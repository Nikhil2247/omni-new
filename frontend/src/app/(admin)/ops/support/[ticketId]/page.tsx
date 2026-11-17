import { OpsSupportList } from '@/components/features/ops'

export default function OpsSupportDetailPage({ params }: { params: { ticketId: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Support Ticket</h1>
      <p className="text-muted-foreground">Ticket ID: {params.ticketId}</p>
      <OpsSupportList />
    </div>
  )
}
