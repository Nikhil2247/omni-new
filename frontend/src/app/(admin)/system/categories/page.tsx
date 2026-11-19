'use client'

import { useMemo, useState } from 'react'
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/queries/use-admin-catalog'
import { DataTable, FormDialog, FormField, PageHeader, type DataColumn } from '@/components/dash'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AdminCategory, AdminCategoryInput } from '@/lib/api/types/admin.types'

const NO_PARENT = 'none'

interface FormState {
  name: string
  slug: string
  description: string
  icon: string
  sortOrder: string
  isActive: boolean
  parentId: string
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  icon: '',
  sortOrder: '0',
  isActive: true,
  parentId: NO_PARENT,
}

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function SystemCategoriesPage() {
  const { data, isLoading, isError, refetch } = useAdminCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(false)

  const categories = useMemo(() => data ?? [], [data])
  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return categories
    return categories.filter((c) => c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term))
  }, [categories, query])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSlugTouched(false)
    setDialogOpen(true)
  }

  const openEdit = (category: AdminCategory) => {
    setEditing(category)
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      icon: category.icon ?? '',
      sortOrder: String(category.sortOrder ?? 0),
      isActive: category.isActive,
      parentId: category.parentId ?? NO_PARENT,
    })
    setSlugTouched(true)
    setDialogOpen(true)
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    const payload: AdminCategoryInput = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || null,
      icon: form.icon.trim() || null,
      sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
      isActive: form.isActive,
      parentId: form.parentId === NO_PARENT ? null : form.parentId,
    }
    if (editing) {
      await updateCategory.mutateAsync({ id: editing.id, payload })
    } else {
      await createCategory.mutateAsync(payload)
    }
  }

  const columns: DataColumn<AdminCategory>[] = [
    {
      id: 'name',
      header: 'Category',
      label: 'Category',
      cell: (category) => (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-medium">{category.name}</div>
          {category.description ? (
            <div className="truncate text-xs text-muted-foreground">{category.description}</div>
          ) : null}
        </div>
      ),
      sortValue: (category) => category.name.toLowerCase(),
      exportValue: (category) => category.name,
    },
    {
      id: 'slug',
      header: 'URL slug',
      label: 'URL slug',
      cell: (category) => <code className="text-xs">/vendors/category/{category.slug}</code>,
      sortValue: (category) => category.slug,
      exportValue: (category) => category.slug,
    },
    {
      id: 'parent',
      header: 'Parent',
      label: 'Parent',
      cell: (category) => <span className="text-sm">{category.parent?.name ?? '-'}</span>,
      exportValue: (category) => category.parent?.name ?? '',
    },
    {
      id: 'vendors',
      header: 'Vendors',
      label: 'Vendors',
      cell: (category) => <span className="text-sm tabular-nums">{category._count?.vendors ?? 0}</span>,
      sortValue: (category) => category._count?.vendors ?? 0,
      exportValue: (category) => category._count?.vendors ?? 0,
    },
    {
      id: 'order',
      header: 'Order',
      label: 'Order',
      cell: (category) => <span className="text-sm tabular-nums text-muted-foreground">{category.sortOrder}</span>,
      sortValue: (category) => category.sortOrder,
      exportValue: (category) => category.sortOrder,
    },
    {
      id: 'active',
      header: 'Visible',
      label: 'Visible',
      cell: (category) => (
        <Switch
          checked={category.isActive}
          aria-label={`${category.name} visible`}
          disabled={updateCategory.isPending}
          onCheckedChange={(checked) => updateCategory.mutate({ id: category.id, payload: { isActive: checked } })}
        />
      ),
      sortValue: (category) => category.isActive,
      exportValue: (category) => (category.isActive ? 'Yes' : 'No'),
    },
  ]

  const canSubmit = form.name.trim().length >= 2

  return (
    <div className="space-y-3">
      <PageHeader
        title="Categories"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" />
            Add category
          </Button>
        }
      />

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(category) => category.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        search={{ value: query, onChange: setQuery, placeholder: 'Search categories' }}
        rowActions={(category) => {
          const vendors = category._count?.vendors ?? 0
          return [
            { label: 'Edit category', icon: Pencil, onClick: () => openEdit(category) },
            {
              label: vendors > 0 ? 'Cannot delete: has vendors' : 'Delete category',
              icon: Trash2,
              danger: true,
              disabled: vendors > 0,
              confirm: {
                title: `Delete ${category.name}?`,
                description:
                  'The category disappears from filters and its public page stops existing. This cannot be undone.',
                confirmLabel: 'Delete category',
              },
              onClick: () => deleteCategory.mutateAsync(category.id),
            },
          ]
        }}
        defaultPageSize={25}
        emptyTitle="No categories yet"
        emptyIcon={Tags}
        emptyAction={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" />
            Add category
          </Button>
        }
        exportFilename="categories"
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? `Edit ${editing.name}` : 'Add category'}
        description="Categories drive the vendor filters and the public category pages."
        submitLabel={editing ? 'Save changes' : 'Create category'}
        canSubmit={canSubmit}
        loading={createCategory.isPending || updateCategory.isPending}
        onSubmit={handleSubmit}
      >
        <FormField label="Name" htmlFor="cat-name">
          <Input
            id="cat-name"
            value={form.name}
            autoFocus
            onChange={(e) => {
              const name = e.target.value
              setForm((prev) => ({ ...prev, name, slug: slugTouched ? prev.slug : toSlug(name) }))
            }}
          />
        </FormField>
        <FormField
          label="URL slug"
          htmlFor="cat-slug"
          hint="Used in the page address. Changing it changes the public URL, so only do that if you must."
        >
          <Input
            id="cat-slug"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true)
              set('slug', toSlug(e.target.value))
            }}
          />
        </FormField>
        <FormField label="Description" htmlFor="cat-desc">
          <Textarea id="cat-desc" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Icon" htmlFor="cat-icon" hint="Icon name or URL (optional)">
            <Input id="cat-icon" value={form.icon} onChange={(e) => set('icon', e.target.value)} />
          </FormField>
          <FormField label="Sort order" htmlFor="cat-order" hint="Lower numbers come first">
            <Input
              id="cat-order"
              type="number"
              value={form.sortOrder}
              onChange={(e) => set('sortOrder', e.target.value)}
            />
          </FormField>
        </div>
        <FormField label="Parent category">
          <Select value={form.parentId} onValueChange={(value) => set('parentId', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PARENT}>None (top level)</SelectItem>
              {categories
                .filter((c) => c.id !== editing?.id)
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </FormField>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Visible on the site</p>
            <p className="text-xs text-muted-foreground">Hidden categories are removed from filters and search.</p>
          </div>
          <Switch checked={form.isActive} onCheckedChange={(checked) => set('isActive', checked)} />
        </div>
      </FormDialog>
    </div>
  )
}
