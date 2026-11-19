'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, GripVertical, LayoutGrid, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface BoardWidget {
  id: string;
  /** Shown in edit mode and in the "hidden widgets" tray. */
  title: string;
  /** Width in a 12-column grid on large screens. Always full width on mobile. */
  span?: 4 | 5 | 6 | 7 | 8 | 12;
  content: React.ReactNode;
}

interface BoardState {
  order: string[];
  hidden: string[];
}

const SPAN_CLASS: Record<NonNullable<BoardWidget['span']>, string> = {
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  12: 'lg:col-span-12',
};

const keyFor = (storageKey: string) => `omni:board:${storageKey}`;

function load(storageKey: string): BoardState | null {
  try {
    const raw = window.localStorage.getItem(keyFor(storageKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BoardState>;
    return {
      order: Array.isArray(parsed.order) ? parsed.order.filter((x) => typeof x === 'string') : [],
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden.filter((x) => typeof x === 'string') : [],
    };
  } catch {
    return null;
  }
}

function save(storageKey: string, state: BoardState) {
  try {
    window.localStorage.setItem(keyFor(storageKey), JSON.stringify(state));
  } catch {
    /* storage can be blocked: layout just won't persist */
  }
}

/** Saved order first (for ids that still exist), new widgets appended in their default position. */
function reconcile(widgets: BoardWidget[], saved: BoardState | null): BoardState {
  const ids = widgets.map((w) => w.id);
  if (!saved) return { order: ids, hidden: [] };
  const known = saved.order.filter((id) => ids.includes(id));
  const added = ids.filter((id) => !known.includes(id));
  return { order: [...known, ...added], hidden: saved.hidden.filter((id) => ids.includes(id)) };
}

/**
 * Drag-and-drop dashboard layout. Users can reorder widgets (drag the grip, or use the arrow
 * buttons from the keyboard), hide ones they don't need, and reset to the default. The layout is
 * remembered per browser under `storageKey`.
 */
export function WidgetBoard({
  storageKey,
  widgets,
  className,
}: {
  storageKey: string;
  widgets: BoardWidget[];
  className?: string;
}) {
  const defaultState = React.useMemo(() => reconcile(widgets, null), [widgets]);
  const [state, setState] = React.useState<BoardState>(defaultState);
  const [editing, setEditing] = React.useState(false);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  // Restore the saved layout after mount (avoids a hydration mismatch).
  React.useEffect(() => {
    setState(reconcile(widgets, load(storageKey)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, widgets.map((w) => w.id).join('|')]);

  const commit = (next: BoardState) => {
    setState(next);
    save(storageKey, next);
  };

  const byId = React.useMemo(() => new Map(widgets.map((w) => [w.id, w])), [widgets]);
  const visible = state.order.filter((id) => !state.hidden.includes(id) && byId.has(id));
  const hiddenWidgets = state.hidden.filter((id) => byId.has(id));
  const isCustomised =
    state.hidden.length > 0 || state.order.some((id, i) => id !== defaultState.order[i]);

  const move = (id: string, delta: -1 | 1) => {
    const idx = visible.indexOf(id);
    const target = visible[idx + delta];
    if (!target) return;
    const order = [...state.order];
    const a = order.indexOf(id);
    const b = order.indexOf(target);
    [order[a], order[b]] = [order[b], order[a]];
    commit({ ...state, order });
  };

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const order = state.order.filter((id) => id !== dragId);
    const at = order.indexOf(targetId);
    const from = state.order.indexOf(dragId);
    const to = state.order.indexOf(targetId);
    order.splice(from < to ? at + 1 : at, 0, dragId);
    commit({ ...state, order });
  };

  const hide = (id: string) => commit({ ...state, hidden: [...state.hidden, id] });
  const show = (id: string) => commit({ ...state, hidden: state.hidden.filter((h) => h !== id) });
  const reset = () => commit(defaultState);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {editing ? (
          <>
            <span className="text-muted-foreground mr-auto text-xs">
              Drag the handle to rearrange. Use the eye to hide a widget.
            </span>
            {isCustomised ? (
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="size-3.5" /> Reset
              </Button>
            ) : null}
            <Button size="sm" onClick={() => setEditing(false)}>
              <Check className="size-3.5" /> Done
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <LayoutGrid className="size-3.5" /> Customize layout
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {visible.map((id, index) => {
          const w = byId.get(id)!;
          const isDragging = dragId === id;
          const isOver = overId === id && dragId && dragId !== id;
          return (
            <div
              key={id}
              className={cn(
                'relative min-w-0 transition-[opacity,transform,box-shadow]',
                SPAN_CLASS[w.span ?? 6],
                editing && 'ring-border/80 rounded-xl ring-1 ring-dashed',
                isDragging && 'opacity-40',
                isOver && 'ring-primary ring-2 ring-offset-2'
              )}
              onDragOver={editing ? (e) => { e.preventDefault(); setOverId(id); } : undefined}
              onDragLeave={editing ? () => setOverId((cur) => (cur === id ? null : cur)) : undefined}
              onDrop={editing ? (e) => { e.preventDefault(); dropOn(id); setDragId(null); setOverId(null); } : undefined}
            >
              {editing ? (
                <div className="bg-card/95 absolute inset-x-2 top-2 z-10 flex items-center gap-1 rounded-lg border px-1.5 py-1 shadow-sm backdrop-blur">
                  <span
                    draggable
                    onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); setDragId(id); }}
                    onDragEnd={() => { setDragId(null); setOverId(null); }}
                    className="text-muted-foreground hover:text-foreground cursor-grab rounded p-0.5 active:cursor-grabbing"
                    aria-label={`Drag ${w.title}`}
                    title="Drag to move"
                  >
                    <GripVertical className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">{w.title}</span>
                  <button type="button" onClick={() => move(id, -1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground rounded p-0.5 disabled:opacity-30" aria-label={`Move ${w.title} earlier`}>
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => move(id, 1)} disabled={index === visible.length - 1} className="text-muted-foreground hover:text-foreground rounded p-0.5 disabled:opacity-30" aria-label={`Move ${w.title} later`}>
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => hide(id)} className="text-muted-foreground hover:text-destructive rounded p-0.5" aria-label={`Hide ${w.title}`}>
                    <EyeOff className="size-3.5" />
                  </button>
                </div>
              ) : null}
              <div className={cn('h-full', editing && 'pointer-events-none select-none pt-11')}>{w.content}</div>
            </div>
          );
        })}
      </div>

      {editing && hiddenWidgets.length > 0 ? (
        <div className="bg-muted/40 rounded-xl border border-dashed p-3">
          <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium">
            <Eye className="size-3.5" /> Hidden widgets
          </p>
          <div className="flex flex-wrap gap-2">
            {hiddenWidgets.map((id) => (
              <Button key={id} variant="outline" size="sm" onClick={() => show(id)}>
                <Plus className="size-3.5" /> {byId.get(id)!.title}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
