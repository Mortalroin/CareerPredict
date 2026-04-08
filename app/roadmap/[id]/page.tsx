import { RoadmapDetailPage } from "@/components/roadmap-detail-page"

export default async function RoadmapDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <RoadmapDetailPage stepId={id} />
}
