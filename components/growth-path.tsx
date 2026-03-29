"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { GrowthStage } from "@/lib/types"

interface GrowthPathProps {
  stages: GrowthStage[]
}

export function GrowthPath({ stages }: GrowthPathProps) {
  return (
    <section className="bg-secondary/25 py-14 lg:py-20" id="growth">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium text-primary">Growth path</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">A clean view of future career stages</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            The layout works on desktop and mobile, and each stage can be updated directly from backend response data.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-4">
          {stages.map((stage) => (
            <Card
              key={stage.id}
              className={`border-border/60 ${stage.current ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10" : "bg-card/85"}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stage {stage.id}</span>
                  <span className={`rounded-full px-3 py-1 text-xs ${stage.current ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                    {stage.level}
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold">{stage.role}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{stage.timeframe}</p>
                <p className="mt-2 text-sm font-medium text-primary">{stage.salary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {stage.focus.map((item) => (
                    <span key={item} className="rounded-full border border-border/60 px-3 py-1 text-sm text-foreground">
                      {item}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
