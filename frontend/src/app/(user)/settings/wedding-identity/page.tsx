'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { trackDashboard } from '@/lib/analytics/umami'
import { format } from 'date-fns'
import {
  Heart,
  Users,
  Calendar,
  Mail,
  Phone,
  Send,
  Edit2,
  Check,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import {
  useWeddingIdentity,
  useCreateWeddingIdentity,
  useUpdateWeddingIdentity,
  useInvitePartner,
} from '@/hooks/queries/use-onboarding'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
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
import { toast } from 'sonner'
import Link from 'next/link'

const updateSchema = z.object({
  displayName: z.string().min(2, 'Display name is required'),
  eventDate: z.string().optional(),
  eventType: z.enum(['WEDDING', 'ENGAGEMENT', 'OTHER']),
})

const createSchema = z.object({
  partnerOneName: z.string().min(2, 'Name must be at least 2 characters'),
  partnerTwoName: z.string().min(2, 'Name must be at least 2 characters'),
  eventDate: z.string().optional(),
  eventType: z.enum(['WEDDING', 'ENGAGEMENT', 'OTHER']),
})

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
})

type UpdateValues = z.infer<typeof updateSchema>
type CreateValues = z.infer<typeof createSchema>
type InviteValues = z.infer<typeof inviteSchema>

const formatDateSafe = (value?: string | Date) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return format(date, 'MMMM d, yyyy')
}

export default function WeddingIdentitySettingsPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)

  useEffect(() => {
    trackDashboard.sectionView('wedding-identity', 'user')
  }, [])

  const { data: identity, isLoading, refetch } = useWeddingIdentity()
  const createIdentity = useCreateWeddingIdentity()
  const updateIdentity = useUpdateWeddingIdentity()
  const invitePartner = useInvitePartner()

  const updateForm = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      displayName: identity?.displayName || '',
      eventDate: identity?.eventDate || '',
      eventType: identity?.eventType || 'WEDDING',
    },
  })

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      partnerOneName: '',
      partnerTwoName: '',
      eventDate: '',
      eventType: 'WEDDING',
    },
  })

  const inviteForm = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (!identity) return
    updateForm.reset({
      displayName: identity.displayName || '',
      eventDate: identity.eventDate || '',
      eventType: identity.eventType || 'WEDDING',
    })
  }, [identity, updateForm])

  const onUpdateSubmit = async (values: UpdateValues) => {
    try {
      await updateIdentity.mutateAsync(values)
      toast.success('Wedding identity updated!')
      setIsEditing(false)
    } catch {
      toast.error('Failed to update. Please try again.')
    }
  }

  const onInviteSubmit = async (values: InviteValues) => {
    try {
      await invitePartner.mutateAsync(values)
      toast.success('Invitation sent!')
      setShowInviteForm(false)
      inviteForm.reset()
    } catch {
      toast.error('Failed to send invitation. Please try again.')
    }
  }

  const onCreateSubmit = async (values: CreateValues) => {
    try {
      await createIdentity.mutateAsync(values)
      toast.success('Wedding identity created!')
      setShowInviteForm(true)
    } catch {
      toast.error('Failed to create wedding identity. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Wedding Identity</h1>
          <p className="text-muted-foreground">Manage your joint profile</p>
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!identity) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Wedding Identity</h1>
          <p className="text-muted-foreground">Create a joint profile for you and your partner</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Heart className="mx-auto h-12 w-12 text-pink-500" />
              <h3 className="text-lg font-semibold">No Wedding Identity Yet</h3>
              <p className="text-muted-foreground">
                Create a joint profile so both partners can collaborate on the same planning board.
              </p>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 text-left">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={createForm.control}
                      name="partnerOneName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partner 1 Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Partner 1" {...field} />
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
                            <Input placeholder="Partner 2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="WEDDING">Wedding</SelectItem>
                              <SelectItem value="ENGAGEMENT">Engagement</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
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
                          <FormLabel>Event Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-linear-to-r from-pink-500 to-purple-500" disabled={createIdentity.isPending}>
                    {createIdentity.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Heart className="h-4 w-4 mr-2" />
                    )}
                    Create Wedding Identity
                  </Button>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const partners = identity.partners ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Wedding Identity</h1>
          <p className="text-muted-foreground">Manage your joint profile</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Identity Card */}
      <Card className="border-pink-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
              {identity.displayName}
            </CardTitle>
            <CardDescription>
              Created {formatDateSafe(identity.createdAt) ?? 'Unknown date'}
            </CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
                <FormField
                  control={updateForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={updateForm.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="WEDDING">Wedding</SelectItem>
                            <SelectItem value="ENGAGEMENT">Engagement</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={updateForm.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateIdentity.isPending}>
                    {updateIdentity.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {identity.eventDate
                      ? formatDateSafe(identity.eventDate) ?? 'Date not set'
                      : 'Date not set'}
                  </span>
                </div>
                <div>
                  <Badge variant="secondary">{identity.eventType}</Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partners */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Partners
            </CardTitle>
            <CardDescription>People who can edit this planning board</CardDescription>
          </div>
          {!showInviteForm && partners.length < 2 && (
            <Button variant="outline" size="sm" onClick={() => setShowInviteForm(true)}>
              <Send className="h-4 w-4 mr-2" />
              Invite Partner
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {partners.map((partner, index) => (
            <div
              key={partner.id || index}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-linear-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                  {partner.name?.charAt(0) ?? '?'}
                </div>
                <div>
                  <p className="font-medium">{partner.name ?? 'Partner'}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {partner.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {partner.email}
                      </span>
                    )}
                    {partner.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {partner.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Badge
                variant={
                  partner.isOwner
                    ? 'default'
                    : partner.inviteStatus === 'ACCEPTED'
                    ? 'default'
                    : 'secondary'
                }
              >
                {partner.isOwner ? 'Owner' : (partner.inviteStatus?.toLowerCase() || 'pending')}
              </Badge>
            </div>
          ))}

          {showInviteForm && (
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Invite Your Partner</h4>
              <Form {...inviteForm}>
                <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4">
                  <FormField
                    control={inviteForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="partner@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={inviteForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+91 90000 00000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowInviteForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={invitePartner.isPending}>
                      {invitePartner.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send Invite
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
