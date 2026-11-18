'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { trackOnboarding } from '@/lib/analytics/umami'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft, Loader2, Send } from 'lucide-react'
import {
  useWeddingIdentity,
  useCreateWeddingIdentity,
  useInvitePartner,
} from '@/hooks/queries/use-onboarding'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Brush, BrushBar, Ico, ICONS, Paper, SketchButton, SkContainer, Stamp } from '@/components/sketch'
import { toast } from 'sonner'

const weddingIdentitySchema = z.object({
  partnerOneName: z.string().min(2, 'Name must be at least 2 characters'),
  partnerTwoName: z.string().min(2, 'Name must be at least 2 characters'),
  eventDate: z.string().optional(),
  eventType: z.enum(['WEDDING', 'ENGAGEMENT', 'OTHER']),
})

const invitePartnerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
})

type WeddingIdentityValues = z.infer<typeof weddingIdentitySchema>
type InvitePartnerValues = z.infer<typeof invitePartnerSchema>

export default function WeddingIdentityPage() {
  const router = useRouter()
  const [step, setStep] = useState<'create' | 'invite'>('create')
  const [inviteSent, setInviteSent] = useState(false)

  useEffect(() => {
    trackOnboarding.stepComplete(2, 'wedding-identity', 'user')
  }, [])

  const { data: weddingIdentity, isLoading } = useWeddingIdentity()
  const createIdentity = useCreateWeddingIdentity()
  const invitePartner = useInvitePartner()

  const createForm = useForm<WeddingIdentityValues>({
    resolver: zodResolver(weddingIdentitySchema),
    defaultValues: {
      partnerOneName: '',
      partnerTwoName: '',
      eventDate: '',
      eventType: 'WEDDING',
    },
  })

  const inviteForm = useForm<InvitePartnerValues>({
    resolver: zodResolver(invitePartnerSchema),
    defaultValues: {
      email: '',
      phone: '',
    },
  })

  const onCreateSubmit = async (values: WeddingIdentityValues) => {
    try {
      await createIdentity.mutateAsync(values)
      toast.success('Wedding identity created!')
      setStep('invite')
    } catch {
      toast.error('Failed to create wedding identity. Please try again.')
    }
  }

  const onInviteSubmit = async (values: InvitePartnerValues) => {
    try {
      await invitePartner.mutateAsync(values)
      toast.success('Invitation sent to your partner!')
      setInviteSent(true)
    } catch {
      toast.error('Failed to send invitation. Please try again.')
    }
  }

  const handleComplete = () => {
    router.push('/dashboard')
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <SkContainer className="py-8 sm:py-12">
        <div aria-busy="true" className="mx-auto max-w-2xl space-y-6">
          <Skeleton className="mx-auto h-12 w-3/4" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </SkContainer>
    )
  }

  // If identity already exists, show summary
  if (weddingIdentity) {
    return (
      <SkContainer className="py-8 sm:py-12">
        <div className="mx-auto max-w-2xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 text-center"
          >
            <Ico d={ICONS.heart} className="text-rose mx-auto h-10 w-10" />
            <h1 className="font-display text-[clamp(1.9rem,6vw,3rem)] leading-[1.05] font-semibold tracking-tight text-balance break-words">
              <Brush>{weddingIdentity.displayName}</Brush>
            </h1>
            <p className="text-ink-soft">Your wedding identity is all set up!</p>
          </motion.div>

          <Paper tape className="px-5 py-5 sm:px-6">
            <h2 className="font-display mb-4 flex items-center gap-2 text-xl font-semibold">
              <Ico d={ICONS.star} className="text-gold h-5 w-5" />
              Partners
            </h2>
            <div className="space-y-4">
              {(weddingIdentity.partners ?? []).map((partner, index) => (
                <div
                  key={partner.id || index}
                  className="border-line flex items-center justify-between gap-3 border-b-2 border-dashed pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-blue text-on-blue border-ink font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-semibold">
                      {partner.name?.charAt(0) ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{partner.name ?? 'Partner'}</p>
                      {partner.email && (
                        <p className="text-ink-soft truncate text-sm">{partner.email}</p>
                      )}
                    </div>
                  </div>
                  <Stamp tone={partner.inviteStatus === 'ACCEPTED' ? 'ok' : 'wait'} className="shrink-0">
                    {partner.isOwner ? 'Owner' : partner.inviteStatus?.toLowerCase() ?? 'pending'}
                  </Stamp>
                </div>
              ))}
            </div>
          </Paper>

          <SketchButton onClick={handleComplete} className="w-full">
            Go to Dashboard
            <ArrowRight className="size-4" />
          </SketchButton>
        </div>
      </SkContainer>
    )
  }

  return (
    <SkContainer className="py-8 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 text-center"
        >
          <h1 className="font-display text-[clamp(2rem,6vw,3.2rem)] leading-[1.05] font-semibold tracking-tight text-balance">
            Wedding <Brush>Identity</Brush>
          </h1>
          <p className="text-ink-soft mx-auto max-w-xl text-lg">
            {step === 'create'
              ? 'Create a joint profile so both partners can collaborate on the same planning board.'
              : 'Invite your partner to join and edit the plan together.'}
          </p>
        </motion.div>

        {/* Step indicator */}
        <BrushBar value={step === 'create' ? 50 : 100} className="mx-auto max-w-xs" />

        {step === 'create' ? (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Paper tape className="px-5 py-6 sm:px-7">
              <div className="mb-6">
                <h2 className="font-display flex items-center gap-2 text-xl font-semibold">
                  <Ico d={ICONS.star} className="text-gold h-5 w-5" />
                  Create Your Joint Profile
                </h2>
                <p className="text-ink-soft mt-1 text-sm">
                  This name will appear on your invitations and planning board
                </p>
              </div>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={createForm.control}
                      name="partnerOneName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partner 1 Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Rohit" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="partnerTwoName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partner 2 Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Riya" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-line border-t-2 border-dashed" />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={createForm.control}
                      name="eventType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select event type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="WEDDING">Wedding</SelectItem>
                              <SelectItem value="ENGAGEMENT">Engagement</SelectItem>
                              <SelectItem value="OTHER">Other Celebration</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="eventDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>You can add this later</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Preview */}
                  {createForm.watch('partnerOneName') && createForm.watch('partnerTwoName') && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <Paper alt className="p-6 text-center">
                        <p className="sk-eyebrow mb-2">Your wedding identity</p>
                        <h3 className="font-display text-2xl font-semibold break-words">
                          <Brush>
                            {createForm.watch('partnerOneName')} &amp; {createForm.watch('partnerTwoName')}
                          </Brush>
                        </h3>
                      </Paper>
                    </motion.div>
                  )}

                  <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <SketchButton type="button" variant="ghost" onClick={handleBack}>
                      <ArrowLeft className="size-4" />
                      Back to Dashboard
                    </SketchButton>
                    <SketchButton type="submit" disabled={createIdentity.isPending}>
                      {createIdentity.isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </SketchButton>
                  </div>
                </form>
              </Form>
            </Paper>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Paper tape className="px-5 py-6 sm:px-7">
              <div className="mb-6">
                <h2 className="font-display flex items-center gap-2 text-xl font-semibold">
                  <Ico d={ICONS.mail} className="text-gold h-5 w-5" />
                  Invite Your Partner
                </h2>
                <p className="text-ink-soft mt-1 text-sm">
                  Send an invitation so your partner can access and edit the same planning board
                </p>
              </div>
              {inviteSent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 py-8 text-center"
                >
                  <Ico d={ICONS.shield} className="text-leaf-deep mx-auto h-16 w-16" />
                  <h3 className="font-display text-xl font-semibold">Invitation Sent!</h3>
                  <p className="text-ink-soft">
                    We&apos;ve sent an email invitation. They can accept it to join your planning board.
                  </p>
                  <SketchButton onClick={handleComplete}>
                    Go to Dashboard
                    <ArrowRight className="size-4" />
                  </SketchButton>
                </motion.div>
              ) : (
                <Form {...inviteForm}>
                  <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-6">
                    <FormField
                      control={inviteForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partner&apos;s Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="partner@example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            They&apos;ll receive an email with a link to join
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={inviteForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+91 90000 00000" {...field} />
                          </FormControl>
                          <FormDescription>For WhatsApp notifications</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <SketchButton type="button" variant="ghost" onClick={handleComplete}>
                        Skip &amp; Continue
                      </SketchButton>
                      <SketchButton type="submit" disabled={invitePartner.isPending}>
                        {invitePartner.isPending ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="size-4" />
                            Send Invitation
                          </>
                        )}
                      </SketchButton>
                    </div>
                  </form>
                </Form>
              )}
            </Paper>
          </motion.div>
        )}
      </div>
    </SkContainer>
  )
}
