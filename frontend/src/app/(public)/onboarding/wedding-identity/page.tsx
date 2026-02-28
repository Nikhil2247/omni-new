'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { trackOnboarding } from '@/lib/analytics/umami'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import {
  Heart,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Send,
  Check,
  Mail,
} from 'lucide-react'
import {
  useWeddingIdentity,
  useCreateWeddingIdentity,
  useInvitePartner,
} from '@/hooks/queries/use-onboarding'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
      <div className="min-h-screen p-4">
        <div className="mx-auto max-w-2xl space-y-6">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  // If identity already exists, show summary
  if (weddingIdentity) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-2xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-2">
              <Heart className="h-8 w-8 text-pink-500 fill-pink-500" />
              <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                {weddingIdentity.displayName}
              </h1>
            </div>
            <p className="text-muted-foreground">Your wedding identity is all set up!</p>
          </motion.div>

          <Card className="border-pink-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-pink-500" />
                Partners
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(weddingIdentity.partners ?? []).map((partner, index) => (
                <div key={partner.id || index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-linear-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                      {partner.name?.charAt(0) ?? '?'}
                    </div>
                    <div>
                      <p className="font-medium">{partner.name ?? 'Partner'}</p>
                      {partner.email && (
                        <p className="text-sm text-muted-foreground">{partner.email}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={partner.inviteStatus === 'ACCEPTED' ? 'default' : 'secondary'}>
                    {partner.isOwner ? 'Owner' : partner.inviteStatus?.toLowerCase() ?? 'pending'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            size="lg"
            onClick={handleComplete}
            className="w-full bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-2">
            <Heart className="h-8 w-8 text-pink-500" />
            <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Wedding Identity
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {step === 'create'
              ? 'Create a joint profile so both partners can collaborate on the same planning board.'
              : 'Invite your partner to join and edit the plan together.'}
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={`h-2 w-16 rounded-full transition-colors ${
              step === 'create' ? 'bg-pink-500' : 'bg-pink-200'
            }`}
          />
          <div
            className={`h-2 w-16 rounded-full transition-colors ${
              step === 'invite' ? 'bg-pink-500' : 'bg-pink-200'
            }`}
          />
        </div>

        {step === 'create' ? (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-pink-100 shadow-lg shadow-pink-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-pink-500" />
                  Create Your Joint Profile
                </CardTitle>
                <CardDescription>
                  This name will appear on your invitations and planning board
                </CardDescription>
              </CardHeader>
              <CardContent>
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

                    <Separator />

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
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl bg-linear-to-r from-pink-50 to-purple-50 p-6 text-center"
                      >
                        <p className="text-sm text-muted-foreground mb-2">Your wedding identity</p>
                        <h3 className="text-2xl font-bold bg-linear-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                          {createForm.watch('partnerOneName')} & {createForm.watch('partnerTwoName')}
                        </h3>
                      </motion.div>
                    )}

                    <div className="flex items-center justify-between pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleBack}
                        className="text-muted-foreground"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                      </Button>
                      <Button
                        type="submit"
                        disabled={createIdentity.isPending}
                        className="bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                      >
                        {createIdentity.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-pink-100 shadow-lg shadow-pink-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-pink-500" />
                  Invite Your Partner
                </CardTitle>
                <CardDescription>
                  Send an invitation so your partner can access and edit the same planning board
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inviteSent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8 space-y-4"
                  >
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold">Invitation Sent!</h3>
                    <p className="text-muted-foreground">
                      We've sent an email invitation. They can accept it to join your planning board.
                    </p>
                    <Button
                      onClick={handleComplete}
                      className="bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <Form {...inviteForm}>
                    <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-6">
                      <FormField
                        control={inviteForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Partner's Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="partner@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              They'll receive an email with a link to join
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
                              <Input
                                type="tel"
                                placeholder="+91 90000 00000"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              For WhatsApp notifications
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center justify-between pt-4">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleComplete}
                          className="text-muted-foreground"
                        >
                          Skip & Continue
                        </Button>
                        <Button
                          type="submit"
                          disabled={invitePartner.isPending}
                          className="bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                        >
                          {invitePartner.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send Invitation
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
