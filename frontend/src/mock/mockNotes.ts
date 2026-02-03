export interface Note {
  id: string;
  title: string;
  path: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const mockNotes: Note[] = [
  {
    id: "note-1",
    title: "Daily Scratchpad",
    path: "Daily/Daily Scratchpad.md",
    content: `# Daily Scratchpad

- [ ] One thing to do today
- [ ] Another thing to remember
- [x] Already finished this one

## Thoughts

Write your thoughts here...

## Quick Links

- [[Project Ideas]]
- [[Reading List]]
`,
    createdAt: "2025-01-14T08:00:00Z",
    updatedAt: "2025-01-14T10:30:00Z",
  },
  {
    id: "note-2",
    title: "Project Ideas",
    path: "Projects/Project Ideas.md",
    content: `# Project Ideas

## App Concepts

1. **Habit Tracker** - Track daily habits with streaks
2. **Recipe Manager** - Store and organize recipes with markdown
3. **Bookmark Manager** - Tag and search bookmarks

## Learning Goals

- [ ] Learn Rust basics
- [ ] Build a CLI tool
- [ ] Explore WebAssembly

## Notes

Keep brainstorming here. Link to [[Daily Scratchpad]] for daily tasks.
`,
    createdAt: "2025-01-10T09:00:00Z",
    updatedAt: "2025-01-13T14:00:00Z",
  },
  {
    id: "note-3",
    title: "Reading List",
    path: "Personal/Reading List.md",
    content: `# Reading List

## Currently Reading

- **The Pragmatic Programmer** - David Thomas & Andrew Hunt
  - Chapter 5: Bend or Break

## To Read

- [ ] Clean Code - Robert C. Martin
- [ ] Designing Data-Intensive Applications - Martin Kleppmann
- [ ] Structure and Interpretation of Computer Programs

## Finished

- [x] Atomic Habits - James Clear
- [x] Deep Work - Cal Newport

## Book Notes

Link detailed notes here as you read.
`,
    createdAt: "2025-01-05T12:00:00Z",
    updatedAt: "2025-01-12T16:00:00Z",
  },
  {
    id: "note-4",
    title: "Meeting Notes",
    path: "Work/Meetings/2025-01-14 Sync.md",
    content: `# Meeting Notes

## 2025-01-14 - Weekly Sync

### Attendees
- Alice
- Bob
- Charlie

### Agenda
1. Sprint review
2. Blockers
3. Next steps

### Action Items
- [ ] Alice: Finish API docs
- [ ] Bob: Review PR #123
- [ ] Charlie: Set up staging environment

---

## 2025-01-07 - Planning Session

See [[Project Ideas]] for context.
`,
    createdAt: "2025-01-07T10:00:00Z",
    updatedAt: "2025-01-14T11:00:00Z",
  },
];

export function createNewNote(): Note {
  const now = new Date().toISOString();
  const id = `note-${Date.now()}`;
  return {
    id,
    title: "Untitled Note",
    path: "Untitled Note.md",
    content: `# Untitled Note

Start writing here...
`,
    createdAt: now,
    updatedAt: now,
  };
}
