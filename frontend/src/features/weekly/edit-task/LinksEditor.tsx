import { useMemo, useState } from "react";
import {
  buildLinkLine,
  cleanLinkLines,
  joinLinkLines,
  normalizeLinkUrl,
  parseLinkLine,
  type LinkEntry,
} from "../../../shared/lib/linksMarkdown";

interface LinksEditorProps {
  linksMarkdown: string;
  onChange: (nextMarkdown: string) => void;
}

export function LinksEditor({ linksMarkdown, onChange }: LinksEditorProps) {
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkLabel, setNewLinkLabel] = useState("");

  const linkLines = useMemo(
    () => cleanLinkLines(linksMarkdown),
    [linksMarkdown]
  );
  const linkEntries: LinkEntry[] = useMemo(
    () =>
      linkLines
        .map((line, index) => {
          const parsed = parseLinkLine(line);
          return parsed ? { ...parsed, index } : null;
        })
        .filter((entry): entry is LinkEntry => Boolean(entry)),
    [linkLines]
  );

  const normalizedNewLinkUrl = normalizeLinkUrl(newLinkUrl);
  const canAddLink = Boolean(normalizedNewLinkUrl);

  const handleAddLink = () => {
    if (!normalizedNewLinkUrl) return;
    const label = newLinkLabel.trim() || undefined;
    const nextLine = buildLinkLine(normalizedNewLinkUrl, label);
    const nextLines = [...linkLines, nextLine];
    onChange(joinLinkLines(nextLines));
    setNewLinkUrl("");
    setNewLinkLabel("");
  };

  const handleRemoveLink = (index: number) => {
    const nextLines = linkLines.filter((_, idx) => idx !== index);
    onChange(joinLinkLines(nextLines));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={newLinkLabel}
          onChange={(e) => setNewLinkLabel(e.target.value)}
          placeholder="Label"
          className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
          />
          <button
            type="button"
            onClick={handleAddLink}
            disabled={!canAddLink}
            className="rounded px-3 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add link
          </button>
        </div>
      </div>
      {linkEntries.length > 0 && (
        <div className="flex flex-col gap-2 pt-1">
          {linkEntries.map((entry) => (
            <div
              key={`${entry.index}-${entry.url}`}
              className="flex items-center justify-between gap-4 rounded border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200"
            >
              <a
                href={entry.url}
                target="_blank"
                rel="noreferrer noopener"
                className="truncate text-slate-100 underline-offset-4 hover:text-white hover:underline"
              >
                {entry.label || entry.url}
              </a>
              <button
                type="button"
                onClick={() => handleRemoveLink(entry.index)}
                className="text-xs text-rose-400 hover:text-rose-200 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LinksEditor;
