import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CloudUpload, X, Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUploadProgress } from "@/hooks/use-upload-progress";
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
  const { 
    addUpload, 
    updateProgress, 
    completeUpload, 
    setActiveUpload, 
    removeActiveUpload,
    cancelUpload,
    uploads,
    activeUploads 
  } = useUploadProgress();

  // Clean up when modal closes or component unmounts
  useEffect(() => {
    if (!open) {
      // Don't cancel uploads when modal closes - let them continue in background
      // Only reset UI state
      setSelectedFiles([]);
      setDragActive(false);
    }
  }, [open]);

  // Don't cleanup uploads on modal close - let them continue in background
  // Only cleanup if explicitly requested by user or page unload

  // Compress images if they're too large, skip videos for faster upload
  const compressFile = async (file: File): Promise<File> => {
    // Skip compression for videos and large files to improve upload speed
    if (file.type.startsWith('video/') || file.size > 50 * 1024 * 1024) {
      return file;
    }
    
    // Only compress images larger than 2MB
    if (file.type.startsWith('image/') && file.size > 2 * 1024 * 1024) {
      try {
        const options = {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.85,
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

  // Optimized upload with progress tracking for large files
  const uploadFileWithProgress = useCallback(async (file: File) => {
    const processedFile = await compressFile(file);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', processedFile);
      if (folderId) {
        formData.append('folderId', folderId.toString());
      }

      // Track this upload
      setActiveUpload(file.name, xhr);

      // Set timeout for large files (5 minutes)
      xhr.timeout = 5 * 60 * 1000;

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          updateProgress(file.name, percentComplete);
          console.log(`Upload progress for ${file.name}: ${Math.round(percentComplete)}%`);
        }
      });

      // Add loadstart event to ensure progress tracking starts
      xhr.upload.addEventListener('loadstart', () => {
        console.log(`Upload started for ${file.name}`);
        updateProgress(file.name, 1); // Set to 1% to show it started
      });

      xhr.addEventListener('load', () => {
        console.log(`Upload load event for ${file.name}:`, {
          status: xhr.status,
          responseText: xhr.responseText.substring(0, 200)
        });

        // Remove from active uploads
        removeActiveUpload(file.name);

        if (xhr.status === 200 || xhr.status === 201) {
          try {
            updateProgress(file.name, 100);
            const response = JSON.parse(xhr.responseText);
            console.log(`Upload successful for ${file.name}:`, response);
            resolve(response);
          } catch (parseError) {
            console.error('Failed to parse upload response:', parseError, xhr.responseText);
            reject(new Error(`Invalid response for ${file.name}`));
          }
        } else {
          console.error(`Upload failed for ${file.name}:`, xhr.status, xhr.responseText);
          reject(new Error(`Upload failed with status ${xhr.status} for ${file.name}`));
        }
      });

      xhr.addEventListener('error', (event) => {
        console.error(`Upload error for ${file.name}:`, event);
        removeActiveUpload(file.name);
        reject(new Error(`Network error uploading ${file.name}`));
      });

      xhr.addEventListener('timeout', (event) => {
        console.error(`Upload timeout for ${file.name}:`, event);
        removeActiveUpload(file.name);
        reject(new Error(`Upload timeout for ${file.name}`));
      });

      xhr.addEventListener('abort', (event) => {
        console.log(`Upload cancelled for ${file.name}:`, event);
        removeActiveUpload(file.name);
        reject(new Error(`Upload cancelled for ${file.name}`));
      });

      xhr.open('POST', '/api/files');
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }, [folderId, setActiveUpload, updateProgress, removeActiveUpload]);

  // Enhanced upload function that handles individual file completion
  const uploadFileIndividually = useCallback(async (file: File) => {
    console.log(`Starting upload for ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`);
    
    try {
      // Add to upload tracking first
      addUpload(file.name);
      
      // Initialize progress to 0%
      updateProgress(file.name, 0);
      
      // Start the upload
      const result = await uploadFileWithProgress(file);
      
      // Only complete if upload was successful
      if (result) {
        completeUpload(file.name);
        
        // Invalidate queries for immediate UI update
        queryClient.invalidateQueries({ queryKey: ["/api/files"] });
        
        // Show individual success toast
        toast({
          title: "File Uploaded",
          description: `${file.name} uploaded successfully!`,
        });
        
        console.log(`Upload completed successfully for ${file.name}`);
      }
      
      return result;
    } catch (error) {
      // Remove from upload tracking on error
      removeActiveUpload(file.name);
      cancelUpload(file.name);
      
      // Handle individual file error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${file.name}: ${errorMessage}`,
        variant: "destructive",
      });
      console.error('Upload error for', file.name, errorMessage, error);
      throw error;
    }
  }, [queryClient, toast, uploadFileWithProgress, addUpload, completeUpload, removeActiveUpload, updateProgress, cancelUpload]);

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      console.log(`Starting batch upload of ${files.length} files`);
      
      // Start uploads individually with delay to prevent race conditions
      files.forEach((file, index) => {
        setTimeout(() => {
          uploadFileIndividually(file).catch(error => {
            console.error('Background upload failed:', file.name, error);
          });
        }, index * 100); // Stagger uploads by 100ms
      });
      
      return files;
    },
    onSuccess: (files) => {
      // Clear selected files and show toast
      setSelectedFiles([]);
      toast({
        title: "Upload Started",
        description: `${files.length} files are uploading in the background`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Error", 
        description: error.message || "Failed to start uploads",
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
      <DialogContent className="max-w-lg w-[95vw] sm:w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-4 sm:p-6">
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
            className={`border-2 border-dashed rounded-2xl p-4 sm:p-8 text-center transition-all cursor-pointer ${
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
            <div className="cloud-shape w-12 h-8 sm:w-16 sm:h-10 gradient-cinnamoroll dark:gradient-kuromi mx-auto mb-3 sm:mb-4 animate-bounce-soft"></div>
            <h4 className="font-nunito font-semibold text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-2">
              Drop your files here
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
              or click to browse
            </p>
            <Button
              type="button"
              className="w-full sm:w-auto gradient-cinnamoroll dark:gradient-kuromi font-nunito font-medium text-sm sm:text-base"
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
              <div className="flex items-center justify-between">
                <h5 className="font-nunito font-semibold text-sm text-gray-700 dark:text-gray-300">
                  Selected Files ({selectedFiles.length})
                </h5>
                {activeUploads.size > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      activeUploads.forEach(xhr => xhr.abort());
                    }}
                    className="text-xs"
                  >
                    Cancel All
                  </Button>
                )}
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-cinnamoroll-50 dark:bg-kuromi-900/50 rounded-lg space-y-2 sm:space-y-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                      {/* Progress bar for uploads */}
                      {uploads.find(u => u.fileName === file.name) && (
                        <div className="mt-1">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                uploads.find(u => u.fileName === file.name)?.isComplete
                                  ? "bg-green-500" 
                                  : "bg-gradient-to-r from-kawaii-pink to-kawaii-purple"
                              }`}
                              style={{ width: `${uploads.find(u => u.fileName === file.name)?.progress || 0}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {uploads.find(u => u.fileName === file.name)?.isComplete
                              ? "✓ Upload complete" 
                              : `${Math.round(uploads.find(u => u.fileName === file.name)?.progress || 0)}% uploaded`
                            }
                          </p>
                        </div>
                      )}
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
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                {activeUploads.size > 0 && (
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Close & Continue in Background
                  </Button>
                )}
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="w-full sm:w-auto gradient-cinnamoroll dark:gradient-kuromi font-nunito font-medium"
                >
                  {uploadMutation.isPending ? (
                    <div className="flex items-center justify-center space-x-2">
                      <CinnamorollSpinner />
                      <span className="hidden sm:inline">Starting uploads...</span>
                      <span className="sm:hidden">Starting...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Start Upload</span>
                      <span className="sm:hidden">Upload</span>
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
