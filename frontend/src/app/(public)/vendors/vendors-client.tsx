"use client";

import { useState, useCallback, Suspense, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { trackDashboard } from "@/lib/analytics/umami";
import { motion, useInView } from "framer-motion";
import Lenis from "lenis";
import { usePublicVendors, useFeaturedVendors } from "@/hooks/queries/use-public-vendors";
import { VendorCard } from "@/components/features/vendors/vendor-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/common/page-loader";
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
import { BannerAdsCarousel } from "@/components/ads";
import { Brush, Eyebrow, Ico, ICONS, Paper, SketchButton, Vine, skPaper } from "@/components/sketch";

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
      className="sk-tilt-host min-w-0"
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
  cityId,
  sortBy,
  sortOrder,
  onTotalChange,
}: {
  query?: string;
  categoryId?: string;
  cityId?: string;
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
      cityId: cityId || undefined,
      sortBy,
      sortOrder,
      page,
      limit: 24,
    }),
    [query, categoryId, cityId, sortBy, sortOrder, page]
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
  }, [query, categoryId, cityId, sortBy, sortOrder]);

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
  }, [vendorsData, page, query, categoryId, cityId, sortBy, sortOrder]);

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
    return <PageLoader label="Loading vendors" />;
  }

  if (displayVendors.length === 0) {
    return (
      <FadeIn className="py-16">
        <Paper className="mx-auto max-w-md px-6 py-10 text-center">
          <Ico d={ICONS.search} className="mx-auto mb-2 !size-[70px]" />
          <h3 className="font-display mb-2 text-2xl font-semibold">No vendors found</h3>
          <p className="text-ink-soft mx-auto max-w-sm">
            Try adjusting your search, a different city or another category.
          </p>
        </Paper>
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
    <div className="sk-paper sk-paper--alt h-full p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Filters</h2>
        {activeFiltersCount > 0 && (
          <span className="sk-stamp">{activeFiltersCount} active</span>
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
          <Select
            value={sortOrder}
            onValueChange={(value) => setSortOrder(value as SortOrderValue)}
          >
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
        <SketchButton variant="line" size="sm" onClick={onClear}>
          Clear
        </SketchButton>
        <SketchButton size="sm" onClick={onApply}>
          Apply
        </SketchButton>
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
    trackDashboard.sectionView("vendors", "user");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const queryParam = searchParams.get("query") ?? "";
  const categoryParam = searchParams.get("categoryId") ?? "";
  const sortByParam = (searchParams.get("sortBy") as SortByValue | null) ?? "viewCount";
  const sortOrderParam = (searchParams.get("sortOrder") as SortOrderValue | null) ?? "desc";
  // Passed from the home page quick planner
  const cityIdParam = searchParams.get("cityId") ?? "";
  const cityNameParam = searchParams.get("cityName") ?? "";
  const eventParam = searchParams.get("event") ?? "";
  const dateParam = searchParams.get("date") ?? "";

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
      // Use slug as the id since the backend supports slug-based filtering
      if (vendor.category?.slug && vendor.category?.name) {
        map.set(vendor.category.slug, vendor.category.name);
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
    if (cityIdParam) {
      params.set("cityId", cityIdParam);
      if (cityNameParam) params.set("cityName", cityNameParam);
    }
    if (eventParam) params.set("event", eventParam);
    if (dateParam) params.set("date", dateParam);

    router.push(params.toString() ? `/vendors?${params.toString()}` : "/vendors");
    setMobileFiltersOpen(false);
  }, [searchQuery, selectedCategoryId, sortBy, sortOrder, cityIdParam, cityNameParam, eventParam, dateParam, router]);

  // Drop only the planner choices (city, event, date) and keep the rest of the search
  const clearPlan = useCallback(() => {
    const params = new URLSearchParams();
    if (queryParam) params.set("query", queryParam);
    if (categoryParam) params.set("categoryId", categoryParam);
    if (sortByParam !== "viewCount") params.set("sortBy", sortByParam);
    if (sortOrderParam !== "desc") params.set("sortOrder", sortOrderParam);
    router.push(params.toString() ? `/vendors?${params.toString()}` : "/vendors");
  }, [queryParam, categoryParam, sortByParam, sortOrderParam, router]);

  const planDate = useMemo(() => {
    if (!dateParam) return "";
    const d = new Date(`${dateParam}T00:00:00`);
    return Number.isNaN(d.getTime()) ? dateParam : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }, [dateParam]);
  const hasPlan = Boolean(cityIdParam || eventParam || dateParam);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategoryId("");
    setSortBy("viewCount");
    setSortOrder("desc");
    router.push("/vendors");
    setMobileFiltersOpen(false);
  }, [router]);

  return (
    <main className="min-h-screen">
      <section className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-2 md:pt-7">
        <Eyebrow>Vendors</Eyebrow>
        <h1 className="font-display mt-2.5 max-w-[20ch] text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.05] font-semibold tracking-tight text-balance">
          Find the people who make the <Brush>day</Brush>.
        </h1>
        <p className="text-ink-soft mt-3 max-w-xl">
          Search by name or service, narrow by category, and save favourites to a wishlist.
        </p>
        <div className="sk-pill mt-6">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="Search vendors, services..."
            aria-label="Search vendors"
          />
          <button type="button" onClick={applyFilters} aria-label="Search">
            <Search className="h-[18px] w-[18px]" />
          </button>
        </div>
        {hasPlan ? (
          <div className="border-blue-wash bg-blue-wash/25 mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[18px_240px_20px_220px/230px_18px_250px_16px] border-2 border-dashed px-3.5 py-2.5 text-[0.95rem]">
            <span>
              Planning {eventParam ? <>a <b>{eventParam}</b></> : "an event"}
              {cityNameParam ? <> in <b>{cityNameParam}</b></> : null}
              {planDate ? <> on <b>{planDate}</b></> : null}
            </span>
            <SketchButton asChild variant="ghost" size="sm">
              <Link href="/">Change</Link>
            </SketchButton>
            <SketchButton variant="ghost" size="sm" onClick={clearPlan}>
              Clear
            </SketchButton>
            <small className="text-ink-soft">Vendors confirm availability when you request a quote.</small>
          </div>
        ) : null}
      </section>

      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 lg:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-8">
          <aside className="sticky top-6 hidden self-start lg:block">
            <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40 max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain pr-1 space-y-6">
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
              {/* Sponsored Ads in Sidebar */}
              <BannerAdsCarousel placement="search" limit={2} variant="compact" />
            </div>
          </aside>

          <section>
            <FadeIn className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Showing results</p>
                <h2 className="font-serif text-xl font-semibold sm:text-2xl">
                  {totalVendors} vendors
                </h2>
              </div>
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <Button
                  variant="outline"
                  className="lg:hidden"
                  onClick={() => setMobileFiltersOpen(true)}
                >
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
              key={`${queryParam}-${categoryParam}-${cityIdParam}-${sortByParam}-${sortOrderParam}`}
              query={queryParam}
              categoryId={categoryParam}
              cityId={cityIdParam}
              sortBy={sortByParam}
              sortOrder={sortOrderParam}
              onTotalChange={setTotalVendors}
            />
          </section>
        </div>
      </div>

      {/* CTA Section */}
      <section className="mx-auto w-full max-w-[1440px] px-4 pt-4 pb-12">
        <div className={`${skPaper({ tape: true })} px-6 py-14 text-center`}>
          <Vine d="M0 190C60 170 110 130 150 80C180 40 230 20 290 12" seed={31} n={11} s={1.05} className="pointer-events-none absolute -bottom-6 -left-10 w-[260px] max-[700px]:w-32" />
          <Vine d="M0 190C60 170 110 130 150 80C180 40 230 20 290 12" seed={41} n={11} s={1.05} className="pointer-events-none absolute -right-10 -bottom-6 w-[260px] -scale-x-100 max-[700px]:w-32" />
          <FadeIn className="relative z-10 mx-auto max-w-3xl">
            <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] leading-[1.05] font-semibold text-balance">Are you a vendor?</h2>
            <p className="text-ink-soft mx-auto mt-3 max-w-xl">
              Join thousands of professionals on Omnicassion and grow your business.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
              <SketchButton asChild>
                <Link href="/register/vendor">
                  Join as Professional
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </SketchButton>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}

/**
 * `shell` is server-rendered HTML (heading, intro and the first vendors). It is what the server sends and what search
 * engines read, while this client component (which needs the URL's search params) takes over in the browser.
 */
export default function VendorsPage({ shell }: { shell?: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        shell ?? (
          <div className="bg-background flex min-h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
              <span className="text-muted-foreground text-sm">Loading vendors...</span>
            </div>
          </div>
        )
      }
    >
      <VendorsPageContent />
    </Suspense>
  );
}
