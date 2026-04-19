"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"

import { ArrowLeft, Database, FileText, LoaderCircle, Sparkles, UploadCloud } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { countFilledResumeOptimizationDrafts } from "@/lib/resume-optimization"
import type {
  ResumeOptimizationDraft,
  ResumeOptimizationField,
  ResumeUploadMode,
} from "@/lib/types"

interface ResumeUploadProps {
  file: File | null
  targetRole: string
  notes: string
  uploadMode: ResumeUploadMode
  optimizationFields: ResumeOptimizationField[]
  optimizationDrafts: ResumeOptimizationDraft
  isSubmitting: boolean
  isSavingOptimization: boolean
  canSaveOptimization: boolean
  statusMessage: string
  backendReady: boolean | null
  onFileChange: (file: File | null) => void
  onTargetRoleChange: (value: string) => void
  onNotesChange: (value: string) => void
  onUploadModeChange: (mode: ResumeUploadMode) => void
  onOptimizationDraftChange: (key: string, value: string) => void
  onSaveOptimization: () => void
  onAnalyze: () => void
  onLoadDemo: () => void
}

export function ResumeUpload({
  file,
  targetRole,
  notes,
  uploadMode,
  optimizationFields,
  optimizationDrafts,
  isSubmitting,
  isSavingOptimization,
  canSaveOptimization,
  statusMessage,
  backendReady,
  onFileChange,
  onTargetRoleChange,
  onNotesChange,
  onUploadModeChange,
  onOptimizationDraftChange,
  onSaveOptimization,
  onAnalyze,
  onLoadDemo,
}: ResumeUploadProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState("")
  const completedOptimizationCount = useMemo(
    () => countFilledResumeOptimizationDrafts(optimizationDrafts),
    [optimizationDrafts],
  )

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

  if (uploadMode === "optimize") {
    return (
      <section className="py-14 lg:py-20" id="upload">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="border-border/60 shadow-lg shadow-primary/5">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-2xl">优化简历</CardTitle>
                  <CardDescription className="mt-2 leading-7">
                    把真实项目材料补进来，再生成一版更贴近目标岗位的新报告。
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => onUploadModeChange("default")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回上传表单
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-3xl border border-primary/15 bg-primary/5 p-5">
                <p className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  已填写 {completedOptimizationCount} / {optimizationFields.length} 条优化内容
                </p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  这里填写的内容会在你下次点击“生成报告”时自动并入补充说明，同时也可以单独保存到数据库。
                </p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-secondary/15 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="flex items-center gap-2 text-lg font-semibold text-foreground">
                      <Sparkles className="h-5 w-5 text-primary" />
                      填写建议
                    </p>
                    <p className="mt-3 text-base leading-8 text-muted-foreground">
                      先把经历写具体，再把动作、结果和业务价值补完整，这样生成出来的新报告才会更贴近目标岗位。
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background px-5 py-4 lg:min-w-64">
                    <p className="text-sm font-medium text-muted-foreground">当前目标岗位</p>
                    <p className="mt-2 text-xl font-semibold leading-8">{targetRole || "尚未填写目标岗位"}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-background px-5 py-4">
                    <p className="text-sm font-semibold text-primary">01</p>
                    <p className="mt-2 text-base leading-7 text-foreground">先写你真实做过的项目、实习或工作情境。</p>
                  </div>
                  <div className="rounded-2xl bg-background px-5 py-4">
                    <p className="text-sm font-semibold text-primary">02</p>
                    <p className="mt-2 text-base leading-7 text-foreground">
                      再补动作、结果、工具和业务价值，尽量避免空泛表述。
                    </p>
                  </div>
                  <div className="rounded-2xl bg-background px-5 py-4">
                    <p className="text-sm font-semibold text-primary">03</p>
                    <p className="mt-2 text-base leading-7 text-foreground">写完后可以直接生成新报告，或先保存到数据库。</p>
                  </div>
                </div>
              </div>

              {!canSaveOptimization ? (
                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5">
                  <p className="text-sm font-medium text-amber-700">当前还不能保存到数据库</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    需要先上传真实简历并成功生成一次报告，系统拿到真实 `resume_id` 后，才能把这部分优化内容写入后端数据库。
                  </p>
                </div>
              ) : null}

              <div className="space-y-4">
                {optimizationFields.map((field) => {
                  const isFilled = Boolean(optimizationDrafts[field.key]?.trim())

                  return (
                    <div key={field.key} className="rounded-3xl border border-border/60 bg-secondary/15 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-semibold">{field.label}</p>
                        <span
                          className={`rounded-full bg-background px-3 py-1 text-xs font-medium ${
                            isFilled ? "text-emerald-600" : "text-amber-500"
                          }`}
                        >
                          {isFilled ? "已填写" : "待补充"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{field.hint}</p>
                      <div className="mt-4 rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm leading-7 text-foreground">
                        <span className="font-medium text-primary">模板示例：</span>
                        {field.example}
                      </div>
                      <div className="mt-4 space-y-2">
                        <label className="text-sm font-medium">补充内容</label>
                        <Textarea
                          value={optimizationDrafts[field.key] || ""}
                          onChange={(event) => onOptimizationDraftChange(field.key, event.target.value)}
                          placeholder={`请结合你的真实经历补充“${field.label}”`}
                          className="min-h-28 bg-background"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={onSaveOptimization}
                  disabled={isSavingOptimization || isSubmitting || !canSaveOptimization}
                >
                  {isSavingOptimization ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                  <span>{isSavingOptimization ? "保存中" : "保存到数据库并返回上传区"}</span>
                </Button>
                <Button type="button" variant="outline" className="rounded-full" onClick={onAnalyze} disabled={isSubmitting}>
                  {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  <span>{isSubmitting ? "生成中" : "直接生成新报告"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section className="py-14 lg:py-20" id="upload">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/60 shadow-lg shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl">上传简历并开始分析</CardTitle>
              <CardDescription className="leading-7">
                支持 PDF、DOC 和 DOCX。页面会优先调用 FastAPI 完成解析与匹配，若后端暂时不可用，则回退到演示数据。
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
                  <p className="mt-2 text-sm text-muted-foreground">当前文件：{selectedFileName || "尚未选择任何文件"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">支持格式：PDF、DOC、DOCX</p>
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
                  <label className="text-sm font-medium">目标岗位</label>
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
                  placeholder="添加你偏好的城市、目标行业、薪资预期，或任何有助于分析的背景信息。"
                  className="min-h-28"
                />
              </div>

              {completedOptimizationCount > 0 ? (
                <div className="rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                  <p className="text-sm font-medium text-sky-700">已补充 {completedOptimizationCount} 条优化内容</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    这些内容会在下次生成报告时自动并入补充说明；如果已经生成过真实报告，也可以进入优化模式后保存到数据库。
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
              <CardDescription>当前前后端联调时，这里会帮助你快速确认请求参数和当前提示。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border border-border/60 bg-background p-5">
                <p className="text-sm text-muted-foreground">状态消息</p>
                <p className="mt-3 leading-7">{statusMessage}</p>
              </div>
              <div className="rounded-3xl border border-border/60 bg-background p-5">
                <p className="text-sm text-muted-foreground">建议请求字段</p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-foreground">
                  <p>`file`：简历文件</p>
                  <p>`target_role`：用户目标岗位</p>
                  <p>`resume_id`：已有简历记录的唯一标识，用于更新而不是重复入库</p>
                  <p>`notes`：补充说明与优化内容</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
