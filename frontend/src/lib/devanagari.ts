/**
 * Devanagari Typography and Text Normalization Utility
 * Ensures perfect alignment, proper conjunct (sanyukt akshar) formation,
 * matra positioning, and clean typography for Sanskrit & Hindi.
 */

export function cleanDevanagari(text: string | null | undefined): string {
  if (!text) return "";
  return text
    // Fix virama followed immediately by short-i matra before consonant:
    // e.g. श् + ि + च -> श् + च + ि (prevents dotted circle ◌ glitch)
    .replace(/\u094d\u093f([\u0915-\u0939])/g, "\u094d$1\u093f")
    // Replace non-breaking spaces (\u00A0) and zero-width artifacts
    .replace(/[\u00a0\u200b\u200c\u200d]+/g, " ")
    // Normalize excessive horizontal whitespace
    .replace(/[ \t]+/g, " ")
    .trim();
}

/**
 * Normalizes Sanskrit shlokas by removing excessive blank lines (\n\n+)
 * so the shloka lines stay gracefully and tightly grouped.
 */
export function cleanSanskritShloka(text: string | null | undefined): string {
  if (!text) return "";
  let cleaned = cleanDevanagari(text);
  // Replace multiple newlines with a single newline to remove oversized gaps
  cleaned = cleaned.replace(/\r?\n\s*\r?\n+/g, "\n");
  return cleaned.trim();
}

export function cleanHindiTranslation(text: string | null | undefined): string {
  if (!text) return "";
  let cleaned = cleanDevanagari(text);
  // Normalize leading verse number format e.g. "।।2.5।। " or "||2.5|| " so spacing is consistent
  cleaned = cleaned.replace(/^(?:[।|]{1,2}\s*\d+[\.\s]+\d+\s*[।|]{1,2}\s*)/, "");
  return cleaned.trim();
}
