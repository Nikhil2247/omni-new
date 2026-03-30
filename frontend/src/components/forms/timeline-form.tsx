"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface TimelineFormData {
  name: string
  eventDate: string
}

interface TimelineFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  timeline?: {
    id: string
    name: string
    date: string
  } | null
  onSubmit: (data: TimelineFormData & { id?: string }) => Promise<void>
  mode?: "create" | "edit"
}

export function TimelineForm({
  open,
  onOpenChange,
  eventId,
  timeline,
  onSubmit,
  mode = "create",
}: TimelineFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TimelineFormData>({
    defaultValues: {
      name: timeline?.name || "",
      eventDate: timeline?.date || "",
    },
  })

  useEffect(() => {
    form.reset({
      name: timeline?.name || "",
      eventDate: timeline?.date || "",
    })
  }, [timeline?.id, timeline?.name, timeline?.date, open, form])

  const handleSubmit = async (data: TimelineFormData) => {
    setIsSubmitting(true)
    try {
      const normalizedEventDate = data.eventDate
        ? new Date(data.eventDate).toISOString()
        : data.eventDate

      await onSubmit({
        ...data,
        eventDate: normalizedEventDate,
        ...(timeline?.id && { id: timeline.id }),
      })
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to submit timeline:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Timeline" : "Edit Timeline"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new timeline to organize your event schedule."
              : "Update your timeline details."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Timeline name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timeline Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Wedding Day Schedule"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventDate"
              rules={{ required: "Event date is required" }}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Event Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          field.onChange(date?.toISOString())
                        }}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {mode === "create" ? "Create Timeline" : "Update Timeline"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
