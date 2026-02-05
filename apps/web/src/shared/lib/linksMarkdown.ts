const LINK_LINE_REGEX = /^\s*-\s*(?:\[(.*?)\]\((.*?)\)|(.*\S.*))$/;

export interface ParsedLink {
  label?: string;
  url: string;
  raw: string;
}

export interface LinkEntry extends ParsedLink {
  index: number;
}

export const parseLinkLine = (line: string): ParsedLink | null => {
  const trimmed = line.trim();
  const match = trimmed.match(LINK_LINE_REGEX);
  if (!match) {
    if (!trimmed) {
      return null;
    }
    return {
      label: trimmed,
      url: trimmed,
      raw: trimmed,
    };
  }

  const label = match[1];
  const url = match[2];
  const fallback = match[3]?.trim();

  if (label && url) {
    return { label, url, raw: trimmed };
  }

  const finalUrl = fallback || "";
  return { label: finalUrl, url: finalUrl, raw: trimmed };
};

export const normalizeLinkUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
  const candidate = hasProtocol ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    return url.href;
  } catch {
    return "";
  }
};

export const buildLinkLine = (url: string, label?: string) =>
  label ? `- [${label}](${url})` : `- ${url}`;

export const cleanLinkLines = (markdown: string) =>
  markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export const joinLinkLines = (lines: string[]) => lines.join("\n");

