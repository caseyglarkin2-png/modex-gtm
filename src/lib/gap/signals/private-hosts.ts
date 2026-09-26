/**
 * Which hosts a PUBLIC fact may not cite (moved out of the signals route: a
 * Next route module may export only its handlers and route config).
 */

/**
 * Hosts that can never be a PUBLIC fact (R2-10): our own properties and the
 * tools we read prospects through. A url on one of these is first-party
 * knowledge at best and private intent at worst; the operator branch is
 * the honest place for it. A host matches when it equals an entry or ends
 * with `.` + the entry.
 */
export const PRIVATE_FACT_HOSTS: readonly string[] = [
  'yardflow.ai',
  'freightroll.com',
  'hubspot.com',
  'app.hubspot.com',
  'docs.google.com',
  'drive.google.com',
];

const PRIVATE_SUFFIXES = ['.local', '.internal', '.localhost'];

/** IPv4 loopback, RFC 1918 and link-local ranges. */
function isPrivateIpv4(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if (a === 127 || a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

/** Loopback, private ranges, local suffixes and the own-domain list. */
export function isPrivateHost(hostname: string): boolean {
  let host = hostname.trim().toLowerCase();
  if (host.endsWith('.')) host = host.slice(0, -1);
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
  if (!host) return true;
  if (host === 'localhost' || host === '::1' || host === '0:0:0:0:0:0:0:1') return true;
  if (isPrivateIpv4(host)) return true;
  if (PRIVATE_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  return PRIVATE_FACT_HOSTS.some((entry) => host === entry || host.endsWith(`.${entry}`));
}
