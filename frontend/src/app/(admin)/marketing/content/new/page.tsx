'use client'

import { useEffect, useMemo, useState } from 'react'
import NextImage from 'next/image'
import { useRouter } from 'next/navigation'
import { useCreateBlogPost } from '@/hooks/queries/use-marketing'
import { usePublicBlogCategories, usePublicBlogTags } from '@/hooks/queries/use-public-blog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/ui/file-upload'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { marketingService } from '@/lib/api/services/marketing.service'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { FileText, Image, Settings, Tags } from 'lucide-react'
import { PageHeader } from '@/components/dashboard'

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

  return (
    <div className="space-y-3">
      <PageHeader
        title="Create Blog Post"
        actions={
          <Button
            onClick={handleCreate}
            disabled={!title || !content || createPost.isPending || isUploadingFeatured || isUploadingOg}
            size="sm"
          >
            {createPost.isPending ? 'Saving...' : 'Save Draft'}
          </Button>
        }
      />

      <Tabs defaultValue="content" className="space-y-3">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
          <TabsTrigger value="content" className="gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-2">
            <Image className="h-4 w-4" />
            Media
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Settings className="h-4 w-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <Tags className="h-4 w-4" />
            Tags
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-3">
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm">Post Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="title">Title *</Label>
                    <span className="text-xs text-muted-foreground">{title.length} characters</span>
                  </div>
                  <Input
                    id="title"
                    placeholder="Enter a compelling title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="text-base"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="slug">URL Slug</Label>
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
                  <p className="text-xs text-muted-foreground">
                    Slug is auto-generated from title. Edit manually if needed.
                  </p>
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    Preview URL: /blog/{slug || 'your-post-slug'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <span className="text-xs text-muted-foreground">{excerpt.length} characters</span>
                </div>
                <Textarea
                  id="excerpt"
                  placeholder="Brief summary of your post (optional)"
                  value={excerpt}
                  onChange={(event) => setExcerpt(event.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">A short description shown in post previews</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm">Content Editor</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your blog post content..."
                minHeight="380px"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-3">

          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm">Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="space-y-2">
                <Label>Upload Image</Label>
                <FileUpload
                  onUpload={(files) => handleUpload(files, 'featured')}
                  accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] }}
                  maxFiles={1}
                  maxSize={10 * 1024 * 1024}
                  multiple={false}
                  autoUpload={false}
                  uploadButtonLabel="Upload Featured Image"
                  disabled={isUploadingFeatured}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="featuredImageUrl">Or enter image URL</Label>
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

              {featuredImage && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <NextImage
                      src={featuredImagePreview || getMinioViewUrl(featuredImage) || featuredImage}
                      alt={featuredImageAlt || 'Featured image preview'}
                      width={1200}
                      height={480}
                      unoptimized={true}
                      priority={true}
                      className="h-48 w-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="featuredImageAlt">Alt Text</Label>
                <Input
                  id="featuredImageAlt"
                  placeholder="Describe the image for accessibility"
                  value={featuredImageAlt}
                  maxLength={125}
                  onChange={(event) => setFeaturedImageAlt(event.target.value.slice(0, 125))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm">Social Media Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="space-y-2">
                <Label>Upload Image</Label>
                <FileUpload
                  onUpload={(files) => handleUpload(files, 'og')}
                  accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                  maxFiles={1}
                  maxSize={10 * 1024 * 1024}
                  multiple={false}
                  autoUpload={false}
                  uploadButtonLabel="Upload Social Image"
                  disabled={isUploadingOg}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ogImageUrl">Or enter image URL</Label>
                <Input
                  id="ogImageUrl"
                  placeholder="https://example.com/og-image.jpg"
                  value={ogImage}
                  onChange={(event) => {
                    const newUrl = event.target.value
                    setOgImage(newUrl)
                    // Only clear preview if the new URL is empty or different from uploaded path
                    if (!newUrl || !newUrl.startsWith('blog-images/')) {
                      setOgImagePreview('')
                    }
                  }}
                />
              </div>

              {ogImage && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <NextImage
                      src={ogImagePreview || getMinioViewUrl(ogImage) || ogImage}
                      alt="Open Graph preview"
                      width={1200}
                      height={480}
                      unoptimized={true}
                      priority={true}
                      className="h-48 w-full object-cover"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm">Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category">
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

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vendorId">Vendor ID (Optional)</Label>
                  <Input 
                    id="vendorId"
                    placeholder="Vendor identifier" 
                    value={vendorId} 
                    onChange={(event) => setVendorId(event.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="readingTime">Reading Time</Label>
                  <Input
                    id="readingTime"
                    placeholder="5"
                    type="number"
                    min={1}
                    value={readingTime}
                    onChange={(event) => setReadingTime(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Estimated minutes to read</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-3">
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm">SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  placeholder="SEO-optimized title"
                  value={metaTitle}
                  onChange={(event) => setMetaTitle(event.target.value)}
                  maxLength={60}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Recommended: 50-60 characters</span>
                  <span>{metaTitle.length}/60</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  placeholder="Brief description for search results"
                  value={metaDescription}
                  onChange={(event) => setMetaDescription(event.target.value)}
                  rows={3}
                  maxLength={160}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Recommended: 140-160 characters</span>
                  <span>{metaDescription.length}/160</span>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="focusKeyword">Focus Keyword</Label>
                <Input
                  id="focusKeyword"
                  placeholder="Primary keyword for this post"
                  value={focusKeyword}
                  onChange={(event) => setFocusKeyword(event.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="keywords">Additional Keywords</Label>
                <Input
                  id="keywords"
                  placeholder="keyword1, keyword2, keyword3"
                  value={keywords}
                  onChange={(event) => setKeywords(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">Separate keywords with commas</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-3">

          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm">Post Tags</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {tagOptions.length ? (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Selected: {tagIds.length} tag{tagIds.length !== 1 ? 's' : ''}
                  </div>
                  <ScrollArea className="h-72 rounded-lg border p-3">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {tagOptions.map((tag) => {
                        const checked = tagIds.includes(tag.id)
                        return (
                          <div 
                            key={tag.id} 
                            className="flex items-center gap-2 rounded-md border px-3 py-2 transition-colors hover:bg-accent"
                          >
                            <Checkbox
                              id={`tag-${tag.id}`}
                              checked={checked}
                              onCheckedChange={(value) => {
                                const isChecked = Boolean(value)
                                setTagIds((prev) =>
                                  isChecked
                                    ? Array.from(new Set([...prev, tag.id]))
                                    : prev.filter((id) => id !== tag.id),
                                )
                              }}
                            />
                            <Label 
                              htmlFor={`tag-${tag.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {tag.name}
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="py-3 text-center">
                  <p className="text-sm text-muted-foreground">No tags available yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Create tags in the tag management section.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
