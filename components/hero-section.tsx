"use client"

import { ArrowDownRight, Cpu, Sparkles, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/40">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(42,97,255,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(13,148,136,0.15),transparent_35%)]" />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-4 py-2 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            Resume parsing, job matching, and planning in one flow
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Turn a plain resume into an
            <span className="block bg-gradient-to-r from-primary via-chart-3 to-accent bg-clip-text text-transparent">
              AI-guided career roadmap
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            The frontend is now fully wired for upload, analysis, and report presentation. Once the FastAPI backend is ready, it can plug into the existing flow without redesign.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-full px-6">
              <a href="#upload">
                Upload resume
                <ArrowDownRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-6">
              <a href="#jobs">View job matches</a>
            </Button>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <StatCard label="Report modules" value="6 panels" icon={Cpu} />
            <StatCard label="Top match score" value="95%" icon={Target} />
            <StatCard label="Backend style" value="FastAPI" icon={Sparkles} />
          </div>
        </div>

        <Card className="border-border/60 bg-card/80 shadow-2xl shadow-primary/10">
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Preview report</p>
                <h2 className="text-2xl font-semibold">AI Career Transition Report</h2>
              </div>
              <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-600">Ready</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <PreviewBlock title="Current profile" value="Senior Product Manager / 6 years" />
              <PreviewBlock title="Next target" value="AI Product Lead" />
              <PreviewBlock title="Near-term focus" value="AI workflow depth and case-study storytelling" />
              <PreviewBlock title="Suggested timeline" value="4 to 6 month transition sprint" />
            </div>
            <div className="rounded-3xl bg-secondary/60 p-5">
              <p className="text-sm text-muted-foreground">Integration note</p>
              <p className="mt-2 text-sm leading-7 text-foreground">
                The page tries FastAPI first and automatically falls back to local mock data if the backend is not available.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Sparkles
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function PreviewBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 font-medium leading-7">{value}</p>
    </div>
  )
}
