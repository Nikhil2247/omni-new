"use client";

import { useSearchParams } from "next/navigation";
import NextImage from "next/image";
import { useEffect, useState } from "react";
import { GlobalSearch } from "@/components/common/global-search";
import { searchApi, type SearchResultItem, type GlobalSearchResponse } from "@/lib/api/search";
import { MapPin, Tag, Loader2, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query || query.length < 2) {
        setResults(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await searchApi.search({ q: query });
        setResults(data);
      } catch (err) {
        console.error("Search failed:", err);
        setError("Failed to fetch search results. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Search */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <GlobalSearch className="max-w-3xl mx-auto" />
        </div>
      </div>

      {/* Results Container */}
      <div className="container mx-auto px-4 py-8">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Searching...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {!isLoading && !error && results && (
          <>
            {/* Results Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold">
                Search results for &quot;{query}&quot;
              </h1>
              <p className="text-muted-foreground mt-1">
                Found {results.meta.totalResults} result
                {results.meta.totalResults !== 1 ? "s" : ""} in{" "}
                {results.meta.processingTimeMs}ms
              </p>
            </div>

            {/* Results Grid */}
            {results.results.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {results.results.map((result) => (
                  <SearchResultCard key={result.id} result={result} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-12 text-center">
                <p className="text-lg font-medium">No results found</p>
                <p className="text-muted-foreground mt-2">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}

            {/* Pagination */}
            {results.meta.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                {Array.from({ length: Math.min(results.meta.totalPages, 5) }, (_, i) => i + 1).map((page) => (
                  <Link
                    key={page}
                    href={`/search?q=${encodeURIComponent(query)}&page=${page}`}
                    className={cn(
                      "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                      page === results.meta.page
                        ? "bg-primary text-primary-foreground"
                        : "bg-card hover:bg-accent"
                    )}
                  >
                    {page}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {!isLoading && !error && !results && query && (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              Enter a search query to see results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResultItem }) {
  const getResultUrl = () => {
    if (result.type === "vendor" && result.slug) {
      return `/vendors/${result.slug}`;
    }
    return "#";
  };

  return (
    <Link
      href={getResultUrl()}
      className="group relative overflow-hidden rounded-lg border bg-card transition-all hover:shadow-lg hover:border-primary/50"
    >
      {/* Image */}
      {result.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <NextImage
            src={result.imageUrl}
            alt={result.title}
            width={1200}
            height={675}
            unoptimized={true}
            priority={true}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          {result.isVerified && (
            <div className="absolute top-2 right-2 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-md">
              Verified
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
          {result.title}
        </h3>
        
        {result.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {result.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {result.category && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {result.category}
            </span>
          )}
          {result.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {result.location}
            </span>
          )}
          {result.rating && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {result.rating}
            </span>
          )}
        </div>

        {result.price && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm font-medium">
              Starting from ₹{result.price.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
