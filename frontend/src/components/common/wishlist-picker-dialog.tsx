'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Wishlist } from '@/lib/api/types/wishlist.types'

interface WishlistPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wishlists: Wishlist[]
  onConfirm: (selection: { wishlistId?: string; wishlistName?: string }) => Promise<void>
  isSaving?: boolean
}

export function WishlistPickerDialog({
  open,
  onOpenChange,
  wishlists,
  onConfirm,
  isSaving = false,
}: WishlistPickerDialogProps) {
  const [wishlistId, setWishlistId] = useState('')
  const [wishlistName, setWishlistName] = useState('')

  const hasWishlists = wishlists.length > 0
  const canSubmit = Boolean(wishlistName.trim() || wishlistId)

  useEffect(() => {
    if (!open) {
      setWishlistId('')
      setWishlistName('')
    }
  }, [open])

  const wishlistOptions = useMemo(
    () => wishlists.map((list) => ({ id: list.id, name: list.name })),
    [wishlists],
  )

  const handleConfirm = async () => {
    if (!canSubmit || isSaving) {
      return
    }

    await onConfirm({
      wishlistId: wishlistId || undefined,
      wishlistName: wishlistName.trim() || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to wishlist</DialogTitle>
          <DialogDescription>
            Choose an existing wishlist or create a new one.
          </DialogDescription>
        </DialogHeader>

        {hasWishlists && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Select wishlist</p>
            <Select value={wishlistId} onValueChange={setWishlistId}>
              <SelectTrigger>
                <SelectValue placeholder="Select wishlist" />
              </SelectTrigger>
              <SelectContent>
                {wishlistOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Or create a new wishlist</p>
          <Input
            placeholder="Eg. Reception decor ideas"
            value={wishlistName}
            onChange={(event) => setWishlistName(event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!canSubmit || isSaving}>
            {isSaving ? 'Saving...' : 'Save to wishlist'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
