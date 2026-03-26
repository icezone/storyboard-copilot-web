import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mock ──────────────────────────────────────────────────────────────
const mock = vi.hoisted(() => {
  // Mutable state for credit balance
  let creditBalance = 100
  let insertResults: Record<string, { data: unknown; error: unknown }> = {}

  // Build a chainable query that resolves at the end
  const makeChain = (tableResult: { data: unknown; error: unknown }) => {
    const chain: Record<string, unknown> = {}
    const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit', 'in']
    for (const m of methods) {
      chain[m] = () => chain
    }
    chain.single = () => Promise.resolve(tableResult)
    chain.maybeSingle = () => Promise.resolve(tableResult)
    chain.then = (resolve: (v: unknown) => void, _reject: (e: unknown) => void) =>
      Promise.resolve(tableResult).then(resolve, _reject)
    return chain
  }

  const fromFn = vi.fn((table: string) => {
    if (table === 'user_credits') {
      return makeChain({ data: { balance: creditBalance }, error: null })
    }
    if (table === 'ai_jobs') {
      // For inserts return a job with id
      const result = insertResults['ai_jobs'] ?? { data: { id: 'job-uuid-001' }, error: null }
      return makeChain(result)
    }
    if (table === 'credit_ledger') {
      const result = insertResults['credit_ledger'] ?? { data: {}, error: null }
      return makeChain(result)
    }
    return makeChain({ data: null, error: null })
  })

  return {
    client: {
      from: fromFn,
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null }),
      },
    },
    setCreditBalance(balance: number) {
      creditBalance = balance
    },
    setInsertResult(table: string, data: unknown, error?: unknown) {
      insertResults[table] = { data, error: error ?? null }
    },
    setJobFetchResult(data: unknown, error?: unknown) {
      insertResults['ai_jobs'] = { data, error: error ?? null }
    },
    reset() {
      creditBalance = 100
      insertResults = {}
      fromFn.mockClear()
    },
    fromFn,
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => mock.client,
  getAuthUser: async () => ({ id: 'user-1' }),
}))

import { createJob, updateJobStatus, getJob, InsufficientCreditsError, JobNotFoundError } from '@/server/jobs/jobService'

describe('jobService', () => {
  beforeEach(() => {
    mock.reset()
  })

  describe('createJob', () => {
    it('should create a job and return its id when credits are sufficient', async () => {
      mock.setCreditBalance(200)
      mock.setInsertResult('ai_jobs', { id: 'job-uuid-001' })
      mock.setInsertResult('credit_ledger', {})

      const jobId = await createJob({
        userId: 'user-1',
        projectId: 'proj-1',
        type: 'image',
        providerId: 'ppio',
        modelId: 'ppio/gemini-3.1-flash',
        creditCost: 10,
      })

      expect(jobId).toBe('job-uuid-001')
    })

    it('should throw InsufficientCreditsError when balance is too low', async () => {
      mock.setCreditBalance(5)

      await expect(
        createJob({
          userId: 'user-1',
          projectId: 'proj-1',
          type: 'image',
          providerId: 'ppio',
          modelId: 'ppio/test',
          creditCost: 10,
        })
      ).rejects.toThrow(InsufficientCreditsError)
    })

    it('should throw InsufficientCreditsError with correct message', async () => {
      mock.setCreditBalance(3)

      try {
        await createJob({
          userId: 'user-1',
          projectId: 'proj-1',
          type: 'image',
          providerId: 'ppio',
          modelId: 'ppio/test',
          creditCost: 50,
        })
        expect.fail('Should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(InsufficientCreditsError)
        expect((err as Error).message).toContain('required 50')
        expect((err as Error).message).toContain('available 3')
      }
    })

    it('should treat zero balance as insufficient for any cost > 0', async () => {
      mock.setCreditBalance(0)

      await expect(
        createJob({
          userId: 'user-1',
          projectId: 'proj-1',
          type: 'image',
          providerId: 'grsai',
          modelId: 'grsai/nano-banana-pro',
          creditCost: 1,
        })
      ).rejects.toThrow(InsufficientCreditsError)
    })
  })

  describe('updateJobStatus', () => {
    it('should update job to completed without refund', async () => {
      mock.setJobFetchResult({
        id: 'job-uuid-001',
        user_id: 'user-1',
        credits_held: 10,
        status: 'pending',
      })

      // Should not throw
      await expect(
        updateJobStatus('job-uuid-001', 'completed', { outputUrl: 'https://example.com/out.png' })
      ).resolves.toBeUndefined()
    })

    it('should insert a refund ledger entry when job fails', async () => {
      mock.setJobFetchResult({
        id: 'job-uuid-001',
        user_id: 'user-1',
        credits_held: 10,
        status: 'pending',
      })

      await updateJobStatus('job-uuid-001', 'failed', {
        errorMessage: 'Provider error',
      })

      // The from() function should have been called with credit_ledger for refund
      const ledgerCalls = mock.fromFn.mock.calls.filter(
        (call: unknown[]) => call[0] === 'credit_ledger'
      )
      expect(ledgerCalls.length).toBeGreaterThan(0)
    })

    it('should throw JobNotFoundError when job does not exist', async () => {
      mock.setJobFetchResult(null, { message: 'Row not found' })

      await expect(
        updateJobStatus('nonexistent-job', 'completed')
      ).rejects.toThrow(JobNotFoundError)
    })
  })

  describe('getJob', () => {
    it('should return job data when job belongs to user', async () => {
      const jobData = {
        id: 'job-uuid-001',
        user_id: 'user-1',
        provider_id: 'ppio',
        model_id: 'ppio/test',
        status: 'completed',
        credits_held: 10,
        credits_consumed: 10,
        result: { url: 'https://example.com/output.png' },
        error: null,
        created_at: '2026-03-26T00:00:00Z',
        updated_at: '2026-03-26T00:01:00Z',
      }
      mock.setJobFetchResult(jobData)

      const job = await getJob('job-uuid-001', 'user-1')
      expect(job.id).toBe('job-uuid-001')
      expect(job.status).toBe('completed')
    })

    it('should throw JobNotFoundError when job not found', async () => {
      mock.setJobFetchResult(null, { message: 'Row not found' })

      await expect(
        getJob('nonexistent', 'user-1')
      ).rejects.toThrow(JobNotFoundError)
    })
  })
})
