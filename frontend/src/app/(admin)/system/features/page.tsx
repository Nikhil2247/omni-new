'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Lock, Search } from 'lucide-react'
import {
  useBulkUpdateFeatureFlags,
  useFeatureFlags,
  useUpdateFeatureFlag,
} from '@/hooks/queries/use-admin'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog, PageHeader } from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { FeatureFlag, FeatureFlagCategory } from '@/lib/api/types/admin.types'

const CATEGORIES: { value: FeatureFlagCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'user', label: 'User' },
  { value: 'system', label: 'System' },
]

const CATEGORY_COLORS: Record<FeatureFlagCategory, string> = {
  marketing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  vendor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  user: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  system: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
}

interface CategorySectionProps {
  category: FeatureFlagCategory
  flags: FeatureFlag[]
  onToggle: (id: string, enabled: boolean) => void
  onBulkToggle: (ids: string[], enabled: boolean) => void
  isUpdating: boolean
  isBulkUpdating: boolean
}

function CategorySection({
  category,
  flags,
  onToggle,
  onBulkToggle,
  isUpdating,
  isBulkUpdating,
}: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false)

  const enabledCount = flags.filter((f) => f.enabled).length
  const flagIds = flags.map((f) => f.id)
  const allEnabled = enabledCount === flags.length
  const noneEnabled = enabledCount === 0

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <CardTitle className="text-base capitalize">{category}</CardTitle>
                <Badge variant="secondary" className="ml-2">
                  {enabledCount} / {flags.length} enabled
                </Badge>
              </button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkToggle(flagIds, true)}
                disabled={allEnabled || isBulkUpdating}
              >
                Enable All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDisableOpen(true)}
                disabled={noneEnabled || isBulkUpdating}
              >
                Disable All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="divide-y">
              {flags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{flag.name}</span>
                      {flag.isSystem && (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <Badge
                        variant="outline"
                        className={`shrink-0 border-0 ${CATEGORY_COLORS[flag.category]}`}
                      >
                        {flag.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{flag.key}</code>
                      {flag.description && <span className="ml-2">{flag.description}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-medium ${
                        flag.enabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                      }`}
                    >
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={(value) => onToggle(flag.id, value)}
                      disabled={isUpdating}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
      <ConfirmDialog
        open={confirmDisableOpen}
        onOpenChange={setConfirmDisableOpen}
        title={`Disable all ${category} features?`}
        description={`${flags.length} feature flag${flags.length !== 1 ? 's' : ''} will be turned off.`}
        confirmLabel="Disable all"
        loading={isBulkUpdating}
        onConfirm={() => onBulkToggle(flagIds, false)}
      />
    </Collapsible>
  )
}

export default function SystemFeaturesPage() {
  const { data, isLoading } = useFeatureFlags()
  const updateFlag = useUpdateFeatureFlag()
  const bulkUpdateFlags = useBulkUpdateFeatureFlags()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<FeatureFlagCategory | 'all'>('all')

  // Filter flags based on search and category
  const filteredFlags = useMemo(() => {
    if (!data || !Array.isArray(data)) return []

    return data.filter((flag) => {
      const matchesSearch =
        searchQuery === '' ||
        flag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (flag.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        flag.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const flagCategory = flag.category || 'system'
      const matchesCategory = activeCategory === 'all' || flagCategory === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [data, searchQuery, activeCategory])

  // Group flags by category for display
  const groupedFlags = useMemo(() => {
    const groups: Record<FeatureFlagCategory, FeatureFlag[]> = {
      marketing: [],
      vendor: [],
      user: [],
      system: [],
    }

    filteredFlags.forEach((flag) => {
      groups[flag.category].push(flag)
    })

    return groups
  }, [filteredFlags])

  // Get categories that have flags
  const nonEmptyCategories = Object.entries(groupedFlags)
    .filter(([, flags]) => flags.length > 0)
    .map(([category]) => category as FeatureFlagCategory)

  const handleToggle = (id: string, enabled: boolean) => {
    updateFlag.mutate({ id, enabled })
  }

  const handleBulkToggle = (ids: string[], enabled: boolean) => {
    bulkUpdateFlags.mutate({ ids, enabled })
  }

  return (
    <div className="space-y-3">
      <PageHeader title="System Features" />

      {/* Search and Category Filter */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by key or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-9"
          />
        </div>
        <Tabs
          value={activeCategory}
          onValueChange={(v) => setActiveCategory(v as FeatureFlagCategory | 'all')}
        >
          <TabsList>
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Feature Flags Display */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : filteredFlags.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">
              {searchQuery || activeCategory !== 'all'
                ? 'No feature flags match your filters.'
                : 'No feature flags configured.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {nonEmptyCategories.map((category) => (
            <CategorySection
              key={category}
              category={category}
              flags={groupedFlags[category]}
              onToggle={handleToggle}
              onBulkToggle={handleBulkToggle}
              isUpdating={updateFlag.isPending}
              isBulkUpdating={bulkUpdateFlags.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
