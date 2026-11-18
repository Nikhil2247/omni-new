'use client'

import { useEffect, useState, useCallback } from 'react'
import NextImage from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { trackOnboarding } from '@/lib/analytics/umami'
import { Check, Loader2 } from 'lucide-react'
import { useVibeQuizImages, useSubmitVibeQuiz, useVibeQuizStatus } from '@/hooks/queries/use-onboarding'
import { useAuthStore } from '@/store/auth-store'
import { Skeleton } from '@/components/ui/skeleton'
import { Brush, BrushBar, Eyebrow, Ico, ICONS, Paper, SketchButton, SkContainer, Stamp } from '@/components/sketch'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const MIN_SELECTIONS = 5
const MAX_SELECTIONS = 10

interface QuizImage {
  id: string
  url: string
  thumbnailUrl?: string
  category?: string
  style?: string
}

export default function VibeQuizPage() {
  const router = useRouter()
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const setOnboardingComplete = useAuthStore((state) => state.setOnboardingComplete)

  useEffect(() => {
    trackOnboarding.stepComplete(1, 'vibe-quiz', 'user')
  }, [])

  const { data: imagesData, isLoading: imagesLoading, error: imagesError } = useVibeQuizImages()
  const { data: quizStatus, isLoading: statusLoading } = useVibeQuizStatus()
  const submitQuiz = useSubmitVibeQuiz()

  // The API can answer with an array or { data: array }
  const images: QuizImage[] = Array.isArray(imagesData)
    ? (imagesData as QuizImage[])
    : ((imagesData as unknown as { data?: QuizImage[] })?.data ?? [])

  const completed = Boolean(quizStatus?.completed)

  // If the quiz is already done, go on to the dashboard
  useEffect(() => {
    if (completed) router.push('/dashboard')
  }, [completed, router])

  const toggleSelection = useCallback((imageId: string) => {
    setSelectedImages((prev) => {
      if (prev.includes(imageId)) return prev.filter((id) => id !== imageId)
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
      setOnboardingComplete()
      toast.success('Your style preferences have been saved!')
      router.push('/dashboard')
    } catch {
      toast.error('Failed to save your preferences. Please try again.')
    }
  }

  if (completed) return null

  if (imagesLoading || statusLoading) {
    return (
      <SkContainer className="py-8 sm:py-12">
        <div aria-busy="true" className="space-y-8">
          <div className="space-y-3 text-center">
            <Skeleton className="mx-auto h-5 w-32" />
            <Skeleton className="mx-auto h-12 w-3/4 max-w-md" />
            <Skeleton className="mx-auto h-5 w-1/2 max-w-sm" />
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </SkContainer>
    )
  }

  if (imagesError || images.length === 0) {
    return (
      <SkContainer className="max-w-md py-12">
        <Paper tape className="px-6 py-10 text-center">
          <Ico d={ICONS.heart} className="mx-auto mb-3 h-12 w-12" />
          <h1 className="font-display text-2xl font-semibold">Unable to load the quiz</h1>
          <p className="text-ink-soft mt-2">We couldn&apos;t load the quiz images. Try again, or continue to your dashboard.</p>
          <div className="mt-6 grid gap-3">
            <SketchButton variant="line" onClick={() => window.location.reload()}>
              Try Again
            </SketchButton>
            <SketchButton variant="ghost" asChild>
              <Link href="/dashboard">Continue to Dashboard</Link>
            </SketchButton>
          </div>
        </Paper>
      </SkContainer>
    )
  }

  const count = selectedImages.length
  const ready = count >= MIN_SELECTIONS
  const progress = Math.min((count / MIN_SELECTIONS) * 100, 100)

  return (
    <SkContainer className="py-8 sm:py-12">
      {/* Header */}
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <Eyebrow>Step 1 · Your style</Eyebrow>
        <h1 className="font-display mt-3 text-[clamp(2rem,6vw,3.2rem)] leading-[1.05] font-semibold tracking-tight text-balance">
          Discover Your <Brush>Vibe</Brush>
        </h1>
        <p className="text-ink-soft mt-3 text-lg">
          Pick {MIN_SELECTIONS} to {MAX_SELECTIONS} pictures that feel like your dream celebration. We use them to suggest vendors and ideas you&apos;ll love.
        </p>
      </div>

      {/* Progress */}
      <Paper alt className="mx-auto mb-8 max-w-3xl px-5 py-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-ink-soft">
            {count} of {MIN_SELECTIONS} minimum chosen
          </span>
          <Stamp tone={ready ? 'ok' : 'wait'}>{ready ? 'Ready to continue' : `${MIN_SELECTIONS - count} more to go`}</Stamp>
        </div>
        <BrushBar value={progress} tone={ready ? 'green' : 'blue'} />
      </Paper>

      {/* Image grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => {
          const isSelected = selectedImages.includes(image.id)
          return (
            <button
              key={image.id}
              type="button"
              onClick={() => toggleSelection(image.id)}
              aria-pressed={isSelected}
              aria-label={`${image.category ?? 'Style'} ${image.style ?? ''}`.trim()}
              className={cn(
                'sk-paper group relative block aspect-square overflow-hidden p-1.5 text-left transition-transform duration-200',
                index % 2 ? 'sk-paper--alt rotate-[0.6deg]' : '-rotate-[0.6deg]',
                isSelected ? 'scale-[0.97] !rotate-0' : 'hover:-translate-y-1',
              )}
            >
              <span
                className={cn(
                  'border-ink relative block h-full w-full overflow-hidden rounded-[10px_14px_10px_16px] border-2',
                  isSelected && 'outline-blue outline-4 -outline-offset-4',
                )}
              >
                <NextImage
                  src={image.thumbnailUrl || image.url}
                  alt={`${image.category ?? ''} ${image.style ?? ''}`.trim() || 'Style inspiration'}
                  width={800}
                  height={800}
                  unoptimized
                  priority={index < 8}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* chosen tint */}
                <span
                  className={cn(
                    'absolute inset-0 transition-opacity duration-200',
                    isSelected ? 'bg-blue/25 opacity-100' : 'opacity-0',
                  )}
                />

                {/* chosen mark */}
                {isSelected ? (
                  <span className="bg-blue text-on-blue border-ink absolute top-2 right-2 flex size-8 items-center justify-center rounded-full border-2">
                    <Check className="size-4" />
                  </span>
                ) : null}

                {image.style ? (
                  <span className="sk-hand border-ink bg-card text-ink absolute bottom-2 left-2 rounded-[10px_14px_10px_12px] border-2 px-2.5 py-0.5 text-[1.05rem] leading-tight">
                    {image.style}
                  </span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>

      {/* Action */}
      <div className="sticky bottom-4 z-10 mt-8 flex justify-center">
        <Paper className="flex flex-wrap items-center justify-center gap-4 px-5 py-3">
          <span className="text-ink-soft text-sm">
            {count} chosen
            {count >= MAX_SELECTIONS ? ' (maximum)' : ''}
          </span>
          <SketchButton onClick={handleSubmit} disabled={!ready || submitQuiz.isPending}>
            {submitQuiz.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving...
              </>
            ) : (
              'Continue →'
            )}
          </SketchButton>
        </Paper>
      </div>
    </SkContainer>
  )
}
