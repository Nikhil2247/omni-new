'use client'

import Link from 'next/link'
import { Brush, PaintedScene, SecHead, SketchButton, Stamp, skPaper } from '@/components/sketch'
import { usePublicBlogPosts } from '@/hooks/queries/use-public-blog'

/** "Top Wedding Blogs": the three most viewed published posts. Hidden when there are none. */
export function TopBlogs() {
  const { data, isLoading } = usePublicBlogPosts({ status: 'PUBLISHED', limit: 3, sortBy: 'mostViewed' })
  const blogs = data?.data ?? []
  if (isLoading || blogs.length === 0) return null

  return (
    <section data-reveal id="home-blog" className="mx-auto w-full max-w-[1440px] px-4 py-11 md:py-16">
      <SecHead
        eyebrow="Latest Articles"
        title={<>Top Wedding <Brush gold>Blogs</Brush></>}
      >
        <div className="flex flex-col items-start gap-4">
          <p>Tips, trends, and inspiration for your big day</p>
          <SketchButton asChild variant="line">
            <Link href="/blog">View All Articles →</Link>
          </SketchButton>
        </div>
      </SecHead>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-7">
        {blogs.map((blog, i) => (
          <Link key={blog.id} href={`/blog/${blog.slug}`} className={`${skPaper({ alt: i % 2 === 1 })} grid gap-2 p-2.5 pb-[18px]`}>
            <div className="bg-sky1 relative aspect-[16/10] overflow-hidden rounded-[18px_240px_20px_220px/230px_18px_250px_16px]">
              {blog.featuredImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={blog.featuredImage} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <PaintedScene seed={(i + 1) * 7} />
              )}
            </div>
            <div className="grid gap-2 px-2">
              <div className="text-ink-soft flex flex-wrap items-center gap-2.5 text-sm">
                {blog.category ? <Stamp className="!text-blue">{blog.category.name}</Stamp> : null}
                {blog.readingTime ? <span>{blog.readingTime} min read</span> : null}
              </div>
              <h3 className="font-display line-clamp-2 text-[1.3rem] leading-tight font-semibold">{blog.title}</h3>
              {blog.excerpt ? <p className="text-ink-soft line-clamp-2 text-[0.92rem]">{blog.excerpt}</p> : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
