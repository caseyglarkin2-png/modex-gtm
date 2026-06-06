/**
 * Draft Queue scheduling: pure, DST-correct, no DB.
 *
 * All wall-clock reasoning goes through Intl (the IANA tz database) rather than
 * fixed UTC offsets, so a window of "08:00 local" lands correctly whether the
 * target day is in DST (EDT, -4) or standard time (EST, -5).
 */
import { STATUS } from '@/lib/queue/types';

export interface WindowConfig {
  tz: string;
  startHour: number;
  endHour: number;
  /** Allowed ISO weekday numbers, 1=Mon .. 7=Sun. */
  days: number[];
}

export const DEFAULT_WINDOW: WindowConfig = {
  tz: 'America/New_York',
  startHour: 8,
  endHour: 18,
  days: [1, 2, 3, 4, 5],
};

/** N send times, `minutesApart` apart, starting at base. Does not mutate base. */
export function staggerTimes(base: Date, count: number, minutesApart: number): Date[] {
  const out: Date[] = [];
  const stepMs = minutesApart * 60 * 1000;
  for (let i = 0; i < count; i++) {
    out.push(new Date(base.getTime() + i * stepMs));
  }
  return out;
}

const WEEKDAY_TO_ISO: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

interface LocalParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
  second: number;
  isoWeekday: number; // 1=Mon..7=Sun
}

/** Read the wall-clock parts of an instant in `tz`. */
function getLocalParts(date: Date, tz: string): LocalParts {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value])) as Record<
    string,
    string
  >;
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    // Intl can render midnight as "24"; normalize to 0.
    hour: Number(p.hour) % 24,
    minute: Number(p.minute),
    second: Number(p.second),
    isoWeekday: WEEKDAY_TO_ISO[p.weekday],
  };
}

/**
 * Build the UTC instant whose wall-clock rendering in `tz` is the given local
 * Y/M/D H:M:S. Solves for the tz offset by formatting a guess and correcting,
 * which is DST-safe (the offset is read from the IANA db for that exact day).
 */
function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  tz: string,
): Date {
  // First guess: treat the desired local parts as if they were UTC.
  const guessMs = Date.UTC(year, month - 1, day, hour, minute, second);
  let guess = new Date(guessMs);
  // How does that guess actually render in tz? The delta is the offset.
  for (let i = 0; i < 2; i++) {
    const lp = getLocalParts(guess, tz);
    const renderedAsUtc = Date.UTC(
      lp.year,
      lp.month - 1,
      lp.day,
      lp.hour,
      lp.minute,
      lp.second,
    );
    const diff = guessMs - renderedAsUtc;
    if (diff === 0) break;
    guess = new Date(guess.getTime() + diff);
  }
  return guess;
}

/**
 * Clamp an instant into the next valid business-hours slot in cfg.tz:
 *  - local time < startHour on an allowed day -> startHour same local day
 *  - local time >= endHour, or day not allowed -> startHour on the next allowed day
 *  - otherwise unchanged.
 * Returns the UTC instant for the clamped local wall-time. DST-correct.
 */
export function clampToWindow(date: Date, cfg: WindowConfig = DEFAULT_WINDOW): Date {
  const lp = getLocalParts(date, cfg.tz);
  const dayAllowed = cfg.days.includes(lp.isoWeekday);

  // Inside the window on an allowed day -> unchanged.
  if (dayAllowed && lp.hour >= cfg.startHour && lp.hour < cfg.endHour) {
    return new Date(date.getTime());
  }

  // Before the window on an allowed day -> startHour same local day.
  if (dayAllowed && lp.hour < cfg.startHour) {
    return zonedTimeToUtc(lp.year, lp.month, lp.day, cfg.startHour, 0, 0, cfg.tz);
  }

  // Otherwise (after window, or day not allowed) -> startHour on next allowed day.
  let { year, month, day } = lp;
  // Step the local calendar forward day-by-day until we hit an allowed weekday.
  // Use UTC math purely to advance the calendar date; weekday is recomputed via
  // a noon-local probe so we never trip over DST transitions.
  let cursor = Date.UTC(year, month - 1, day);
  do {
    cursor += 24 * 60 * 60 * 1000;
    const probe = new Date(cursor);
    year = probe.getUTCFullYear();
    month = probe.getUTCMonth() + 1;
    day = probe.getUTCDate();
    // Confirm the ISO weekday of this local calendar day at startHour.
    const candidate = zonedTimeToUtc(year, month, day, cfg.startHour, 0, 0, cfg.tz);
    const candLp = getLocalParts(candidate, cfg.tz);
    if (cfg.days.includes(candLp.isoWeekday)) {
      return candidate;
    }
  } while (true);
}

/**
 * Items ripe to send now: status 'approved' and scheduled_for <= now.
 * Preserves input order. Null scheduled_for is excluded.
 */
export function selectDue<T extends { status: string; scheduled_for: Date | null }>(
  items: T[],
  now: Date,
): T[] {
  return items.filter(
    (it) =>
      it.status === STATUS.approved &&
      it.scheduled_for !== null &&
      it.scheduled_for.getTime() <= now.getTime(),
  );
}
