"use client"

import { useEffect, useId, useRef, useState } from "react"

import { FileText, LoaderCircle, UploadCloud } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ResumeUploadProps {
  file: File | null
  targetRole: string
  notes: string
  isSubmitting: boolean
  statusMessage: string
  backendReady: boolean | null
  onFileChange: (file: File | null) => void
  onTargetRoleChange: (value: string) => void
  onNotesChange: (value: string) => void
  onAnalyze: () => void
  onLoadDemo: () => void
}

export function ResumeUpload({
  file,
  targetRole,
  notes,
  isSubmitting,
  statusMessage,
  backendReady,
  onFileChange,
  onTargetRoleChange,
  onNotesChange,
  onAnalyze,
  onLoadDemo,
}: ResumeUploadProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState("")

  function handleSelectedFile(nextFile: File | null) {
    setSelectedFileName(nextFile?.name || "")
    onFileChange(nextFile)
  }

  useEffect(() => {
    setSelectedFileName(file?.name || "")
  }, [file])

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragActive(true)
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragActive(false)
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragActive(false)
    const droppedFile = event.dataTransfer.files?.[0] ?? null
    handleSelectedFile(droppedFile)
  }

  function handleOpenFilePicker() {
    inputRef.current?.click()
  }

  return (
    <section className="py-14 lg:py-20" id="upload">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/60 shadow-lg shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl">上传简历并开始分析</CardTitle>
              <CardDescription>
                支持 PDF、DOC 与 DOCX。页面会优先调用 FastAPI 完成解析与匹配，若后端暂时不可用，则回退到演示数据。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <input
                id={inputId}
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(event) => handleSelectedFile(event.target.files?.[0] ?? null)}
              />

              <div
                role="button"
                tabIndex={0}
                className={`block cursor-pointer rounded-3xl border border-dashed p-8 transition ${
                  isDragActive ? "border-primary bg-primary/10" : "border-primary/30 bg-primary/5 hover:bg-primary/10"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleOpenFilePicker}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    handleOpenFilePicker()
                  }
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <p className="text-lg font-medium">选择文件或将其拖放到此处</p>
                  <p className="mt-2 text-sm text-muted-foreground">当前文件：{selectedFileName || "未选择任何文件"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">支持的格式：PDF、DOC、DOCX</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 rounded-full"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      handleOpenFilePicker()
                    }}
                  >
                    选择简历
                  </Button>
                </div>
              </div>

              {selectedFileName ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700">
                  已选择文件：{selectedFileName}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">目标角色</label>
                  <Input
                    value={targetRole}
                    onChange={(event) => onTargetRoleChange(event.target.value)}
                    placeholder="例如：AI 产品经理、测试工程师、实施工程师"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">后端状态</label>
                  <div className="rounded-xl border border-border/60 bg-secondary/50 px-4 py-2 text-sm text-muted-foreground">
                    {backendReady === null ? "检查中..." : backendReady ? "FastAPI 可达" : "离线，使用演示数据"}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">补充说明</label>
                <Textarea
                  value={notes}
                  onChange={(event) => onNotesChange(event.target.value)}
                  placeholder="添加您偏好的城市、目标行业、薪资期望或其他有助于分析的信息。"
                  className="min-h-28"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={onAnalyze} disabled={isSubmitting} className="flex-1 rounded-full">
                  {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  <span>{isSubmitting ? "运行分析" : "生成报告"}</span>
                </Button>
                <Button variant="outline" onClick={onLoadDemo} className="rounded-full">
                  加载演示报告
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-secondary/30">
            <CardHeader>
              <CardTitle className="text-xl">当前运行状态</CardTitle>
              <CardDescription>当前前端与后端并行联调中时，这面板能帮助快速定位问题。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border border-border/60 bg-background p-5">
                <p className="text-sm text-muted-foreground">状态消息</p>
                <p className="mt-3 leading-7">{statusMessage}</p>
              </div>
              <div className="rounded-3xl border border-border/60 bg-background p-5">
                <p className="text-sm text-muted-foreground">建议的请求字段</p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-foreground">
                  <p>`file`：简历文件</p>
                  <p>`target_role`：用户目标角色</p>
                  <p>`limit`：返回岗位数量</p>
                  <p>`notes`：补充说明</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
