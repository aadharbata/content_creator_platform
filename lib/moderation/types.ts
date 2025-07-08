export type ModerationStatus = 'OK' | 'REJECTED' | 'REVIEW'

export interface ModerationVerdict {
  /**
   * High-level result of the screening.
   * OK        – safe to publish immediately
   * REJECTED  – disallowed content detected
   * REVIEW    – could not reach confident decision, needs manual review
   */
  status: ModerationStatus
  /**
   * Machine-readable labels that triggered a rejection or the key labels
   * returned by the provider (e.g. ['ExplicitNudity', 'Violence']).
   */
  reasons: string[]
  /**
   * Raw provider payload for audit / debugging. Keep undefined for cheap filters.
   */
  raw?: unknown
} 