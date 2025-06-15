import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileCard } from "@/components/file-card";
import { FilePreview } from "@/components/file-preview";
import { ProfileMenu } from "@/components/profile-menu";
import { CinnamorollLoader, CinnamorollSkeleton } from "@/components/cinnamoroll-loader";
import { Search, Star, Moon, Sun, ArrowLeft, AlertTriangle } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useLocation } from "wouter";
import { File, Folder } from "@shared/schema";

export default function FavoritesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const { data: favoriteFiles = [], isLoading, error } = useQuery<File[]>({
    queryKey: ["/api/files/favorites"],
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ["/api/folders"],
  });

  const filteredFiles = favoriteFiles.filter(file =>
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
                  placeholder="Search your favorite files..."
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
        <div className="flex items-center space-x-3 sm:space-x-4 mb-6 min-w-0">
          <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex-shrink-0">
            <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-nunito font-bold text-2xl sm:text-3xl text-cinnamoroll-700 dark:text-kuromi-300 break-words">
              Favorite Files
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 break-words">
              {favoriteFiles.length} files you've starred ⭐
            </p>
          </div>
        </div>

        {/* Files Grid */}
        {error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-6 bg-red-100 dark:bg-red-900/30 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="font-nunito font-semibold text-xl text-gray-800 dark:text-gray-200 mb-2">
              Failed to load favorites
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              We couldn't load your favorite files. Please try refreshing the page.
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
                message="Loading your favorite files..." 
                variant="pulse" 
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
              <FileCard
                key={file.id}
                item={file}
                type="file"
                onPreview={setSelectedFile}
                availableFolders={folders}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="p-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Star className="w-12 h-12 text-yellow-500" />
            </div>
            <h3 className="font-nunito font-bold text-xl text-gray-600 dark:text-gray-300 mb-2">
              No favorite files yet!
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Star some files to see them here ⭐
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

      {/* File Preview Modal */}
      <FilePreview
        file={selectedFile}
        open={!!selectedFile}
        onClose={() => setSelectedFile(null)}
      />
    </div>
  );
}
