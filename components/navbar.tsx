"use client"

import { Compass, FileText, LineChart, Map, Sparkles } from "lucide-react"

interface NavbarProps {
  reportBadge?: string
}

const navItems = [
  { label: "画像", href: "#profile", icon: Sparkles },
  { label: "工作机会", href: "#jobs", icon: FileText },
  { label: "路线图", href: "#roadmap", icon: Map },
  { label: "成长", href: "#growth", icon: LineChart },
]

export function Navbar({ reportBadge }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold">职业预测</p>
            <p className="text-xs text-muted-foreground">人工智能职业工作空间</p>
          </div>
        </a>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            )
          })}
        </nav>

        <div className="rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
          {reportBadge ?? "就绪"}
        </div>
      </div>
    </header>
  )
}
