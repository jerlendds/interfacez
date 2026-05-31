export type MarkdownEventKind = "enter" | "exit";

export interface MarkdownPoint {
  line: number;
  column: number;
  offset: number;
}

export interface MarkdownEventLink {
  previous?: number;
  next?: number;
  content?: string;
}

export interface MarkdownEvent {
  kind: MarkdownEventKind;
  name: string;
  point: MarkdownPoint;
  link?: MarkdownEventLink;
}

interface Edit<T> {
  at: number;
  remove: number;
  add: T[];
}

type Jump = readonly [at: number, removeAcc: number, addAcc: number];

export class EditMap<T extends { link?: MarkdownEventLink }> {
  private readonly map: Edit<T>[] = [];

  add(index: number, remove: number, add: T[]): void {
    addImpl(this.map, index, remove, add, false);
  }

  addBefore(index: number, remove: number, add: T[]): void {
    addImpl(this.map, index, remove, add, true);
  }

  consume(events: T[]): void {
    this.map.sort((a, b) => a.at - b.at);
    if (this.map.length === 0) return;

    const jumps: Jump[] = [];
    let addAcc = 0;
    let removeAcc = 0;

    for (const edit of this.map) {
      removeAcc += edit.remove;
      addAcc += edit.add.length;
      jumps.push([edit.at, removeAcc, addAcc]);
    }

    shiftLinks(events, jumps);

    const slices: T[][] = [];

    for (let index = this.map.length - 1; index >= 0; index -= 1) {
      const edit = this.map[index];
      const tail = events.splice(edit.at + edit.remove);
      slices.push(tail);
      slices.push(edit.add.splice(0));
      events.length = edit.at;
    }

    slices.push(events.splice(0));
    events.length = 0;

    while (slices.length) {
      events.push(...slices.pop()!);
    }

    this.map.length = 0;
  }
}

function addImpl<T>(
  map: Edit<T>[],
  at: number,
  remove: number,
  add: T[],
  before: boolean,
): void {
  if (remove === 0 && add.length === 0) return;

  const existing = map.find((entry) => entry.at === at);

  if (existing) {
    existing.remove += remove;
    existing.add = before ? add.concat(existing.add) : existing.add.concat(add);
    return;
  }

  map.push({ at, remove, add });
}

function shiftLinks<T extends { link?: MarkdownEventLink }>(
  events: T[],
  jumps: readonly Jump[],
): void {
  let jumpIndex = 0;
  let index = 0;
  let add = 0;
  let rm = 0;

  while (index < events.length) {
    const rmCurr = rm;

    while (jumpIndex < jumps.length && jumps[jumpIndex][0] <= index) {
      add = jumps[jumpIndex][2];
      rm = jumps[jumpIndex][1];
      jumpIndex += 1;
    }

    if (rm > rmCurr) {
      index += rm - rmCurr;
      continue;
    }

    const link = events[index].link;
    const next = link?.next;

    if (next != null && events[next]?.link) {
      events[next].link!.previous = index + add - rm;

      while (jumpIndex < jumps.length && jumps[jumpIndex][0] <= next) {
        add = jumps[jumpIndex][2];
        rm = jumps[jumpIndex][1];
        jumpIndex += 1;
      }

      events[index].link!.next = next + add - rm;
      index = next;
      continue;
    }

    index += 1;
  }
}
