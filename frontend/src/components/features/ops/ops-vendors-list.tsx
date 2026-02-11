'use client'

import Link from 'next/link'
import { useOpsVendors } from '@/hooks/queries/use-ops'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, CheckCircle2, Clock, XCircle } from 'lucide-react'

export function OpsVendorsList() {
  const { data, isLoading, error } = useOpsVendors()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Error Loading Vendors
          </CardTitle>
          <CardDescription>Failed to load vendors. Please try again.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!data?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-5 w-5" />
            No Vendors Found
          </CardTitle>
          <CardDescription>No vendor profiles available at the moment.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
      case 'INACTIVE':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20'
      default:
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map((vendor) => (
        <Link key={vendor.id} href={`/ops/vendors/${vendor.id}`}>
          <Card className="transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 hover:border-primary">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{vendor.businessName || 'Unnamed Vendor'}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      ID: {vendor.id.slice(0, 8)}...
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={getStatusColor(vendor.status || 'UNKNOWN')}>
                  {vendor.status || 'UNKNOWN'}
                </Badge>
                {vendor.verifiedAt ? (
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Not verified
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
