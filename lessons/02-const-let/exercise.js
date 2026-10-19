/** 2 hours 15 minutes → 135 minutes. */
export function totalMinutes(hours, minutes) {
  const total = hours * 60;
  total = total + minutes; // TypeError when this runs: fix the declaration above
  return total;
}

/** 30 → "30 seconds left" */
export function countdownLabel(seconds) {
  throw new Error('TODO: countdownLabel');
}
