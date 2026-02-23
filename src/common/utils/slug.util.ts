import { randomInt } from 'crypto';

const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generates a URL-friendly slug from a name, appended with 4-6 random alphanumeric characters.
 * Example: "Dr. Jane Smith" -> "dr-jane-smith-x7k2m"
 */
export function generateSlugFromName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const suffixLength = randomInt(4, 7); // 4, 5, or 6
  const suffix = Array.from(
    { length: suffixLength },
    () => ALPHANUMERIC[randomInt(0, ALPHANUMERIC.length)],
  ).join('');

  return base ? `${base}-${suffix}` : suffix;
}
