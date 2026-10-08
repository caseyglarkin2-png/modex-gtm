// @vitest-environment jsdom
/**
 * R63-A S9: "CRM HubSpot: UNAVAILABLE" sat a few lines under "No open HubSpot deal, checked moments ago" on the same
 * email page (t3-05) and read like an outage. It meant only that this send is not logged to HubSpot. The final check
 * now says HubSpot once, in one sentence, with no reader code.
 */
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }), usePathname: () => '/gap' }));
import { SendFromYardflow } from '@/components/gap/send-from-yardflow';

const PREVIEW = { crmLogging: 'unavailable', fromName: 'Casey Larkin', from: 'casey@yardflow.ai', toName: 'Glen Scratch', to: 'glen@fedex-scratch.example', subject: 'Doors versus spots', body: 'Hi Glen,\n\nBody.', contentHash: 'c'.repeat(64), stepIndex: 0 };

afterEach(() => vi.unstubAllGlobals());

describe('R63-A S9: one HubSpot sentence on the final check', () => {
  it('a send that is not logged says so in words, beside the deal check, never "UNAVAILABLE"', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, preview: PREVIEW }) })));
    render(<SendFromYardflow decisionId="dec-1" mailbox="casey@yardflow.ai" />);
    fireEvent.click(screen.getByRole('button', { name: 'Send email' }));
    const confirm = await screen.findByTestId('send-confirm');
    expect(screen.getByTestId('send-hubspot')).toHaveTextContent('No open deal, read moments ago. This email is not logged in HubSpot; GAP records it as emailed.');
    expect(confirm).not.toHaveTextContent(/UNAVAILABLE|\bCRM\b|HubSpot: ON/);
    expect(confirm.textContent?.match(/HubSpot/g)?.length).toBe(2);
  });
});
