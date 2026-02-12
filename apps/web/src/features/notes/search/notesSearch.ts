import type { Note } from "../../../mock/mockNotes";

export interface MatchPreview {
  lineNumber: number;
  text: string;
  matchStart: number; // offset within the line
  matchEnd: number;
  rangeFrom: number; // absolute offset in page content
  rangeTo: number;
  pageIndex: number; // which page the match is on
  pageTitle: string; // title of the page
}

export interface NoteSearchResult {
  noteId: string;
  title: string;
  path: string;
  matchCount: number;
  titleMatchCount: number;
  pathMatchCount: number;
  contentMatchCount: number;
  contentMatches: MatchPreview[]; // one item per match occurrence
  firstMatchRange: { from: number; to: number; pageIndex: number } | null;
}

/**
 * Search notes by title, path, and content using case-insensitive substring matching.
 * Searches across all pages of each note.
 * Returns results with match counts, preview lines, and the first match range.
 */
export function searchNotes(notes: Note[], query: string): NoteSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const lowerQuery = trimmed.toLowerCase();
  const results: NoteSearchResult[] = [];

  for (const note of notes) {
    const titleLower = note.title.toLowerCase();
    const pathLower = note.path.toLowerCase();

    // Check title/path matches
    const titleMatches = titleLower.includes(lowerQuery);
    const pathMatches = pathLower.includes(lowerQuery);

    // Search all pages for content matches
    const allContentMatches: MatchPreview[] = [];
    let totalContentMatchCount = 0;
    let firstMatchRange: { from: number; to: number; pageIndex: number } | null = null;

    for (let pageIdx = 0; pageIdx < note.pages.length; pageIdx++) {
      const page = note.pages[pageIdx];
      const { contentMatchCount, contentMatches: pageMatches, firstMatchRange: pageFirstMatch } =
        findContentMatches(page.content, lowerQuery, pageIdx, page.title);

      totalContentMatchCount += contentMatchCount;
      allContentMatches.push(...pageMatches);

      if (firstMatchRange === null && pageFirstMatch !== null) {
        firstMatchRange = { ...pageFirstMatch, pageIndex: pageIdx };
      }
    }

    const hasContentMatches = totalContentMatchCount > 0;

    if (!titleMatches && !pathMatches && !hasContentMatches) {
      continue;
    }

    // Count matches
    const titleMatchCount = titleMatches
      ? countOccurrences(titleLower, lowerQuery)
      : 0;
    const pathMatchCount = pathMatches ? countOccurrences(pathLower, lowerQuery) : 0;

    const matchCount = titleMatchCount + pathMatchCount + totalContentMatchCount;

    results.push({
      noteId: note.id,
      title: note.title,
      path: note.path,
      matchCount,
      titleMatchCount,
      pathMatchCount,
      contentMatchCount: totalContentMatchCount,
      contentMatches: allContentMatches,
      firstMatchRange,
    });
  }

  // Sort by match count descending, then by title
  results.sort((a, b) => {
    if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
    return a.title.localeCompare(b.title);
  });

  return results;
}

function countOccurrences(text: string, query: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = text.indexOf(query, pos)) !== -1) {
    count++;
    pos += query.length;
  }
  return count;
}

interface ContentMatchResult {
  contentMatchCount: number;
  contentMatches: MatchPreview[]; // one item per match occurrence
  firstMatchRange: { from: number; to: number } | null;
}

function findContentMatches(
  content: string,
  lowerQuery: string,
  pageIndex: number,
  pageTitle: string
): ContentMatchResult {
  const lines = content.split("\n");
  const contentMatches: MatchPreview[] = [];
  let firstMatchRange: { from: number; to: number } | null = null;
  let contentMatchCount = 0;

  let charOffset = 0;
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineLower = line.toLowerCase();
    let pos = 0;

    while ((pos = lineLower.indexOf(lowerQuery, pos)) !== -1) {
      contentMatchCount++;

      const rangeFrom = charOffset + pos;
      const rangeTo = charOffset + pos + lowerQuery.length;

      // Record first match range (absolute offset in content)
      if (firstMatchRange === null) {
        firstMatchRange = { from: rangeFrom, to: rangeTo };
      }

      contentMatches.push({
        lineNumber: lineIdx + 1, // 1-based
        text: line,
        matchStart: pos,
        matchEnd: pos + lowerQuery.length,
        rangeFrom,
        rangeTo,
        pageIndex,
        pageTitle,
      });

      pos += lowerQuery.length;
    }

    // +1 for the newline character (except last line)
    charOffset += line.length + (lineIdx < lines.length - 1 ? 1 : 0);
  }

  return { contentMatchCount, contentMatches, firstMatchRange };
}
