// The learner's own notes, one Markdown file per lesson: notes/<slug>.md (gitignored).
// Format (docs/SHARED-FORMAT.md, section 8; shared with the other learn-* repos):
//
//   # <lesson title>
//
//   <!-- note {"anchor":"token:println!","at":"2026-10-20T09:05:00.000Z"} -->
//   ## `println!`
//
//   free text…
import fs from 'node:fs';
import path from 'node:path';

const MARKER = /^<!-- note (\{.*\}) -->$/;
export const MAX_NOTE = 20_000;

/** Markdown file → { title, notes: [{ anchor, label, text, at }] }. Unreadable markers are skipped. */
export function parseNotes(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  const title = (lines.find(l => l.startsWith('# ')) || '# ').slice(2).trim();
  const notes = [];
  let cur = null;
  const flush = () => { if (cur) { cur.text = cur.lines.join('\n').trim(); delete cur.lines; notes.push(cur); } };
  for (const line of lines) {
    const m = MARKER.exec(line);
    if (m) {
      flush();
      cur = null;
      try {
        const meta = JSON.parse(m[1]);
        if (typeof meta.anchor === 'string' && meta.anchor) cur = { anchor: meta.anchor, label: '', text: '', at: String(meta.at || ''), lines: [] };
      } catch { /* a broken marker: ignore its section */ }
    } else if (cur && !cur.label && !cur.lines.some(Boolean) && line.startsWith('## ')) {
      cur.label = line.slice(3).trim();
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  flush();
  return { title, notes };
}

/** { title, notes } → Markdown, the exact inverse of parseNotes for well-formed notes. */
export function formatNotes({ title, notes }) {
  const parts = [`# ${title}`];
  for (const n of notes) {
    parts.push(`<!-- note ${JSON.stringify({ anchor: n.anchor, at: n.at })} -->\n## ${n.label}\n\n${n.text}`);
  }
  return parts.join('\n\n') + '\n';
}

export function readNotes(dir, slug) {
  try { return parseNotes(fs.readFileSync(path.join(dir, slug + '.md'), 'utf8')); } catch { return { title: '', notes: [] }; }
}

/** Create, replace or (with empty text) remove one note; returns the lesson's notes. */
export function saveNote(dir, slug, title, { anchor, label, text }, at = new Date().toISOString()) {
  if (typeof anchor !== 'string' || !anchor || anchor.length > 300 || /-->|\n/.test(anchor)) throw new Error('A note needs a short anchor');
  const body = String(text || '').trim();
  if (body.length > MAX_NOTE) throw new Error('That note is too long');
  const file = readNotes(dir, slug);
  const notes = file.notes.filter(n => n.anchor !== anchor || body);
  const clean = String(label || anchor).replace(/\s+/g, ' ').trim();
  const i = notes.findIndex(n => n.anchor === anchor);
  if (body && i >= 0) notes[i] = { ...notes[i], label: clean, text: body, at };
  else if (body) notes.push({ anchor, label: clean, text: body, at });
  const out = { title, notes };
  fs.mkdirSync(dir, { recursive: true });
  if (notes.length) fs.writeFileSync(path.join(dir, slug + '.md'), formatNotes(out));
  else fs.rmSync(path.join(dir, slug + '.md'), { force: true });
  return out;
}

/** Every lesson's notes: [{ slug, title, notes }]. */
export function listNotes(dir) {
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => f.endsWith('.md')); } catch { return []; }
  return files.sort().map(f => ({ slug: f.slice(0, -3), ...readNotes(dir, f.slice(0, -3)) })).filter(n => n.notes.length);
}
