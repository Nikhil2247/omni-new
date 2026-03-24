import { redirect } from 'next/navigation'

export default async function BusinessWishlistDetailPage({
  params,
}: {
  params: Promise<{ boardId: string }>
}) {
  const { boardId } = await params
  redirect(`/wishlists/${boardId}`)
}
