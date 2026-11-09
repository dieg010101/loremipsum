// the figma spaces things out with runs of ordinary spaces ("buy  ask about it",
// "   ·   "). html would collapse them, so a run is non-breaking spaces ending in
// a normal one: same width, and the line can still wrap there.
export const sp = (n: number) => ' '.repeat(Math.max(0, n - 1)) + ' ';

/** "   ·   " */
export const DOT = `${sp(3)}·${sp(3)}`;

// keeps the runs of spaces that content uses for rhythm ("a  ·  b"), which html would collapse.
export const spaced = (text: string) => text.replace(/ {2,}/g, (run) => sp(run.length));
