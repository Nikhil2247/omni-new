'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { useVibeQuizImages, useSubmitVibeQuiz, useVibeQuizStatus } from '@/hooks/queries/use-onboarding'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

const MIN_SELECTIONS = 5
const MAX_SELECTIONS = 10

export default function VibeQuizPage() {
  const router = useRouter()
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const setOnboardingComplete = useAuthStore((state) => state.setOnboardingComplete)

  const { data: imagesData, isLoading: imagesLoading, error: imagesError } = useVibeQuizImages()
  const { data: quizStatus, isLoading: statusLoading } = useVibeQuizStatus()
  const submitQuiz = useSubmitVibeQuiz()

  // Handle different API response formats (array or { data: array })
  const images = Array.isArray(imagesData) ? imagesData : (imagesData as any)?.data ?? []

  const toggleSelection = useCallback((imageId: string) => {
    setSelectedImages(prev => {
      if (prev.includes(imageId)) {
        return prev.filter(id => id !== imageId)
      }
      if (prev.length >= MAX_SELECTIONS) {
        toast.error(`You can select up to ${MAX_SELECTIONS} images`)
        return prev
      }
      return [...prev, imageId]
    })
  }, [])

  const handleSubmit = async () => {
    if (selectedImages.length < MIN_SELECTIONS) {
      toast.error(`Please select at least ${MIN_SELECTIONS} images`)
      return
    }

    try {
      await submitQuiz.mutateAsync({ selectedImageIds: selectedImages })
      // Update auth store to mark onboarding as complete
      setOnboardingComplete()
      toast.success('Your style preferences have been saved!')
      router.push('/dashboard')
    } catch {
      toast.error('Failed to save your preferences. Please try again.')
    }
  }

  // If quiz already completed, redirect
  if (quizStatus?.completed) {
    router.push('/dashboard')
    return null
  }

  if (imagesLoading || statusLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
          </div>
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (imagesError || images.length === 0) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-pink-500" />
            </div>
            <CardTitle>Unable to Load Quiz</CardTitle>
            <CardDescription>
              We couldn't load the quiz images. Please try again or continue to your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Try Again
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/dashboard">Continue to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = (selectedImages.length / MIN_SELECTIONS) * 100

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-pink-500" />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Discover Your Vibe
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Select {MIN_SELECTIONS}-{MAX_SELECTIONS} images that resonate with your dream celebration.
            This helps us personalize your experience.
          </p>
        </motion.div>

        {/* Progress */}
        <Card className="border-pink-100 shadow-lg shadow-pink-500/5">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedImages.length} of {MIN_SELECTIONS} minimum selected
                </span>
                <span className="font-medium text-pink-600">
                  {selectedImages.length >= MIN_SELECTIONS ? 'Ready to continue!' : `${MIN_SELECTIONS - selectedImages.length} more to go`}
                </span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Image Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {images.map((image: any, index: number) => {
              const isSelected = selectedImages.includes(image.id)
              return (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => toggleSelection(image.id)}
                  className={cn(
                    'relative aspect-square rounded-xl overflow-hidden cursor-pointer group',
                    'ring-4 transition-all duration-200',
                    isSelected
                      ? 'ring-pink-500 scale-[0.98]'
                      : 'ring-transparent hover:ring-pink-200'
                  )}
                >
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt={`${image.category} - ${image.style}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />

                  {/* Overlay */}
                  <div className={cn(
                    'absolute inset-0 transition-all duration-200',
                    isSelected
                      ? 'bg-pink-500/30'
                      : 'bg-black/0 group-hover:bg-black/10'
                  )} />

                  {/* Selection indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute top-2 right-2 bg-pink-500 rounded-full p-1.5 shadow-lg"
                      >
                        <Check className="h-4 w-4 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Style badge */}
                  <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium">
                    {image.style}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center pt-4"
        >
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={selectedImages.length < MIN_SELECTIONS || submitQuiz.isPending}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg shadow-pink-500/25 px-8"
          >
            {submitQuiz.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
