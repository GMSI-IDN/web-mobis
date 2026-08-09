import type { Payload } from 'payload'

export type IncrementVoucherResult =
  | { ok: true; used: number; quota: number }
  | { ok: false; reason: 'not_found' | 'quota_exhausted' | 'invalid_id' }

/**
 * Atomically increment `vouchers.used` guarding against quota overflow.
 *
 * The previous implementation read `used`, added 1, then wrote it back in a
 * separate query. Under concurrent registrations that pattern is a TOCTOU race:
 * two requests can both read `used = 9`, both write `10`, and the quota gets
 * oversold. This performs the check-and-increment in a single SQL statement so
 * Postgres serializes the update — only requests that still fit under quota win.
 */
export async function incrementVoucherUsed(
  payload: Payload,
  voucherId: number,
): Promise<IncrementVoucherResult> {
  const id = Number(voucherId)
  if (!Number.isFinite(id)) {
    return { ok: false, reason: 'invalid_id' }
  }

  const drizzle = (payload.db as any).drizzle

  const updated: any = await drizzle.execute(
    `UPDATE vouchers
        SET used = COALESCE(used, 0) + 1
      WHERE id = ${id}
        AND enabled = true
        AND COALESCE(used, 0) < quota
      RETURNING used, quota;`,
  )

  const updatedRows = updated?.rows ?? updated ?? []
  const updatedRow = Array.isArray(updatedRows) ? updatedRows[0] : undefined

  if (updatedRow) {
    return {
      ok: true,
      used: Number(updatedRow.used),
      quota: Number(updatedRow.quota),
    }
  }

  // No row updated: either the voucher is gone/disabled or the quota is spent.
  // Do a follow-up read only to return a precise reason for the caller.
  const checked: any = await drizzle.execute(
    `SELECT id FROM vouchers WHERE id = ${id} LIMIT 1;`,
  )
  const checkedRows = checked?.rows ?? checked ?? []
  const exists = Array.isArray(checkedRows) ? checkedRows.length > 0 : false

  return { ok: false, reason: exists ? 'quota_exhausted' : 'not_found' }
}
