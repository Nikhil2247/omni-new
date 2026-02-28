"use client";

import { useState, useCallback, Suspense, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { trackDashboard } from '@/lib/analytics/umami';
import { motion, useInView } from "framer-motion";
import Lenis from "lenis";
import { usePublicVendors, useFeaturedVendors } from "@/hooks/queries/use-public-vendors";
import { VendorCard } from "@/components/features/vendors/vendor-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { VendorSearchParams } from "@/lib/api/types/vendor.types";
import { Search, Users, ArrowRight, SlidersHorizontal } from "lucide-react";

// ─── Lenis Smooth Scroll ─────────────────────────────────────────────────────

function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);
}

// ─── Reusable Motion Wrappers ────────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const;

function FadeIn({
  children,
  delay = 0,
  className = "",
  y = 40,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated card wrapper - animates each item independently
function AnimatedCard({ children, index }: { children: React.ReactNode; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.05, 0.3), // Cap delay at 0.3s
        ease,
      }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
    >
      {children}
    </motion.div>
  );
}

// ─── Vendor Results Grid ─────────────────────────────────────────────────────

function VendorResults({
  query,
  categoryId,
  sortBy,
  sortOrder,
  onTotalChange,
}: {
  query?: string;
  categoryId?: string;
  sortBy?: VendorSearchParams["sortBy"];
  sortOrder?: VendorSearchParams["sortOrder"];
  onTotalChange: (total: number) => void;
}) {
  const [page, setPage] = useState(1);
  const [allVendors, setAllVendors] = useState<any[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const filters = useMemo(
    () => ({
      query,
      categoryId: categoryId || undefined,
      sortBy,
      sortOrder,
      page,
      limit: 24,
    }),
    [query, categoryId, sortBy, sortOrder, page]
  );

  const { data: vendorsData, isLoading: vendorsLoading, isFetching } = usePublicVendors(filters);
  const totalVendors = vendorsData?.meta?.total || 0;

  useEffect(() => {
    if (vendorsData?.meta?.total !== undefined) {
      onTotalChange(vendorsData.meta.total);
    }
  }, [vendorsData?.meta?.total, onTotalChange]);

  useEffect(() => {
    setPage(1);
    setAllVendors([]);
  }, [query, categoryId, sortBy, sortOrder]);

  useEffect(() => {
    if (vendorsData?.data) {
      if (page === 1) {
        setAllVendors(vendorsData.data);
      } else {
        // Deduplicate by ID to prevent duplicate keys
        setAllVendors((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newItems = vendorsData.data.filter((item) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [vendorsData, page, query, categoryId, sortBy, sortOrder]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !vendorsLoading && !isFetching) {
          const hasMore =
            vendorsData?.meta?.hasNextPage ?? allVendors.length < (vendorsData?.meta?.total || 0);
          if (hasMore) {
            setPage((prev) => prev + 1);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [vendorsLoading, isFetching, vendorsData?.meta, allVendors.length]);

  const displayVendors = allVendors.length ? allVendors : vendorsData?.data || [];

  if (vendorsLoading && page === 1) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Skeleton className="aspect-4/5 rounded-2xl" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (displayVendors.length === 0) {
    return (
      <FadeIn className="py-20 text-center">
        <div className="bg-muted/50 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <Users className="text-muted-foreground/60 h-9 w-9" />
        </div>
        <h3 className="mb-2 font-serif text-xl font-semibold">No vendors found</h3>
        <p className="text-muted-foreground mx-auto max-w-sm">
          Try adjusting your search or browse a different category.
        </p>
      </FadeIn>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayVendors.map((vendor, index) => (
          <AnimatedCard key={vendor.id} index={index % 24}>
            <VendorCard vendor={vendor} />
          </AnimatedCard>
        ))}
      </div>

      {(displayVendors.length < totalVendors || isFetching) && (
        <div ref={loadMoreRef} className="flex w-full justify-center py-12">
          {isFetching && (
            <div className="flex items-center gap-3">
              <div className="border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
              <span className="text-muted-foreground text-sm">Loading more...</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

type SortByValue = NonNullable<VendorSearchParams["sortBy"]>;
type SortOrderValue = NonNullable<VendorSearchParams["sortOrder"]>;

type CategoryOption = {
  id: string;
  name: string;
};

function VendorFilters({
  selectedCategoryId,
  setSelectedCategoryId,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  categoryOptions,
  activeFiltersCount,
  onApply,
  onClear,
  autoApply = false,
}: {
  selectedCategoryId: string;
  setSelectedCategoryId: (value: string) => void;
  sortBy: SortByValue;
  setSortBy: (value: SortByValue) => void;
  sortOrder: SortOrderValue;
  setSortOrder: (value: SortOrderValue) => void;
  categoryOptions: CategoryOption[];
  activeFiltersCount: number;
  onApply: () => void;
  onClear: () => void;
  autoApply?: boolean;
}) {
  // Auto-apply changes when used in desktop sidebar to update results immediately.
  useEffect(() => {
    if (!autoApply) return;
    const timer = setTimeout(() => onApply(), 300);
    return () => clearTimeout(timer);
  }, [selectedCategoryId, sortBy, sortOrder, autoApply, onApply]);

  return (
    <div className="h-full rounded-2xl border border-[#165EA6]/20 p-4 sm:p-5" style={{ background: 'linear-gradient(160deg, #165EA6/5 0%, rgba(22,94,166,0.06) 100%)', backgroundColor: 'rgba(22,94,166,0.05)' }}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold" style={{ color: '#165EA6' }}>Filters</h2>
        {activeFiltersCount > 0 && (
          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold">
            {activeFiltersCount} active
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Search moved to header */}

        <div>
          <label className="mb-2 block text-sm font-medium">Category</label>
          <Select
            value={selectedCategoryId || "all"}
            onValueChange={(value) => setSelectedCategoryId(value === "all" ? "" : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Sort by</label>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortByValue)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewCount">Most Viewed</SelectItem>
              <SelectItem value="leadCount">Most Leads</SelectItem>
              <SelectItem value="createdAt">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Order</label>
          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrderValue)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={onClear}>
          Clear
        </Button>
        <Button onClick={onApply}>Apply</Button>
      </div>
    </div>
  );
}

// ─── Page Content ────────────────────────────────────────────────────────────

function VendorsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Track page view on mount
  useEffect(() => {
    trackDashboard.sectionView('vendors', 'user')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const queryParam = searchParams.get("query") ?? "";
  const categoryParam = searchParams.get("categoryId") ?? "";
  const sortByParam = (searchParams.get("sortBy") as SortByValue | null) ?? "viewCount";
  const sortOrderParam = (searchParams.get("sortOrder") as SortOrderValue | null) ?? "desc";

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryParam);
  const [sortBy, setSortBy] = useState<SortByValue>(sortByParam);
  const [sortOrder, setSortOrder] = useState<SortOrderValue>(sortOrderParam);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [totalVendors, setTotalVendors] = useState(0);

  useSmoothScroll();

  const { data: featuredVendors } = useFeaturedVendors(60);

  const categoryOptions = useMemo(() => {
    if (!featuredVendors?.length) return [];

    const map = new Map<string, string>();
    featuredVendors.forEach((vendor) => {
      if (vendor.category?.id && vendor.category?.name) {
        map.set(vendor.category.id, vendor.category.name);
      }
    });

    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [featuredVendors]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (queryParam) count += 1;
    if (categoryParam) count += 1;
    if (sortByParam !== "viewCount") count += 1;
    if (sortOrderParam !== "desc") count += 1;
    return count;
  }, [queryParam, categoryParam, sortByParam, sortOrderParam]);

  useEffect(() => {
    setSearchQuery(queryParam);
    setSelectedCategoryId(categoryParam);
    setSortBy(sortByParam);
    setSortOrder(sortOrderParam);
  }, [queryParam, categoryParam, sortByParam, sortOrderParam]);

  const applyFilters = useCallback(() => {
    const normalizedQuery = searchQuery.trim();
    const params = new URLSearchParams();

    if (normalizedQuery) params.set("query", normalizedQuery);
    if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
    if (sortBy !== "viewCount") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);

    router.push(params.toString() ? `/vendors?${params.toString()}` : "/vendors");
    setMobileFiltersOpen(false);
  }, [searchQuery, selectedCategoryId, sortBy, sortOrder, router]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategoryId("");
    setSortBy("viewCount");
    setSortOrder("desc");
    router.push("/vendors");
    setMobileFiltersOpen(false);
  }, [router]);

  return (
    <main className="bg-background min-h-screen">
      {/* Compact Header — mirrors Discover page */}
      <section className="border-b bg-muted/20 py-3 lg:py-4">
        <div className="mx-auto max-w-8xl px-6">
          <FadeIn delay={0.05} className="max-w-6xl">
            <div className="relative flex items-center bg-background border border-border rounded-full shadow-sm p-1.5 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Search vendors, services..."
                className="h-9 border-0 bg-transparent px-3 text-sm shadow-none focus-visible:ring-0"
              />
              <Button onClick={applyFilters} className="h-9 w-9 shrink-0 rounded-full p-0" aria-label="Search">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <div className="mx-auto max-w-8xl px-6 py-8 lg:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:items-start">
          <aside className="hidden lg:block self-start sticky top-6">
            <div className="max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40 pr-1">
              <VendorFilters
                selectedCategoryId={selectedCategoryId}
                setSelectedCategoryId={setSelectedCategoryId}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                categoryOptions={categoryOptions}
                activeFiltersCount={activeFiltersCount}
                onApply={applyFilters}
                onClear={clearFilters}
                autoApply
              />
            </div>
          </aside>

          <section>
            <FadeIn className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Showing results</p>
                <h2 className="font-serif text-xl font-semibold sm:text-2xl">{totalVendors} vendors</h2>
              </div>
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <Button variant="outline" className="lg:hidden" onClick={() => setMobileFiltersOpen(true)}>
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                </Button>
                <SheetContent side="right" className="w-full max-w-sm p-0">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>Refine your vendor results</SheetDescription>
                  </SheetHeader>
                  <div className="px-4 pb-6">
                    <VendorFilters
                      selectedCategoryId={selectedCategoryId}
                      setSelectedCategoryId={setSelectedCategoryId}
                      sortBy={sortBy}
                      setSortBy={setSortBy}
                      sortOrder={sortOrder}
                      setSortOrder={setSortOrder}
                      categoryOptions={categoryOptions}
                      activeFiltersCount={activeFiltersCount}
                      onApply={applyFilters}
                      onClear={clearFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </FadeIn>

            <VendorResults
              key={`${queryParam}-${categoryParam}-${sortByParam}-${sortOrderParam}`}
              query={queryParam}
              categoryId={categoryParam}
              sortBy={sortByParam}
              sortOrder={sortOrderParam}
              onTotalChange={setTotalVendors}
            />
          </section>
        </div>
      </div>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-slate-900 via-indigo-950 to-purple-950 py-16 lg:py-20">
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-sky-500/10 blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-rose-500/10 blur-[100px]" />

        <FadeIn className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Are you a vendor?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/60">
            Join thousands of professionals on Omnicassion and grow your business.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-8 shadow-lg">
              <Link href="/business">
                Join as Professional
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/20 bg-white/5 px-8 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
            >
              <Link href="/business/about">Learn More</Link>
            </Button>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}

export default function VendorsPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
            <span className="text-muted-foreground text-sm">Loading vendors...</span>
          </div>
        </div>
      }
    >
      <VendorsPageContent />
    </Suspense>
  );
}
