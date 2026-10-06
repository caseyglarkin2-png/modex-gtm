/**
 * UX-12 DICTATE: the provider boundary (paid only when explicitly enabled; mock never in production; disabled by
 * default and then no provider call), the recorder's states (Recording with a timer and Cancel; Escape discards;
 * Stop posts the audio), and the confirmation boundary in the capture flow (I heard is editable; only Confirm writes,
 * through the existing capture route; Discard writes nothing).
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DISABLED_MESSAGE, transcribe, transcriptionProvider } from '@/lib/gap/voice/transcribe';
import { Dictate } from '@/components/gap/dictate';
import { CaptureFlow } from '@/components/gap/capture-flow';

describe('transcriptionProvider and transcribe', () => {
  it('is disabled by default; paid only with the flag, the provider and the key; mock only outside production', () => {
    expect(transcriptionProvider({})).toBe('disabled');
    expect(transcriptionProvider({ GAP_TRANSCRIPTION_PROVIDER: 'elevenlabs', ELEVENLABS_API_KEY: 'k' })).toBe('disabled'); // not enabled
    expect(transcriptionProvider({ GAP_TRANSCRIPTION_ENABLED: 'true', GAP_TRANSCRIPTION_PROVIDER: 'elevenlabs' })).toBe('disabled'); // no key
    expect(transcriptionProvider({ GAP_TRANSCRIPTION_ENABLED: 'true', GAP_TRANSCRIPTION_PROVIDER: 'elevenlabs', ELEVENLABS_API_KEY: 'k' })).toBe('elevenlabs');
    expect(transcriptionProvider({ GAP_TRANSCRIPTION_PROVIDER: 'mock', NODE_ENV: 'test' } as NodeJS.ProcessEnv)).toBe('mock');
    expect(transcriptionProvider({ GAP_TRANSCRIPTION_PROVIDER: 'mock', NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toBe('disabled');
    expect(transcriptionProvider({ GAP_TRANSCRIPTION_ENABLED: 'true', GAP_TRANSCRIPTION_PROVIDER: 'openai', OPENAI_API_KEY: 'k' })).toBe('disabled'); // never OpenAI
  });
  it('disabled never calls a provider; the mock answers without reading audio; the paid path posts the audio once and reads the text', async () => {
    const f = vi.fn();
    const blob = new Blob(['x'], { type: 'audio/webm' });
    expect(await transcribe(blob, { provider: 'disabled', fetch: f as unknown as typeof fetch })).toEqual({ ok: false, reason: 'transcription_disabled', detail: DISABLED_MESSAGE });
    expect(f).not.toHaveBeenCalled();
    expect(await transcribe(blob, { provider: 'mock', fetch: f as unknown as typeof fetch })).toMatchObject({ ok: true, provider: 'mock' });
    expect(f).not.toHaveBeenCalled();
    expect(await transcribe(new Blob([]), { provider: 'mock' })).toEqual({ ok: false, reason: 'empty_audio' });
    const paid = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ text: ' Trailers wait an hour. ' }) });
    expect(await transcribe(blob, { provider: 'elevenlabs', apiKey: 'k', fetch: paid as unknown as typeof fetch })).toEqual({ ok: true, text: 'Trailers wait an hour.', provider: 'elevenlabs' });
    expect(paid).toHaveBeenCalledTimes(1);
    expect(String(paid.mock.calls[0][0])).toMatch(/elevenlabs\.io\/v1\/speech-to-text/);
    expect((paid.mock.calls[0][1] as RequestInit).headers).toEqual({ 'xi-api-key': 'k' });
    const down = vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    expect(await transcribe(blob, { provider: 'elevenlabs', apiKey: 'k', fetch: down as unknown as typeof fetch })).toEqual({ ok: false, reason: 'provider_error', detail: 'ElevenLabs 429' });
  });
});

class FakeRecorder {
  static instances: FakeRecorder[] = [];
  static isTypeSupported = () => true;
  state: 'inactive' | 'recording' = 'inactive';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(public stream: unknown, public opts?: unknown) {
    FakeRecorder.instances.push(this);
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) });
    this.onstop?.();
  }
}
const tracks = { stop: vi.fn() };

beforeEach(() => {
  FakeRecorder.instances = [];
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [tracks] }) } });
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('<Dictate>', () => {
  it('records with a visible state, a timer and Cancel; Cancel discards and posts nothing; Stop posts the audio and hands the transcript up', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({ text: 'Trailers wait an hour at the gate.', provider: 'mock' }) } as unknown as Response);
    const onTranscript = vi.fn();
    render(<Dictate enabled onTranscript={onTranscript} />);
    expect(screen.getByTestId('dictate-start')).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByTestId('dictate-start'));
    await waitFor(() => expect(screen.getByTestId('dictate')).toHaveAttribute('data-phase', 'recording'));
    expect(screen.getByTestId('dictate-recording')).toHaveTextContent('Recording');
    expect(document.activeElement).toBe(screen.getByTestId('dictate-stop')); // focus follows the state
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId('dictate-timer')).toHaveTextContent('00:02');
    fireEvent.click(screen.getByTestId('dictate-cancel'));
    await waitFor(() => expect(screen.getByTestId('dictate')).toHaveAttribute('data-phase', 'idle'));
    expect(screen.getByTestId('dictate-status')).toHaveTextContent('Discarded. Nothing was recorded.');
    expect(document.activeElement).toBe(screen.getByTestId('dictate-start'));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(onTranscript).not.toHaveBeenCalled();
    expect(tracks.stop).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('dictate-start'));
    await waitFor(() => expect(screen.getByTestId('dictate')).toHaveAttribute('data-phase', 'recording'));
    fireEvent.click(screen.getByTestId('dictate-stop'));
    await waitFor(() => expect(onTranscript).toHaveBeenCalledWith('Trailers wait an hour at the gate.'));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0][0])).toBe('/api/gap/voice/transcribe');
    expect((fetchSpy.mock.calls[0][1] as RequestInit).body).toBeInstanceOf(FormData);
    expect(screen.getByTestId('dictate-status')).toHaveTextContent(/confirm before anything is recorded/);
  });
  it('leaving the page mid-recording discards: the stop handler never posts', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { unmount } = render(<Dictate enabled onTranscript={vi.fn()} />);
    fireEvent.click(screen.getByTestId('dictate-start'));
    await waitFor(() => expect(screen.getByTestId('dictate')).toHaveAttribute('data-phase', 'recording'));
    unmount();
    expect(FakeRecorder.instances[0].state).toBe('inactive');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(tracks.stop).toHaveBeenCalled();
  });
  it('Escape while recording discards and says so', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<Dictate enabled onTranscript={vi.fn()} />);
    fireEvent.click(screen.getByTestId('dictate-start'));
    await waitFor(() => expect(screen.getByTestId('dictate')).toHaveAttribute('data-phase', 'recording'));
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.getByTestId('dictate-status')).toHaveTextContent('Discarded. Nothing was recorded.'));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('when transcription is off the button says why and never opens the microphone', async () => {
    const gum = navigator.mediaDevices.getUserMedia as unknown as ReturnType<typeof vi.fn>;
    render(<Dictate enabled={false} onTranscript={vi.fn()} />);
    expect(screen.getByTestId('dictate-off')).toHaveTextContent(DISABLED_MESSAGE);
    fireEvent.click(screen.getByTestId('dictate-start'));
    await waitFor(() => expect(screen.getByTestId('dictate-error')).toHaveTextContent(DISABLED_MESSAGE));
    expect(gum).not.toHaveBeenCalled();
    expect(FakeRecorder.instances).toHaveLength(0);
  });
  it('a failed transcription keeps the audio for Retry and says to type instead', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false, status: 502, json: async () => ({ error: 'provider_error' }) } as unknown as Response).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ text: 'Second try.' }) } as unknown as Response);
    const onTranscript = vi.fn();
    render(<Dictate enabled onTranscript={onTranscript} />);
    fireEvent.click(screen.getByTestId('dictate-start'));
    await waitFor(() => expect(screen.getByTestId('dictate')).toHaveAttribute('data-phase', 'recording'));
    fireEvent.click(screen.getByTestId('dictate-stop'));
    await waitFor(() => expect(screen.getByTestId('dictate-error')).toHaveTextContent(/Could not transcribe \(provider_error\)\. The recording is kept here: Retry, or type the note\./));
    fireEvent.click(screen.getByTestId('dictate-retry'));
    await waitFor(() => expect(onTranscript).toHaveBeenCalledWith('Second try.'));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

describe('the confirmation boundary in the capture flow', () => {
  it('I heard is editable; I am about to record names the account, person, conversation and quote; only Confirm writes (through /api/gap/captures); Discard writes nothing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const u = String(url);
      if (u === '/api/gap/voice/transcribe') return { ok: true, status: 200, json: async () => ({ text: 'Trailers wait an hour on Mondays.' }) } as unknown as Response;
      if (u.startsWith('/api/gap/capture/lookup')) return { ok: true, status: 200, json: async () => ({ people: [], hypotheses: [] }) } as unknown as Response;
      if (u === '/api/gap/captures') return { ok: true, status: 201, json: async () => ({ id: 'c1', accountName: 'PepsiCo', candidates: [], meetings: [], personaId: null, rawText: 'Trailers wait an hour on Mondays.' }) } as unknown as Response;
      throw new Error(`unexpected ${u}`);
    });
    render(<CaptureFlow initialAccount="PepsiCo" dictate />);
    fireEvent.click(screen.getByTestId('dictate-start'));
    await waitFor(() => expect(screen.getByTestId('dictate')).toHaveAttribute('data-phase', 'recording'));
    fireEvent.click(screen.getByTestId('dictate-stop'));
    await waitFor(() => expect(screen.getByTestId('dictate-review')).toBeInTheDocument());
    expect(screen.getByTestId('dictate-heard')).toHaveValue('Trailers wait an hour on Mondays.');
    expect(screen.getByTestId('dictate-about')).toHaveTextContent('Account: PepsiCo');
    expect(screen.getByTestId('dictate-about')).toHaveTextContent('Person: account level');
    expect(screen.getByTestId('dictate-about')).toHaveTextContent('Conversation: Meeting');
    expect(screen.getByTestId('dictate-about')).toHaveTextContent('Note: "Trailers wait an hour on Mondays."');
    // Nothing written yet.
    expect(fetchSpy.mock.calls.some(([u]) => String(u) === '/api/gap/captures')).toBe(false);
    fireEvent.change(screen.getByTestId('dictate-heard'), { target: { value: 'Trailers wait an hour on Mondays at the north gate.' } });
    fireEvent.click(screen.getByTestId('dictate-discard'));
    expect(screen.queryByTestId('dictate-review')).toBeNull();
    expect(fetchSpy.mock.calls.some(([u]) => String(u) === '/api/gap/captures')).toBe(false);
    // Again, then Confirm: one write, the edited words, the existing route.
    fireEvent.click(screen.getByTestId('dictate-start'));
    await waitFor(() => expect(screen.getByTestId('dictate')).toHaveAttribute('data-phase', 'recording'));
    fireEvent.click(screen.getByTestId('dictate-stop'));
    await waitFor(() => expect(screen.getByTestId('dictate-review')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('dictate-heard'), { target: { value: 'Trailers wait an hour on Mondays at the north gate.' } });
    // Words already typed in the note are kept: Confirm adds the transcript after them.
    fireEvent.change(screen.getByTestId('capture-text'), { target: { value: 'Met Karen at the gate.' } });
    fireEvent.click(screen.getByTestId('dictate-confirm'));
    await waitFor(() => expect(screen.getByTestId('capture-review')).toBeInTheDocument());
    const writes = fetchSpy.mock.calls.filter(([u]) => String(u) === '/api/gap/captures');
    expect(writes).toHaveLength(1);
    expect(JSON.parse(String((writes[0][1] as RequestInit).body))).toMatchObject({ accountName: 'PepsiCo', context: 'meeting', rawText: 'Met Karen at the gate.\nTrailers wait an hour on Mondays at the north gate.' });
    expect(fetchSpy.mock.calls.every(([u]) => !/send|enroll|suppress|do-not-contact|delete/i.test(String(u)))).toBe(true);
  });
});
