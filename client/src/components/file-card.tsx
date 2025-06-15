import { useState, memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  RotateCcw,
  Edit3,
  Move,
  MoreVertical
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
  viewMode?: "grid" | "list";
  availableFolders?: FolderType[];
}

const FileCard = memo(function FileCard({ item, type, onPreview, onFolderClick, showRestoreActions = false, viewMode = "grid", availableFolders = [] }: FileCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [newName, setNewName] = useState(item.name || (item as File).originalName);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/files/${id}/favorite`);
    },
    onSuccess: () => {
      // Invalidate all file-related queries to ensure consistency across folders/favorites/trash
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files/favorites"] });
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
      // Invalidate all queries to ensure files/folders disappear from current view and appear in trash
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files/deleted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files/favorites"] });
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
      // Invalidate all queries to ensure restored items appear in correct locations
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files/deleted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files/favorites"] });
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

  const renameFolderMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      await apiRequest("PUT", `/api/folders/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setShowRenameDialog(false);
      toast({
        title: "Success",
        description: "Folder renamed successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to rename folder",
        variant: "destructive",
      });
    },
  });

  const moveFileMutation = useMutation({
    mutationFn: async ({ fileId, folderId }: { fileId: number; folderId: number | null }) => {
      await apiRequest("PUT", `/api/files/${fileId}/move`, { folderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setShowMoveDialog(false);
      toast({
        title: "Success",
        description: "File moved successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to move file",
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
    const iconClass = "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24";
    if (mimeType.startsWith('image/')) return <FileImage className={iconClass} />;
    if (mimeType.startsWith('video/')) return <FileVideo className={iconClass} />;
    if (mimeType.includes('pdf')) return <FileText className={`${iconClass} text-red-500`} />;
    if (mimeType.includes('document') || mimeType.includes('word')) {
      return <FileText className={`${iconClass} text-blue-500`} />;
    }
    return <FileIcon className={iconClass} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent action if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    if (type === "folder" && onFolderClick) {
      onFolderClick(item as FolderType);
    } else if (type === "file" && onPreview) {
      onPreview(item as File);
    }
  };

  if (viewMode === "list") {
    return (
      <Card 
        className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-cinnamoroll-200 dark:border-kuromi-700 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <div className="p-3 lg:p-4 xl:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3 lg:space-x-4 xl:space-x-5 flex-1 min-w-0">
            {type === "folder" ? (
              <Folder className="w-8 h-8 text-cinnamoroll-400 dark:text-kuromi-400 group-hover:text-kawaii-pink transition-colors flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                {(item as File).mimeType.startsWith('image/') ? (
                  <img 
                    src={`/api/files/${item.id}/preview`} 
                    alt={(item as File).originalName}
                    className="w-8 h-8 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const icon = getFileIcon((item as File).mimeType);
                      const wrapper = e.currentTarget.parentElement;
                      if (wrapper) {
                        wrapper.innerHTML = '';
                        const iconElement = document.createElement('div');
                        iconElement.className = 'w-8 h-8 flex items-center justify-center text-gray-500';
                        wrapper.appendChild(iconElement);
                      }
                    }}
                  />
                ) : (
                  <div className="text-gray-500 scale-50">
                    {getFileIcon((item as File).mimeType)}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex-1 min-w-0 max-w-full">
              <h3 className="font-nunito font-semibold text-sm text-gray-800 dark:text-gray-200 break-words line-clamp-1 pr-2">
                {type === "folder" ? item.name : (item as File).originalName}
              </h3>
              {type === "file" && (
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                  <span className="truncate">{formatFileSize((item as File).size)}</span>
                  <span>•</span>
                  <span className="truncate">{new Date((item as File).createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* List view actions - always visible on mobile, hover on desktop */}
          <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {type === "file" && !showRestoreActions && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavoriteMutation.mutate(item.id);
                  }}
                  className="p-1 h-auto"
                  disabled={toggleFavoriteMutation.isPending}
                >
                  <Star className={`w-4 h-4 ${(item as File).isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview?.(item as File);
                  }}
                  className="p-1 h-auto"
                >
                  <Eye className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadFile(item as File);
                  }}
                  className="p-1 h-auto"
                >
                  <Download className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(item.id);
                  }}
                  className="p-1 h-auto"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 h-auto"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMoveDialog(true);
                      }}
                    >
                      <Move className="w-4 h-4 mr-2" />
                      Move file
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            {type === "folder" && !showRestoreActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 h-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRenameDialog(true);
                    }}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Rename folder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(item.id);
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {showRestoreActions && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    restoreMutation.mutate(item.id);
                  }}
                  className="p-1 h-auto"
                  disabled={restoreMutation.isPending}
                >
                  <RotateCcw className="w-4 h-4 text-green-500" />
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
    <Card 
      className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-cinnamoroll-200 dark:border-kuromi-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="p-3 sm:p-4 lg:p-5 xl:p-6">
        <div className="text-center mb-3">
          {type === "folder" ? (
            <div className="mb-3">
              <Folder className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 text-cinnamoroll-400 dark:text-kuromi-400 group-hover:text-kawaii-pink transition-colors mx-auto" />
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

        <div className="text-center min-w-0">
          <h3 className="font-nunito font-medium text-sm text-gray-700 dark:text-gray-300 break-words line-clamp-2 px-1">
            {type === "folder" ? item.name : (item as File).originalName}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {type === "folder" 
              ? "Folder" 
              : formatFileSize((item as File).size)
            }
          </p>
        </div>

        <div className="transition-opacity duration-200 mt-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
          <div className="flex justify-between items-center">
            <div className="flex space-x-1">
              {type === "file" && !showRestoreActions && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-1 hover:bg-cinnamoroll-100 dark:hover:bg-kuromi-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteMutation.mutate(item.id);
                    }}
                    disabled={toggleFavoriteMutation.isPending}
                  >
                    <Star className={`w-4 h-4 ${(item as File).isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-1 hover:bg-cinnamoroll-100 dark:hover:bg-kuromi-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview?.(item as File);
                    }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    restoreMutation.mutate(item.id);
                  }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(item as File);
                      }}
                    >
                      <Download className="w-4 h-4 text-cinnamoroll-500 dark:text-kuromi-400" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(item.id);
                    }}
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
    
    {/* Rename Folder Dialog */}
    {showRenameDialog && (
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
          <DialogDescription>
            Enter a new name for this folder.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="col-span-3"
              placeholder="Enter folder name"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (newName.trim()) {
                renameFolderMutation.mutate({ id: item.id, name: newName.trim() });
              }
            }}
            disabled={renameFolderMutation.isPending || !newName.trim()}
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    )}

    {/* Move File Dialog */}
    {showMoveDialog && (
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move File</DialogTitle>
          <DialogDescription>
            Select a destination folder for this file.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="folder" className="text-right">
              Folder
            </Label>
            <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main Drive</SelectItem>
                {availableFolders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id.toString()}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              const targetFolderId = selectedFolderId === "main" ? null : parseInt(selectedFolderId);
              moveFileMutation.mutate({ fileId: item.id, folderId: targetFolderId });
            }}
            disabled={moveFileMutation.isPending || !selectedFolderId}
          >
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    )}
    </>
  );
});

export { FileCard };
