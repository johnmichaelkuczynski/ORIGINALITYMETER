import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Image, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadProps {
  onDocumentProcessed: (content: string, filename?: string, type?: 'content' | 'style') => void;
  acceptImages?: boolean;
  placeholder?: string;
  sourceType?: 'content' | 'style';
  className?: string;
}

interface UploadedFile {
  file: File;
  id: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  content?: string;
  error?: string;
}

export default function DocumentUpload({ 
  onDocumentProcessed, 
  acceptImages = true, 
  placeholder,
  sourceType,
  className = "" 
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const acceptedTypes = acceptImages 
    ? '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png'
    : '.pdf,.doc,.docx,.txt';

  const processFile = async (uploadedFile: UploadedFile) => {
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile.file);
      
      // Update status to processing
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'processing', progress: 50 } 
          : f
      ));

      const response = await fetch('/api/process-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to process document: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update status to completed
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'completed', progress: 100, content: result.content } 
          : f
      ));

      // Call the callback with processed content
      onDocumentProcessed(result.content, uploadedFile.file.name, sourceType);
      
      toast({
        title: "Document processed successfully",
        description: `${uploadedFile.file.name} has been processed and ready to use.`,
      });

    } catch (error) {
      console.error('Error processing file:', error);
      
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { 
              ...f, 
              status: 'error', 
              progress: 0, 
              error: error instanceof Error ? error.message : 'Processing failed' 
            } 
          : f
      ));

      toast({
        title: "Error processing document",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach(file => {
      const id = Math.random().toString(36).substr(2, 9);
      const uploadedFile: UploadedFile = {
        file,
        id,
        status: 'uploading',
        progress: 0,
      };

      setFiles(prev => [...prev, uploadedFile]);
      
      // Start processing
      setTimeout(() => processFile(uploadedFile), 100);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'error':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className={className}>
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-6">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-gray-400">
              {acceptImages ? <Upload className="h-12 w-12" /> : <FileText className="h-12 w-12" />}
            </div>
            <p className="mb-2 text-sm text-gray-600">
              {placeholder || `Drag and drop your ${acceptImages ? 'documents or images' : 'documents'} here, or`}
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mb-4"
            >
              Choose Files
            </Button>
            <p className="text-xs text-gray-500">
              Supported formats: {acceptImages ? 'PDF, Word, TXT, JPG, PNG' : 'PDF, Word, TXT'}
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
          {files.map((file) => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {getStatusIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Badge className={getStatusColor(file.status)}>
                    {file.status}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {(file.status === 'uploading' || file.status === 'processing') && (
                <div className="mt-2">
                  <Progress value={file.progress} className="h-2" />
                </div>
              )}
              
              {file.status === 'error' && file.error && (
                <p className="mt-2 text-xs text-red-600">{file.error}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}