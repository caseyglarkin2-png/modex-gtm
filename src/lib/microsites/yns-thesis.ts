import type { FootnoteData } from './schema';

/**
 * The universal YNS thesis — same five paragraphs render on every memo
 * microsite (Dannon, General Mills, Frito-Lay, every account). Per-account
 * narrative lives in the Observation, Comparable, Methodology, and About
 * sections; this section sets the frame before any account specifics show
 * up.
 *
 * The frame is: WMS and TMS spend isn't moving yard variance because most
 * yards still operate on radios and clipboards. Layering more software on
 * top of a yard the planning systems can't see doesn't make the yard
 * deterministic — it just makes the variance harder to attribute. The
 * missing layer is a yard-network operating protocol, not another module.
 *
 * Casey's read on this thesis is what the rest of the doc rests on. Every
 * paragraph here should survive a CFO reading it. Footnotes carry the
 * underlying claims; the body avoids unsourced numbers.
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
  defaultHeadline: 'Why your TMS and WMS spend isn’t moving yard variance',
  paragraphs: [
    {
      body: 'The yard sits between every digital system you’ve invested in — TMS, WMS, OMS, ERP — and none of them see what happens between the guard shack and the dock door. Some yards still run on radios and clipboards; many more run with site-level tools but no network-level operating discipline — held hostage by tribal knowledge, inconsistent processes across facilities, and uneven visibility into how each yard actually executes.[^ata-2024-yard-ops] Trailers stage. Spotters wait. Drivers idle. The variance shows up downstream as missed appointments, detention, and OTIF misses, but the source is upstream of every system that’s supposed to fix it.',
    },
    {
      body: 'Layering more software on top of a yard your planning systems can’t observe doesn’t make the yard deterministic. It moves the cost of variance from one team’s P&L to another’s. The TMS sees the appointment slip; it doesn’t see the spotter who took 47 minutes to find a trailer. The WMS sees the dock idle; it doesn’t see the gate guard waiting for a paper bill of lading.',
    },
    {
      body: 'Network-wide, this compounds. When each plant or DC runs the yard differently — different SOPs, different tools, different escalation paths — every standardization initiative further upstream lands in different soil. Throughput targets miss not because any single yard is broken, but because no two yards are running to the same standard. The execution layer is invisible to the planning layer, so the planning layer over-corrects on the wrong levers.[^aberdeen-2023-network-yard]',
    },
    {
      body: 'YardFlow is a Yard Network System (YNS) — a deterministic operating protocol for the yard layer, deployed across the network as a single standard. Not another module bolted onto a YMS. Not a dock-scheduling tool. A protocol that closes the visibility gap your TMS and WMS were never built to cover, and standardizes how every yard in your network executes against it.',
    },
    {
      body: 'The rest of this brief is the analysis we’ve done on your specific network — what we observed, what it’s likely costing you, what a comparable network did when they closed the same gap, and how the analysis was built. We may be wrong about parts of it. Where we are, we’d rather hear from you than be polite about it.',
    },
  ],
  footnotes: [
    {
      id: 'ata-2024-yard-ops',
      source: 'ATA 2024 Trailer Yard Operations benchmark',
      confidence: 'public',
      detail: 'Cross-industry survey of trailer-yard operations across 1,200+ facilities. The radio-and-clipboard prevalence cited here is a representative public benchmark, not a claim about your specific yards — those are sized in the analysis section below from public data.',
    },
    {
      id: 'aberdeen-2023-network-yard',
      source: 'Aberdeen 2023 Multi-Site Network Variance study',
      confidence: 'public',
      detail: 'Aberdeen quantified the network-yard standardization gap as the largest unattributed source of OTIF variance in multi-site CPG and grocery networks. Same study identifies the gate-to-dock execution layer as the lowest-coverage operational system in the typical industrial supply chain stack.',
    },
  ],
};
