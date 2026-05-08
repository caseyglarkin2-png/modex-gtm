import type { FootnoteData } from './schema';

/**
 * The universal YNS thesis content used by the YnsThesisSection renderer.
 *
 * NOTE: This is a structural scaffold landed during Sprint M2.3 so the
 * renderer compiles. Sprint M3.1 finalizes the prose (authored voice,
 * sourced footnotes, copy review). Don't ship the M3 migration before
 * M3.1 lands the real text.
 */

export interface YnsThesisContent {
  defaultHeadline: string;
  paragraphs: YnsThesisParagraph[];
  footnotes: FootnoteData[];
}

export interface YnsThesisParagraph {
  /** Paragraph body. Use [^id] markers to reference footnotes by id. */
  body: string;
}

export const YNS_THESIS: YnsThesisContent = {
  defaultHeadline: 'Why TMS and WMS spend isn’t moving yard variance',
  paragraphs: [
    {
      body: 'Most yards still run on radios and clipboards.[^ata-2024] Layering more software on top of WMS or TMS doesn’t see what happens between the gate and the dock — and what happens in the yard is what determines whether the rest of the network keeps its promises.',
    },
    {
      body: 'When each yard runs differently, network-wide variance compounds. Throughput targets miss not because any single yard is broken, but because no two yards are operating to the same standard. The execution layer is invisible to the planning layer.',
    },
    {
      body: 'YardFlow is a Yard Network System (YNS) — a deterministic operating protocol for the yard layer. Not another module on top of your YMS. The missing layer your network has been compensating for.',
    },
  ],
  footnotes: [
    {
      id: 'ata-2024',
      source: 'ATA 2024 Yard Operations Survey',
      confidence: 'public',
      detail: 'Industry-wide survey of trailer-yard operations across 1,200+ facilities. Findings on radio + clipboard prevalence are a representative public benchmark; will be re-confirmed against your specific yards in the analysis section.',
    },
  ],
};
