"use client";

import { useState, useCallback, Suspense, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, useInView, type Variants, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import { usePublicVendors, useFeaturedVendors } from "@/hooks/queries/use-public-vendors";
import { VendorCard } from "@/components/features/vendors/vendor-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, ArrowRight } from "lucide-react";

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
  onTotalChange,
}: {
  query?: string;
  onTotalChange: (total: number) => void;
}) {
  const [page, setPage] = useState(1);
  const [allVendors, setAllVendors] = useState<any[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const filters = useMemo(
    () => ({
      query,
      page,
      limit: 24,
    }),
    [query, page]
  );

  const { data: vendorsData, isLoading: vendorsLoading, isFetching } = usePublicVendors(filters);
  const totalVendors = vendorsData?.meta?.total || 0;

  useEffect(() => {
    if (vendorsData?.meta?.total !== undefined) {
      onTotalChange(vendorsData.meta.total);
    }
  }, [vendorsData?.meta?.total, onTotalChange]);

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
  }, [vendorsData, page]);

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

// ─── Page Content ────────────────────────────────────────────────────────────

function VendorsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("query") ?? "";
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [totalVendors, setTotalVendors] = useState(0);

  useSmoothScroll();

  const { data: featuredVendors, isLoading: featuredLoading } = useFeaturedVendors(8);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  const handleSearch = useCallback(() => {
    const normalizedQuery = searchQuery.trim();
    const params = new URLSearchParams();
    if (normalizedQuery) params.set("query", normalizedQuery);
    router.push(params.toString() ? `/vendors?${params.toString()}` : "/vendors");
  }, [searchQuery, router]);

  const showFeatured = !queryParam && featuredVendors && featuredVendors.length > 0;

  return (
    <main className="bg-background min-h-screen">
      {/* Compact Search Header */}
      <section className="bg-muted/20 border-b py-6 lg:py-8">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn className="mb-4 text-left">
            <h1 className="font-serif text-2xl font-bold sm:text-3xl">Find your perfect team</h1>
          </FadeIn>

          {/* Search Bar */}
          <FadeIn delay={0.05} className="max-w-xl">
            <div className="bg-background border-border focus-within:ring-primary/20 focus-within:border-primary/30 relative flex items-center rounded-full border p-1.5 shadow-sm transition-shadow focus-within:ring-2 hover:shadow-md">
              <Search className="text-muted-foreground ml-3 h-4 w-4 shrink-0" />
              <Input
                type="text"
                placeholder="Search vendors, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-9 border-0 bg-transparent px-3 text-sm shadow-none focus-visible:ring-0"
              />
              <Button onClick={handleSearch} className="h-9 shrink-0 rounded-full px-4 text-sm">
                Search
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        {/* Featured Section */}
        {showFeatured && (
          <section className="mb-16">
            <FadeIn className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-primary mb-1 text-sm font-semibold tracking-widest uppercase">
                  Featured
                </p>
                <h2 className="font-serif text-2xl font-bold sm:text-3xl">
                  Top-rated professionals
                </h2>
              </div>
              <Button variant="ghost" className="group hidden sm:flex" asChild>
                <Link href="/vendors?featured=true">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </FadeIn>

            {featuredLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-4/5 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {featuredVendors!.slice(0, 4).map((vendor, index) => (
                  <AnimatedCard key={vendor.id} index={index}>
                    <VendorCard vendor={vendor} />
                  </AnimatedCard>
                ))}
              </div>
            )}
          </section>
        )}

        {/* All Vendors */}
        <section>
          <FadeIn className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold sm:text-3xl">
                  {queryParam ? "Search Results" : "All Vendors"}
                </h2>
                {totalVendors > 0 && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {totalVendors} professionals found
                  </p>
                )}
              </div>
            </div>
          </FadeIn>

          <VendorResults key={queryParam} query={queryParam} onTotalChange={setTotalVendors} />
        </section>
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
