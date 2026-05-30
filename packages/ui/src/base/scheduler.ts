const reads: Array<() => void> = [];
const writes: Array<() => void> = [];
let scheduled = false;

// A single frame runs all reads before all writes, keeping layout
// measurement and mutation from interleaving across callers.
function schedule() {
  if (scheduled) return;
  scheduled = true;

  requestAnimationFrame(() => {
    scheduled = false;
    for (const fn of reads.splice(0)) fn();
    for (const fn of writes.splice(0)) fn();
  });
}

/// Schedule a DOM read for the next animation frame.
export function read(fn: () => void) {
  reads.push(fn);
  schedule();
}

/// Schedule a DOM write for the next animation frame, after pending
/// reads have completed.
export function write(fn: () => void) {
  writes.push(fn);
  schedule();
}
