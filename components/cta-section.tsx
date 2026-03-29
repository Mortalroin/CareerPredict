"use client"

import { Download, FileText, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ReportSummary } from "@/lib/types"

interface CTASectionProps {
  report: ReportSummary
}

export function CTASection({ report }: CTASectionProps) {
  return (
    <section className="py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border-primary/20 bg-[linear-gradient(135deg,rgba(42,97,255,0.08),rgba(13,148,136,0.08))] shadow-xl shadow-primary/10">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                Final report area
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight">{report.reportTitle}</h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                This section is ready for final delivery actions. You can later connect PDF export, saved history, or a user dashboard without changing the page structure.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="rounded-full">
                  <FileText className="h-4 w-4" />
                  Generate full report
                </Button>
                <Button variant="outline" className="rounded-full">
                  <Download className="h-4 w-4" />
                  Reserve PDF export
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-background/80 bg-background/80 p-6">
              <p className="text-sm text-muted-foreground">Latest update</p>
              <p className="mt-2 text-xl font-semibold">{report.updatedAt}</p>
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Report completeness</span>
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
                {report.highlights.map((item) => (
                  <div key={item} className="rounded-2xl border border-border/60 px-4 py-3 text-sm leading-7">
                    {item}
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
