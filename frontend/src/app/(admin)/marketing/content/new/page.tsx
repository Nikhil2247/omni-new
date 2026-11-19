'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { useRouter } from 'next/navigation'
import { useCreateBlogPost } from '@/hooks/queries/use-marketing'
import { usePublicBlogCategories, usePublicBlogTags } from '@/hooks/queries/use-public-blog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/ui/file-upload'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { marketingService } from '@/lib/api/services/marketing.service'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { ArrowLeft, FileText, Image as ImageIcon, Search, Send, Tags } from 'lucide-react'
import { PageHeader, Panel, StatusBadge } from '@/components/dash'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

export default function MarketingContentNewPage() {
  const router = useRouter()
  const createPost = useCreateBlogPost()
  const { data: categories } = usePublicBlogCategories()
  const { data: tags } = usePublicBlogTags()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [focusKeyword, setFocusKeyword] = useState('')
  const [keywords, setKeywords] = useState('')
  const [ogImage, setOgImage] = useState('')
  const [ogImagePreview, setOgImagePreview] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [featuredImagePreview, setFeaturedImagePreview] = useState('')
  const [featuredImageAlt, setFeaturedImageAlt] = useState('')
  const [categoryId, setCategoryId] = useState('none')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [vendorId, setVendorId] = useState('')
  const [readingTime, setReadingTime] = useState('')
  const [isUploadingFeatured, setIsUploadingFeatured] = useState(false)
  const [isUploadingOg, setIsUploadingOg] = useState(false)
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)

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
    if (isSlugManuallyEdited) return
    setSlug(slugify(title))
  }, [title, isSlugManuallyEdited])

  useEffect(() => {
    return () => {
      if (featuredImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(featuredImagePreview)
      }
      if (ogImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(ogImagePreview)
      }
    }
  }, [featuredImagePreview, ogImagePreview])

  const handleUpload = async (files: File[], type: 'featured' | 'og') => {
    if (!files.length) return
    const file = files[0]
    const localPreview = file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    try {
      if (type === 'featured') {
        setIsUploadingFeatured(true)
        setFeaturedImagePreview((prev) => {
          if (prev.startsWith('blob:')) {
            URL.revokeObjectURL(prev)
          }
          return localPreview
        })
      } else {
        setIsUploadingOg(true)
        setOgImagePreview((prev) => {
          if (prev.startsWith('blob:')) {
            URL.revokeObjectURL(prev)
          }
          return localPreview
        })
      }
      const uploaded = await marketingService.uploadBlogImage(file)
      const resolvedUploadedUrl = uploaded.url || uploaded.path

      if (type === 'featured') {
        setFeaturedImage(resolvedUploadedUrl)
        if (!featuredImageAlt) {
          setFeaturedImageAlt(file.name.replace(/\.[^/.]+$/, '').trim().slice(0, 125))
        }
      } else {
        setOgImage(resolvedUploadedUrl)
      }
    } finally {
      if (type === 'featured') {
        setIsUploadingFeatured(false)
      } else {
        setIsUploadingOg(false)
      }
    }
  }

  const handleCreate = async () => {
    const normalizedFeaturedImageAlt = featuredImageAlt.trim().slice(0, 125)
    const payload = {
      title,
      content,
      slug: slug || undefined,
      excerpt: excerpt || undefined,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      focusKeyword: focusKeyword || undefined,
      keywords: keywords
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      ogImage: ogImage || undefined,
      featuredImage: featuredImage || undefined,
      featuredImageAlt: normalizedFeaturedImageAlt || undefined,
      categoryId: categoryId === 'none' ? undefined : categoryId,
      tagIds,
      vendorId: vendorId || undefined,
      readingTime: readingTime ? Number(readingTime) : undefined,
    }

    try {
      const result = await createPost.mutateAsync(payload)
      if (result?.id) {
        router.push(`/marketing/content/${result.id}`)
      }
    } catch {
      // toast handled in mutation hook
    }
  }

  const isUploading = isUploadingFeatured || isUploadingOg
  const canSave = Boolean(title && content) && !createPost.isPending && !isUploading
  const isDirty = Boolean(title || content || excerpt || featuredImage)
  const missing = !title ? 'Add a title to save.' : !content ? 'Add some content to save.' : null
  const saveState = createPost.isPending
    ? 'Saving...'
    : isUploading
      ? 'Uploading image...'
      : isDirty
        ? 'Unsaved changes'
        : 'Not saved yet'

  const imagePreview = (src: string, alt: string) => (
    <div className="overflow-hidden rounded-lg border">
      <NextImage src={src} alt={alt} width={1200} height={480} unoptimized priority className="h-36 w-full object-cover" />
    </div>
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="New blog post"
        leading={
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/marketing/content">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Content
            </Link>
          </Button>
        }
        actions={
          <>
            <span className="text-muted-foreground hidden text-xs sm:inline">{saveState}</span>
            <Button onClick={handleCreate} disabled={!canSave} size="sm">
              {createPost.isPending ? 'Saving...' : 'Save draft'}
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main column */}
        <Panel title="Post" icon={FileText}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="title">Title *</Label>
                <span className="text-muted-foreground text-xs">{title.length} characters</span>
              </div>
              <Input
                id="title"
                placeholder="Enter a compelling title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-10 text-base"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="slug">URL slug</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setIsSlugManuallyEdited(false)
                    setSlug(slugify(title))
                  }}
                >
                  Regenerate
                </Button>
              </div>
              <Input
                id="slug"
                placeholder="auto-generated-from-title"
                value={slug}
                onChange={(event) => {
                  setIsSlugManuallyEdited(true)
                  setSlug(slugify(event.target.value))
                }}
              />
              <p className="text-muted-foreground text-xs">/blog/{slug || 'your-post-slug'}</p>
            </div>

            <div className="space-y-1.5">
              <Label>Content *</Label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your blog post content..."
                minHeight="420px"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <span className="text-muted-foreground text-xs">{excerpt.length} characters</span>
              </div>
              <Textarea
                id="excerpt"
                placeholder="Short summary shown in post previews (optional)"
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                rows={3}
              />
            </div>
          </div>
        </Panel>

        {/* Side column */}
        <div className="space-y-4 lg:sticky lg:top-4">
          <Panel title="Publish" icon={Send}>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status="draft" />
              </div>
              <p className="text-muted-foreground text-xs">
                {missing ?? 'Ready to save. Publish or schedule once the draft is created.'}
              </p>
              <Button onClick={handleCreate} disabled={!canSave} className="w-full">
                {createPost.isPending ? 'Saving...' : 'Save draft'}
              </Button>
            </div>
          </Panel>

          <Panel title="Category and tags" icon={Tags}>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category" className="w-full">
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
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Tags</Label>
                  <span className="text-muted-foreground text-xs">{tagIds.length} selected</span>
                </div>
                {tagOptions.length ? (
                  <ScrollArea className="h-40 rounded-lg border p-2">
                    <div className="space-y-1">
                      {tagOptions.map((tag) => {
                        const checked = tagIds.includes(tag.id)
                        return (
                          <label
                            key={tag.id}
                            htmlFor={`tag-${tag.id}`}
                            className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                          >
                            <Checkbox
                              id={`tag-${tag.id}`}
                              checked={checked}
                              onCheckedChange={(value) => {
                                const isChecked = Boolean(value)
                                setTagIds((prev) =>
                                  isChecked ? Array.from(new Set([...prev, tag.id])) : prev.filter((id) => id !== tag.id),
                                )
                              }}
                            />
                            {tag.name}
                          </label>
                        )
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-muted-foreground text-xs">No tags available yet.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="readingTime">Reading time (min)</Label>
                  <Input
                    id="readingTime"
                    placeholder="5"
                    type="number"
                    min={1}
                    value={readingTime}
                    onChange={(event) => setReadingTime(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendorId">Vendor ID</Label>
                  <Input
                    id="vendorId"
                    placeholder="Optional"
                    value={vendorId}
                    onChange={(event) => setVendorId(event.target.value)}
                  />
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Featured image" icon={ImageIcon}>
            <div className="space-y-3">
              <FileUpload
                onUpload={(files) => handleUpload(files, 'featured')}
                accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] }}
                maxFiles={1}
                maxSize={10 * 1024 * 1024}
                multiple={false}
                autoUpload={false}
                uploadButtonLabel="Upload featured image"
                disabled={isUploadingFeatured}
              />
              <div className="space-y-1.5">
                <Label htmlFor="featuredImageUrl">Or image URL</Label>
                <Input
                  id="featuredImageUrl"
                  placeholder="https://example.com/image.jpg"
                  value={featuredImage}
                  onChange={(event) => {
                    const newUrl = event.target.value
                    setFeaturedImage(newUrl)
                    // Only clear preview if the new URL is empty or different from uploaded path
                    if (!newUrl || !newUrl.startsWith('blog-images/')) {
                      setFeaturedImagePreview('')
                    }
                  }}
                />
              </div>
              {featuredImage
                ? imagePreview(
                    featuredImagePreview || getMinioViewUrl(featuredImage) || featuredImage,
                    featuredImageAlt || 'Featured image preview',
                  )
                : null}
              <div className="space-y-1.5">
                <Label htmlFor="featuredImageAlt">Alt text</Label>
                <Input
                  id="featuredImageAlt"
                  placeholder="Describe the image for accessibility"
                  value={featuredImageAlt}
                  maxLength={125}
                  onChange={(event) => setFeaturedImageAlt(event.target.value.slice(0, 125))}
                />
              </div>
            </div>
          </Panel>

          <Panel title="SEO" icon={Search} description="Search and social sharing">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="metaTitle">Meta title</Label>
                  <span className="text-muted-foreground text-xs">{metaTitle.length}/60</span>
                </div>
                <Input
                  id="metaTitle"
                  placeholder="50-60 characters"
                  value={metaTitle}
                  onChange={(event) => setMetaTitle(event.target.value)}
                  maxLength={60}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="metaDescription">Meta description</Label>
                  <span className="text-muted-foreground text-xs">{metaDescription.length}/160</span>
                </div>
                <Textarea
                  id="metaDescription"
                  placeholder="140-160 characters"
                  value={metaDescription}
                  onChange={(event) => setMetaDescription(event.target.value)}
                  rows={3}
                  maxLength={160}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="focusKeyword">Focus keyword</Label>
                <Input
                  id="focusKeyword"
                  placeholder="Primary keyword"
                  value={focusKeyword}
                  onChange={(event) => setFocusKeyword(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="keywords">Additional keywords</Label>
                <Input
                  id="keywords"
                  placeholder="keyword1, keyword2"
                  value={keywords}
                  onChange={(event) => setKeywords(event.target.value)}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Social image</Label>
                <FileUpload
                  onUpload={(files) => handleUpload(files, 'og')}
                  accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                  maxFiles={1}
                  maxSize={10 * 1024 * 1024}
                  multiple={false}
                  autoUpload={false}
                  uploadButtonLabel="Upload social image"
                  disabled={isUploadingOg}
                />
                <Input
                  id="ogImageUrl"
                  aria-label="Social image URL"
                  placeholder="Or image URL"
                  value={ogImage}
                  onChange={(event) => {
                    const newUrl = event.target.value
                    setOgImage(newUrl)
                    if (!newUrl || !newUrl.startsWith('blog-images/')) {
                      setOgImagePreview('')
                    }
                  }}
                />
                {ogImage ? imagePreview(ogImagePreview || getMinioViewUrl(ogImage) || ogImage, 'Open Graph preview') : null}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
