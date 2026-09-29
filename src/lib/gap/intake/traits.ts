/**
 * What a work-source TYPE means downstream, in ONE place (pure; no I/O, safe to import anywhere, including the
 * account brief and the approach decision).
 */
export const SOURCE_TYPES = ['newsletter', 'conference', 'crm_list', 'referral', 'relationship', 'target_list', 'content', 'inbound', 'other'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];
/**
 * What a source TYPE means downstream, in ONE place (configuration, not architecture). A new source type is a
 * row here (plus the SQL CHECK vocabulary):
 *   engaged     Casey met or was introduced to these people: their accounts are in scope by his own act
 *   relational  the relationship is real context, so a no-fact person can still be worth a relationship-led touch
 *   approach    the no-fact approach (referral-led for a referral), else relationship-led
 *   opener      'author': Casey may say he writes it (a newsletter), never that they subscribe
 */
export interface SourceTypeTraits {
  engaged: boolean;
  relational: boolean;
  approach?: 'referral_led';
  opener?: 'author';
}
export const SOURCE_TYPE_TRAITS: Record<SourceType, SourceTypeTraits> = {
  newsletter: { engaged: false, relational: true, opener: 'author' },
  conference: { engaged: true, relational: true },
  crm_list: { engaged: false, relational: false },
  referral: { engaged: true, relational: true, approach: 'referral_led' },
  relationship: { engaged: true, relational: true },
  target_list: { engaged: false, relational: false },
  content: { engaged: false, relational: true, opener: 'author' },
  inbound: { engaged: false, relational: true },
  other: { engaged: false, relational: false },
};
export const traitsOf = (sourceType: string | null | undefined): SourceTypeTraits => SOURCE_TYPE_TRAITS[sourceType as SourceType] ?? SOURCE_TYPE_TRAITS.other;
