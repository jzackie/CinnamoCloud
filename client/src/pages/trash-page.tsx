import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileCard } from "@/components/file-card";
import { ProfileMenu } from "@/components/profile-menu";
import { CinnamorollLoader } from "@/components/cinnamoroll-loader";
import { Search, Trash2, Moon, Sun, ArrowLeft, AlertTriangle } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { File } from "@shared/schema";

export default function TrashPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const { data: deletedFiles = [], isLoading } = useQuery<File[]>({
    queryKey: ["/api/files/deleted"],
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
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/')}
                className="p-2 rounded-full hover:bg-cinnamoroll-100 dark:hover:bg-kuromi-800 mr-2"
              >
                <ArrowLeft className="w-4 h-4 text-cinnamoroll-600 dark:text-kuromi-400" />
              </Button>
              <div className="cloud-shape w-10 h-6 gradient-cinnamoroll dark:gradient-kuromi animate-float"></div>
              <h1 className="font-nunito font-bold text-xl text-cinnamoroll-600 dark:text-kuromi-400">
                CinnamoCloud
              </h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
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
            <div className="flex items-center space-x-4">
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
              
              <ProfileMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="font-nunito font-bold text-3xl text-cinnamoroll-700 dark:text-kuromi-300">
                Trash
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
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
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Empty Trash
            </Button>
          )}
        </div>

        {/* Files Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <CinnamorollLoader 
              size="lg" 
              message="Loading deleted kawaii files..." 
              variant="cloud" 
            />
          </div>
        ) : filteredFiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <TrashFileCard
                key={file.id}
                file={file}
                onPermanentDelete={() => permanentDeleteMutation.mutate(file.id)}
                isPermanentDeleting={permanentDeleteMutation.isPending}
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
