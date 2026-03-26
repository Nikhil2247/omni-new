'use client'

import { useState, useMemo } from 'react'
import { useGuestlist } from '@/hooks/queries/use-guestlist'
import { useSendEInvite, useBulkSendEInvite } from '@/hooks/queries/use-einvites'
import { einviteService } from '@/lib/api/services/einvite.service'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Search,
  Send,
  Users,
  User,
  MessageCircle,
  Copy,
  Check,
  Loader2,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Guest } from '@/lib/api/types/guestlist.types'
import type { EInviteChannel } from '@/lib/api/types/einvite.types'

interface SendToGuestsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  einviteId: string
  eventId: string
  shareCode: string
  eventName?: string | null
}

export function SendToGuestsDialog({
  open,
  onOpenChange,
  einviteId,
  eventId,
  shareCode,
  eventName,
}: SendToGuestsDialogProps) {
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [sendMode, setSendMode] = useState<'individual' | 'bulk'>('individual')
  const [copied, setCopied] = useState(false)

  // Fetch guestlist
  const { data: guestlistData, isLoading: guestlistLoading } = useGuestlist(eventId)
  const guests = guestlistData?.guests || []

  // Mutations
  const sendToGuests = useSendEInvite(einviteId)
  const bulkSendToGuests = useBulkSendEInvite(einviteId)

  // Filter guests by search
  const filteredGuests = useMemo(() => {
    if (!searchQuery) return guests
    const query = searchQuery.toLowerCase()
    return guests.filter(
      (guest: Guest) =>
        guest.firstName.toLowerCase().includes(query) ||
        (guest.lastName?.toLowerCase().includes(query)) ||
        (guest.phone?.includes(query)) ||
        (guest.email?.toLowerCase().includes(query))
    )
  }, [guests, searchQuery])

  // Guests with phone numbers (for WhatsApp)
  const guestsWithPhone = useMemo(
    () => filteredGuests.filter((guest: Guest) => guest.phone),
    [filteredGuests]
  )

  // Toggle guest selection
  const toggleGuest = (guestId: string) => {
    setSelectedGuests((prev) =>
      prev.includes(guestId)
        ? prev.filter((id) => id !== guestId)
        : [...prev, guestId]
    )
  }

  // Select all guests with phone
  const selectAllWithPhone = () => {
    setSelectedGuests(guestsWithPhone.map((g: Guest) => g.id))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedGuests([])
  }

  // Copy share link
  const copyShareLink = () => {
    const shareUrl = einviteService.getShareUrl(shareCode)
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Share link copied!')
  }

  // Open WhatsApp with pre-filled message for a single guest
  const openWhatsAppForGuest = (guest: Guest) => {
    if (!guest.phone) {
      toast.error('Guest has no phone number')
      return
    }

    const shareUrl = einviteService.getShareUrl(shareCode)
    const message = customMessage
      ? `${customMessage}\n\nView your invitation: ${shareUrl}`
      : `Hi ${guest.firstName}! You're invited to ${eventName || 'our event'}! View your invitation here: ${shareUrl}`

    const phone = guest.phone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  // Send to selected guests (records in database)
  const handleSendToSelected = async () => {
    if (selectedGuests.length === 0) {
      toast.error('Please select at least one guest')
      return
    }

    try {
      await sendToGuests.mutateAsync({
        guestIds: selectedGuests,
        channel: 'WHATSAPP' as EInviteChannel,
        customMessage: customMessage || undefined,
      })
      toast.success(`Invitation marked as sent to ${selectedGuests.length} guests`)

      // Open WhatsApp for each selected guest
      selectedGuests.forEach((guestId) => {
        const guest = guests.find((g: Guest) => g.id === guestId)
        if (guest?.phone) {
          openWhatsAppForGuest(guest)
        }
      })

      setSelectedGuests([])
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to send invitations')
    }
  }

  // Bulk send to all guests
  const handleBulkSend = async () => {
    try {
      const result = await bulkSendToGuests.mutateAsync({
        channel: 'WHATSAPP' as EInviteChannel,
        customMessage: customMessage || undefined,
        excludeAlreadySent: true,
      })
      toast.success(`Sent to ${result.sent} guests, skipped ${result.skipped}`)
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to send invitations')
    }
  }

  const shareUrl = einviteService.getShareUrl(shareCode)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Send E-Invite to Guests</DialogTitle>
          <DialogDescription>
            Select guests to send the invitation via WhatsApp or copy the share link
          </DialogDescription>
        </DialogHeader>

        <Tabs value={sendMode} onValueChange={(v) => setSendMode(v as 'individual' | 'bulk')} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">
              <User className="h-4 w-4 mr-2" />
              Select Guests
            </TabsTrigger>
            <TabsTrigger value="bulk">
              <Users className="h-4 w-4 mr-2" />
              Send to All
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="flex-1 overflow-hidden flex flex-col space-y-4 mt-4">
            {/* Share Link */}
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copyShareLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <Label>Custom Message (Optional)</Label>
              <Textarea
                placeholder="Add a personal message to include with the invitation..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={2}
              />
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search guests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Selection Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedGuests.length} selected
                </Badge>
                {guestsWithPhone.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={selectAllWithPhone}>
                    Select all with phone ({guestsWithPhone.length})
                  </Button>
                )}
                {selectedGuests.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Guest List */}
            <ScrollArea className="flex-1 border rounded-lg">
              {guestlistLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredGuests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <Users className="h-8 w-8 mb-2" />
                  <p className="text-sm">No guests found</p>
                  <p className="text-xs">Add guests in the Guestlist tab first</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredGuests.map((guest: Guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedGuests.includes(guest.id)}
                        onCheckedChange={() => toggleGuest(guest.id)}
                        disabled={!guest.phone}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {guest.firstName} {guest.lastName}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {guest.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {guest.phone}
                            </span>
                          )}
                          {guest.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {guest.email}
                            </span>
                          )}
                        </div>
                      </div>
                      {guest.phone ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openWhatsAppForGuest(guest)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          No phone
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4 mt-4">
            {/* Share Link */}
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copyShareLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <Label>Custom Message (Optional)</Label>
              <Textarea
                placeholder="Add a personal message to include with the invitation..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Summary */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <h4 className="font-medium">Send Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Guests</p>
                  <p className="text-2xl font-bold">{guests.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">With Phone</p>
                  <p className="text-2xl font-bold">{guestsWithPhone.length}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Invitations will be marked as sent. Guests who have already received an invite will be skipped.
              </p>
            </div>

            {/* WhatsApp Broadcast Info */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">WhatsApp Sharing</p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    After clicking "Send to All", you can share the invitation link via WhatsApp manually or use WhatsApp's broadcast feature to send to multiple contacts at once.
                  </p>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-green-700 dark:text-green-400"
                    onClick={() => {
                      const whatsappUrl = einviteService.getWhatsAppShareUrl(shareCode, eventName || undefined)
                      window.open(whatsappUrl, '_blank')
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open WhatsApp to Share
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {sendMode === 'individual' ? (
            <Button
              onClick={handleSendToSelected}
              disabled={selectedGuests.length === 0 || sendToGuests.isPending}
            >
              {sendToGuests.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send to {selectedGuests.length} Guest{selectedGuests.length !== 1 ? 's' : ''}
            </Button>
          ) : (
            <Button
              onClick={handleBulkSend}
              disabled={guestsWithPhone.length === 0 || bulkSendToGuests.isPending}
            >
              {bulkSendToGuests.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send to All ({guestsWithPhone.length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
