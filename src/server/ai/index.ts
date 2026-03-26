import { registerProvider } from './registry'
import { ppioProvider } from './providers/ppio'
import { grsaiProvider } from './providers/grsai'
import { kieProvider } from './providers/kie'
import { falProvider } from './providers/fal'

// Register all AI image providers
registerProvider(ppioProvider)
registerProvider(grsaiProvider)
registerProvider(kieProvider)
registerProvider(falProvider)

export { registerProvider, getProvider, getAllProviders } from './registry'
export type { AIProvider, AiGenerateRequest, AiGenerateResult, JobPollResult, JobStatus } from './types'
