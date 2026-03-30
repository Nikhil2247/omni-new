'use client'

import { useState, useMemo } from 'react'
import { useGuestlist } from '@/hooks/queries/use-guestlist'
import { useEInviteByEvent, useSendEInvite, useBulkSendEInvite } from '@/hooks/queries/use-einvites'
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
import { Card, CardContent } from '@/components/ui/card'
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
  Link2,
  FileText,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Guest } from '@/lib/api/types/guestlist.types'
import type { EInviteChannel } from '@/lib/api/types/einvite.types'

interface SendToGuestsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  einviteId?: string
  eventId: string
  shareCode?: string
  eventName?: string | null
}

// Frontend URL for links
const FRONTEND_URL = typeof window !== 'undefined'
  ? window.location.origin
  : process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://omnicassion.com'

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
  const [linkType, setLinkType] = useState<'combined' | 'einvite' | 'rsvp'>('combined')

  // Fetch guestlist
  const { data: guestlistData, isLoading: guestlistLoading } = useGuestlist(eventId)
  const guests = guestlistData?.guests || []

  // Fetch e-invite for this event
  const { data: eventEInvite } = useEInviteByEvent(eventId)

  // Get the effective e-invite
  const effectiveEInvite = eventEInvite || (einviteId && shareCode ? { id: einviteId, shareCode, eventName, isPublished: true } : null)
  const effectiveEInviteId = einviteId || effectiveEInvite?.id || ''

  // Mutations
  const sendToGuests = useSendEInvite(effectiveEInviteId)
  const bulkSendToGuests = useBulkSendEInvite(effectiveEInviteId)

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

  // Guests with phone numbers
  const guestsWithPhone = useMemo(
    () => filteredGuests.filter((guest: Guest) => guest.phone),
    [filteredGuests]
  )

  const toggleGuest = (guestId: string) => {
    setSelectedGuests((prev) =>
      prev.includes(guestId)
        ? prev.filter((id) => id !== guestId)
        : [...prev, guestId]
    )
  }

  const selectAllWithPhone = () => {
    setSelectedGuests(guestsWithPhone.map((g: Guest) => g.id))
  }

  const clearSelection = () => {
    setSelectedGuests([])
  }

  // Generate guest link based on link type
  const getGuestLink = (guest: Guest) => {
    const code = effectiveEInvite?.shareCode || shareCode
    const rsvpToken = guest.rsvpToken

    if (linkType === 'combined' && code && rsvpToken) {
      return `${FRONTEND_URL}/einvite/${code}?rsvp=${rsvpToken}`
    } else if (linkType === 'einvite' && code) {
      return `${FRONTEND_URL}/einvite/${code}`
    } else if (linkType === 'rsvp' && rsvpToken) {
      return `${FRONTEND_URL}/rsvp/${rsvpToken}`
    }
    return code ? `${FRONTEND_URL}/einvite/${code}` : ''
  }

  // Get the share link - for combined type, show example with {rsvp_token} placeholder
  const getShareLink = () => {
    const code = effectiveEInvite?.shareCode || shareCode
    if (!code) return ''

    if (linkType === 'combined') {
      return `${FRONTEND_URL}/einvite/${code}?rsvp={token}`
    } else if (linkType === 'rsvp') {
      return `${FRONTEND_URL}/rsvp/{token}`
    }
    return `${FRONTEND_URL}/einvite/${code}`
  }

  // Get a specific guest's link for copying
  const getGuestShareLink = (guest: Guest) => {
    return getGuestLink(guest)
  }

  const copyShareLink = () => {
    const shareUrl = getShareLink()
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Share link copied!')
    }
  }

  const openWhatsAppForGuest = (guest: Guest) => {
    if (!guest.phone) {
      toast.error('Guest has no phone number')
      return
    }

    const guestLink = getGuestLink(guest)
    const displayName = eventName || effectiveEInvite?.eventName || 'our event'

    let message = ''
    if (customMessage) {
      message = `${customMessage}\n\nView your invitation${guest.rsvpToken && linkType !== 'einvite' ? ' and RSVP' : ''}: ${guestLink}`
    } else {
      message = `Hi ${guest.firstName}! You're invited to ${displayName}! View your invitation${guest.rsvpToken && linkType !== 'einvite' ? ' and RSVP' : ''} here: ${guestLink}`
    }

    const phone = guest.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleSendToSelected = async () => {
    if (selectedGuests.length === 0) {
      toast.error('Please select at least one guest')
      return
    }

    if (!effectiveEInviteId) {
      toast.error('Please create and publish an e-invite first')
      return
    }

    try {
      await sendToGuests.mutateAsync({
        guestIds: selectedGuests,
        channel: 'WHATSAPP' as EInviteChannel,
        customMessage: customMessage || undefined,
      })
      toast.success(`Invitation marked as sent to ${selectedGuests.length} guests`)

      selectedGuests.forEach((guestId) => {
        const guest = guests.find((g: Guest) => g.id === guestId)
        if (guest?.phone) {
          openWhatsAppForGuest(guest)
        }
      })

      setSelectedGuests([])
      onOpenChange(false)
    } catch {
      toast.error('Failed to send invitations')
    }
  }

  const handleBulkSend = async () => {
    if (!effectiveEInviteId) {
      toast.error('Please create and publish an e-invite first')
      return
    }

    try {
      const result = await bulkSendToGuests.mutateAsync({
        channel: 'WHATSAPP' as EInviteChannel,
        customMessage: customMessage || undefined,
        excludeAlreadySent: true,
      })
      toast.success(`Sent to ${result.sent} guests, skipped ${result.skipped}`)
      onOpenChange(false)
    } catch {
      toast.error('Failed to send invitations')
    }
  }

  const shareUrl = getShareLink()
  const hasEInvite = !!(effectiveEInvite?.isPublished)

  // Copy individual guest link
  const copyGuestLink = (guest: Guest) => {
    const link = getGuestLink(guest)
    if (link) {
      navigator.clipboard.writeText(link)
      toast.success(`Link copied for ${guest.firstName}!`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Send E-Invite to Guests</DialogTitle>
          <DialogDescription>
            Select guests to send the invitation via WhatsApp or copy their personalized link
          </DialogDescription>
        </DialogHeader>

        <Tabs value={sendMode} onValueChange={(v) => setSendMode(v as 'individual' | 'bulk')} className="flex-1 flex flex-col min-h-0 px-6">
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

          <TabsContent value="individual" className="flex-1 flex flex-col min-h-0 mt-4 data-[state=inactive]:hidden overflow-hidden">
            {/* Fixed top section */}
            <div className="space-y-3 shrink-0">
              {/* E-Invite Status */}
              {effectiveEInvite ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium flex-1 truncate">
                    {effectiveEInvite.eventName || eventName || 'E-Invite'}
                  </span>
                  <Badge variant={effectiveEInvite.isPublished ? 'default' : 'secondary'} className="text-[10px]">
                    {effectiveEInvite.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">No e-invite created yet. Create one first.</span>
                </div>
              )}

              {/* Link Type Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs">Link Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={linkType === 'combined' ? 'default' : 'outline'}
                    onClick={() => setLinkType('combined')}
                    className="flex-1 h-8 text-xs gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    E-Invite + RSVP
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={linkType === 'einvite' ? 'default' : 'outline'}
                    onClick={() => setLinkType('einvite')}
                    className="flex-1 h-8 text-xs gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    E-Invite Only
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={linkType === 'rsvp' ? 'default' : 'outline'}
                    onClick={() => setLinkType('rsvp')}
                    className="flex-1 h-8 text-xs gap-1"
                  >
                    <Link2 className="h-3 w-3" />
                    RSVP Only
                  </Button>
                </div>
                {linkType === 'combined' && (
                  <p className="text-[10px] text-muted-foreground">
                    Each guest gets a unique link with their RSVP token
                  </p>
                )}
              </div>

              {/* Custom Message */}
              <div className="space-y-1.5">
                <Label className="text-xs">Custom Message (Optional)</Label>
                <Textarea
                  placeholder="Add a personal message..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search guests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              {/* Selection Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {selectedGuests.length} selected
                  </Badge>
                  {guestsWithPhone.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={selectAllWithPhone} className="h-7 text-xs">
                      Select all ({guestsWithPhone.length})
                    </Button>
                  )}
                  {selectedGuests.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 text-xs">
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Scrollable Guest List */}
            <div className="flex-1 min-h-0 mt-3 border rounded-lg overflow-hidden">
              <ScrollArea className="h-full max-h-[250px]">
                {guestlistLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredGuests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
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
                          <p className="font-medium text-sm truncate">
                            {guest.firstName} {guest.lastName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {guest.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {guest.phone}
                              </span>
                            )}
                            {guest.rsvpToken && linkType !== 'einvite' && (
                              <Badge variant="outline" className="text-[9px] gap-0.5 h-4">
                                <Link2 className="h-2.5 w-2.5" />
                                RSVP
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Copy link button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyGuestLink(guest)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Copy link"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          {guest.phone ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openWhatsAppForGuest(guest)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 text-xs"
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              No phone
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="flex-1 overflow-auto mt-4 space-y-4 data-[state=inactive]:hidden">
            {/* E-Invite Status */}
            {effectiveEInvite ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium flex-1 truncate">
                  {effectiveEInvite.eventName || eventName || 'E-Invite'}
                </span>
                <Badge variant={effectiveEInvite.isPublished ? 'default' : 'secondary'}>
                  {effectiveEInvite.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400">
                <FileText className="h-4 w-4" />
                <span className="text-sm">No e-invite created yet. Create one first.</span>
              </div>
            )}

            {/* Generic Share Link */}
            {shareUrl && linkType === 'einvite' && (
              <div className="space-y-2">
                <Label>Share Link (Generic)</Label>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={copyShareLink}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Custom Message */}
            <div className="space-y-2">
              <Label>Custom Message (Optional)</Label>
              <Textarea
                placeholder="Add a personal message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Summary */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4 space-y-3">
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
                  Guests who already received an invite will be skipped.
                </p>
              </CardContent>
            </Card>

            {/* WhatsApp Info */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">WhatsApp Sharing</p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    Use "Select Guests" tab to send personalized links with RSVP.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 pb-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {sendMode === 'individual' ? (
            <Button
              onClick={handleSendToSelected}
              disabled={selectedGuests.length === 0 || sendToGuests.isPending || !hasEInvite}
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
              disabled={guestsWithPhone.length === 0 || bulkSendToGuests.isPending || !hasEInvite}
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
