// Reads lessons/NN-slug/lesson.md (format: docs/SHARED-FORMAT.md).
import fs from 'node:fs';
import path from 'node:path';

const SLUG = /^[a-z0-9][a-z0-9-]*$/;

/** Parse the small YAML subset used in lesson front matter. */
export function parseFrontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const raw of m[1].split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, '').trim();
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    meta[kv[1]] = parseValue(kv[2]);
  }
  return { meta, body: text.slice(m[0].length) };
}

function parseValue(v) {
  if (/^\[.*\]$/.test(v)) {
    const inner = v.slice(1, -1).trim();
    return inner ? inner.split(',').map(s => parseValue(s.trim())) : [];
  }
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v.replace(/^(['"])(.*)\1$/, '$2');
}

export function listLessons(lessonsDir) {
  if (!fs.existsSync(lessonsDir)) return [];
  return fs.readdirSync(lessonsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && SLUG.test(d.name) && fs.existsSync(path.join(lessonsDir, d.name, 'lesson.md')))
    .map(d => d.name)
    .sort()
    .map(slug => {
      const { meta } = parseFrontMatter(fs.readFileSync(path.join(lessonsDir, slug, 'lesson.md'), 'utf8'));
      return { slug, id: meta.id, title: meta.title || slug, minutes: meta.minutes, concepts: meta.concepts || [], kind: meta.kind || 'core', for: meta.for || null, topic: meta.topic || null };
    });
}

/** Load one lesson, or null if the slug isn't a lesson folder. */
export function loadLesson(lessonsDir, slug) {
  if (!SLUG.test(slug)) return null;
  const dir = path.join(lessonsDir, slug);
  const mdPath = path.join(dir, 'lesson.md');
  if (!fs.existsSync(mdPath)) return null;
  const { meta, body } = parseFrontMatter(fs.readFileSync(mdPath, 'utf8'));
  const file = meta.edit;
  if (typeof file !== 'string' || file.includes('..') || path.isAbsolute(file)) {
    throw new Error(`lesson ${slug}: front matter needs an "edit:" file inside the lesson folder`);
  }
  return { slug, dir, meta, body, file, starter: fs.readFileSync(path.join(dir, file), 'utf8') };
}
