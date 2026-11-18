'use client';

import * as React from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Inbox,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { RowActions, type RowAction } from './row-actions';

export interface DataColumn<T> {
  id: string;
  header: React.ReactNode;
  /** Plain-text header used by the Columns menu and CSV export (falls back to `header` if a string). */
  label?: string;
  cell: (row: T, index: number) => React.ReactNode;
  /** Provide to make the column sortable (client-side sort). */
  sortValue?: (row: T) => string | number | boolean | Date | null | undefined;
  /** Plain value for CSV export. Falls back to sortValue. */
  exportValue?: (row: T) => string | number | null | undefined;
  align?: 'left' | 'right' | 'center';
  className?: string;
  headerClassName?: string;
  /** Hide this column below a breakpoint. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ServerPagination {
  page: number; // 1-based
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export interface DataTableProps<T> {
  data: T[] | undefined;
  columns: DataColumn<T>[];
  rowKey: (row: T) => string;
  isLoading?: boolean;

  /** Toolbar search box (controlled by the page so it can drive server queries). */
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  /** Filter chips (FilterSelect) rendered next to the search box. */
  filters?: React.ReactNode;
  /** Extra toolbar content on the right, before Columns / Export. */
  toolbarRight?: React.ReactNode;

  /** Inline icon actions at the end of each row. Any action with `confirm` opens a confirmation modal. */
  rowActions?: (row: T) => RowAction[];
  onRowClick?: (row: T) => void;

  /** Row checkboxes. */
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  /** Rendered in the toolbar when something is selected (bulk actions). */
  bulkActions?: (selectedKeys: string[]) => React.ReactNode;

  /** Show the "Columns" visibility menu. */
  columnToggle?: boolean;
  /** Show "Export CSV" and use this file name (without extension). */
  exportFilename?: string;

  /** Omit for client-side pagination; pass for server-driven pages. */
  serverPagination?: ServerPagination;
  pageSizeOptions?: number[];
  defaultPageSize?: number;

  emptyTitle?: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  emptyAction?: React.ReactNode;

  /** Max height of the whole table card; the body scrolls and the footer stays pinned. */
  maxHeight?: string;
  className?: string;
}

