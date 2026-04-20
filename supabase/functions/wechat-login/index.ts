import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const WECHAT_APP_ID = Deno.env.get("WECHAT_APP_ID")!;
const WECHAT_APP_SECRET = Deno.env.get("WECHAT_APP_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface WeChatSessionResponse {
  openid?: string;
  session_key?: string;
  errcode?: number;
  errmsg?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "method not allowed" }, 405);
  }

  let body: { code?: string; uuid?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "invalid JSON" }, 400);
  }

  const { code, uuid } = body;
  if (!code || !uuid) {
    return jsonResponse(
      { success: false, error: "code and uuid are required" },
      400
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. Validate session exists and is pending
  const { data: session, error: fetchError } = await supabase
    .from("wechat_login_sessions")
    .select("*")
    .eq("id", uuid)
    .single();

  if (fetchError || !session) {
    return jsonResponse({ success: false, error: "invalid session" }, 400);
  }

  if (session.status !== "pending") {
    return jsonResponse({ success: false, error: "session already used" }, 400);
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabase
      .from("wechat_login_sessions")
      .update({ status: "expired" })
      .eq("id", uuid);
    return jsonResponse({ success: false, error: "session expired" }, 400);
  }

  // 2. Call WeChat code2session API
  const wechatUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}&js_code=${code}&grant_type=authorization_code`;

  let wechatData: WeChatSessionResponse;
  try {
    const wechatRes = await fetch(wechatUrl);
    wechatData = await wechatRes.json();
  } catch {
    await supabase
      .from("wechat_login_sessions")
      .update({
        status: "failed",
        error_message: "WeChat API network error",
      })
      .eq("id", uuid);
    return jsonResponse(
      { success: false, error: "WeChat API unavailable" },
      502
    );
  }

  if (wechatData.errcode && wechatData.errcode !== 0) {
    await supabase
      .from("wechat_login_sessions")
      .update({
        status: "failed",
        error_message: `WeChat error: ${wechatData.errcode} ${wechatData.errmsg}`,
      })
      .eq("id", uuid);
    return jsonResponse(
      { success: false, error: `WeChat auth failed: ${wechatData.errmsg}` },
      400
    );
  }

  const openid = wechatData.openid;
  if (!openid) {
    await supabase
      .from("wechat_login_sessions")
      .update({ status: "failed", error_message: "No openid returned" })
      .eq("id", uuid);
    return jsonResponse({ success: false, error: "failed to get openid" }, 400);
  }

  // 3. Find or create user
  let userId: string;

  // Search for existing user with this wechat_openid
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.user_metadata?.wechat_openid === openid
  );

  if (existingUser) {
    userId = existingUser.id;
  } else {
    // Create new user with wechat_openid in metadata
    const fakeEmail = `wechat_${openid}@wechat.placeholder`;
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: fakeEmail,
        email_confirm: true,
        user_metadata: { wechat_openid: openid, provider: "wechat" },
      });

    if (createError || !newUser.user) {
      await supabase
        .from("wechat_login_sessions")
        .update({
          status: "failed",
          error_message: `User creation failed: ${createError?.message}`,
        })
        .eq("id", uuid);
      return jsonResponse(
        { success: false, error: "failed to create user" },
        500
      );
    }
    userId = newUser.user.id;
  }

  // 4. Generate session tokens for the user
  const { data: linkData, error: linkError } =
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: existingUser?.email || `wechat_${openid}@wechat.placeholder`,
    });

  if (linkError || !linkData) {
    await supabase
      .from("wechat_login_sessions")
      .update({
        status: "failed",
        error_message: `Session generation failed: ${linkError?.message}`,
      })
      .eq("id", uuid);
    return jsonResponse(
      { success: false, error: "failed to generate session" },
      500
    );
  }

  // Exchange the token_hash for a real session
  const verifyUrl = `${SUPABASE_URL}/auth/v1/verify`;
  const verifyRes = await fetch(verifyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      type: "magiclink",
      token_hash: linkData.properties?.hashed_token,
    }),
  });

  const verifyData = await verifyRes.json();

  if (!verifyData.access_token) {
    await supabase
      .from("wechat_login_sessions")
      .update({ status: "failed", error_message: "Token exchange failed" })
      .eq("id", uuid);
    return jsonResponse(
      { success: false, error: "failed to exchange token" },
      500
    );
  }

  // 5. Update session table with tokens (atomic: only if still pending)
  const { data: updateResult, error: updateError } = await supabase
    .from("wechat_login_sessions")
    .update({
      status: "confirmed",
      user_id: userId,
      access_token: verifyData.access_token,
      refresh_token: verifyData.refresh_token,
    })
    .eq("id", uuid)
    .eq("status", "pending")
    .select()
    .single();

  if (updateError || !updateResult) {
    return jsonResponse(
      { success: false, error: "session was already consumed" },
      409
    );
  }

  return jsonResponse({ success: true }, 200);
});

function jsonResponse(
  data: Record<string, unknown>,
  status: number
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
