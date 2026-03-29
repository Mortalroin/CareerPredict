"use client"

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
  return (
    <section className="py-14 lg:py-20" id="upload">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/60 shadow-lg shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl">Upload a resume and start analysis</CardTitle>
              <CardDescription>
                PDF and DOCX are supported. The UI will call FastAPI first and fall back to mock data when the backend is not ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="block cursor-pointer rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-8 transition hover:bg-primary/10">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
                />
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <p className="text-lg font-medium">Choose a file or drop it here</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Current file: {file ? file.name : "No file selected"}
                  </p>
                </div>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target role</label>
                  <Input
                    value={targetRole}
                    onChange={(event) => onTargetRoleChange(event.target.value)}
                    placeholder="Example: AI Product Lead"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Backend status</label>
                  <div className="rounded-xl border border-border/60 bg-secondary/50 px-4 py-2 text-sm text-muted-foreground">
                    {backendReady === null ? "Checking..." : backendReady ? "FastAPI reachable" : "Offline, using mock"}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Extra notes</label>
                <Textarea
                  value={notes}
                  onChange={(event) => onNotesChange(event.target.value)}
                  placeholder="Add preferred cities, target industries, salary expectations, or anything helpful for analysis."
                  className="min-h-28"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={onAnalyze} disabled={isSubmitting} className="flex-1 rounded-full">
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Running analysis
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Generate report
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={onLoadDemo} className="rounded-full">
                  Load demo report
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-secondary/30">
            <CardHeader>
              <CardTitle className="text-xl">Current runtime status</CardTitle>
              <CardDescription>This panel is useful when the frontend and backend are being integrated in parallel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border border-border/60 bg-background p-5">
                <p className="text-sm text-muted-foreground">Status message</p>
                <p className="mt-3 leading-7">{statusMessage}</p>
              </div>
              <div className="rounded-3xl border border-border/60 bg-background p-5">
                <p className="text-sm text-muted-foreground">Suggested request fields</p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-foreground">
                  <p>`file`: resume file</p>
                  <p>`target_role`: user target role</p>
                  <p>`notes`: extra instructions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
