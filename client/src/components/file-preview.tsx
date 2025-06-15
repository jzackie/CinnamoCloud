import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { File } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface FilePreviewProps {
  file: File | null;
  open: boolean;
  onClose: () => void;
}

export function FilePreview({ file, open, onClose }: FilePreviewProps) {
  const { toast } = useToast();

  if (!file) return null;

  const downloadFile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/files/${file.id}/download`, {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Download started! 📥✨",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const renderPreview = () => {
    const previewUrl = `/api/files/${file.id}/preview`;
    
    if (file.mimeType.startsWith('image/')) {
      return (
        <img 
          src={previewUrl} 
          alt={file.originalName}
          className="max-w-full max-h-[70vh] object-contain rounded-lg"
        />
      );
    }
    
    if (file.mimeType.startsWith('video/')) {
      return (
        <video 
          controls 
          className="max-w-full max-h-[70vh] rounded-lg"
          preload="metadata"
          controlsList="nodownload"
          playsInline
        >
          <source src={previewUrl} type={file.mimeType} />
          Your browser does not support the video tag.
        </video>
      );
    }
    
    if (file.mimeType === 'application/pdf') {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-[70vh] rounded-lg"
          title={file.originalName}
        />
      );
    }
    
    // For other file types, show a download prompt
    return (
      <div className="text-center py-16">
        <div className="cloud-shape w-24 h-16 gradient-cinnamoroll dark:gradient-kuromi mx-auto mb-6 animate-float"></div>
        <h3 className="font-nunito font-bold text-xl text-gray-600 dark:text-gray-300 mb-2">
          Preview not available
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Download the file to view its contents
        </p>
        <Button onClick={downloadFile} className="gradient-cinnamoroll dark:gradient-kuromi">
          <Download className="w-4 h-4 mr-2" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-nunito font-bold text-lg">
              {file.originalName}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={downloadFile}
                className="border-cinnamoroll-200 dark:border-kuromi-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="hover:bg-cinnamoroll-100 dark:hover:bg-kuromi-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex justify-center items-center">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
