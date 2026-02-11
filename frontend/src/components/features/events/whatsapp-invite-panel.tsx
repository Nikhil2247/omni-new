'use client'

import { useState } from 'react'
import { MessageCircle, Send, Users, CheckCircle, Clock, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import {
  useSendWhatsAppInvite,
  useSendWhatsAppBulk,
  useWhatsAppSummary,
  useWhatsAppTemplates,
} from '@/hooks/queries/use-whatsapp'
import type { Guest } from '@/lib/api/types/guestlist.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface WhatsAppInvitePanelProps {
  guestlistId: string
  guests: Guest[]
}

// Demo templates (in production, these come from the API)
const DEMO_TEMPLATES = [
  {
    id: '1',
    name: 'Wedding Invitation',
    type: 'INVITE' as const,
    content: 'Dear {guestName}, you are cordially invited to celebrate the wedding of {coupleName} on {eventDate}. We would be honored by your presence!',
    variables: ['guestName', 'coupleName', 'eventDate'],
  },
  {
    id: '2',
    name: 'RSVP Reminder',
    type: 'REMINDER' as const,
    content: 'Hi {guestName}, friendly reminder to RSVP for {coupleName}\'s wedding on {eventDate}. Please let us know if you can make it!',
    variables: ['guestName', 'coupleName', 'eventDate'],
  },
  {
    id: '3',
    name: 'Thank You',
    type: 'THANK_YOU' as const,
    content: 'Dear {guestName}, thank you so much for being part of our special day. Your presence made it even more memorable!',
    variables: ['guestName'],
  },
]

export function WhatsAppInvitePanel({ guestlistId, guests }: WhatsAppInvitePanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [customMessage, setCustomMessage] = useState('')
  const [sendToAll, setSendToAll] = useState(false)

  const { data: summary, isLoading: summaryLoading } = useWhatsAppSummary(guestlistId)
  const { data: apiTemplates } = useWhatsAppTemplates()
  const sendInvite = useSendWhatsAppInvite(guestlistId)
  const sendBulk = useSendWhatsAppBulk(guestlistId)

  const templates = apiTemplates?.length ? apiTemplates : DEMO_TEMPLATES
  const guestsWithPhone = guests.filter(g => g.phone)
  const pendingGuests = guests.filter(g => g.phone && g.rsvpStatus === 'PENDING')

  const handleSelectAll = (checked: boolean) => {
    setSendToAll(checked)
    if (checked) {
      setSelectedGuests(guestsWithPhone.map(g => g.id))
    } else {
      setSelectedGuests([])
    }
  }

  const handleGuestToggle = (guestId: string) => {
    setSelectedGuests(prev =>
      prev.includes(guestId)
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    )
  }

  const handleSend = async () => {
    if (selectedGuests.length === 0 && !sendToAll) {
      toast.error('Please select at least one guest')
      return
    }

    try {
      if (sendToAll) {
        await sendBulk.mutateAsync({
          guestlistId,
          filter: { hasPhone: true },
          templateId: selectedTemplate || undefined,
          customMessage: customMessage || undefined,
        })
      } else {
        await sendInvite.mutateAsync({
          guestIds: selectedGuests,
          templateId: selectedTemplate || undefined,
          customMessage: customMessage || undefined,
        })
      }

      toast.success('WhatsApp invitations sent successfully!')
      setIsDialogOpen(false)
      setSelectedGuests([])
      setCustomMessage('')
      setSendToAll(false)
    } catch {
      toast.error('Failed to send invitations. Please try again.')
    }
  }

  const generateWhatsAppLink = (guest: Guest) => {
    const phone = guest.phone?.replace(/\D/g, '')
    const message = encodeURIComponent(
      customMessage || `Hi ${guest.firstName}, you're invited to our celebration!`
    )
    return `https://wa.me/${phone}?text=${message}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-600" />
          WhatsApp Invitations
        </CardTitle>
        <CardDescription>
          Send invites directly to your guests via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {summary?.totalSent ?? 0}
            </div>
            <div className="text-xs text-green-700">Total Sent</div>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {summary?.delivered ?? 0}
            </div>
            <div className="text-xs text-blue-700">Delivered</div>
          </div>
          <div className="rounded-lg bg-yellow-50 p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {summary?.pending ?? pendingGuests.length}
            </div>
            <div className="text-xs text-yellow-700">Pending RSVP</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {guestsWithPhone.length}
            </div>
            <div className="text-xs text-gray-700">With Phone</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Send className="mr-2 h-4 w-4" />
                Send Invites
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  Send WhatsApp Invitations
                </DialogTitle>
                <DialogDescription>
                  Select guests and choose a message template to send invitations
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Template Selection */}
                <div className="space-y-2">
                  <Label>Message Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {template.type}
                            </Badge>
                            {template.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Message */}
                <div className="space-y-2">
                  <Label>Custom Message (Optional)</Label>
                  <Textarea
                    placeholder="Add a personalized message..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {'{guestName}'} to personalize the message
                  </p>
                </div>

                {/* Guest Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Select Recipients</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="selectAll"
                        checked={sendToAll}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      />
                      <label htmlFor="selectAll" className="text-sm cursor-pointer">
                        Send to all guests with phone ({guestsWithPhone.length})
                      </label>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    {guestsWithPhone.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No guests have phone numbers added
                      </div>
                    ) : (
                      <div className="divide-y">
                        {guestsWithPhone.map(guest => (
                          <label
                            key={guest.id}
                            className={cn(
                              'flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50',
                              selectedGuests.includes(guest.id) && 'bg-green-50'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedGuests.includes(guest.id)}
                                onCheckedChange={() => handleGuestToggle(guest.id)}
                              />
                              <div>
                                <p className="font-medium">
                                  {guest.firstName} {guest.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {guest.phone}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                guest.rsvpStatus === 'ATTENDING'
                                  ? 'default'
                                  : guest.rsvpStatus === 'PENDING'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {guest.rsvpStatus.toLowerCase()}
                            </Badge>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedGuests.length > 0 && !sendToAll && (
                    <p className="text-sm text-muted-foreground">
                      {selectedGuests.length} guest(s) selected
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={
                    (selectedGuests.length === 0 && !sendToAll) ||
                    sendInvite.isPending ||
                    sendBulk.isPending
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  {sendInvite.isPending || sendBulk.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send to {sendToAll ? guestsWithPhone.length : selectedGuests.length} guests
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => toast.info('Reminder feature coming soon!')}>
            <Clock className="mr-2 h-4 w-4" />
            Send Reminders
          </Button>
        </div>

        {/* Quick Send Links */}
        {guestsWithPhone.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Quick Send (opens WhatsApp)</Label>
            <div className="flex flex-wrap gap-2">
              {guestsWithPhone.slice(0, 5).map(guest => (
                <a
                  key={guest.id}
                  href={generateWhatsAppLink(guest)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm hover:bg-green-200 transition-colors"
                >
                  <MessageCircle className="h-3 w-3" />
                  {guest.firstName}
                </a>
              ))}
              {guestsWithPhone.length > 5 && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm">
                  +{guestsWithPhone.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
