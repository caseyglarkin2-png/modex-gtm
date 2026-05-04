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