const HIDE: Record<NonNullable<DataColumn<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
};

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function headerText<T>(c: DataColumn<T>) {
  return c.label ?? (typeof c.header === 'string' ? c.header : c.id);
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  isLoading,
  search,
  filters,
  toolbarRight,
  rowActions,
  onRowClick,
  selectable,
  selectedKeys,
  onSelectionChange,
  bulkActions,
  columnToggle,
  exportFilename,
  serverPagination,
  pageSizeOptions = [10, 20, 50, 100],
  defaultPageSize = 20,
  emptyTitle = 'No results found',
  emptyIcon: EmptyIcon = Inbox,
  emptyAction,
  maxHeight = 'calc(100dvh - 8rem)',
  className,
}: DataTableProps<T>) {
  const rows = React.useMemo(() => data ?? [], [data]);
  const [sort, setSort] = React.useState<{ id: string; dir: 'asc' | 'desc' } | null>(null);
  const [hidden, setHidden] = React.useState<Set<string>>(new Set());
  const [clientPage, setClientPage] = React.useState(1);
  const [clientSize, setClientSize] = React.useState(defaultPageSize);
  const [internalSel, setInternalSel] = React.useState<string[]>([]);

  const sel = selectedKeys ?? internalSel;
  const setSel = (keys: string[]) => (onSelectionChange ? onSelectionChange(keys) : setInternalSel(keys));

  const visibleCols = columns.filter((c) => !hidden.has(c.id));

  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.sortValue) return rows;
    const get = col.sortValue;
    const norm = (v: ReturnType<typeof get>) =>
      v instanceof Date ? v.getTime() : typeof v === 'boolean' ? Number(v) : v;
    return [...rows].sort((a, b) => {
      const av = norm(get(a));
      const bv = norm(get(b));
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const r =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
      return sort.dir === 'asc' ? r : -r;
    });
  }, [rows, columns, sort]);

  const pageSize = serverPagination?.pageSize ?? clientSize;
  const total = serverPagination?.total ?? sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(serverPagination?.page ?? clientPage, pageCount);

  // Reset to first page when the data set shrinks / filters change (client mode).
  React.useEffect(() => {
    if (!serverPagination) setClientPage(1);
  }, [rows.length, serverPagination]);

  const pageRows = serverPagination ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, (page - 1) * pageSize + pageRows.length);

  const goto = (p: number) => {
    const next = Math.min(Math.max(1, p), pageCount);
    if (serverPagination) serverPagination.onPageChange(next);
    else setClientPage(next);
  };
  const changeSize = (n: number) => {
    if (serverPagination) {
      serverPagination.onPageSizeChange?.(n);
      serverPagination.onPageChange(1);
    } else {
      setClientSize(n);
      setClientPage(1);
    }
  };

  const toggleSort = (id: string) =>
    setSort((s) => (s?.id !== id ? { id, dir: 'asc' } : s.dir === 'asc' ? { id, dir: 'desc' } : null));

  const keysOnPage = pageRows.map(rowKey);
  const allOnPage = keysOnPage.length > 0 && keysOnPage.every((k) => sel.includes(k));
  const someOnPage = keysOnPage.some((k) => sel.includes(k));

  const exportCsv = () => {
    const cols = visibleCols;
    const lines = [
      cols.map((c) => csvEscape(headerText(c))).join(','),
      ...sorted.map((r) =>
        cols
          .map((c) => {
            const v = c.exportValue ? c.exportValue(r) : c.sortValue ? c.sortValue(r) : '';
            return csvEscape(v instanceof Date ? v.toISOString() : v);
          })
          .join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFilename ?? 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasToolbar = search || filters || toolbarRight || columnToggle || exportFilename || (selectable && sel.length > 0 && bulkActions);
  const colSpan = visibleCols.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  return (
    <div
      className={cn('bg-card flex flex-col overflow-hidden rounded-lg border', className)}
      style={{ maxHeight }}
    >
      {hasToolbar && (
        <div className="flex flex-wrap items-center gap-2 border-b p-2">
          {search && (
            <div className="relative w-full sm:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder ?? 'Search...'}
                className="h-8 pl-8"
              />
            </div>
          )}
          {filters}
          {selectable && sel.length > 0 && bulkActions ? (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">{sel.length} selected</span>
              {bulkActions(sel)}
            </div>
          ) : null}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {toolbarRight}
            {columnToggle && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Columns3 /> Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {columns.map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c.id}
                      checked={!hidden.has(c.id)}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={(v) =>
                        setHidden((prev) => {
                          const n = new Set(prev);
                          if (v) n.delete(c.id);
                          else n.add(c.id);
                          return n;
                        })
                      }
                    >
                      {headerText(c)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {exportFilename && (
              <Button variant="outline" size="sm" className="h-8" onClick={exportCsv} disabled={!rows.length}>
                <Download /> Export CSV
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="dash-table min-h-0 flex-1 overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="h-9">
              {selectable && (
                <th className="w-9 pr-0 pl-3 text-left align-middle">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    className="size-4 accent-[var(--blue)]"
                    checked={allOnPage}
                    ref={(el) => {
                      if (el) el.indeterminate = !allOnPage && someOnPage;
                    }}
                    onChange={(e) =>
                      setSel(
                        e.target.checked
                          ? Array.from(new Set([...sel, ...keysOnPage]))
                          : sel.filter((k) => !keysOnPage.includes(k))
                      )
                    }
                  />
                </th>
              )}
              {visibleCols.map((c) => {
                const active = sort?.id === c.id;
                return (
                  <th
                    key={c.id}
                    className={cn(
                      'text-muted-foreground px-3 text-xs font-medium whitespace-nowrap',
                      c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                      c.hideBelow && HIDE[c.hideBelow],
                      c.headerClassName
                    )}
                  >
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.id)}
                        className="hover:text-foreground inline-flex items-center gap-1"
                      >
                        {c.header}
                        {active ? (
                          sort?.dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                        ) : (
                          <ArrowUpDown className="size-3 opacity-50" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
              {rowActions && <th className="w-px px-3" aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="h-11">
                  <td colSpan={colSpan} className="px-3">
                    <div className="bg-muted h-4 animate-pulse rounded" style={{ width: `${70 + ((i * 7) % 25)}%` }} />
                  </td>
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="py-10 text-center">
                  <EmptyIcon className="text-muted-foreground/60 mx-auto mb-2 size-7" />
                  <p className="text-muted-foreground text-sm">{emptyTitle}</p>
                  {emptyAction ? <div className="mt-3">{emptyAction}</div> : null}
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => {
                const key = rowKey(row);
                const selected = sel.includes(key);
                return (
                  <tr
                    key={key}
                    data-selected={selected}
                    className={cn('h-11 transition-colors', onRowClick && 'cursor-pointer')}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable && (
                      <td className="w-9 pr-0 pl-3 align-middle" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label="Select row"
                          className="size-4 accent-[var(--blue)]"
                          checked={selected}
                          onChange={(e) => setSel(e.target.checked ? [...sel, key] : sel.filter((k) => k !== key))}
                        />
                      </td>
                    )}
                    {visibleCols.map((c) => (
                      <td
                        key={c.id}
                        className={cn(
                          'px-3 py-1 align-middle whitespace-nowrap',
                          c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                          c.hideBelow && HIDE[c.hideBelow],
                          c.className
                        )}
                      >
                        {c.cell(row, i)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-2 align-middle">
                        <RowActions actions={rowActions(row)} />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t px-3 py-1.5 text-xs">
        <span>{total === 0 ? '0 results' : `${from}–${to} of ${total}`}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>Rows</span>
            <Select value={String(pageSize)} onValueChange={(v) => changeSize(Number(v))}>
              <SelectTrigger size="sm" className="h-7 w-[4.5rem] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span>
            Page {page} of {pageCount}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={page <= 1} onClick={() => goto(page - 1)}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={page >= pageCount} onClick={() => goto(page + 1)}>
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
