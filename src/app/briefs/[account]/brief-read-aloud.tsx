'use client';

import { VoicePreviewButton } from '@/components/voice-preview-button';

interface Props {
  accountName: string;
  sections: { label: string; value: string }[];
}

export function BriefReadAloud({ accountName, sections }: Props) {
  const briefText = `Meeting brief for ${accountName}. ${sections
    .filter((s) => s.value)
    .map((s) => `${s.label}: ${s.value}`)
    .join('. ')}`;

  return (
    <VoicePreviewButton
      text={briefText}
      label="Read Brief Aloud"
      className="w-fit"
    />
  );
}
