import { GrowthDetailPage } from "@/components/growth-detail-page"

export default async function GrowthDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <GrowthDetailPage stageId={id} />
}
