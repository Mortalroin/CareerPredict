"use client"

import { Radar } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CapabilityScoreCard } from "@/lib/types"

interface CapabilityMatrixProps {
  items: CapabilityScoreCard[]
}

export function CapabilityMatrix({ items }: CapabilityMatrixProps) {
  return (
    <section className="bg-secondary/25 py-14 lg:py-20" id="capability">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium text-primary">四维能力分析</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">从基础要求到发展潜力的多维对比</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            人岗匹配不仅看关键词命中。这里把基础要求、职业技能、职业素养和发展潜力拆开评分，方便理解“为什么匹配”和“差距在哪里”。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {items.map((item) => (
            <Card key={item.dimension} className="border-border/60 bg-card/85">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Radar className="h-5 w-5 text-primary" />
                    {item.dimension}
                  </CardTitle>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    {Math.round(item.score)} 分
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                    <span>权重 {Math.round(item.weight * 100)}%</span>
                    <span>{Math.round(item.score)} / 100</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-7 text-muted-foreground">{item.summary}</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-500/5 p-4">
                    <p className="text-sm font-medium text-emerald-700">已有优势</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.matchedItems.length > 0 ? (
                        item.matchedItems.map((value) => (
                          <span key={`${item.dimension}-${value}`} className="rounded-full bg-background px-3 py-1 text-sm">
                            {value}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">暂未识别到明显优势项</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-amber-500/5 p-4">
                    <p className="text-sm font-medium text-amber-700">待补齐项</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.gapItems.length > 0 ? (
                        item.gapItems.map((value) => (
                          <span key={`${item.dimension}-gap-${value}`} className="rounded-full bg-background px-3 py-1 text-sm">
                            {value}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">当前没有明显短板</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
