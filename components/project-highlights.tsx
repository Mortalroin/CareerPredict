"use client"

import { FolderKanban } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProjectHighlight } from "@/lib/types"

interface ProjectHighlightsProps {
  projects: ProjectHighlight[]
}

export function ProjectHighlights({ projects }: ProjectHighlightsProps) {
  return (
    <section className="py-14 lg:py-20" id="projects">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium text-primary">项目与实践</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">从简历中提取的项目与经历证据</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            这里优先展示项目经历；如果简历里没有明确项目，系统会用工作职责自动补成“实践证据”，方便后续继续润色。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {projects.map((project, index) => (
            <Card key={`${project.title}-${index}`} className="border-border/60 bg-card/85">
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-xl">
                  <FolderKanban className="mt-1 h-5 w-5 text-primary" />
                  <span>{project.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-7 text-muted-foreground">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.length > 0 ? (
                    project.tags.map((tag) => (
                      <span
                        key={`${project.title}-${tag}`}
                        className="rounded-full border border-border/60 px-3 py-1 text-sm text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-dashed border-border/60 px-3 py-1 text-sm text-muted-foreground">
                      建议继续补充关键词
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
