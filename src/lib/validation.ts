import { z } from 'zod'

export const uuidSchema = z.string().uuid()

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200),
})

export const saveDraftSchema = z.object({
  data: z.object({}).passthrough(),
  expectedRevision: z.number().int().min(0),
})

export const viewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number().positive(),
})
