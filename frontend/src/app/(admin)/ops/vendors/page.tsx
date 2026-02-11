'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useOpsVendors } from '@/hooks/queries/use-ops'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  CheckCircle2,
  Clock,
  Search,
  Store,
  ShieldCheck,
  ShieldX,
  XCircle,
} from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-green-500/10 text-green-700 border-green-500/20' },
  PENDING_VERIFICATION: { label: 'Pending Verification', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
  SUSPENDED: { label: 'Suspended', color: 'bg-red-500/10 text-red-700 border-red-500/20' },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
}

export default function OpsVendorsPage() {
  const { data: vendors, isLoading, error } = useOpsVendors()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredVendors = vendors?.filter((vendor) => {
    const matchesSearch = !searchTerm ||
      vendor.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  const activeCount = vendors?.filter(v => v.status === 'ACTIVE').length || 0
  const pendingCount = vendors?.filter(v => v.status === 'PENDING_VERIFICATION').length || 0
  const verifiedCount = vendors?.filter(v => v.verifiedAt).length || 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">Manage vendor profiles and verifications.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Error Loading Vendors
            </CardTitle>
            <CardDescription>Failed to load vendors. Please try again.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Vendors</h1>
        <p className="text-muted-foreground">Manage vendor profiles and verifications.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Vendors</p>
                <p className="text-2xl font-bold">{vendors?.length || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Store className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Verification</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-purple-600">{verifiedCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vendors Grid */}
      {filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Building2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No vendors found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => {
            const status = statusConfig[vendor.status || ''] || { label: vendor.status || 'Unknown', color: 'bg-gray-500/10 text-gray-700' }

            return (
              <Link key={vendor.id} href={`/ops/vendors/${vendor.id}`}>
                <Card className="transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 hover:border-primary h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
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
                      <Badge variant="outline" className={status.color}>
                        {status.label.replace(/_/g, ' ')}
                      </Badge>
                      {vendor.verifiedAt ? (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ShieldX className="h-3 w-3" />
                          Not verified
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
