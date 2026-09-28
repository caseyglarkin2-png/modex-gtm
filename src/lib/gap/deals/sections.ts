/** The Deal Brief's truth sections (client-safe: no server imports). */
export const TRUTH_SECTIONS = ['current_state', 'problem', 'root_cause', 'business_impact', 'future_state', 'requirements'] as const;
export type TruthSection = (typeof TRUTH_SECTIONS)[number];

export const SECTION_TITLE: Record<TruthSection, string> = {
  current_state: 'Current state',
  problem: 'Problem',
  root_cause: 'Root cause',
  business_impact: 'Business impact',
  future_state: 'Desired future state',
  requirements: 'Solution requirements',
};

