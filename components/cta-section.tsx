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
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                最终报告区：{report.llmEnabled ? "LLM 增强模式" : "规则回退模式"}
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight">{report.reportTitle}</h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">{report.overview}</p>
              <div className="mt-6 rounded-3xl border border-border/60 bg-background/80 p-5">
                <p className="text-sm font-medium text-primary">发展路径总览</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{report.pathPlan}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="rounded-full">
                  <FileText className="h-4 w-4" />
                  报告可继续编辑
                </Button>
                <Button variant="outline" className="rounded-full" onClick={handleExport} disabled={!report.exportReady}>
                  <Download className="h-4 w-4" />
                  浏览器打印导出
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-background/80 bg-background/80 p-6">
              <p className="text-sm text-muted-foreground">最近更新时间</p>
              <p className="mt-2 text-xl font-semibold">{report.updatedAt}</p>
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>报告完整度</span>
                  <span>{report.completionRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${report.completionRate}%` }}
                  />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {report.highlights.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-2xl border border-border/60 px-4 py-3 text-sm leading-7">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                <p className="text-sm font-medium text-primary">编辑建议</p>
                {report.editTips.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm leading-7 text-muted-foreground">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-4">
                <p className="text-sm font-medium text-primary">行动计划</p>
                {report.actionPlan.map((phase) => (
                  <div key={`${phase.phase}-${phase.timeline}`} className="rounded-3xl border border-border/60 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium">{phase.phase}</p>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">{phase.timeline}</span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {phase.actions.map((action, index) => (
                        <p key={`${phase.phase}-${index}`}>{action}</p>
                      ))}
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
