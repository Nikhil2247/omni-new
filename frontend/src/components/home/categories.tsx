import Link from 'next/link'
import { Ico, ICONS, skPaper } from '@/components/sketch'
import { cn } from '@/lib/utils'
import { CATEGORY_TILES } from './content'

export function CategoryTiles() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 pt-10 pb-5">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(125px,1fr))] gap-5 max-[560px]:grid-cols-2 max-[560px]:gap-3.5">
        {CATEGORY_TILES.map((c, i) => (
          <Link
            key={c.slug}
            href={`/vendors?categoryId=${c.slug}`}
            className={cn(
              skPaper({ alt: i % 2 === 1 }),
              'grid justify-items-center gap-2 px-2 py-4 text-[0.95rem] font-bold transition-transform hover:-translate-y-1 hover:-rotate-1',
            )}
          >
            <Ico d={ICONS[c.icon]} className="!size-10" />
            {c.title}
          </Link>
        ))}
      </div>
    </section>
  )
}
