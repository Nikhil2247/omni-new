'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Send, Trash2 } from 'lucide-react'
import { useUmami } from '@/hooks/use-umami'
import { useBlogPosts, useDeleteBlogPost, usePublishBlogPost } from '@/hooks/queries/use-marketing'
import { usePublicBlogCategories, usePublicBlogTags } from '@/hooks/queries/use-public-blog'
import { useAuthStore } from '@/store/auth-store'
import { ROLES } from '@/config/roles'
import { Button } from '@/components/ui/button'
import { BlogHealthIndicator } from '@/components/marketing/blog-health-indicator'
import { DataTable, FilterSelect, PageHeader, StatusBadge, TwoLineCell, type DataColumn } from '@/components/dashboard'
import type { BlogStatus } from '@/lib/api/types/marketing.types'

export default function MarketingContentPage() {
  const { user } = useAuthStore()
  const isContentWriter = user?.role === ROLES.CONTENT_WRITER
  const { track } = useUmami()
  const [keyword, setKeyword] = useState('')
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const publishMutation = usePublishBlogPost()
  const deleteMutation = useDeleteBlogPost()
  const [status, setStatus] = useState<BlogStatus | 'all'>('all')
  const [categoryId, setCategoryId] = useState('all')
  const [tagId, setTagId] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [keyword, status, categoryId, tagId])

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      status: status === 'all' ? undefined : status,
      categoryId: categoryId === 'all' ? undefined : categoryId,
      tagId: tagId === 'all' ? undefined : tagId,
      page: currentPage,
      limit: 20,
    }),
    [keyword, status, categoryId, tagId, currentPage]
  )

  const { data, isLoading } = useBlogPosts(params)
  const { data: categories } = usePublicBlogCategories()
  const { data: tags } = usePublicBlogTags()

  useEffect(() => {
    track('marketing:content:page_view', { totalPosts: data?.data?.length || 0 })
  }, [data, track])

  const categoryOptions = Array.isArray(categories)
    ? categories
    : categories && typeof categories === 'object' && 'data' in categories && Array.isArray((categories as { data: unknown[] }).data)
      ? ((categories as { data: unknown[] }).data as typeof categories)
      : []

  const tagOptions = Array.isArray(tags)
    ? tags
    : tags && typeof tags === 'object' && 'data' in tags && Array.isArray((tags as { data: unknown[] }).data)
      ? ((tags as { data: unknown[] }).data as typeof tags)
      : []

  type Post = NonNullable<typeof data>['data'][number]

  const columns: DataColumn<Post>[] = [
    {
      id: 'title',
      header: 'Title',
      cell: (p) => <TwoLineCell title={p.title} subtitle={p.slug} />,
      sortValue: (p) => p.title,
      exportValue: (p) => p.title,
    },
    {
      id: 'category',
      header: 'Category',
      cell: (p) => <span className="text-muted-foreground">{p.category?.name ?? 'Uncategorized'}</span>,
      sortValue: (p) => p.category?.name,
      exportValue: (p) => p.category?.name ?? 'Uncategorized',
      hideBelow: 'sm',
    },
    { id: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status} />, sortValue: (p) => p.status, exportValue: (p) => p.status },
    { id: 'health', header: 'Health', cell: (p) => <BlogHealthIndicator post={p} />, hideBelow: 'lg' },
    { id: 'read', header: 'Read time', cell: (p) => `${p.readingTime} min`, sortValue: (p) => p.readingTime, hideBelow: 'md' },
    { id: 'views', header: 'Views', cell: (p) => p.viewCount, sortValue: (p) => p.viewCount, hideBelow: 'md' },
    {
      id: 'updated',
      header: 'Updated',
      cell: (p) => formatDate(p.updatedAt),
      sortValue: (p) => new Date(p.updatedAt),
      exportValue: (p) => formatDate(p.updatedAt),
      hideBelow: 'sm',
    },
  ]

  return (
    <div className="space-y-3">
      <PageHeader
        title={isContentWriter ? 'My Drafts' : 'Content manager'}
        actions={
          <Button asChild size="sm">
            <Link href="/marketing/content/new">{isContentWriter ? 'Write draft' : 'Create post'}</Link>
          </Button>
        }
      />

      <DataTable
        data={data?.data}
        columns={columns}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        search={{ value: keyword, onChange: setKeyword, placeholder: 'Search content' }}
        filters={
          <>
            <FilterSelect
              label="Category"
              value={categoryId}
              onChange={setCategoryId}
              options={categoryOptions.map((c) => ({ value: c.id, label: c.name }))}
            />
            <FilterSelect
              label="Tag"
              value={tagId}
              onChange={setTagId}
              options={tagOptions.map((t) => ({ value: t.id, label: t.name }))}
            />
            {isContentWriter ? (
              <StatusBadge tone="neutral">Draft only</StatusBadge>
            ) : (
              <FilterSelect
                label="Status"
                value={status}
                onChange={(value) => setStatus(value as BlogStatus | 'all')}
                options={[
                  { value: 'PUBLISHED', label: 'Published' },
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'ARCHIVED', label: 'Archived' },
                ]}
              />
            )}
          </>
        }
        rowActions={(post) => [
          {
            label: publishingId === post.id ? 'Publishing...' : 'Publish',
            icon: Send,
            visible: !isContentWriter && post.status !== 'PUBLISHED',
            disabled: publishingId === post.id,
            onClick: async () => {
              setPublishingId(post.id)
              try {
                await publishMutation.mutateAsync(post.id)
              } finally {
                setPublishingId(null)
              }
            },
          },
          { label: 'Open', icon: ExternalLink, href: `/marketing/content/${post.id}` },
          {
            label: 'Delete',
            icon: Trash2,
            danger: true,
            visible: !isContentWriter,
            disabled: deletingId === post.id,
            confirm: {
              title: 'Delete this blog post?',
              description: 'This action cannot be undone.',
            },
            onClick: async () => {
              setDeletingId(post.id)
              try {
                await deleteMutation.mutateAsync(post.id)
              } finally {
                setDeletingId(null)
              }
            },
          },
        ]}
        exportFilename="content"
        emptyTitle="No content found"
        serverPagination={{
          page: currentPage,
          pageSize: 20,
          total: data?.meta?.total ?? data?.data?.length ?? 0,
          onPageChange: setCurrentPage,
        }}
      />
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}
