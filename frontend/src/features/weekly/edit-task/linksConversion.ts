import {
  parseLinkLine,
  cleanLinkLines,
  buildLinkLine,
  joinLinkLines,
} from "../../../shared/lib/linksMarkdown";

export interface LinkEntry {
  label?: string;
  url: string;
}

/**
 * Converts links markdown (used in the UI) to a structured JSON array for Supabase.
 */
export function markdownToLinksJson(markdown: string | undefined): LinkEntry[] {
  if (!markdown) return [];
  
  const lines = cleanLinkLines(markdown);
  return lines
    .map(line => {
      const parsed = parseLinkLine(line);
      if (!parsed) return null;
      const entry: LinkEntry = {
        url: parsed.url,
      };
      if (parsed.label && parsed.label !== parsed.url) {
        entry.label = parsed.label;
      }
      return entry;
    })
    .filter((entry): entry is LinkEntry => entry !== null);
}

/**
 * Converts a structured JSON array from Supabase back to links markdown for the UI.
 */
export function linksJsonToMarkdown(links: LinkEntry[] | null | undefined): string {
  if (!links || !Array.isArray(links) || links.length === 0) return "";
  
  const lines = links.map(link => buildLinkLine(link.url, link.label));
  return joinLinkLines(lines);
}
