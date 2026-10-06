/**
 * UX-04 Listen cleanup: pause and resume (never a stop that rewinds), one player at a time (a second Listen stops the
 * first), the audio stops and its URL is released on unmount, the state is announced.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
import { VoicePreviewButton } from '@/components/voice-preview-button';

class FakeAudio {
  static instances: FakeAudio[] = [];
  src: string;
  paused = true;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(src: string) { this.src = src; FakeAudio.instances.push(this); }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
}

beforeEach(() => {
  FakeAudio.instances = [];
  vi.stubGlobal('Audio', FakeAudio);
  vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() });
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, blob: async () => new Blob(['a']) } as Response);
});
afterEach(() => vi.restoreAllMocks());

describe('VoicePreviewButton', () => {
  it('plays, then pauses in place and resumes; the label and pressed state follow', async () => {
    render(<VoicePreviewButton text="Hello" label="Listen" />);
    const btn = screen.getByRole('button', { name: 'Listen' });
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pause: Listen' })).toBeInTheDocument());
    expect(FakeAudio.instances).toHaveLength(1);
    expect(FakeAudio.instances[0].paused).toBe(false);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button'));
    expect(FakeAudio.instances[0].paused).toBe(true);
    expect(screen.getByRole('button', { name: 'Resume: Listen' })).toBeInTheDocument();
    expect(screen.getByRole('status').textContent).toBe('Paused.');
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(FakeAudio.instances[0].paused).toBe(false));
    expect(FakeAudio.instances).toHaveLength(1);
  });
  it('a second Listen stops the first (one player on the page)', async () => {
    render(<div><VoicePreviewButton text="One" label="Listen one" /><VoicePreviewButton text="Two" label="Listen two" /></div>);
    fireEvent.click(screen.getByRole('button', { name: 'Listen one' }));
    await waitFor(() => expect(FakeAudio.instances).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: 'Listen two' }));
    await waitFor(() => expect(FakeAudio.instances).toHaveLength(2));
    expect(FakeAudio.instances[0].paused).toBe(true);
    expect(FakeAudio.instances[1].paused).toBe(false);
    expect(screen.getByRole('button', { name: 'Listen one' })).toBeInTheDocument();
  });
  it('unmounting while playing pauses the audio and releases its URL (no playback with no control left)', async () => {
    const { unmount } = render(<VoicePreviewButton text="Hello" label="Listen" />);
    fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
    await waitFor(() => expect(FakeAudio.instances[0].paused).toBe(false));
    act(() => unmount());
    expect(FakeAudio.instances[0].paused).toBe(true);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
  });
});
