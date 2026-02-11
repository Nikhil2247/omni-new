import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16">
      <section className="space-y-4">
        <Badge variant="secondary">About Omnicassion</Badge>
        <h1 className="text-4xl font-semibold">A visual-first planning platform for unforgettable events.</h1>
        <p className="text-lg text-muted-foreground">
          Omnicassion unifies inspiration, vendor discovery, and planning workflows into one elegant workspace. We help
          teams and couples turn ideas into perfectly orchestrated experiences with a modern, data-informed toolkit.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: 'Discover with confidence',
            description: 'Curated vendor portfolios, transparent pricing, and verified reviews in one place.',
          },
          {
            title: 'Plan collaboratively',
            description: 'Shared checklists, guestlists, and timelines keep every stakeholder aligned.',
          },
          {
            title: 'Execute with clarity',
            description: 'Operations-grade workflows for vendor agreements, tasks, and day-of coordination.',
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{item.description}</CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-2xl border bg-muted/40 p-8">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold">Built for every role in the celebration.</h2>
            <p className="text-muted-foreground">
              From couples to vendors and operations teams, Omnicassion brings the entire ecosystem together. Our
              architecture scales with your needs while staying simple to use.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/vendors">Explore vendors</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
