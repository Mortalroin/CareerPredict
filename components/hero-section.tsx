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
            简历解析、岗位匹配与成长规划一体化
          </div>

          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            把一份普通简历变成可执行的
            <span className="block bg-gradient-to-r from-primary via-chart-3 to-accent bg-clip-text text-transparent">
              AI 职业发展路线图
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            现在这套前端已经串起上传、分析、报告展示和简历优化主流程。接入后端后，用户输入的内容可以真实参与分析并写入数据库，不再只是一个静态演示页。
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-full px-6">
              <a href="#upload">
                上传简历
                <ArrowDownRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-6">
              <a href="#jobs">查看岗位匹配</a>
            </Button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <StatCard label="报告模块" value="多模块联动" icon={Cpu} />
            <StatCard label="能力对比" value="四维分析" icon={Target} />
            <StatCard label="后端能力" value="FastAPI + LLM" icon={Sparkles} />
          </div>
        </div>

        <Card className="border-border/60 bg-card/80 shadow-2xl shadow-primary/10">
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">报告预览</p>
                <h2 className="text-2xl font-semibold">AI 职业发展报告</h2>
              </div>
              <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-600">可用</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <PreviewBlock title="当前画像" value="候选人能力结构与发展潜力" />
              <PreviewBlock title="目标方向" value="目标岗位匹配与职业路径规划" />
              <PreviewBlock title="近期重点" value="关键技能差距、项目补强与实践建议" />
              <PreviewBlock title="建议周期" value="短期冲刺加中期成长计划" />
            </div>

            <div className="rounded-3xl bg-secondary/60 p-5">
              <p className="text-sm text-muted-foreground">联调说明</p>
              <p className="mt-2 text-sm leading-7 text-foreground">
                页面会优先请求 FastAPI；如果后端暂时不可用，则自动回退到本地演示数据，保证前端流程始终可看、可测、可继续优化。
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
