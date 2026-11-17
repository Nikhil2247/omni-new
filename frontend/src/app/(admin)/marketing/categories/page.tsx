'use client'

import { useMarketingCategories } from '@/hooks/queries/use-marketing'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function MarketingCategoriesPage() {
  const { data, isLoading } = useMarketingCategories()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Categories</h1>
        <p className="text-muted-foreground">Marketing taxonomy and content grouping.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category list</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.slug || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? 'default' : 'secondary'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No categories available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
