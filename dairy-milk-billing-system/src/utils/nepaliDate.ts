/**
 * Nepali Bikram Sambat (BS) Date Utility
 * Kathmandu timezone: UTC+5:45
 * Fiscal Year: Baisakh (Month 1) to Chaitra (Month 12)
 */

export interface BSDate {
  year: number;
  month: number;
  day: number;
}

// Days in each month for BS years 2078–2085
const BS_MONTH_DAYS: Record<number, number[]> = {
  2078: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2080: [31, 31, 32, 31, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2082: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 29, 30],
  2083: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30],
  2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 29],
  2085: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
};

// Reference: 2081 Baisakh 1 = April 13, 2024 AD
const AD_REF = new Date(2024, 3, 13); // April 13, 2024
const BS_REF: BSDate = { year: 2081, month: 1, day: 1 };

/** Get current date/time in Kathmandu timezone (UTC+5:45) */
export function getNowKathmandu(): Date {
  const now = new Date();
  // Kathmandu offset in minutes: 5*60 + 45 = 345
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 345 * 60000);
}

/** Convert AD Date to BS Date */
export function adToBS(adDate: Date): BSDate {
  // Days difference from reference
  const refTime = AD_REF.getTime();
  const targetTime = new Date(adDate.getFullYear(), adDate.getMonth(), adDate.getDate()).getTime();
  const diffDays = Math.round((targetTime - refTime) / 86400000);

  let { year, month, day } = BS_REF;
  let remaining = diffDays;

  if (remaining >= 0) {
    // Move forward
    while (remaining > 0) {
      const daysInMonth = BS_MONTH_DAYS[year]?.[month - 1] ?? 30;
      const daysLeftInMonth = daysInMonth - day;
      if (remaining <= daysLeftInMonth) {
        day += remaining;
        remaining = 0;
      } else {
        remaining -= daysLeftInMonth + 1;
        day = 1;
        month++;
        if (month > 12) { month = 1; year++; }
      }
    }
  } else {
    // Move backward
    remaining = Math.abs(remaining);
    while (remaining > 0) {
      if (remaining < day) {
        day -= remaining;
        remaining = 0;
      } else {
        remaining -= day;
        month--;
        if (month < 1) { month = 12; year--; }
        day = BS_MONTH_DAYS[year]?.[month - 1] ?? 30;
      }
    }
  }

  return { year, month, day };
}

/** Get today's date in BS (Kathmandu time) */
export function getTodayBS(): BSDate {
  return adToBS(getNowKathmandu());
}

/** Format BSDate as YYYY/MM/DD string */
export function formatBSDate(d: BSDate): string {
  return `${d.year}/${String(d.month).padStart(2, '0')}/${String(d.day).padStart(2, '0')}`;
}

/** Format BSDate as human-readable: "15 Baisakh 2082" */
export function formatBSFull(d: BSDate): string {
  return `${d.day} ${BS_MONTHS[d.month - 1]} ${d.year}`;
}

/** Format BSDate short: "Bai 15, 2082" */
export function formatBSShort(d: BSDate): string {
  return `${BS_MONTHS_SHORT[d.month - 1]} ${d.day}, ${d.year}`;
}

/** Parse "YYYY/MM/DD" string to BSDate */
export function parseBSDate(str: string): BSDate {
  const [y, m, d] = str.split('/').map(Number);
  return { year: y, month: m, day: d };
}

/** Get days in a given BS month */
export function getDaysInBSMonth(year: number, month: number): number {
  return BS_MONTH_DAYS[year]?.[month - 1] ?? 30;
}

/** Get fortnight: 1 = 1st–15th, 2 = 16th–end */
export function getFortnight(d: BSDate): 1 | 2 {
  return d.day <= 15 ? 1 : 2;
}

/** Get fortnight date range strings */
export function getFortnightRange(year: number, month: number, half: 1 | 2): { start: string; end: string } {
  const endDay = half === 1 ? 15 : getDaysInBSMonth(year, month);
  const startDay = half === 1 ? 1 : 16;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    start: `${year}/${pad(month)}/${pad(startDay)}`,
    end: `${year}/${pad(month)}/${pad(endDay)}`,
  };
}

/** Compare two BS date strings */
export function compareBSDateStr(a: string, b: string): number {
  return a.localeCompare(b);
}

/** Get current fiscal year (BS): Baisakh=start, Chaitra=end */
export function getCurrentFiscalYear(): number {
  return getTodayBS().year;
}

/** Get all dates in a BS month as strings */
export function getBSMonthDates(year: number, month: number): string[] {
  const days = getDaysInBSMonth(year, month);
  const pad = (n: number) => String(n).padStart(2, '0');
  return Array.from({ length: days }, (_, i) => `${year}/${pad(month)}/${pad(i + 1)}`);
}

/** Format current Kathmandu time as HH:MM */
export function getCurrentTimeKTM(): string {
  const now = getNowKathmandu();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export const BS_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

export const BS_MONTHS_SHORT = [
  'Bai', 'Jes', 'Ash', 'Shr', 'Bha', 'Ash',
  'Kar', 'Man', 'Pou', 'Mag', 'Fal', 'Cha',
];

export const BS_MONTHS_NP = [
  'बैशाख', 'जेष्ठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
  'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र',
];
