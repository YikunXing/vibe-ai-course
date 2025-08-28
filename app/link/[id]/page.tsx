import { LinkDetail } from "@/components/link-detail"

export default async function LinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LinkDetail linkId={id} />
}
