export const COLD_OUTBOUND_PROMPT_POLICY_VERSION = '2026-05-account-command-center-v1';

export const DEFAULT_CTA_MODE = 'scorecard_reply';

export type PromptAssetType =
  | 'email'
  | 'follow_up'
  | 'dm'
  | 'call_script'
  | 'meeting_prep'
  | 'outreach_sequence'
  | 'one_pager'
  | 'microsite';

export type JourneyStage =
  | 'cold_email'
  | 'sequence_step_1'
  | 'sequence_step_2_plus'
  | 'one_pager'
  | 'microsite'
  | 'follow_up'
  | 'meeting_prep';

export type CtaFamily =
  | 'scorecard_reply'
  | 'asset_offer'
  | 'light_reaction'
  | 'meeting_request';

export type CtaPolicy = {
  assetType: PromptAssetType;
  journeyStage: JourneyStage;
  allowedFamily: CtaFamily;
  disallowedFamilies: CtaFamily[];
  ctaMode: string;
};

const CTA_POLICY_MATRIX: Record<PromptAssetType, Partial<Record<JourneyStage, CtaPolicy>>> = {
  email: {
    cold_email: {
      assetType: 'email',
      journeyStage: 'cold_email',
      allowedFamily: 'scorecard_reply',
      disallowedFamilies: ['meeting_request'],
      ctaMode: 'scorecard_reply',
    },
  },
  follow_up: {
    follow_up: {
      assetType: 'follow_up',
      journeyStage: 'follow_up',
      allowedFamily: 'asset_offer',
      disallowedFamilies: ['meeting_request'],
      ctaMode: 'asset_offer',
    },
  },
  dm: {
    cold_email: {
      assetType: 'dm',
      journeyStage: 'cold_email',
      allowedFamily: 'light_reaction',
      disallowedFamilies: ['meeting_request'],
      ctaMode: 'light_reaction',
    },
  },
  call_script: {
    cold_email: {
      assetType: 'call_script',
      journeyStage: 'cold_email',
      allowedFamily: 'asset_offer',
      disallowedFamilies: ['meeting_request'],
      ctaMode: 'asset_offer',
    },
  },
  meeting_prep: {
    meeting_prep: {
      assetType: 'meeting_prep',
      journeyStage: 'meeting_prep',
      allowedFamily: 'meeting_request',
      disallowedFamilies: [],
      ctaMode: 'meeting_request',
    },
  },
  outreach_sequence: {
    sequence_step_1: {
      assetType: 'outreach_sequence',
      journeyStage: 'sequence_step_1',
      allowedFamily: 'scorecard_reply',
      disallowedFamilies: ['meeting_request'],
      ctaMode: 'scorecard_reply',
    },
    sequence_step_2_plus: {
      assetType: 'outreach_sequence',
      journeyStage: 'sequence_step_2_plus',
      allowedFamily: 'asset_offer',
      disallowedFamilies: ['meeting_request'],
      ctaMode: 'asset_offer',
    },
  },
  one_pager: {
    one_pager: {
      assetType: 'one_pager',
      journeyStage: 'one_pager',
      allowedFamily: 'scorecard_reply',
      disallowedFamilies: ['meeting_request'],
      ctaMode: 'scorecard_reply',
    },
  },
  microsite: {
    microsite: {
      assetType: 'microsite',
      journeyStage: 'microsite',
      allowedFamily: 'asset_offer',
      disallowedFamilies: ['meeting_request'],
      ctaMode: 'asset_offer',
    },
  },
};

export function getCtaPolicy(assetType: PromptAssetType, journeyStage: JourneyStage): CtaPolicy {
  const policy = CTA_POLICY_MATRIX[assetType]?.[journeyStage];
  if (policy) return policy;
  return {
    assetType,
    journeyStage,
    allowedFamily: journeyStage === 'meeting_prep' ? 'meeting_request' : 'scorecard_reply',
    disallowedFamilies: journeyStage === 'meeting_prep' ? [] : ['meeting_request'],
    ctaMode: journeyStage === 'meeting_prep' ? 'meeting_request' : DEFAULT_CTA_MODE,
  };
}

export function getAllowedCtaFamily(stage: JourneyStage): CtaFamily {
  switch (stage) {
    case 'meeting_prep':
      return getCtaPolicy('meeting_prep', stage).allowedFamily;
    case 'follow_up':
      return getCtaPolicy('follow_up', stage).allowedFamily;
    case 'microsite':
      return getCtaPolicy('microsite', stage).allowedFamily;
    case 'sequence_step_1':
      return getCtaPolicy('outreach_sequence', stage).allowedFamily;
    case 'sequence_step_2_plus':
      return getCtaPolicy('outreach_sequence', stage).allowedFamily;
    case 'one_pager':
      return getCtaPolicy('one_pager', stage).allowedFamily;
    case 'cold_email':
    default:
      return getCtaPolicy('email', 'cold_email').allowedFamily;
  }
}

export function buildColdOutboundPolicyNotes(stage: JourneyStage, assetType?: PromptAssetType) {
  const family = assetType ? getCtaPolicy(assetType, stage).allowedFamily : getAllowedCtaFamily(stage);
  if (family === 'meeting_request') {
    return 'Meeting and scheduling asks are allowed because this is an explicit meeting-oriented asset.';
  }

  const shared = [
    'Do not ask for a date, time, benchmark call, walkthrough, or calendar slot in cold-first-touch outreach.',
    'Default to a low-friction scorecard, short-version, or reply CTA.',
    'Use one CTA only.',
  ];

  if (family === 'asset_offer') {
    return [
      ...shared,
      'Use phrasing like "If useful, I can send the 1-page scorecard." or "Worth sending over the short version?"',
    ].join('\n');
  }

  return [
    ...shared,
    'Preferred CTA language: "Worth sending over the yard-network scorecard?", "Reply and I’ll send the short version.", or "If useful, I can send the 1-page scorecard."',
  ].join('\n');
}

export function getOnePagerSuggestedNextStep(accountName: string) {
  return `If useful, I can send the 1-page Yard Network scorecard for ${accountName} with the operator-version context.`;
}

export function isLegacyPromptPolicy(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') return true;
  const version = (metadata as Record<string, unknown>).prompt_policy_version;
  const ctaMode = (metadata as Record<string, unknown>).cta_mode;
  return version !== COLD_OUTBOUND_PROMPT_POLICY_VERSION || typeof ctaMode !== 'string';
}

export function isLegacyColdAsset(metadata: unknown, contentType: string) {
  if (!['one_pager', 'outreach_sequence', 'email', 'cold_hook'].includes(contentType)) {
    return false;
  }
  return isLegacyPromptPolicy(metadata);
}
