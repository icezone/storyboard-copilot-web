'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WeChatQRModal } from './WeChatQRModal';

export function WeChatLoginButton() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-full rounded-md border border-foreground/20 bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5"
      >
        {t('auth.wechatLogin')}
      </button>
      <WeChatQRModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
