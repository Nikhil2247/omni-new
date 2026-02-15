'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  useBusinessProfile,
  useBusinessPortfolio,
  useCreatePortfolioItem,
  useUpdatePortfolioItem,
  useDeletePortfolioItem,
  useDeletePortfolioMediaItem,
  useUpdatePortfolioMediaItem,
  useUploadPortfolioImage,
  useUploadMultiplePortfolioImages,
} from '@/hooks/queries/use-business'
import { useAddMediaTags, useMediaItemTags, useRemoveMediaTag } from '@/hooks/queries/use-media-tags'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FileUpload } from '@/components/ui/file-upload'
import {
  Image as ImageIcon,
  Video,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  Loader2,
  AlertTriangle,
  Upload,
  Grid3X3,
  List,
  Tag,
} from 'lucide-react'
import type { Portfolio, MediaItem } from '@/lib/api/types/business.types'
import { getMinioViewUrl } from '@/lib/utils/minio'

type ViewMode = 'grid' | 'list'

export default function BusinessPortfolioPage() {
  const { data: profile, isLoading: profileLoading } = useBusinessProfile()
  const { data: portfolio, isLoading: portfolioLoading } = useBusinessPortfolio(profile?.id || '')
  const createPortfolio = useCreatePortfolioItem()
  const updatePortfolio = useUpdatePortfolioItem()
  const deletePortfolio = useDeletePortfolioItem()
  const deleteMediaItem = useDeletePortfolioMediaItem()
  const updateMediaItem = useUpdatePortfolioMediaItem()
  const uploadImage = useUploadPortfolioImage()
  const uploadMultipleImages = useUploadMultiplePortfolioImages()
  const addTags = useAddMediaTags()
  const removeTag = useRemoveMediaTag()

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<Portfolio | null>(null)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [tagDraft, setTagDraft] = useState('')
  const [tagMediaItem, setTagMediaItem] = useState<MediaItem | null>(null)
  const { data: tagList = [] } = useMediaItemTags(tagMediaItem?.id || '')
  const [captionDialogOpen, setCaptionDialogOpen] = useState(false)
  const [captionDraft, setCaptionDraft] = useState('')
  const [captionMediaItem, setCaptionMediaItem] = useState<MediaItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'album'; album: Portfolio }
    | { type: 'media'; media: MediaItem; albumId: string }
    | null
  >(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadCaption, setUploadCaption] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isFeatured: false,
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      isFeatured: false,
    })
  }

  const openEditDialog = (album: Portfolio) => {
    setSelectedAlbum(album)
    setFormData({
      title: album.title,
      description: album.description || '',
      isFeatured: album.isFeatured,
    })
    setShowEditDialog(true)
  }

  const openCreateDialog = () => {
    resetForm()
    setShowCreateDialog(true)
  }

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (!profile) return

      setIsUploading(true)
      setUploadProgress(0)

      try {
        if (!selectedAlbumId) {
          throw new Error('Select an album to upload media')
        }

        if (files.length === 1) {
          const file = files[0]
          setUploadProgress(30)
          await uploadImage.mutateAsync({
            portfolioId: selectedAlbumId,
            file,
            options: {
              altText: file.name.replace(/\.[^/.]+$/, ''),
            },
          })
          setUploadProgress(100)
        } else {
          await uploadMultipleImages.mutateAsync({
            portfolioId: selectedAlbumId,
            files,
          })
          setUploadProgress(100)
        }

        // Close dialog after success
        setTimeout(() => {
          setShowUploadDialog(false)
          setUploadProgress(0)
          setUploadCaption('')
        }, 1000)
      } catch (error) {
        console.error('Upload failed:', error)
      } finally {
        setIsUploading(false)
      }
    },
    [profile, selectedAlbumId, uploadImage, uploadMultipleImages]
  )

  const handleCreate = () => {
    if (!profile) return

    createPortfolio.mutate(
      {
        vendorProfileId: profile.id,
        title: formData.title,
        description: formData.description || undefined,
        isFeatured: formData.isFeatured,
      },
      {
        onSuccess: () => {
          setShowCreateDialog(false)
          resetForm()
        },
      },
    )
  }

  const handleUpdateAlbum = () => {
    if (!selectedAlbum) return

    updatePortfolio.mutate(
      {
        id: selectedAlbum.id,
        payload: {
          title: formData.title,
          description: formData.description || undefined,
          isFeatured: formData.isFeatured,
        },
      },
      {
        onSuccess: () => {
          setShowEditDialog(false)
          setSelectedAlbum(null)
          resetForm()
        },
      }
    )
  }

  const handleDelete = () => {
    if (!deleteTarget) return

    if (deleteTarget.type === 'album') {
      deletePortfolio.mutate(deleteTarget.album.id, {
        onSuccess: () => {
          setShowDeleteDialog(false)
          setDeleteTarget(null)
        },
      })
      return
    }

    deleteMediaItem.mutate(deleteTarget.media.id, {
      onSuccess: () => {
        setShowDeleteDialog(false)
        setDeleteTarget(null)
      },
    })
  }

  const openTagDialog = (media: MediaItem) => {
    setTagMediaItem(media)
    setTagDraft('')
    setTagDialogOpen(true)
  }

  const openCaptionDialog = (media: MediaItem) => {
    setCaptionMediaItem(media)
    setCaptionDraft(media.caption || '')
    setCaptionDialogOpen(true)
  }

  const handleAddTag = async () => {
    if (!tagMediaItem || !tagDraft.trim()) return
    const tags = tagDraft
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
    if (tags.length === 0) return
    await addTags.mutateAsync({ mediaItemId: tagMediaItem.id, tags })
    setTagDraft('')
  }

  const handleSaveCaption = async () => {
    if (!captionMediaItem) return
    await updateMediaItem.mutateAsync({
      mediaId: captionMediaItem.id,
      payload: { caption: captionDraft || null },
    })
    setCaptionDialogOpen(false)
    setCaptionMediaItem(null)
  }

  useEffect(() => {
    if (!selectedAlbumId && portfolio && portfolio.length > 0) {
      setSelectedAlbumId(portfolio[0].id)
    }
  }, [portfolio, selectedAlbumId])

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">Showcase your work</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold">Profile Required</h3>
            <p className="text-muted-foreground mt-2">
              Please create your business profile first before adding portfolio items.
            </p>
            <Button className="mt-4" onClick={() => (window.location.href = '/business/profile')}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const albums = portfolio || []
  const featuredAlbums = albums.filter((album) => album.isFeatured)
  const totalAlbums = albums.length
  const totalMedia = albums.reduce((count, album) => count + (album.mediaItems?.length || 0), 0)
  const activeAlbum = albums.find((album) => album.id === selectedAlbumId) || null
  const selectedMedia = activeAlbum?.mediaItems || []
  const deleteTitle = deleteTarget?.type === 'album' ? 'Delete Album' : 'Delete Media Item'
  const deleteName =
    deleteTarget?.type === 'album'
      ? deleteTarget.album.title
      : deleteTarget?.media.altText || 'this media item'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">
            Organize your media into albums ({totalAlbums} albums)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Album
          </Button>
          <Button onClick={() => setShowUploadDialog(true)} disabled={!selectedAlbumId}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Media
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Albums</p>
                <p className="text-2xl font-bold">{totalAlbums}</p>
              </div>
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Featured Albums</p>
                <p className="text-2xl font-bold">{featuredAlbums.length}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Media Items</p>
                <p className="text-2xl font-bold">{totalMedia}</p>
              </div>
              <Video className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Content */}
      {portfolioLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !albums || albums.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ImageIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No Albums Yet</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Create your first album to start showcasing your work.
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Album
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Albums</CardTitle>
              <CardDescription>Organize your media into albums for clients to browse.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {albums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    isSelected={album.id === selectedAlbumId}
                    onSelect={() => setSelectedAlbumId(album.id)}
                    onEdit={() => openEditDialog(album)}
                    onDelete={() => {
                      setDeleteTarget({ type: 'album', album })
                      setShowDeleteDialog(true)
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Album Media</CardTitle>
                  <CardDescription>
                    {activeAlbum ? activeAlbum.title : 'Select an album to view media.'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedAlbumId || undefined} onValueChange={setSelectedAlbumId}>
                    <SelectTrigger className="w-55">
                      <SelectValue placeholder="Select album" />
                    </SelectTrigger>
                    <SelectContent>
                      {albums.map((album) => (
                        <SelectItem key={album.id} value={album.id}>
                          {album.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setShowUploadDialog(true)} disabled={!selectedAlbumId}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Media
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!activeAlbum ? (
                <div className="text-center py-10 text-muted-foreground">
                  Select an album to see its media items.
                </div>
              ) : (
                <Tabs defaultValue="all" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="all">All ({selectedMedia.length})</TabsTrigger>
                    <TabsTrigger value="images">
                      Images ({selectedMedia.filter((item) => item.type === 'IMAGE').length})
                    </TabsTrigger>
                    <TabsTrigger value="videos">
                      Videos ({selectedMedia.filter((item) => item.type === 'VIDEO').length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    <MediaGrid
                      items={selectedMedia}
                      viewMode={viewMode}
                      onDelete={(item) => {
                        setDeleteTarget({ type: 'media', media: item, albumId: activeAlbum.id })
                        setShowDeleteDialog(true)
                      }}
                      onTags={openTagDialog}
                      onCaption={openCaptionDialog}
                    />
                  </TabsContent>

                  <TabsContent value="images">
                    <MediaGrid
                      items={selectedMedia.filter((item) => item.type === 'IMAGE')}
                      viewMode={viewMode}
                      onDelete={(item) => {
                        setDeleteTarget({ type: 'media', media: item, albumId: activeAlbum.id })
                        setShowDeleteDialog(true)
                      }}
                      onTags={openTagDialog}
                      onCaption={openCaptionDialog}
                    />
                  </TabsContent>

                  <TabsContent value="videos">
                    <MediaGrid
                      items={selectedMedia.filter((item) => item.type === 'VIDEO')}
                      viewMode={viewMode}
                      onDelete={(item) => {
                        setDeleteTarget({ type: 'media', media: item, albumId: activeAlbum.id })
                        setShowDeleteDialog(true)
                      }}
                      onTags={openTagDialog}
                      onCaption={openCaptionDialog}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={showUploadDialog}
        onOpenChange={(open) => {
          setShowUploadDialog(open)
          if (!open) {
            setUploadCaption('')
            setUploadProgress(0)
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
            <DialogDescription>
              Upload images or videos to showcase your work. Images are automatically optimized for
              web.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4 space-y-2">
              <Label htmlFor="upload-album">Album</Label>
              <Select value={selectedAlbumId || undefined} onValueChange={setSelectedAlbumId}>
                <SelectTrigger id="upload-album" className="w-full">
                  <SelectValue placeholder="Select album" />
                </SelectTrigger>
                <SelectContent>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={album.id}>
                      {album.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedAlbumId && (
                <p className="text-xs text-destructive">Select an album to upload media.</p>
              )}
            </div>
            <div className="mb-4 space-y-2">
              <Label htmlFor="upload-caption">Caption (optional)</Label>
              <Textarea
                id="upload-caption"
                rows={3}
                value={uploadCaption}
                onChange={(event) => setUploadCaption(event.target.value)}
                placeholder="Write a short caption for single uploads..."
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Caption applies to single-file uploads only.
              </p>
            </div>
            <FileUpload
              onUpload={handleFileUpload}
              accept={{
                'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'],
                'video/*': ['.mp4', '.webm'],
              }}
              maxFiles={10}
              maxSize={25 * 1024 * 1024}
              multiple={true}
              disabled={isUploading || !selectedAlbumId}
            />

            {isUploading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={isUploading}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Album</DialogTitle>
            <DialogDescription>Create a new portfolio album to organize your media.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-title">Title *</Label>
              <Input
                id="create-title"
                placeholder="e.g., Sarah & John's Wedding"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                placeholder="Describe this album..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="create-featured">Featured Album</Label>
              <Switch
                id="create-featured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isFeatured: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createPortfolio.isPending || !formData.title}>
              {createPortfolio.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Album'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Album</DialogTitle>
            <DialogDescription>Update album details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                placeholder="Album title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe this album..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-featured">Featured Album</Label>
              <Switch
                id="edit-featured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isFeatured: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAlbum} disabled={updatePortfolio.isPending || !formData.title}>
              {updatePortfolio.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteName}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {(deleteTarget?.type === 'album' ? deletePortfolio.isPending : deleteMediaItem.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>Add or remove hashtags for this media item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mediaTags">Add tags (comma separated)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="mediaTags"
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  placeholder="#wedding, #outdoor"
                />
                <Button type="button" onClick={handleAddTag} disabled={addTags.isPending}>
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Current tags</Label>
              {tagList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tagList.map((tag) => (
                    <Button
                      key={tag.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        tagMediaItem
                          ? removeTag.mutate({ mediaItemId: tagMediaItem.id, tag: tag.tag })
                          : null
                      }
                    >
                      #{tag.tag}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={captionDialogOpen} onOpenChange={setCaptionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Caption</DialogTitle>
            <DialogDescription>Add a description for this media item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="media-caption">Caption</Label>
            <Textarea
              id="media-caption"
              rows={4}
              value={captionDraft}
              onChange={(event) => setCaptionDraft(event.target.value)}
              placeholder="Share the story behind this photo..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCaptionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCaption} disabled={updateMediaItem.isPending}>
              Save Caption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MediaGrid({
  items,
  viewMode,
  onDelete,
  onTags,
  onCaption,
}: {
  items: MediaItem[]
  viewMode: ViewMode
  onDelete: (item: MediaItem) => void
  onTags: (item: MediaItem) => void
  onCaption: (item: MediaItem) => void
}) {
  if (items.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No media available.</div>
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <MediaListItem
            key={item.id}
            item={item}
            onDelete={() => onDelete(item)}
            onTags={() => onTags(item)}
            onCaption={() => onCaption(item)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <MediaCard
          key={item.id}
          item={item}
          onDelete={() => onDelete(item)}
          onTags={() => onTags(item)}
          onCaption={() => onCaption(item)}
        />
      ))}
    </div>
  )
}

function MediaCard({
  item,
  onDelete,
  onTags,
  onCaption,
}: {
  item: MediaItem
  onDelete: () => void
  onTags: () => void
  onCaption: () => void
}) {
  const previewUrl = item.cdnUrl || item.thumbnailUrl || item.url
  const resolvedUrl = item.cdnUrl || getMinioViewUrl(previewUrl) || previewUrl

  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-square bg-muted">
        {item.type === 'IMAGE' ? (
          <img src={resolvedUrl} alt={item.altText || 'Media item'} className="object-cover w-full h-full" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCaption}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Caption
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTags}>
                <Tag className="mr-2 h-4 w-4" />
                Manage Tags
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{item.type}</p>
          {item.isApproved ? <Badge variant="secondary">Approved</Badge> : null}
        </div>
        {item.caption && <p className="mt-2 text-sm font-medium line-clamp-2">{item.caption}</p>}
        {!item.caption && item.altText && (
          <p className="mt-2 text-sm font-medium line-clamp-1">{item.altText}</p>
        )}
        <MediaTagChips mediaItemId={item.id} />
      </CardContent>
    </Card>
  )
}

function MediaListItem({
  item,
  onDelete,
  onTags,
  onCaption,
}: {
  item: MediaItem
  onDelete: () => void
  onTags: () => void
  onCaption: () => void
}) {
  const previewUrl = item.cdnUrl || item.thumbnailUrl || item.url
  const resolvedUrl = item.cdnUrl || getMinioViewUrl(previewUrl) || previewUrl

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
          {item.type === 'IMAGE' ? (
            <img src={resolvedUrl} alt={item.altText || 'Media item'} className="object-cover w-full h-full" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Video className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-medium truncate">{item.caption || item.altText || 'Media item'}</h3>
          {item.caption && item.altText && (
            <p className="text-xs text-muted-foreground line-clamp-1">{item.altText}</p>
          )}
          <p className="text-sm text-muted-foreground">{item.type}</p>
          <MediaTagChips mediaItemId={item.id} />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:w-auto sm:flex-col sm:items-stretch lg:flex-row lg:items-center lg:justify-end">
          <Button variant="ghost" size="sm" className="justify-start" onClick={onCaption}>
            <Edit className="mr-2 h-4 w-4" />
            Caption
          </Button>
          <Button variant="ghost" size="sm" className="justify-start" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button variant="ghost" size="sm" className="justify-start" onClick={onTags}>
            <Tag className="mr-2 h-4 w-4" />
            Tags
          </Button>
        </div>
      </div>
    </Card>
  )
}

function MediaTagChips({ mediaItemId }: { mediaItemId: string }) {
  const { data: tags = [] } = useMediaItemTags(mediaItemId)
  if (tags.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {tags.slice(0, 4).map((tag) => (
        <span key={tag.id} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
          #{tag.tag}
        </span>
      ))}
    </div>
  )
}

function AlbumCard({
  album,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: {
  album: Portfolio
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const cover = album.mediaItems?.[0]
  const coverPreview = cover?.cdnUrl || cover?.thumbnailUrl || cover?.url
  const coverUrl = coverPreview ? cover?.cdnUrl || getMinioViewUrl(coverPreview) || coverPreview : null
  const mediaCount = album.mediaItems?.length || 0

  return (
    <Card
      className={`cursor-pointer overflow-hidden transition-all ${isSelected ? 'ring-1 ring-primary' : 'hover:shadow-sm'}`}
      onClick={onSelect}
    >
      <div className="relative h-28 bg-muted sm:h-30">
        {coverUrl ? (
          <img src={coverUrl} alt={album.title} className="object-cover w-full h-full" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {album.isFeatured && (
          <Badge className="absolute top-2 left-2 h-5 px-1.5 text-[10px] bg-yellow-500 hover:bg-yellow-600">
            <Star className="mr-1 h-2.5 w-2.5" />
            Featured
          </Badge>
        )}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit()
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete()
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="space-y-1.5 p-2.5">
        <div>
          <h3 className="truncate text-sm font-semibold">{album.title}</h3>
          {album.description && (
            <p className="line-clamp-1 text-xs text-muted-foreground">{album.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{mediaCount} items</span>
          {isSelected ? <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Selected</Badge> : null}
        </div>
      </CardContent>
    </Card>
  )
}
