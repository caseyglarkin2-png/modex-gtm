import { evaluateContentQuality } from '@/lib/content-quality';

export type ChecklistItemId =
  | 'clear_value_prop'
  | 'account_specific_proof'
  | 'cta_specific'
  | 'compliance_checked'
  | 'deliverability_checked';

export type ChecklistItem = {
  id: ChecklistItemId;
  label: string;
  required: boolean;
};

export type ContentChecklistTemplate = {
  campaignType: string;
  items: ChecklistItem[];
};

export type ContentChecklistState = {
  generatedContentId: number;
  completedItemIds: ChecklistItemId[];
  updatedAt: string;
};

export type ChecklistItemResolutionSource = 'automatic' | 'manual' | 'manual+automatic' | 'missing';

export type ResolvedChecklistItem = ChecklistItem & {
  completed: boolean;
  source: ChecklistItemResolutionSource;
};

export const CHECKLIST_TEMPLATES: ContentChecklistTemplate[] = [
  {
    campaignType: 'trade_show',
    items: [
      { id: 'clear_value_prop', label: 'Value prop is explicit in first section', required: true },
      { id: 'account_specific_proof', label: 'Includes account-specific signal or proof', required: true },
      { id: 'cta_specific', label: 'CTA specifies next step and timeframe', required: true },
      { id: 'compliance_checked', label: 'Claims reviewed for compliance risk', required: true },
      { id: 'deliverability_checked', label: 'Deliverability checks complete', required: true },
    ],
  },
  {
    campaignType: 'outbound',
    items: [
      { id: 'clear_value_prop', label: 'Value prop is explicit in first section', required: true },
      { id: 'account_specific_proof', label: 'Includes account-specific signal or proof', required: true },
      { id: 'cta_specific', label: 'CTA specifies next step and timeframe', required: true },
      { id: 'deliverability_checked', label: 'Deliverability checks complete', required: true },
      { id: 'compliance_checked', label: 'Claims reviewed for compliance risk', required: false },
    ],
  },
  {
    campaignType: 'default',
    items: [
      { id: 'clear_value_prop', label: 'Value prop is explicit in first section', required: true },
      { id: 'account_specific_proof', label: 'Includes account-specific signal or proof', required: true },
      { id: 'cta_specific', label: 'CTA specifies next step and timeframe', required: true },
      { id: 'compliance_checked', label: 'Claims reviewed for compliance risk', required: true },
      { id: 'deliverability_checked', label: 'Deliverability checks complete', required: true },
    ],
  },
];

export function getChecklistTemplate(campaignType?: string | null): ContentChecklistTemplate {
  if (!campaignType) return CHECKLIST_TEMPLATES.find((template) => template.campaignType === 'default')!;
  return CHECKLIST_TEMPLATES.find((template) => template.campaignType === campaignType)
    ?? CHECKLIST_TEMPLATES.find((template) => template.campaignType === 'default')!;
}

export function computeChecklistCompleteness(
  template: ContentChecklistTemplate,
  completedItemIds: ChecklistItemId[],
): {
  complete: boolean;
  requiredComplete: number;
  requiredTotal: number;
  missingRequired: ChecklistItemId[];
} {
  const requiredItems = template.items.filter((item) => item.required);
  const completedSet = new Set(completedItemIds);
  const missingRequired = requiredItems.filter((item) => !completedSet.has(item.id)).map((item) => item.id);
  return {
    complete: missingRequired.length === 0,
    requiredComplete: requiredItems.length - missingRequired.length,
    requiredTotal: requiredItems.length,
    missingRequired,
  };
}

export function computeAutomatedChecklistItemIds(content: string, accountName: string): ChecklistItemId[] {
  const quality = evaluateContentQuality(content, accountName);
  const completed: ChecklistItemId[] = [];

  if (quality.scores.clarity >= 60) completed.push('clear_value_prop');
  if (quality.scores.personalization >= 60) completed.push('account_specific_proof');
  if (quality.scores.cta_strength >= 60) completed.push('cta_specific');
  if (quality.scores.compliance_risk < 50) completed.push('compliance_checked');
  if (quality.scores.deliverability_risk < 50) completed.push('deliverability_checked');

  return completed;
}

export function resolveContentQaChecklist(input: {
  campaignType?: string | null;
  completedItemIds?: ChecklistItemId[] | string[] | null;
  content?: string | null;
  accountName?: string | null;
}): {
  template: ContentChecklistTemplate;
  complete: boolean;
  requiredComplete: number;
  requiredTotal: number;
  missingRequired: ChecklistItemId[];
  completedItemIds: ChecklistItemId[];
  autoCompletedItemIds: ChecklistItemId[];
  items: ResolvedChecklistItem[];
} {
  const template = getChecklistTemplate(input.campaignType);
  const manualCompleted = (input.completedItemIds ?? []).filter(
    (id): id is ChecklistItemId => template.items.some((item) => item.id === id),
  );
  const autoCompleted = input.content?.trim() && input.accountName?.trim()
    ? computeAutomatedChecklistItemIds(input.content, input.accountName)
    : [];
  const mergedCompleted = Array.from(new Set<ChecklistItemId>([...manualCompleted, ...autoCompleted]));
  const completeness = computeChecklistCompleteness(template, mergedCompleted);
  const manualSet = new Set(manualCompleted);
  const autoSet = new Set(autoCompleted);
  const mergedSet = new Set(mergedCompleted);

  return {
    template,
    ...completeness,
    completedItemIds: mergedCompleted,
    autoCompletedItemIds: autoCompleted,
    items: template.items.map((item) => {
      const manual = manualSet.has(item.id);
      const automatic = autoSet.has(item.id);
      let source: ChecklistItemResolutionSource = 'missing';
      if (manual && automatic) source = 'manual+automatic';
      else if (manual) source = 'manual';
      else if (automatic) source = 'automatic';
      return {
        ...item,
        completed: mergedSet.has(item.id),
        source,
      };
    }),
  };
}
