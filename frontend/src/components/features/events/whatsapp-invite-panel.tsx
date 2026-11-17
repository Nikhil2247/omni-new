'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  useSendWhatsAppInvite,
  useSendWhatsAppBulk,
  useWhatsAppSummary,
  useWhatsAppTemplates,
} from '@/hooks/queries/use-whatsapp'
import type { Guest } from '@/lib/api/types/guestlist.types'
import { Button } from '@/components/ui/button'
import { Ico, ICONS, Paper, SketchButton, Stamp } from '@/components/sketch'
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
    <Paper className="space-y-6 px-5 py-5">
      <div>
        <h2 className="font-display flex items-center gap-2 text-2xl font-semibold">
          <Ico d={ICONS.chat} className="h-7 w-7" />
          WhatsApp Invitations
        </h2>
        <p className="text-ink-soft mt-1 text-sm">Send invites directly to your guests via WhatsApp</p>
      </div>
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Paper className="px-4 py-3 text-center">
            <div className="font-display text-leaf-deep text-2xl font-semibold">{summary?.totalSent ?? 0}</div>
            <div className="sk-eyebrow mt-1">Total Sent</div>
          </Paper>
          <Paper alt className="px-4 py-3 text-center">
            <div className="font-display text-blue text-2xl font-semibold">{summary?.delivered ?? 0}</div>
            <div className="sk-eyebrow mt-1">Delivered</div>
          </Paper>
          <Paper className="px-4 py-3 text-center">
            <div className="font-display text-gold text-2xl font-semibold">{summary?.pending ?? pendingGuests.length}</div>
            <div className="sk-eyebrow mt-1">Pending RSVP</div>
          </Paper>
          <Paper alt className="px-4 py-3 text-center">
            <div className="font-display text-2xl font-semibold">{guestsWithPhone.length}</div>
            <div className="sk-eyebrow mt-1">With Phone</div>
          </Paper>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <SketchButton>Send Invites</SketchButton>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
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
                            <span className="sk-chip text-[10px]">{template.type}</span>
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
                  <p className="text-ink-soft text-xs">
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
                      <div className="p-4 text-center text-ink-soft">
                        No guests have phone numbers added
                      </div>
                    ) : (
                      <div className="divide-y">
                        {guestsWithPhone.map(guest => (
                          <label
                            key={guest.id}
                            className={cn(
                              'flex items-center justify-between p-3 cursor-pointer hover:bg-blue-wash',
                              selectedGuests.includes(guest.id) && 'bg-blue-wash'
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
                                <p className="text-sm text-ink-soft">
                                  {guest.phone}
                                </p>
                              </div>
                            </div>
                            <Stamp
                              tone={
                                guest.rsvpStatus === 'ATTENDING'
                                  ? 'ok'
                                  : guest.rsvpStatus === 'PENDING'
                                  ? 'wait'
                                  : 'late'
                              }
                            >
                              {guest.rsvpStatus.toLowerCase()}
                            </Stamp>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedGuests.length > 0 && !sendToAll && (
                    <p className="text-sm text-ink-soft">
                      {selectedGuests.length} guest(s) selected
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <SketchButton
                  onClick={handleSend}
                  disabled={
                    (selectedGuests.length === 0 && !sendToAll) ||
                    sendInvite.isPending ||
                    sendBulk.isPending
                  }
                >
                  {sendInvite.isPending || sendBulk.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>Send to {sendToAll ? guestsWithPhone.length : selectedGuests.length} guests</>
                  )}
                </SketchButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <SketchButton variant="line" onClick={() => toast.info('Reminder feature coming soon!')}>
            Send Reminders
          </SketchButton>
        </div>

        {/* Quick Send Links */}
        {guestsWithPhone.length > 0 && (
          <div className="space-y-2">
            <Label className="text-ink-soft text-sm">Quick Send (opens WhatsApp)</Label>
            <div className="flex flex-wrap gap-2">
              {guestsWithPhone.slice(0, 5).map(guest => (
                <a
                  key={guest.id}
                  href={generateWhatsAppLink(guest)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sk-chip hover:bg-blue-wash transition-colors"
                >
                  {guest.firstName}
                </a>
              ))}
              {guestsWithPhone.length > 5 && (
                <span className="sk-chip text-ink-soft">
                  +{guestsWithPhone.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Paper>
  )
}
