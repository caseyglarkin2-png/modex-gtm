/**
 * Add-fact form (GAP Prospecting OS, Sprint 2, S2-T10).
 *
 * Pins the two modes, the submit gates (text for operator knowledge, a
 * parseable http(s) URL for a public fact), the two-call sequence on submit
 * (register, then link, then the refetch callback), the verbatim inline
 * refusal, and the frozen state once the hypothesis has left review.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AddFactForm,
  FACTS_FROZEN_HINT,
  OPERATOR_FACT_LABEL,
  TEXT_HINT,
  URL_HINT,
  isHttpUrl,
} from '@/components/gap/add-fact-form';

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderForm(status = 'draft', onLinked = vi.fn()) {
  render(<AddFactForm hypothesisId="hyp_1" accountName="Acme Foods" status={status} onLinked={onLinked} />);
  return onLinked;
}

describe('isHttpUrl', () => {
  it('accepts http and https, rejects bare words, ftp and blanks', () => {
    expect(isHttpUrl('https://x.test/a')).toBe(true);
    expect(isHttpUrl(' http://x.test ')).toBe(true);
    expect(isHttpUrl('notaurl')).toBe(false);
    expect(isHttpUrl('ftp://x.test/a')).toBe(false);
    expect(isHttpUrl('')).toBe(false);
  });
});

describe('<AddFactForm>', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders operator knowledge by default with the first-party label, and switches to the public mode', () => {
    renderForm();
    const kind = screen.getByLabelText('Add a fact') as HTMLSelectElement;
    expect(kind.value).toBe('operator_knowledge');
    expect(screen.getByLabelText('What you know')).toBeInTheDocument();
    expect(screen.getByTestId('add-fact-operator-label')).toHaveTextContent(OPERATOR_FACT_LABEL);
    expect(screen.queryByLabelText('URL')).toBeNull();
    expect((screen.getByLabelText('Observed on') as HTMLInputElement).value).toBe(new Date().toISOString().slice(0, 10));

    fireEvent.change(kind, { target: { value: 'public' } });
    expect(screen.getByLabelText('URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Excerpt')).toBeInTheDocument();
    expect(screen.queryByLabelText('What you know')).toBeNull();
    expect(screen.queryByTestId('add-fact-operator-label')).toBeNull();
  });

  it('operator mode: submit is disabled with the hint until text is present', () => {
    renderForm();
    const submit = screen.getByRole('button', { name: 'Add fact' });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('title', TEXT_HINT);

    fireEvent.change(screen.getByLabelText('What you know'), { target: { value: '   ' } });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText('What you know'), { target: { value: 'They run paper gate logs.' } });
    expect(submit).toBeEnabled();
    expect(submit).not.toHaveAttribute('title');
  });

  it('public mode rejects "notaurl": submit stays disabled with the hint, the inline error shows, nothing is posted', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Add a fact'), { target: { value: 'public' } });
    const submit = screen.getByRole('button', { name: 'Add fact' });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'notaurl' } });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('title', URL_HINT);
    expect(screen.getByTestId('add-fact-url-error')).toHaveTextContent(URL_HINT);
    fireEvent.submit(screen.getByTestId('add-fact-form'));
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://news.test/reno' } });
    expect(submit).toBeEnabled();
    expect(screen.queryByTestId('add-fact-url-error')).toBeNull();
  });

  it('operator submit: POSTs /api/gap/signals then the link endpoint, in that order, then calls onLinked and clears the text', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 'sig_new', created: true }, 201))
      .mockResolvedValueOnce(jsonResponse({ linked: ['sig_new'], already: [] }, 200));
    const onLinked = renderForm('review_required');

    fireEvent.change(screen.getByLabelText('What you know'), { target: { value: '  Reno still logs gate moves on paper.  ' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Paper gate log' } });
    fireEvent.change(screen.getByLabelText('Observed on'), { target: { value: '2026-09-20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add fact' }));

    await waitFor(() => expect(onLinked).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [registerUrl, registerInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(registerUrl).toBe('/api/gap/signals');
    expect(registerInit.method).toBe('POST');
    expect(JSON.parse(String(registerInit.body))).toEqual({
      accountName: 'Acme Foods',
      kind: 'operator_knowledge',
      observedAt: '2026-09-20',
      title: 'Paper gate log',
      text: 'Reno still logs gate moves on paper.',
    });

    const [linkUrl, linkInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(linkUrl).toBe('/api/gap/hypotheses/hyp_1/signals');
    expect(linkInit.method).toBe('POST');
    expect(JSON.parse(String(linkInit.body))).toEqual({ signalIds: ['sig_new'] });

    expect(fetchMock.mock.invocationCallOrder[0]).toBeLessThan(fetchMock.mock.invocationCallOrder[1]);
    expect(screen.getByTestId('add-fact-notice')).toHaveTextContent('Fact linked');
    expect((screen.getByLabelText('What you know') as HTMLTextAreaElement).value).toBe('');
  });

  it('public submit: the body carries url and excerpt, no text', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 'sig_old', created: false }, 201))
      .mockResolvedValueOnce(jsonResponse({ linked: ['sig_old'], already: [] }, 200));
    const onLinked = renderForm();

    fireEvent.change(screen.getByLabelText('Add a fact'), { target: { value: 'public' } });
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://news.test/reno' } });
    fireEvent.change(screen.getByLabelText('Excerpt'), { target: { value: 'The site opened in August.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add fact' }));

    await waitFor(() => expect(onLinked).toHaveBeenCalledTimes(1));
    const body = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body));
    expect(body).toMatchObject({ accountName: 'Acme Foods', kind: 'public', url: 'https://news.test/reno', excerpt: 'The site opened in August.' });
    expect(body.text).toBeUndefined();
    expect(screen.getByTestId('add-fact-notice')).toHaveTextContent('Linked an existing fact');
  });

  it('a refused register (422 no_evidence_text) renders the reason verbatim, never links, never refetches', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'no_evidence_text' }, 422));
    const onLinked = renderForm();

    fireEvent.change(screen.getByLabelText('What you know'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add fact' }));

    const error = await screen.findByTestId('add-fact-error');
    expect(error).toHaveTextContent('no_evidence_text');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onLinked).not.toHaveBeenCalled();
  });

  it('a refused link (409 narrative_frozen) renders the reason verbatim and does not refetch', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 'sig_new', created: true }, 201))
      .mockResolvedValueOnce(jsonResponse({ error: 'narrative_frozen' }, 409));
    const onLinked = renderForm();

    fireEvent.change(screen.getByLabelText('What you know'), { target: { value: 'A fact.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add fact' }));

    const error = await screen.findByTestId('add-fact-error');
    expect(error).toHaveTextContent('narrative_frozen');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onLinked).not.toHaveBeenCalled();
  });

  it('active hypothesis: every control and the submit are disabled, the hint is shown', () => {
    renderForm('active');
    expect(screen.getByTestId('add-fact-frozen')).toHaveTextContent(FACTS_FROZEN_HINT);
    const submit = screen.getByRole('button', { name: 'Add fact' });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('title', FACTS_FROZEN_HINT);
    expect(screen.getByLabelText('Add a fact')).toBeDisabled();
    expect(screen.getByLabelText('What you know')).toBeDisabled();
    expect(screen.getByLabelText('Title')).toBeDisabled();
    expect(screen.getByLabelText('Observed on')).toBeDisabled();
  });
});
