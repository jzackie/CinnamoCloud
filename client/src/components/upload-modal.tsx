import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CloudUpload, X, Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CinnamorollLoader, CinnamorollSpinner } from "@/components/cinnamoroll-loader";
import imageCompression from "browser-image-compression";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  folderId?: number | null;
}

export function UploadModal({ open, onClose, folderId }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Compress images if they're too large
  const compressFile = async (file: File): Promise<File> => {
    // Only compress images larger than 2MB
    if (file.type.startsWith('image/') && file.size > 2 * 1024 * 1024) {
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        
        // Create a new file with original name but compressed content
        return new File([compressedFile], file.name, {
          type: compressedFile.type,
          lastModified: Date.now(),
        });
      } catch (error) {
        console.warn('Compression failed, using original file:', error);
        return file;
      }
    }
    return file;
  };

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploadPromises = files.map(async (file) => {
        // Compress file if needed
        const processedFile = await compressFile(file);
        
        const formData = new FormData();
        formData.append('file', processedFile);
        if (folderId) {
          formData.append('folderId', folderId.toString());
        }

        const response = await fetch('/api/files', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        return response.json();
      });

      return Promise.all(uploadPromises);
    },
    onSuccess: () => {
      // Invalidate all file queries to ensure files appear in current folder
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "Success",
        description: `${selectedFiles.length} file(s) uploaded successfully! 📤✨`,
      });
      setSelectedFiles([]);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      uploadMutation.mutate(selectedFiles);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-nunito font-bold text-lg">
              Upload Kawaii Files
            </DialogTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="hover:bg-cinnamoroll-100 dark:hover:bg-kuromi-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? "border-kawaii-pink bg-kawaii-pink/10"
                : "border-cinnamoroll-300 dark:border-kuromi-600 hover:border-cinnamoroll-400 dark:hover:border-kuromi-500"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="cloud-shape w-16 h-10 gradient-cinnamoroll dark:gradient-kuromi mx-auto mb-4 animate-bounce-soft"></div>
            <h4 className="font-nunito font-semibold text-lg text-gray-700 dark:text-gray-300 mb-2">
              Drop your kawaii files here
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              or click to browse
            </p>
            <Button
              type="button"
              className="gradient-cinnamoroll dark:gradient-kuromi font-nunito font-medium"
            >
              <CloudUpload className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
          </div>

          <Input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-nunito font-semibold text-sm text-gray-700 dark:text-gray-300">
                Selected Files ({selectedFiles.length})
              </h5>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-cinnamoroll-50 dark:bg-kuromi-900/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedFiles(files => files.filter((_, i) => i !== index));
                      }}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20"
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="gradient-cinnamoroll dark:gradient-kuromi font-nunito font-medium"
                >
                  {uploadMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <CinnamorollSpinner />
                      <span>Uploading kawaii files...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Supports: Images, Videos, PDFs, Documents and more! ✨
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
