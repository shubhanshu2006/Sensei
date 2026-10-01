"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  useResumeUploadUrl,
  useUpdateResumeInfo,
  useDirectResumeUpload,
} from "@/lib/api/queries/candidates";
import { Upload, FileText, CheckCircle, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

interface ResumeUploadProps {
  currentResumeUrl?: string;
  currentFileName?: string;
  onUploadSuccess?: (url: string, fileName?: string) => void;
  className?: string;
}

export function ResumeUpload({
  currentResumeUrl,
  currentFileName,
  onUploadSuccess,
  className = "",
}: ResumeUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentResumeUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const directUploadMutation = useDirectResumeUpload();
  const getUploadUrlMutation = useResumeUploadUrl();
  const updateResumeInfoMutation = useUpdateResumeInfo();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type (PDF or Word)
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document (.pdf, .doc, .docx)");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    setSelectedFile(file);
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      // 1. Direct server-side upload: streams to S3 from backend, completely bypassing browser CORS
      const result = await directUploadMutation.mutateAsync(file);
      const fileUrl = result.resumeUrl || result.fileUrl || result.url;

      setUploadedUrl(fileUrl);
      onUploadSuccess?.(fileUrl, file.name);
      toast.success("Resume uploaded successfully!");
    } catch {
      // 2. Fallback to presigned S3 PUT if direct upload had an issue
      try {
        const presigned = await getUploadUrlMutation.mutateAsync({
          fileName: file.name,
          contentType: file.type,
        });

        const uploadResponse = await fetch(presigned.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file to storage");
        }

        await updateResumeInfoMutation.mutateAsync({
          resumeUrl: presigned.fileUrl,
          fileName: file.name,
        });

        setUploadedUrl(presigned.fileUrl);
        onUploadSuccess?.(presigned.fileUrl, file.name);
        toast.success("Resume uploaded successfully!");
      } catch (err: any) {
        toast.error(err.message || "Failed to complete resume upload");
        setSelectedFile(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
      />

      {uploadedUrl ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {selectedFile?.name || currentFileName || "Uploaded Resume"}
              </p>
              <div className="flex items-center space-x-2 text-xs text-emerald-700">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Ready for AI screening</span>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            Replace
          </Button>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-50/20"
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium text-slate-700">
                Uploading to secure storage...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Click to upload resume
                </p>
                <p className="text-xs text-slate-500">
                  PDF, DOC, DOCX up to 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
