'use client';

/* ═══════════════════════════════════════════════════════════════
   Allentown Tour — Command Center · real corridor map panel
   Replaces the stylized MapMotif with the REAL /discovery Leaflet
   satellite map (CorridorMap), framed on the Allentown corridor with
   the live Primo site anchor at Breinigsville and the real prospect
   pins. The campaign's accounts (UNFI / Home Depot / Walgreens / KDP /
   Redner's) are highlighted; a companion list shows every campaign
   account, including any with no mapped site.
   ═══════════════════════════════════════════════════════════════ */

import React, { useMemo } from 'react';
import { CorridorMap } from '@/components/discovery/corridor-map';
import type { Corridor, ProspectRow } from '@/lib/discovery/types';
import {
  matchCampaignAccounts,
  highlightedPlaceIds,
  type CampaignAccountInput,
} from '@/lib/campaigns/account-match';

export interface CampaignMapProps {
  prospects: ProspectRow[];
  corridors: Corridor[];
  accounts: CampaignAccountInput[];
  /** Currently-selected account id (e.g. "a721") to surface in the companion list. */
  selectedAcctId?: string;
  onPick?: (id: string) => void;
}

export function CampaignMap({
  prospects,
  corridors,
  accounts,
  selectedAcctId,
  onPick,
}: CampaignMapProps) {
  const matches = useMemo(
    () => matchCampaignAccounts(accounts, prospects),
    [accounts, prospects],
  );
  const highlight = useMemo(() => highlightedPlaceIds(matches), [matches]);

  // Map a clicked map pin back to the campaign account that owns it.
  const placeToAccount = useMemo(() => {
    const m = new Map<string, string>();
    for (const match of matches) {
      for (const row of match.matchedRows) m.set(row.placeId, match.account.id);
    }
    return m;
  }, [matches]);

  const handleSelectProspect = (placeId: string) => {
    const acctId = placeToAccount.get(placeId);
    if (acctId && onPick) onPick(acctId);
  };

  const mappedCount = highlight.size;

  return (
    <div className="cc-cmap">
      <div className="cc-cmap-stage">
        {prospects.length === 0 ? (
          <div className="cc-cmap-empty">
            Discovery corridor data is unavailable. The people and account intel below still load.
          </div>
        ) : (
          <CorridorMap
            prospects={prospects}
            corridors={corridors}
            highlightPlaceIds={highlight}
            onSelectProspect={handleSelectProspect}
          />
        )}
      </div>

      <div className="cc-cmap-rail">
        <div className="cc-cmap-rail-head">
          <span className="t">Campaign accounts</span>
          <span className="sub">
            {mappedCount} mapped site{mappedCount === 1 ? '' : 's'} in the Allentown corridor
          </span>
        </div>
        <div className="cc-cmap-list">
          {matches.map(({ account, matchedRows }) => {
            const selected = account.id === selectedAcctId;
            const count = matchedRows.length;
            return (
              <button
                type="button"
                key={account.id}
                className={'cc-cmap-item' + (selected ? ' is-selected' : '')}
                onClick={() => onPick?.(account.id)}
                title={account.domain}
              >
                <span className={'cc-cmap-dot' + (count > 0 ? ' on' : '')} />
                <span className="cc-cmap-name">{account.name}</span>
                <span className="cc-cmap-count">
                  {count > 0 ? (
                    <>
                      {count} site{count === 1 ? '' : 's'}
                    </>
                  ) : (
                    <span className="nomap">no mapped site</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
