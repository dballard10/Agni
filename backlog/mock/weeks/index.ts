const weekModules = import.meta.glob("./*.md", { as: "raw", eager: true }) as Record<string, string>;

export const mockWeekMarkdownByStartISO: Record<string, string> = {};

for (const [path, content] of Object.entries(weekModules)) {
  const match = path.match(/\.\/([\d-]{10})\.md$/);
  if (!match) continue;
  mockWeekMarkdownByStartISO[match[1]] = content.trim();
}

export const availableMockWeekStartsISO = Object.keys(
  mockWeekMarkdownByStartISO
).sort((a, b) => (a < b ? 1 : -1));
