"use client"

import { Compass, GitBranchPlus, Sparkles } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CareerAnalysisResponse, JobPortraitCard } from "@/lib/types"

interface TransitionPathsProps {
  paths: CareerAnalysisResponse["transitionPaths"]
  portraits: JobPortraitCard[]
}

export function TransitionPaths({ paths, portraits }: TransitionPathsProps) {
  return (
    <section className="py-14 lg:py-20" id="transition-paths">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium text-primary">转岗路径图谱</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">可迁移岗位与桥接能力</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            这里既展示“可以转到哪里”，也展示“为什么可以转过去”。右侧同步补充岗位画像，帮助理解不同方向需要的技能与素养。
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            {paths.map((path, index) => (
              <Card key={`${path.sourceRole}-${path.targetRole}-${index}`} className="border-border/60 bg-card/85 shadow-sm">
                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <GitBranchPlus className="h-4 w-4" />
                    转岗路径
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">{path.sourceRole}</span>
                    <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">可转向</span>
                    <span className="rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent-foreground">
                      {path.targetRole}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-2xl bg-secondary/50 p-4">
                    <p className="mb-2 text-sm font-medium text-foreground">转岗说明</p>
                    <p className="text-sm leading-7 text-muted-foreground">{path.reason}</p>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-medium">桥接技能</p>
                    <div className="flex flex-wrap gap-2">
                      {path.bridgeSkills.map((skill, skillIndex) => (
                        <span
                          key={`${path.targetRole}-${skill}-${skillIndex}`}
                          className="rounded-full border border-border/60 bg-background px-3 py-1 text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-medium">建议动作</p>
                    <div className="space-y-2">
                      {path.actionItems.map((item, itemIndex) => (
                        <div
                          key={`${path.targetRole}-${itemIndex}`}
                          className="rounded-2xl bg-primary/5 px-4 py-3 text-sm leading-7 text-muted-foreground"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-5">
            {portraits.slice(0, 5).map((portrait, index) => (
              <Card key={`${portrait.roleName}-${portrait.roleFamily}-${index}`} className="border-border/60 bg-card/85 shadow-sm">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Compass className="h-4 w-4" />
                    岗位画像
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <CardTitle className="text-xl">{portrait.roleName}</CardTitle>
                    <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
                      {portrait.roleFamily}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-7 text-muted-foreground">{portrait.summary}</p>

                  <div className="flex flex-wrap gap-2">
                    {portrait.professionalSkills.slice(0, 6).map((skill, skillIndex) => (
                      <span
                        key={`${portrait.roleName}-${skill}-${skillIndex}`}
                        className="rounded-full border border-border/60 bg-background px-3 py-1 text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <InfoBlock title="学习要求" items={portrait.learningRequirements} />
                    <InfoBlock title="沟通要求" items={portrait.communicationRequirements} />
                    <InfoBlock title="抗压要求" items={portrait.stressRequirements} />
                    <InfoBlock title="实践要求" items={portrait.internshipRequirements} />
                  </div>

                  {portrait.certificates.length > 0 ? (
                    <div className="rounded-2xl bg-secondary/40 p-4">
                      <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Sparkles className="h-4 w-4 text-primary" />
                        证书与资质
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {portrait.certificates.slice(0, 5).map((certificate, certificateIndex) => (
                          <span
                            key={`${portrait.roleName}-${certificate}-${certificateIndex}`}
                            className="rounded-full border border-border/60 bg-background px-3 py-1 text-sm"
                          >
                            {certificate}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-secondary/50 p-4">
      <p className="text-sm font-medium">{title}</p>
      <div className="mt-3 space-y-2">
        {items.slice(0, 2).map((item, index) => (
          <p key={`${title}-${item}-${index}`} className="text-sm leading-6 text-muted-foreground">
            {item}
          </p>
        ))}
      </div>
    </div>
  )
}
