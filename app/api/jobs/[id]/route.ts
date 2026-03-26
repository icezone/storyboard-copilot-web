import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { getProvider } from '@/server/ai/registry'
import { getJob, updateJobStatus, JobNotFoundError } from '@/server/jobs/jobService'

// Ensure providers are registered
import '@/server/ai/index'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: jobId } = await params

  try {
    const job = await getJob(jobId, user.id)

    // If job is still pending/running, try to poll the provider
    if (job.status === 'pending' || job.status === 'running') {
      const provider = getProvider(job.provider_id)

      if (provider?.pollJob && job.external_job_id) {
        try {
          const pollResult = await provider.pollJob(job.external_job_id)

          if (pollResult.status === 'completed') {
            await updateJobStatus(jobId, 'completed', { outputUrl: pollResult.imageUrl })
            return NextResponse.json({
              status: 'completed',
              imageUrl: pollResult.imageUrl,
            })
          } else if (pollResult.status === 'failed') {
            await updateJobStatus(jobId, 'failed', {
              errorMessage: pollResult.errorMessage,
            })
            return NextResponse.json({
              status: 'failed',
              errorMessage: pollResult.errorMessage,
            })
          } else {
            // Still pending/processing — update to running if needed
            const mappedStatus = pollResult.status === 'processing' ? 'running' : job.status
            if (mappedStatus !== job.status) {
              await supabase
                .from('ai_jobs')
                .update({ status: mappedStatus, updated_at: new Date().toISOString() })
                .eq('id', jobId)
            }
            return NextResponse.json({
              status: pollResult.status,
              progress: pollResult.progress,
            })
          }
        } catch (pollError) {
          console.error(`Poll error for job ${jobId}:`, pollError)
          // Fall through to return current DB status if polling fails
        }
      }
    }

    // Return job status from DB
    const responseBody: Record<string, unknown> = {
      status: job.status,
    }

    if (job.result) {
      const result = job.result as { url?: string }
      if (result.url) {
        responseBody.imageUrl = result.url
      }
    }

    if (job.error) {
      responseBody.errorMessage = job.error
    }

    return NextResponse.json(responseBody)
  } catch (error) {
    if (error instanceof JobNotFoundError || (error instanceof Error && error.name === 'JobNotFoundError')) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    console.error('Job status error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
