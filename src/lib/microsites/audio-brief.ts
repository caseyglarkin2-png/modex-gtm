import type { AudioChapter } from '@/components/microsites/memo-audio-brief';

/**
 * The canonical 7-minute "Yard network as constraint" audio brief that ships
 * with every memo as the Audio register.
 *
 * The mp3 itself lives at `public/audio/yard-network-brief.mp3` (committed to
 * the repo because per-account audio variants are out of scope for now — see
 * issue #43, Out-of-scope clause).
 *
 * Chapter timestamps are best-effort estimates against the NotebookLM-
 * generated track. They round to 5-second boundaries and split the runtime
 * into the same five beats the printed memo walks. Fine-tune by listening to
 * the file and adjusting the `start` field on each chapter; the player picks
 * the change up automatically (active-chapter highlighting is derived from
 * `start`, not stored separately).
 */
export const AUDIO_BRIEF_SRC = '/audio/yard-network-brief.mp3';
export const AUDIO_BRIEF_DURATION = '7:12';

export const AUDIO_BRIEF_CHAPTERS: AudioChapter[] = [
  { id: 'thesis', label: 'The thesis', start: 0 },
  { id: 'what-yms-missed', label: 'What the legacy YMS missed', start: 75 },
  { id: 'network-not-site', label: 'The network, not the site', start: 165 },
  { id: 'what-237-taught', label: 'What 237 facilities taught', start: 255 },
  { id: 'what-you-do-tomorrow', label: 'What you do tomorrow', start: 345 },
];
