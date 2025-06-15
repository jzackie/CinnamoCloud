import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileCard } from "@/components/file-card";
import { ProfileMenu } from "@/components/profile-menu";
import { CinnamorollLoader } from "@/components/cinnamoroll-loader";
import { 
  Search, 
  Trash2, 
  Moon, 
  Sun, 
  ArrowLeft, 
  AlertTriangle, 
  RotateCcw,
  FileText,
  FileImage,
  FileVideo,
  File as FileIcon
} from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { File, Folder } from "@shared/schema";

interface TrashFileCardProps {
  file: File;
  onPermanentDelete: () => void;
  isPermanentDeleting: boolean;
  availableFolders?: Folder[];
}

function TrashFileCard({ file, onPermanentDelete, isPermanentDeleting, availableFolders = [] }: TrashFileCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();

  const restoreMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/files/${file.id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files/deleted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "Success",
        description: "File restored successfully! ✨",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore file",
        variant: "destructive",
      });
    },
  });

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

  return (
    <Card 
      className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-red-200 dark:border-red-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4">
        <div className="flex flex-col items-center text-center min-w-0">
          <div className="text-red-400 dark:text-red-300 mb-3 opacity-60">
            {getFileIcon(file.mimeType)}
          </div>
          <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1 line-clamp-2 px-1 break-words w-full">
            {file.originalName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(file.size)}
          </p>
        </div>

        <div className="transition-opacity duration-200 mt-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
          <div className="flex justify-between items-center">
            <Button
              size="sm"
              variant="ghost"
              className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20"
              onClick={(e) => {
                e.stopPropagation();
                restoreMutation.mutate();
              }}
              disabled={restoreMutation.isPending}
            >
              <RotateCcw className="w-4 h-4 text-green-500" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Permanently delete "${file.originalName}"? This cannot be undone.`)) {
                  onPermanentDelete();
                }
              }}
              disabled={isPermanentDeleting}
            >
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function TrashPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const { data: deletedFiles = [], isLoading, error } = useQuery<File[]>({
    queryKey: ["/api/files/deleted"],
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ["/api/folders/all"],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/folders/all`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch all folders');
      return response.json();
    }
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest("DELETE", `/api/files/${fileId}/permanent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files/deleted"] });
      toast({
        title: "Permanently deleted",
        description: "File has been permanently deleted and cannot be recovered.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to permanently delete file",
        variant: "destructive",
      });
    },
  });

  const filteredFiles = deletedFiles.filter(file =>
    file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-cinnamoroll-200 dark:border-kuromi-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 min-w-0">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/')}
                className="p-2 rounded-full hover:bg-cinnamoroll-100 dark:hover:bg-kuromi-800"
              >
                <ArrowLeft className="w-4 h-4 text-cinnamoroll-600 dark:text-kuromi-400" />
              </Button>
              <div className="cloud-shape w-8 h-5 sm:w-10 sm:h-6 gradient-cinnamoroll dark:gradient-kuromi animate-float flex-shrink-0"></div>
              <h1 className="font-nunito font-bold text-lg sm:text-xl text-cinnamoroll-600 dark:text-kuromi-400 hidden sm:block">
                CinnamoCloud
              </h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-2 sm:mx-4 lg:mx-8 hidden md:block">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search in trash..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-cinnamoroll-200 dark:border-kuromi-600 bg-white/50 dark:bg-gray-700/50 focus:border-cinnamoroll-400 dark:focus:border-kuromi-400"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cinnamoroll-400 dark:text-kuromi-400" />
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2 rounded-full bg-cinnamoroll-100 dark:bg-kuromi-800 hover:bg-cinnamoroll-200 dark:hover:bg-kuromi-700"
              >
                {theme === "light" ? (
                  <Moon className="w-4 h-4 text-cinnamoroll-600" />
                ) : (
                  <Sun className="w-4 h-4 text-kuromi-400" />
                )}
              </Button>
              
              <div className="relative">
                <ProfileMenu />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl flex-shrink-0">
              <Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-nunito font-bold text-2xl sm:text-3xl text-cinnamoroll-700 dark:text-kuromi-300 break-words">
                Trash
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 break-words">
                {deletedFiles.length} deleted files (can be restored)
              </p>
            </div>
          </div>
          
          {deletedFiles.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => {
                if (window.confirm(`Permanently delete all ${deletedFiles.length} files? This cannot be undone.`)) {
                  deletedFiles.forEach(file => permanentDeleteMutation.mutate(file.id));
                }
              }}
              disabled={permanentDeleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto flex-shrink-0"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Empty Trash</span>
              <span className="sm:hidden">Empty</span>
            </Button>
          )}
        </div>

        {/* Files Grid */}
        {error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-6 bg-red-100 dark:bg-red-900/30 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="font-nunito font-semibold text-xl text-gray-800 dark:text-gray-200 mb-2">
              Failed to load trash
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              We couldn't load your deleted files. Please try refreshing the page.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-cinnamoroll-500 hover:bg-cinnamoroll-600 dark:bg-kuromi-500 dark:hover:bg-kuromi-600"
            >
              Refresh Page
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8">
              <CinnamorollLoader 
                size="md" 
                message="Loading deleted files..." 
                variant="bounce" 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32 mb-2"></div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 mb-1"></div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredFiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <TrashFileCard
                key={file.id}
                file={file}
                onPermanentDelete={() => permanentDeleteMutation.mutate(file.id)}
                isPermanentDeleting={permanentDeleteMutation.isPending}
                availableFolders={folders}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="p-6 bg-red-100 dark:bg-red-900/30 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Trash2 className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="font-nunito font-bold text-xl text-gray-600 dark:text-gray-300 mb-2">
              Trash is empty!
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              No deleted files to show ✨
            </p>
            <Button
              onClick={() => setLocation('/')}
              className="gradient-cinnamoroll dark:gradient-kuromi text-white rounded-2xl font-nunito font-semibold"
            >
              Browse Files
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
