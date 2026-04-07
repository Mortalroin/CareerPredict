import type { ReactNode } from "react"

import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"

import "./globals.css"

export const metadata: Metadata = {
  title: "职业预测 | AI 职业规划平台",
  description: "上传简历并生成就业能力画像、岗位匹配结果、职业路径规划与成长行动建议。",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
