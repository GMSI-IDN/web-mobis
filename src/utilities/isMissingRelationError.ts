type ErrorLike = {
  code?: string
  message?: string
  cause?: unknown
}

export const isMissingRelationError = (error: unknown, relationName: string): boolean => {
  if (!error || typeof error !== 'object') return false

  const err = error as ErrorLike
  const cause = err.cause && typeof err.cause === 'object' ? (err.cause as ErrorLike) : undefined

  const code = err.code ?? cause?.code
  const message = `${err.message ?? ''} ${cause?.message ?? ''}`

  return code === '42P01' && message.includes(`relation "${relationName}" does not exist`)
}

const OPTIONAL_RELATIONS = [
  'pages_blocks_registration_form_opts_online_app',
  'pages_blocks_faq_accordion',
  'pages_blocks_faq_accordion_items',
] as const

export const isKnownOptionalRelationError = (error: unknown): boolean => {
  return OPTIONAL_RELATIONS.some((relationName) => isMissingRelationError(error, relationName))
}
