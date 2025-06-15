import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Upload, ChevronUp, ChevronDown } from "lucide-react";
import { CinnamorollSpinner } from "./cinnamoroll-loader";

interface UploadProgress {
  fileName: string;
  progress: number;
  isComplete: boolean;
}

interface BackgroundUploadProgressProps {
  uploads: UploadProgress[];
  onCancel?: (fileName: string) => void;
  onCancelAll?: () => void;
}

export function BackgroundUploadProgress({ uploads, onCancel, onCancelAll }: BackgroundUploadProgressProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(uploads.length > 0);
  }, [uploads.length]);

  if (!isVisible) return null;

  const activeUploads = uploads.filter(u => !u.isComplete);
  const completedUploads = uploads.filter(u => u.isComplete);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
      <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-cinnamoroll-200 dark:border-kuromi-700 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-cinnamoroll-200 dark:border-kuromi-700">
          <div className="flex items-center space-x-2">
            <Upload className="w-4 h-4 text-cinnamoroll-500 dark:text-kuromi-400" />
            <span className="font-nunito font-medium text-sm text-gray-700 dark:text-gray-300">
              Uploading {activeUploads.length} file{activeUploads.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-auto"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelAll}
              className="p-1 h-auto text-gray-500 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress List */}
        {isExpanded && (
          <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
            {uploads.map((upload, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate flex-1 mr-2 text-gray-700 dark:text-gray-300">
                    {upload.fileName}
                  </span>
                  <div className="flex items-center space-x-1">
                    {upload.isComplete ? (
                      <span className="text-green-500 font-medium">✓</span>
                    ) : (
                      <>
                        <span className="text-gray-500">{Math.round(upload.progress)}%</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onCancel?.(upload.fileName)}
                          className="p-0.5 h-auto text-gray-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      upload.isComplete 
                        ? "bg-green-500" 
                        : "bg-gradient-to-r from-kawaii-pink to-kawaii-purple"
                    }`}
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!isExpanded && activeUploads.length > 0 && (
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CinnamorollSpinner className="w-4 h-4" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {completedUploads.length}/{uploads.length} complete
              </span>
            </div>
            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-kawaii-pink to-kawaii-purple h-1.5 rounded-full transition-all duration-300"
                style={{ 
                  width: `${uploads.length > 0 ? (completedUploads.length / uploads.length) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}