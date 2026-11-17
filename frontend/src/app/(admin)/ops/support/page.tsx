import { OpsSupportList } from '@/components/features/ops'

export default function OpsSupportPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Support Tickets</h1>
        <p className="text-muted-foreground">Active support tickets from operations.</p>
      </div>
      <OpsSupportList />
    </div>
  )
}
