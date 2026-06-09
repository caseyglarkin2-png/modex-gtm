import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  MemoAudioBrief,
  type AudioChapter,
} from '@/components/microsites/memo-audio-brief';
import type { AccountMicrositeData, AccountAudioBrief } from '@/lib/microsites/schema';

const chapters: AudioChapter[] = [
  { id: 'thesis', label: 'The thesis', start: 0 },
  { id: 'what-yms-missed', label: 'What the legacy YMS missed', start: 75 },
  { id: 'network-not-site', label: 'The network, not the site', start: 165 },
  { id: 'what-237-taught', label: 'What 237 facilities taught', start: 255 },
  { id: 'what-you-do-tomorrow', label: 'What you do tomorrow', start: 345 },
];

describe('MemoAudioBrief', () => {
  it('renders the eyebrow + heading + intro register', () => {
    render(<MemoAudioBrief src="/audio/yard-network-brief.mp3" chapters={chapters} />);
    expect(screen.getByText(/Audio register/i)).toBeDefined();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(/listen, if you/i);
    // Default intro mentions the run-time so prospects know it before they click.
    // The canonical brief is 5:24, so the copy now says "Just over five minutes."
    expect(screen.getByText(/just over five minutes/i)).toBeDefined();
  });

  it('renders a section with id="audio" and matching tracking attribute', () => {
    const { container } = render(
      <MemoAudioBrief src="/audio/yard-network-brief.mp3" chapters={chapters} />,
    );
    const section = container.querySelector('section#audio');
    expect(section).not.toBeNull();
    expect(section?.getAttribute('data-ms-section-id')).toBe('audio');
  });

  it('mounts a native <audio controls> element with the provided src', () => {
    const { container } = render(
      <MemoAudioBrief src="/audio/yard-network-brief.mp3" chapters={chapters} />,
    );
    const audio = container.querySelector('audio');
    expect(audio).not.toBeNull();
    expect(audio?.getAttribute('src')).toBe('/audio/yard-network-brief.mp3');
    expect(audio?.getAttribute('preload')).toBe('metadata');
    // The real play button is the browser's own control — no bespoke chrome.
    expect((audio as HTMLAudioElement)?.controls).toBe(true);
  });

  it('no longer renders the custom play disk or scrub strip (native controls only)', () => {
    render(<MemoAudioBrief src="/audio/yard-network-brief.mp3" chapters={chapters} />);
    expect(screen.queryByLabelText(/play audio brief/i)).toBeNull();
    expect(screen.queryByRole('slider', { name: /seek audio brief/i })).toBeNull();
    expect(document.querySelector('[data-ms-cta-id="audio-play"]')).toBeNull();
    expect(document.querySelector('[data-ms-cta-id="audio-speed"]')).toBeNull();
  });

  it('renders all chapters with Roman-numeraled markers and timestamps', () => {
    render(<MemoAudioBrief src="/audio/yard-network-brief.mp3" chapters={chapters} />);
    // Roman markers
    expect(screen.getByText('I')).toBeDefined();
    expect(screen.getByText('II')).toBeDefined();
    expect(screen.getByText('V')).toBeDefined();
    // Labels
    expect(screen.getByText('What 237 facilities taught')).toBeDefined();
    // Timestamps — 75s -> 1:15, 345s -> 5:45
    expect(screen.getByText('1:15')).toBeDefined();
    expect(screen.getByText('5:45')).toBeDefined();
  });

  it('exposes each chapter as an audio-chapter CTA carrying its chapter id', () => {
    render(<MemoAudioBrief src="/audio/yard-network-brief.mp3" chapters={chapters} />);
    const chapterCtas = document.querySelectorAll('[data-ms-cta-id="audio-chapter"]');
    expect(chapterCtas.length).toBe(chapters.length);
    const ids = Array.from(chapterCtas).map((el) => el.getAttribute('data-chapter-id'));
    expect(ids).toEqual(chapters.map((c) => c.id));
  });

  it('marks the first chapter as the active chapter on initial render (currentTime=0)', () => {
    render(<MemoAudioBrief src="/audio/yard-network-brief.mp3" chapters={chapters} />);
    const ctas = document.querySelectorAll('[data-ms-cta-id="audio-chapter"]');
    expect(ctas[0].getAttribute('aria-current')).toBe('true');
    expect(ctas[1].getAttribute('aria-current')).toBeNull();
  });

  it('still accepts the deprecated expectedDuration prop without rendering custom chrome', () => {
    const { container } = render(
      <MemoAudioBrief
        src="/audio/yard-network-brief.mp3"
        chapters={chapters}
        expectedDuration="7:12"
      />,
    );
    // Prop is accepted for call-site compatibility but no longer renders a
    // custom time readout — the native control owns the duration display.
    expect(screen.queryByText('0:00 / 7:12')).toBeNull();
    expect(container.querySelector('audio')).not.toBeNull();
  });
});

describe('AccountAudioBrief schema', () => {
  it('AccountMicrositeData accepts an audioBrief override', () => {
    const audioBrief: AccountAudioBrief = {
      src: '/audio/dannon.mp3',
      chapters: [
        { id: 'thesis', label: 'The thesis', start: 0 },
        { id: 'beats', label: 'Cold-chain beats', start: 60 },
      ],
      heading: 'Listen, Heiko',
      intro: 'A custom intro for Dannon.',
      generatedAt: '2026-05-10T14:00:00Z',
    };
    // Assignability test — fails to compile if the field isn't on the type.
    const data: Partial<AccountMicrositeData> = { audioBrief };
    expect(data.audioBrief?.src).toBe('/audio/dannon.mp3');
  });
});
