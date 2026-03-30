"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TimelineItemFormData {
  title: string
  description?: string
  scheduledTime: string
  duration?: number
}

function normalizeScheduledTime(value: string): string {
  const raw = value.trim()
  if (!raw) return raw

  // Already in 24h HH:mm format
  if (/^([01]?\d|2[0-3]):([0-5]\d)$/.test(raw)) {
    return raw
  }

  // Convert h:mm AM/PM to HH:mm
  const amPmMatch = raw.match(/^(\d{1,2}):(\d{2})\s*([aApP][mM])$/)
  if (amPmMatch) {
    let hours = Number(amPmMatch[1])
    const minutes = amPmMatch[2]
    const period = amPmMatch[3].toLowerCase()

    if (period === 'pm' && hours < 12) hours += 12
    if (period === 'am' && hours === 12) hours = 0

    return `${String(hours).padStart(2, '0')}:${minutes}`
  }

  return raw
}

function toTimeInputValue(value?: string): string {
  if (!value) return ""
  return normalizeScheduledTime(value)
}

interface TimelineItemFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: {
    id: string
    title: string
    description?: string | null
    scheduledTime?: string
    duration?: number | null
  } | null
  onSubmit: (data: TimelineItemFormData & { id?: string }) => Promise<void>
  mode?: "create" | "edit"
}

export function TimelineItemForm({
  open,
  onOpenChange,
  item,
  onSubmit,
  mode = "create",
}: TimelineItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TimelineItemFormData>({
    defaultValues: {
      title: item?.title || "",
      description: item?.description || "",
      scheduledTime: toTimeInputValue(item?.scheduledTime),
      duration: item?.duration || undefined,
    },
  })

  useEffect(() => {
    form.reset({
      title: item?.title || "",
      description: item?.description || "",
      scheduledTime: toTimeInputValue(item?.scheduledTime),
      duration: item?.duration || undefined,
    })
  }, [item?.id, item?.title, item?.description, item?.scheduledTime, item?.duration, open, form])

  const handleSubmit = async (data: TimelineItemFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit({
        ...data,
        scheduledTime: normalizeScheduledTime(data.scheduledTime),
        ...(item?.id && { id: item.id }),
      })
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to submit timeline item:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-137.5">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Schedule Item" : "Edit Schedule Item"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new item to your event timeline."
              : "Update this schedule item."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: "Title is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Hair and Makeup"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add details about this activity..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledTime"
                rules={{ required: "Time is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                        <Input
                          type="time"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Pick a time from the selector
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ? String(field.value) : "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? undefined : Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No duration</SelectItem>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="45">45 min</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1 hour 30 min</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="180">3 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Optional preset duration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Add Item" : "Update Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
