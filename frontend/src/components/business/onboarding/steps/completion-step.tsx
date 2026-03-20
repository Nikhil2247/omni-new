'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  Camera,
  CalendarDays,
  Star,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

interface CompletionStepProps {
  onGoToDashboard: () => void
}

export function CompletionStep({ onGoToDashboard }: CompletionStepProps) {
  // Trigger confetti on mount
  useEffect(() => {
    const duration = 2000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="overflow-hidden">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>

          <Badge className="mb-4 gap-1">
            <Sparkles className="h-3 w-3" />
            Onboarding Complete
          </Badge>

          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            Congratulations! You&apos;re All Set!
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your vendor account is now fully set up. You can start receiving inquiries and bookings from clients.
          </p>
        </div>

        <CardContent className="p-8">
          {/* Next Steps */}
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">What to do next?</h3>

            <div className="grid gap-4">
              <div className="flex items-start gap-4 p-4 rounded-lg border hover:border-primary/50 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Add Portfolio Items</p>
                  <p className="text-sm text-muted-foreground">
                    Showcase your best work to attract more clients.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border hover:border-primary/50 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Set Your Availability</p>
                  <p className="text-sm text-muted-foreground">
                    Block dates when you&apos;re not available for bookings.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border hover:border-primary/50 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Add Services & Pricing</p>
                  <p className="text-sm text-muted-foreground">
                    List your services with clear pricing for better conversions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-8">
            <Button onClick={onGoToDashboard} size="lg" className="w-full">
              <LayoutDashboard className="mr-2 h-5 w-5" />
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
