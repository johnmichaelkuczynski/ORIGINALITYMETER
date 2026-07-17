import React, { useState, useRef, DragEvent } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface FileDropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  onFileSelect: (file: File) => void;
  accept?: string;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  maxSizeInMB?: number;
  className?: string;
  showFileInput?: boolean;
  showButton?: boolean;
  buttonText?: string;
  children?: React.ReactNode;
}

export function FileDropzone({
  onFileSelect,
  accept = ".txt,.docx,.mp3,.pdf",
  disabled = false,
  isUploading = false,
  uploadProgress = 0,
  maxSizeInMB = 10,
  className,
  showFileInput = true,
  showButton = true,
  buttonText = "Upload File",
  children,
  ...props
}: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || isUploading) return;
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || isUploading) return;
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
    }
  };

  const validateAndProcessFile = (file: File) => {
    // Check file size
    if (file.size > maxSizeInMB * 1024 * 1024) {
      console.error(`File too large: ${file.size} bytes`);
      return;
    }

    // Check file type based on accept string
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const acceptableExtensions = accept.split(',').map(ext => ext.trim().replace('.', ''));
    
    if (fileExtension && !acceptableExtensions.includes(fileExtension)) {
      console.error(`Invalid file type: ${fileExtension}`);
      return;
    }

    // Valid file, pass it on
    onFileSelect(file);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current && !disabled && !isUploading) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-md transition-colors",
        isDragActive ? "border-primary-500 bg-primary-50" : "border-gray-300",
        disabled || isUploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        // Only trigger if the click is directly on the container, not on child elements
        if (e.currentTarget === e.target) {
          triggerFileInput();
        }
      }}
      {...props}
    >
      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-5 flex flex-col items-center justify-center rounded-md z-10">
          <Progress value={uploadProgress} className="w-3/4 h-2" />
          <span className="mt-2 text-xs font-medium">Uploading... {uploadProgress}%</span>
        </div>
      )}

      <div className="py-5 px-4 text-center">
        {children || (
          <>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="mx-auto h-10 w-10 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-600">
              Drag & drop your file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Supported formats: {accept.replace(/\./g, "").split(",").join(", ")} (Max {maxSizeInMB}MB)
            </p>
            
            {showButton && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || isUploading}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent double triggering with the parent div click
                    triggerFileInput();
                  }}
                  className="inline-flex items-center gap-1"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  {buttonText}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Always include the file input regardless of showFileInput setting */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        disabled={disabled || isUploading}
        className="hidden"
      />
    </div>
  );
}