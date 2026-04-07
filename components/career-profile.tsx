"use client"

import { Award, Compass, Sparkles, Star } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CareerProfileData } from "@/lib/types"

interface CareerProfileProps {
  profile: CareerProfileData
}

export function CareerProfile({ profile }: CareerProfileProps) {
  return (
    <section className="py-14 lg:py-20" id="profile">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium text-primary">学生就业能力画像</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">{profile.headline}</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">{profile.summary}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-6">
          {profile.cards.map((item, index) => (
            <Card key={`${item.label}-${index}`} className="border-border/60 bg-card/80">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_1fr_1.1fr]">
          <InfoCard title="核心技能" icon={Sparkles} items={profile.skills} emptyLabel="暂未识别到技能信息" />
          <InfoCard title="优势亮点" icon={Star} items={profile.strengths} emptyLabel="暂未识别到明显优势" />
          <InfoCard title="证书与资质" icon={Award} items={profile.certificates} emptyLabel="暂未识别到证书信息" />
          <Card className="border-primary/20 bg-gradient-to-br from-primary/8 to-accent/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Compass className="h-5 w-5 text-primary" />
                建议发展方向
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold leading-8">{profile.suggestedDirection}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

function InfoCard({
  title,
  icon: Icon,
  items,
  emptyLabel,
}: {
  title: string
  icon: typeof Sparkles
  items: string[]
  emptyLabel: string
}) {
  const renderedItems = items.length > 0 ? items : [emptyLabel]

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {renderedItems.map((item, index) => (
          <span key={`${title}-${item}-${index}`} className="rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground">
            {item}
          </span>
        ))}
      </CardContent>
    </Card>
  )
}
