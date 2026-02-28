"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import NextImage from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Search, X, Loader2, MapPin, Tag, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchApi, type SearchResultItem } from "@/lib/api/search";
import { useDebounce } from "@/hooks/use-debounce";

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  showOnHomePage?: boolean;
}

export function GlobalSearch({ placeholder = "Search vendors, services...", className, showFilters = false, showOnHomePage = false }: GlobalSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Set mounted state for SSR safety
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (searchRef.current) {
      const rect = searchRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  // Update position when opening dropdown
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
    }
  }, [isOpen, updateDropdownPosition]);

  // Don't show search on home page unless explicitly allowed
  const isHomePage = pathname === "/";

  // Fetch quick search results
  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const [quickResults, suggestionResults] = await Promise.all([
          searchApi.quickSearch({ q: debouncedQuery, limit: 5 }),
          searchApi.getSuggestions({ q: debouncedQuery, limit: 5 }),
        ]);
        
        setResults(quickResults);
        setSuggestions(suggestionResults);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  // Update position on resize
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      updateDropdownPosition();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, updateDropdownPosition]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalItems = results.length + suggestions.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0) {
        if (selectedIndex < suggestions.length) {
          // Selected a suggestion
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          // Selected a result
          const resultIndex = selectedIndex - suggestions.length;
          handleResultClick(results[resultIndex]);
        }
      } else {
        // No selection, go to full search results
        handleViewAllResults();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setIsOpen(false);
    // Navigate to search results
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const handleResultClick = (result: SearchResultItem) => {
    setIsOpen(false);
    setQuery("");
    
    // Navigate based on result type
    if (result.type === "vendor" && result.slug) {
      router.push(`/vendors/${result.slug}`);
    }
  };

  const handleViewAllResults = () => {
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setQuery("");
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSuggestions([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Highlight matching text in suggestions
  const highlightSuggestion = (suggestion: string, query: string) => {
    const lowerSuggestion = suggestion.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerSuggestion.indexOf(lowerQuery);
    
    if (matchIndex === -1) {
      return <span className="text-foreground">{suggestion}</span>;
    }
    
    const before = suggestion.slice(0, matchIndex);
    const match = suggestion.slice(matchIndex, matchIndex + query.length);
    const after = suggestion.slice(matchIndex + query.length);
    
    return (
      <>
        {before && <span className="text-foreground">{before}</span>}
        <span className="font-medium text-foreground">{match}</span>
        {after && <span className="text-muted-foreground">{after}</span>}
      </>
    );
  };

  // Prevent scroll propagation to page
  const handleDropdownScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  // Don't render on home page unless explicitly allowed via prop
  if (isHomePage && !showOnHomePage) {
    return null;
  }

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(true)}
          placeholder={placeholder}
          className="h-10 w-full rounded-full border bg-background pl-9 pr-20 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {query && !isLoading && (
            <button
              onClick={handleClear}
              className="rounded-md p-1 hover:bg-accent transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Search Results Dropdown - Rendered via Portal */}
      {isMounted && isOpen && (query.length >= 2) && (suggestions.length > 0 || results.length > 0) && createPortal(
        <div
          onWheel={handleDropdownScroll}
          style={{
            position: 'absolute',
            top: `${dropdownPosition.top + 8}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 9999,
          }}
          className="max-h-96 overflow-y-auto overscroll-contain rounded-lg border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500"
        >
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="border-b p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    selectedIndex === index
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
                >
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{highlightSuggestion(suggestion, query)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Results
              </div>
              {results.map((result, index) => {
                const itemIndex = suggestions.length + index;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-md p-3 text-left transition-colors",
                      selectedIndex === itemIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    )}
                  >
                    {result.imageUrl && (
                      <NextImage
                        src={result.imageUrl}
                        alt={result.title}
                        width={48}
                        height={48}
                        unoptimized={true}
                        priority={true}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{result.title}</p>
                        {result.isVerified && (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Verified
                          </span>
                        )}
                      </div>
                      {result.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {result.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
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
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* View All Results */}
          <div className="border-t p-2">
            <button
              onClick={handleViewAllResults}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-accent transition-colors"
            >
              <span>View all results for &quot;{query}&quot;</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* No Results - Rendered via Portal */}
      {isMounted && isOpen && query.length >= 2 && !isLoading && suggestions.length === 0 && results.length === 0 && createPortal(
        <div
          style={{
            position: 'absolute',
            top: `${dropdownPosition.top + 8}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 9999,
          }}
          className="rounded-lg border bg-popover p-4 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
        >
          <p className="text-center text-sm text-muted-foreground">
            No results found for &quot;{query}&quot;
          </p>
        </div>,
        document.body
      )}
    </div>
  );
}
