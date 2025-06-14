import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  Eye, 
  Download, 
  Trash2, 
  FileText, 
  FileImage, 
  FileVideo, 
  File as FileIcon,
  Folder,
  RotateCcw
} from "lucide-react";
import { File, Folder as FolderType } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FileCardProps {
  item: File | FolderType;
  type: "file" | "folder";
  onPreview?: (file: File) => void;
  onFolderClick?: (folder: FolderType) => void;
  showRestoreActions?: boolean;
}

export function FileCard({ item, type, onPreview, onFolderClick, showRestoreActions = false }: FileCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/files/${id}/favorite`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "Success",
        description: "File favorite status updated! ⭐",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const endpoint = type === "file" ? `/api/files/${id}` : `/api/folders/${id}`;
      await apiRequest("DELETE", endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({
        title: "Success",
        description: `${type === "file" ? "File" : "Folder"} moved to trash! 🗑️`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to delete ${type}`,
        variant: "destructive",
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      const endpoint = type === "file" ? `/api/files/${id}/restore` : `/api/folders/${id}/restore`;
      await apiRequest("POST", endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({
        title: "Success",
        description: `${type === "file" ? "File" : "Folder"} restored! ✨`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to restore ${type}`,
        variant: "destructive",
      });
    },
  });

  const downloadFile = async (file: File) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`, {
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

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="w-16 h-16" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="w-16 h-16" />;
    if (mimeType.includes('pdf')) return <FileText className="w-16 h-16 text-red-500" />;
    if (mimeType.includes('document') || mimeType.includes('word')) {
      return <FileText className="w-16 h-16 text-blue-500" />;
    }
    return <FileIcon className="w-16 h-16" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClick = () => {
    if (type === "folder" && onFolderClick) {
      onFolderClick(item as FolderType);
    } else if (type === "file" && onPreview) {
      onPreview(item as File);
    }
  };

  return (
    <Card 
      className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-cinnamoroll-200 dark:border-kuromi-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="text-center mb-3">
          {type === "folder" ? (
            <div className="mb-3">
              <Folder className="w-16 h-16 text-cinnamoroll-400 dark:text-kuromi-400 group-hover:text-kawaii-pink transition-colors mx-auto" />
            </div>
          ) : (
            <div className="aspect-square bg-gradient-to-br from-kawaii-pink to-kawaii-purple dark:from-kuromi-600 dark:to-kawaii-purple p-4 flex items-center justify-center rounded-lg mb-3">
              {(item as File).mimeType.startsWith('image/') ? (
                <img 
                  src={`/api/files/${item.id}/preview`} 
                  alt={(item as File).originalName}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                getFileIcon((item as File).mimeType)
              )}
            </div>
          )}
        </div>

        <div className="text-center">
          <h3 className="font-nunito font-medium text-sm text-gray-700 dark:text-gray-300 truncate">
            {type === "folder" ? item.name : (item as File).originalName}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {type === "folder" 
              ? "Folder" 
              : formatFileSize((item as File).size)
            }
          </p>
        </div>

        <div className={`transition-opacity duration-200 mt-3 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex justify-between items-center">
            <div className="flex space-x-1">
              {type === "file" && !showRestoreActions && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-1 hover:bg-cinnamoroll-100 dark:hover:bg-kuromi-800"
                    onClick={() => toggleFavoriteMutation.mutate(item.id)}
                    disabled={toggleFavoriteMutation.isPending}
                  >
                    <Star className={`w-4 h-4 ${(item as File).isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-1 hover:bg-cinnamoroll-100 dark:hover:bg-kuromi-800"
                    onClick={() => onPreview?.(item as File)}
                  >
                    <Eye className="w-4 h-4 text-cinnamoroll-500 dark:text-kuromi-400" />
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex space-x-1">
              {showRestoreActions ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20"
                  onClick={() => restoreMutation.mutate(item.id)}
                  disabled={restoreMutation.isPending}
                >
                  <RotateCcw className="w-4 h-4 text-green-500" />
                </Button>
              ) : (
                <>
                  {type === "file" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="p-1 hover:bg-cinnamoroll-100 dark:hover:bg-kuromi-800"
                      onClick={() => downloadFile(item as File)}
                    >
                      <Download className="w-4 h-4 text-cinnamoroll-500 dark:text-kuromi-400" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20"
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
