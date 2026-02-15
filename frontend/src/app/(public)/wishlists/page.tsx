"use client";

import { WishlistList } from "@/components/features/events/wishlist-list";
import { useAuthStore } from "@/store/auth-store";
import { useWishlistMine } from "@/hooks/queries/use-wishlists";
import { Heart } from "lucide-react";

export default function WishlistsPage() {
  const { user } = useAuthStore();
  const userId = user?.id;
  const { data: wishlists = [] } = useWishlistMine(Boolean(userId));

  const wishlistArray = Array.isArray(wishlists) ? wishlists : (wishlists?.data ?? []);
  const totalItems = wishlistArray.reduce((total, list) => total + (list.items?.length ?? 0), 0);
  const totalBoards = wishlistArray.length;

  return (
    <div className="mx-auto max-w-8xl space-y-6 px-6 py-8 lg:py-10">
      {/* Hero Section */}
      {/* <div className="relative overflow-hidden rounded-xl border bg-linear-to-br from-pink-50 via-rose-50 to-purple-50 p-6 dark:from-pink-950/30 dark:via-rose-950/30 dark:to-purple-950/30">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">My Wishlists</h1>
            <p className="text-muted-foreground mt-1 text-sm">Save and organize vendors you love</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
              <Heart className="h-6 w-6 fill-pink-500 text-pink-500 dark:fill-pink-400 dark:text-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-muted-foreground text-xs">Saved</p>
            </div>
          </div>
        </div>
        <div className="absolute -top-8 -right-8 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      </div> */}

      {/* Wishlists Component */}
      <WishlistList />
    </div>
  );
}
