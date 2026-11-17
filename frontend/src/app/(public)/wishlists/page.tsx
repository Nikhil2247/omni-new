"use client";

import { useEffect } from 'react';
import { WishlistBoardList } from "@/components/wishlists/wishlist-board-list";
import { Brush, Eyebrow, SkContainer } from "@/components/sketch";
import { trackDashboard } from '@/lib/analytics/umami';

export default function WishlistsPage() {
  useEffect(() => { trackDashboard.sectionView('wishlists', 'user') }, []);

  return (
    <SkContainer className="pb-16">
      <div className="pb-2 pt-6">
        <Eyebrow>Wishlists</Eyebrow>
        <h1 className="mt-2.5 font-display text-[clamp(2.2rem,5vw,3.8rem)] font-bold leading-[1.05] text-ink">
          My <Brush>Wishlists</Brush>
        </h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Save vendor profiles and media you love, then revisit anytime.
        </p>
      </div>
      <WishlistBoardList />
    </SkContainer>
  );
}
