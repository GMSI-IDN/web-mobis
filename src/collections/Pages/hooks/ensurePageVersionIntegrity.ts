import type { CollectionBeforeOperationHook, CollectionBeforeValidateHook } from 'payload'
import { resyncTableIdSequence } from '@/lib/db/resyncPostgresSequences'

function stripTopLevelId<T>(input: T): T {
  if (!input || typeof input !== 'object') return input

  const data = input as Record<string, unknown>
  if (!Object.prototype.hasOwnProperty.call(data, 'id')) return input

  const next = { ...data }
  delete next.id
  return next as T
}

export const stripReservedPageFields: CollectionBeforeValidateHook = ({ data }) => {
  return stripTopLevelId(data)
}

export const ensurePageVersionIntegrity: CollectionBeforeOperationHook<'pages'> = async ({
  args,
  operation,
  req,
  context,
}) => {
  if (operation !== 'create' && operation !== 'update') return args

  // Defensive: prevent manual top-level id injection in page updates/creates.
  const nextArgs = {
    ...args,
    data: stripTopLevelId((args as any)?.data),
  }

  if (req?.data) {
    req.data = stripTopLevelId(req.data)
  }

  // Re-sync only once per request lifecycle.
  if (!(context as any)?.pagesSequencesResynced) {
    await resyncTableIdSequence(req.payload, 'pages')
    await resyncTableIdSequence(req.payload, '_pages_v')
    ;(context as any).pagesSequencesResynced = true
  }

  return nextArgs
}
