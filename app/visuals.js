// Checks a ```visual spec (docs/SHARED-FORMAT.md, section 1) the way visual.js will play it.
// Used by the lesson tests and to check visuals the tutor writes before the learner sees them.

/** The scene after each step, as visual.js computes it (boxes merged by id, arrows replaced). */
export function scenes(scenario) {
  let boxes = [], arrows = [];
  return (scenario.steps || []).map(step => {
    for (const id of step.drop || []) boxes = boxes.filter(b => b.id !== id);
    for (const s of step.set || []) {
      const found = boxes.find(b => b.id === s.id);
      if (found) Object.assign(found, s);
      else boxes.push({ ...s });
    }
    if (step.arrows) arrows = step.arrows;
    return { boxes: boxes.map(b => ({ ...b })), arrows };
  });
}

/** Everything that would make the visual show nonsense; an empty list means it's fine. */
export function visualProblems(spec) {
  const problems = [];
  if (!spec?.scenarios?.length) return ['a visual needs scenarios'];
  for (const sc of spec.scenarios) {
    const where = sc.name || 'scenario';
    const regions = new Set((sc.regions || spec.regions || []).map(r => r.id));
    const lines = String(sc.code || '').split('\n').length;
    if (!regions.size) problems.push(`${where}: no regions`);
    if (!sc.steps || sc.steps.length < 2) { problems.push(`${where}: needs at least 2 steps`); continue; }
    scenes(sc).forEach((scene, i) => {
      const step = sc.steps[i], at = `${where} step ${i + 1}`;
      if (!step.say) problems.push(`${at}: needs "say"`);
      for (const b of scene.boxes) {
        if (!b.in) problems.push(`${at}: new box ${b.id} needs "in"`);
        else if (!regions.has(b.in)) problems.push(`${at}: box ${b.id} is in unknown region ${b.in}`);
      }
      const ids = new Set(scene.boxes.map(b => b.id));
      for (const a of scene.arrows) if (!ids.has(a.from) || !ids.has(a.to)) problems.push(`${at}: arrow ${a.from} → ${a.to} points at a missing box`);
      for (const n of [].concat(step.line ?? [])) if (!(n >= 1 && n <= lines)) problems.push(`${at}: line ${n} is outside the code (${lines} lines)`);
    });
  }
  return problems;
}

const ANATOMY_KINDS = ['keyword', 'name', 'type', 'macro', 'literal', 'symbol', 'operator'];

/** Problems with an ```anatomy spec: each part must be found in the code, in order, and be explained. */
export function anatomyProblems(spec) {
  const problems = [];
  const code = String(spec?.code || '');
  if (!code) return ['an anatomy needs "code"'];
  if (!spec.parts?.length) return ['an anatomy needs "parts"'];
  let at = 0;
  spec.parts.forEach((p, i) => {
    const where = `part ${i + 1} (${JSON.stringify(p.text)})`;
    const found = p.text ? code.indexOf(p.text, at) : -1;
    if (found < 0) problems.push(`${where} is not in the code after the previous part`);
    else at = found + p.text.length;
    if (!p.say) problems.push(`${where} needs "say"`);
    if (!ANATOMY_KINDS.includes(p.kind)) problems.push(`${where}: kind must be one of ${ANATOMY_KINDS.join(', ')}`);
  });
  return problems;
}
