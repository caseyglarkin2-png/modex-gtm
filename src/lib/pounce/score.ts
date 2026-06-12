/**
 * Pounce Engine — trigger taxonomy + deterministic scoring (Phase 1, Task 2).
 *
 * No LLM in the cron path: pounce-ability is a keyword taxonomy with weights,
 * tuned against the signals we know convert (the calibration case is the
 * 2026-06-08 PepsiCo+Gatik autonomous-freight agreement, which must land in
 * the ping tier). Finance noise (price targets, analyst chatter) is penalized
 * unless a supply-chain term co-occurs, because account-name news queries
 * drown in stock copy otherwise.
 */

export interface TriggerScore {
  score: number;
  categories: string[];
}

interface Category {
  key: string;
  weight: number;
  patterns: RegExp;
}

const CATEGORIES: Category[] = [
  {
    key: 'AUTONOMY',
    weight: 6,
    patterns: /\b(gatik|autonomous|driverless|self-driving|robot truck|robotruck|waymo|aurora innovation|kodiak|plus\.ai|einride)\b/i,
  },
  {
    key: 'YARD_DIRECT',
    weight: 6,
    patterns: /\b(truck yard|yards?\b.{0,30}(automat|digit|manag)|yard management|yms\b|dock door|dock schedul|detention|dwell time|gate automation|trailer pool|drop trailer)\b/i,
  },
  {
    key: 'DIGITAL_OPS',
    weight: 4,
    patterns: /\b(digital twin|omniverse|ai-powered|artificial intelligence|automat\w*|robotics|industry 4\.0|machine vision|computer vision)\b/i,
  },
  {
    key: 'NETWORK_CAPEX',
    weight: 4,
    patterns: /\b(new plant|new factory|distribution center|fulfillment center|greenfield|breaks ground|broke ground|expansion|million[- ]square[- ]f(oo|ee)t|opens? (a )?(new )?facility|mega[- ]?site|capex|capital investment)\b/i,
  },
  {
    key: 'COST_RESTRUCTURE',
    weight: 4,
    patterns: /\b(clos(e[sd]?|ing|ures?)\b.{0,30}(plants?|facilit|warehouse|distribution)|closure|shutting down|restructur\w*|layoffs?|activist investor|elliott|productivity (program|initiative|target)|cost[- ]cut\w*|network optimization|consolidat\w*)\b/i,
  },
  {
    key: 'LEADERSHIP',
    weight: 3,
    patterns: /\b(chief supply chain|csco\b|(svp|vp|vice president)[^.]{0,40}supply chain|appoints?|names? new (ceo|cfo|coo|chief))\b/i,
  },
  {
    key: 'FREIGHT',
    weight: 2,
    patterns: /\b(private fleet|trucking|freight|carrier|transportation network|middle[- ]mile|logistics network)\b/i,
  },
];

const FINANCE_NOISE = /\b(price target|stock|shares?|dividend|analyst|rating|upgrade[ds]?|downgrade[ds]?|buy now|undervalued|betting|fantasy|wall st)\b/i;
const SUPPLY_TERM = /\b(supply chain|logistics|warehouse|plant|factory|distribution|freight|trucking|yard|dock|fleet)\b/i;

export function scoreTrigger(title: string, accountName: string): TriggerScore {
  const categories: string[] = [];
  let score = 0;
  for (const c of CATEGORIES) {
    if (c.patterns.test(title)) {
      categories.push(c.key);
      score += c.weight;
    }
  }
  // Name-in-title: the story is ABOUT the account, not a passing mention.
  const nameCore = accountName.replace(/^The /i, '').split(/[ /]/)[0];
  if (nameCore.length >= 3 && title.toLowerCase().includes(nameCore.toLowerCase())) {
    score += 2;
  }
  if (FINANCE_NOISE.test(title) && !SUPPLY_TERM.test(title)) {
    score -= 6;
  }
  return { score, categories };
}

/** Ping tier: a trigger worth interrupting #yardflow-intent for. */
export const PING_THRESHOLD = 8;
