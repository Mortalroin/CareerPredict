"use client"

import { Download, FileText, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ReportSummary } from "@/lib/types"

interface CTASectionProps {
  report: ReportSummary
}

export function CTASection({ report }: CTASectionProps) {
  function handleExport() {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  return (
    <section className="py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border-primary/20 bg-[linear-gradient(135deg,rgba(42,97,255,0.08),rgba(13,148,136,0.08))] shadow-xl shadow-primary/10">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                最终职业规划报告：{report.llmEnabled ? "LLM 增强模式" : "规则回退模式"}
              </div>

              <div>
                <h2 className="text-3xl font-semibold tracking-tight">{report.reportTitle}</h2>
                <p className="mt-4 text-lg leading-8 text-muted-foreground">{report.overview}</p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/80 p-5">
                <p className="text-sm font-medium text-primary">发展路径总览</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{report.pathPlan}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border/60 bg-background/80 p-5">
                  <p className="text-sm font-medium text-primary">报告亮点</p>
                  <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                    {report.highlights.map((item, index) => (
                      <p key={`${item}-${index}`}>{item}</p>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-border/60 bg-background/80 p-5">
                  <p className="text-sm font-medium text-primary">报告优化建议</p>
                  <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                    {report.editTips.map((item, index) => (
                      <p key={`${item}-${index}`}>{item}</p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button className="rounded-full">
                  <FileText className="h-4 w-4" />
                  继续编辑报告
                </Button>
                <Button variant="outline" className="rounded-full" onClick={handleExport} disabled={!report.exportReady}>
                  <Download className="h-4 w-4" />
                  打印或导出报告
                </Button>
              </div>
            </div>

            <div className="space-y-6 rounded-[2rem] border border-background/80 bg-background/80 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">最近更新时间</p>
                  <p className="mt-2 text-xl font-semibold">{report.updatedAt}</p>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  完整度 {report.completionRate}%
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">报告完成进度</span>
                  <span>{report.completionRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${report.completionRate}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-primary">分阶段行动计划</p>
                {report.actionPlan.map((phase) => (
                  <div key={`${phase.phase}-${phase.timeline}`} className="rounded-3xl border border-border/60 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium">{phase.phase}</p>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">{phase.timeline}</span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">目标</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {phase.goals.map((goal, index) => (
                            <span key={`${phase.phase}-goal-${index}`} className="rounded-full border border-border/60 px-3 py-1 text-sm">
                              {goal}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">行动</p>
                        <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                          {phase.actions.map((action, index) => (
                            <p key={`${phase.phase}-action-${index}`}>{action}</p>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">衡量指标</p>
                        <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                          {phase.metrics.map((metric, index) => (
                            <p key={`${phase.phase}-metric-${index}`}>{metric}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
