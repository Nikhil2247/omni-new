import { OpsSupportList } from '@/components/features/ops'

export default function OpsSupportDetailPage({ params }: { params: { ticketId: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Support Ticket</h1>
      <p className="text-muted-foreground">Ticket ID: {params.ticketId}</p>
      <OpsSupportList />
    </div>
  )
}
