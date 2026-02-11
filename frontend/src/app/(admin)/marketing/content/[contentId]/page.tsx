'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useBlogPost, useDeleteBlogPost, useUpdateBlogPost } from '@/hooks/queries/use-marketing'
import { usePublicBlogCategories, usePublicBlogTags } from '@/hooks/queries/use-public-blog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { BlogStatus } from '@/lib/api/types/marketing.types'
import { FileUpload } from '@/components/ui/file-upload'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { uploadService } from '@/lib/api/services/upload.service'
import { getMinioViewUrl } from '@/lib/utils/minio'

export default function MarketingContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contentId = useMemo(() => {
    const value = params?.contentId
    return Array.isArray(value) ? value[0] : value
  }, [params])

  const { data, isLoading } = useBlogPost(contentId ?? '')
  const updatePost = useUpdateBlogPost(contentId ?? '')
  const deletePost = useDeleteBlogPost()
  const { data: categories } = usePublicBlogCategories()
  const { data: tags } = usePublicBlogTags()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<BlogStatus>('DRAFT')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [focusKeyword, setFocusKeyword] = useState('')
  const [keywords, setKeywords] = useState('')
  const [ogImage, setOgImage] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [featuredImageAlt, setFeaturedImageAlt] = useState('')
  const [categoryId, setCategoryId] = useState('none')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [vendorId, setVendorId] = useState('')
  const [readingTime, setReadingTime] = useState('')
  const [isUploadingFeatured, setIsUploadingFeatured] = useState(false)
  const [isUploadingOg, setIsUploadingOg] = useState(false)

  const categoryOptions = useMemo(
    () =>
      Array.isArray(categories)
        ? categories
        : categories && typeof categories === 'object' && 'data' in categories && Array.isArray((categories as { data: unknown[] }).data)
          ? ((categories as { data: unknown[] }).data as typeof categories)
          : [],
    [categories],
  )

  const tagOptions = useMemo(
    () =>
      Array.isArray(tags)
        ? tags
        : tags && typeof tags === 'object' && 'data' in tags && Array.isArray((tags as { data: unknown[] }).data)
          ? ((tags as { data: unknown[] }).data as typeof tags)
          : [],
    [tags],
  )

  useEffect(() => {
    if (!data) return
    setTitle(data.title)
    setSlug(data.slug)
    setExcerpt(data.excerpt || '')
    setContent(data.content)
    setStatus(data.status)
    setMetaTitle(data.metaTitle || '')
    setMetaDescription(data.metaDescription || '')
    setFocusKeyword(data.focusKeyword || '')
    setKeywords((data.keywords || []).join(', '))
    setOgImage(data.ogImage || '')
    setFeaturedImage(data.featuredImage || '')
    setFeaturedImageAlt(data.featuredImageAlt || '')
    setCategoryId(data.categoryId || 'none')
    setTagIds(data.tags?.map((entry) => entry.tagId) ?? [])
    setVendorId(data.vendorId || '')
    setReadingTime(data.readingTime ? String(data.readingTime) : '')
  }, [data])

  const handleUpload = async (files: File[], type: 'featured' | 'og') => {
    if (!files.length) return
    const file = files[0]
    try {
      if (type === 'featured') {
        setIsUploadingFeatured(true)
      } else {
        setIsUploadingOg(true)
      }
      const presigned = await uploadService.getPresignedUrl(file.name, file.type, 'media')
      await uploadService.uploadToPresignedUrl(presigned.uploadUrl, file)

      if (type === 'featured') {
        setFeaturedImage(presigned.fileUrl)
        if (!featuredImageAlt) {
          setFeaturedImageAlt(file.name.replace(/\.[^/.]+$/, ''))
        }
      } else {
        setOgImage(presigned.fileUrl)
      }
    } finally {
      if (type === 'featured') {
        setIsUploadingFeatured(false)
      } else {
        setIsUploadingOg(false)
      }
    }
  }

  const handleSave = () => {
    updatePost.mutate({
      title,
      slug,
      excerpt: excerpt || undefined,
      content,
      status,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      focusKeyword: focusKeyword || undefined,
      keywords: keywords
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      ogImage: ogImage || undefined,
      featuredImage: featuredImage || undefined,
      featuredImageAlt: featuredImageAlt || undefined,
      categoryId: categoryId === 'none' ? undefined : categoryId,
      tagIds: tagIds.length ? tagIds : undefined,
      vendorId: vendorId || undefined,
      readingTime: readingTime ? Number(readingTime) : undefined,
    })
  }

  const handleDelete = async () => {
    if (!contentId) return
    await deletePost.mutateAsync(contentId)
    router.push('/marketing/content')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-sm text-destructive">Content not found.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit post</h1>
          <p className="text-muted-foreground">Last updated {formatDate(data.updatedAt)}</p>
        </div>
        <Button variant="destructive" onClick={handleDelete} disabled={deletePost.isPending}>
          Delete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Post title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input id="slug" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="post-url-slug" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea id="excerpt" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="Brief summary of the post" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as BlogStatus)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Write your blog post content..."
            minHeight="400px"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO & metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={metaTitle} onChange={(event) => setMetaTitle(event.target.value)} placeholder="Meta title" />
          <Textarea
            value={metaDescription}
            onChange={(event) => setMetaDescription(event.target.value)}
            placeholder="Meta description"
          />
          <Input value={focusKeyword} onChange={(event) => setFocusKeyword(event.target.value)} placeholder="Focus keyword" />
          <Input
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
            placeholder="Keywords (comma separated)"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Media & classification</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Label>Featured image</Label>
            <FileUpload
              onUpload={(files) => handleUpload(files, 'featured')}
              accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'] }}
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
              multiple={false}
              disabled={isUploadingFeatured}
            />
            <Input
              value={featuredImage}
              onChange={(event) => setFeaturedImage(event.target.value)}
              placeholder="Featured image URL"
            />
            {featuredImage ? (
              <img
                src={getMinioViewUrl(featuredImage) || featuredImage}
                alt={featuredImageAlt || 'Featured image preview'}
                className="h-40 w-full rounded-md object-cover"
              />
            ) : null}
            <Input
              value={featuredImageAlt}
              onChange={(event) => setFeaturedImageAlt(event.target.value)}
              placeholder="Featured image alt text"
            />
          </div>
          <div className="space-y-3">
            <Label>Open Graph image</Label>
            <FileUpload
              onUpload={(files) => handleUpload(files, 'og')}
              accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'] }}
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
              multiple={false}
              disabled={isUploadingOg}
            />
            <Input
              value={ogImage}
              onChange={(event) => setOgImage(event.target.value)}
              placeholder="OG image URL"
            />
            {ogImage ? (
              <img
                src={getMinioViewUrl(ogImage) || ogImage}
                alt="Open Graph preview"
                className="h-40 w-full rounded-md object-cover"
              />
            ) : null}
          </div>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Uncategorized</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input value={vendorId} onChange={(event) => setVendorId(event.target.value)} placeholder="Vendor ID" />
          <Input
            value={readingTime}
            onChange={(event) => setReadingTime(event.target.value)}
            placeholder="Reading time (minutes)"
            type="number"
            min={1}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          {tagOptions.length ? (
            <ScrollArea className="h-48 rounded-md border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {tagOptions.map((tag) => {
                  const checked = tagIds.includes(tag.id)
                  return (
                    <div key={tag.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          const isChecked = Boolean(value)
                          setTagIds((prev) =>
                            isChecked ? [...prev, tag.id] : prev.filter((id) => id !== tag.id),
                          )
                        }}
                      />
                      <Label className="text-sm text-muted-foreground">{tag.name}</Label>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">No tags available yet.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updatePost.isPending || !title || !content}>
          Save changes
        </Button>
      </div>
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
