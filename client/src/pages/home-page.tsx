import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CinnamorollLoader, CinnamorollSkeleton, CinnamorollSpinner } from "@/components/cinnamoroll-loader";
import { 
  Search, 
  Grid3x3, 
  List, 
  FolderPlus, 
  Upload, 
  Home,
  Users,
  Clock,
  Star,
  Trash2,
  Image,
  Video,
  FileText,
  File as FileIcon,
  Moon,
  Sun,
  Infinity,
  Trophy
} from "lucide-react";
import { FileCard } from "@/components/file-card";
import { FilePreview } from "@/components/file-preview";
import { UploadModal } from "@/components/upload-modal";
import { ProfileMenu } from "@/components/profile-menu";
import { useTheme } from "@/lib/theme-provider";
import { useLanguage } from "@/lib/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { File, Folder } from "@shared/schema";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [currentCategory, setCurrentCategory] = useState<string>("all");
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  // Debounced search for performance optimization
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: folders = [], isLoading: foldersLoading } = useQuery<Folder[]>({
    queryKey: ["/api/folders", currentFolderId],
    queryFn: async () => {
      const url = currentFolderId 
        ? `/api/folders?parentId=${currentFolderId}`
        : "/api/folders";
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json();
    }
  });

  // Fetch ALL folders for file movement (not filtered by current folder)
  const { data: allFolders = [] } = useQuery<Folder[]>({
    queryKey: ["/api/folders/all"],
    queryFn: async () => {
      const response = await fetch("/api/folders/all", { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch all folders');
      return response.json();
    }
  });

  const { data: files = [], isLoading: filesLoading } = useQuery<File[]>({
    queryKey: ["/api/files", currentFolderId],
    queryFn: async () => {
      const url = currentFolderId 
        ? `/api/files?folderId=${currentFolderId}`
        : "/api/files";
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    }
  });

  // Memoized callbacks for better performance
  const handleFolderClick = useCallback((folder: Folder) => {
    setCurrentFolderId(folder.id);
  }, []);

  const handleBackToParent = useCallback(() => {
    setCurrentFolderId(null);
  }, []);

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/folders", { 
        name,
        parentId: currentFolderId 
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders", currentFolderId] });
      setFolderDialogOpen(false);
      setNewFolderName("");
      toast({
        title: "Folder created",
        description: "Your new folder has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Memoized filtered files with debounced search for better performance
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      if (currentCategory === "all") return matchesSearch;
      if (currentCategory === "images") return matchesSearch && file.mimeType?.startsWith("image/");
      if (currentCategory === "videos") return matchesSearch && file.mimeType?.startsWith("video/");
      if (currentCategory === "pdfs") return matchesSearch && file.mimeType === "application/pdf";
      if (currentCategory === "documents") return matchesSearch && (
        file.mimeType?.includes("document") || 
        file.mimeType?.includes("text") || 
        file.mimeType?.includes("sheet") || 
        file.mimeType?.includes("presentation")
      );
      
      return matchesSearch;
    });
  }, [files, debouncedSearchQuery, currentCategory]);

  // Memoized filtered items with debounced search for better performance
  const filteredItems = useMemo(() => {
    return [...folders, ...files].filter(item => {
      const name = "originalName" in item ? item.originalName : item.name;
      return name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    });
  }, [folders, files, debouncedSearchQuery]);

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-cinnamoroll-200 dark:border-kuromi-700 shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-2 sm:px-4 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex justify-between items-center h-14 sm:h-16 lg:h-18">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="cloud-shape cloud-shape-enhanced w-8 h-5 sm:w-10 sm:h-6 gradient-cinnamoroll dark:gradient-kuromi animate-float"></div>
              <h1 className="font-nunito font-bold text-lg sm:text-xl text-cinnamoroll-600 dark:text-kuromi-400">
                {t("cinnamocloud")}
              </h1>
            </div>

            {/* Search Bar - Hidden on small screens */}
            <div className="hidden md:flex flex-1 max-w-lg lg:max-w-xl xl:max-w-2xl mx-8 lg:mx-12 xl:mx-16">
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder={t("search_files")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 lg:py-3 text-sm lg:text-base rounded-full border-2 border-cinnamoroll-200 dark:border-kuromi-600 bg-white/50 dark:bg-gray-700/50 focus:border-cinnamoroll-400 dark:focus:border-kuromi-400"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-cinnamoroll-400 dark:text-kuromi-400" />
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
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

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 py-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-b border-cinnamoroll-200 dark:border-kuromi-700">
        <div className="relative">
          <Input
            type="text"
            placeholder={t("search_files")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-cinnamoroll-200 dark:border-kuromi-600 bg-white/50 dark:bg-gray-700/50 focus:border-cinnamoroll-400 dark:focus:border-kuromi-400"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cinnamoroll-400 dark:text-kuromi-400" />
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-16 sm:w-20 md:w-56 lg:w-64 xl:w-72 2xl:w-80 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-r border-cinnamoroll-200 dark:border-kuromi-700 p-2 sm:p-4 lg:p-6">
          {/* Upload Button */}
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="w-full mb-4 sm:mb-6 p-2 sm:p-3 gradient-cinnamoroll dark:gradient-kuromi text-white rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-nunito font-semibold text-sm sm:text-base"
          >
            <Upload className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("upload_files")}</span>
          </Button>

          {/* Navigation Menu */}
          <nav className="space-y-1 sm:space-y-2">
            <Button
              variant="ghost"
              className={`w-full justify-start p-2 sm:p-3 rounded-xl transition-all text-sm sm:text-base ${
                currentCategory === 'all' && !currentFolderId
                  ? 'text-cinnamoroll-600 dark:text-kuromi-400 bg-cinnamoroll-50 dark:bg-kuromi-900/50'
                  : 'hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50'
              }`}
              onClick={() => {
                setCurrentCategory('all');
                setCurrentFolderId(null);
              }}
            >
              <Home className="w-4 h-4 sm:mr-3" />
              <span className="hidden sm:inline font-nunito font-medium">{t("my_drive")}</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-2 sm:p-3 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50 rounded-xl transition-all text-gray-400 cursor-not-allowed text-sm sm:text-base"
              disabled
            >
              <Users className="w-4 h-4 sm:mr-3" />
              <span className="hidden sm:inline font-nunito font-medium">Shared (Coming Soon)</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-2 sm:p-3 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50 rounded-xl transition-all text-sm sm:text-base"
              onClick={() => setLocation('/favorites')}
            >
              <Star className="w-4 h-4 sm:mr-3" />
              <span className="hidden sm:inline font-nunito font-medium">{t("favorites")}</span>
              <span className="ml-auto bg-kawaii-pink dark:bg-kuromi-500 text-white text-xs px-1 sm:px-2 py-1 rounded-full hidden sm:inline">
                {files.filter(f => f.isFavorite).length}
              </span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-2 sm:p-3 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50 rounded-xl transition-all text-sm sm:text-base"
              onClick={() => setLocation('/achievements')}
            >
              <Trophy className="w-4 h-4 sm:mr-3" />
              <span className="hidden sm:inline font-nunito font-medium">{t("achievements")}</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-2 sm:p-3 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50 rounded-xl transition-all text-sm sm:text-base"
              onClick={() => setLocation('/trash')}
            >
              <Trash2 className="w-4 h-4 sm:mr-3" />
              <span className="hidden sm:inline font-nunito font-medium">{t("trash")}</span>
              <span className="ml-auto bg-red-400 text-white text-xs px-1 sm:px-2 py-1 rounded-full hidden sm:inline">
                {files.filter(f => f.isDeleted).length}
              </span>
            </Button>

            {/* File Categories */}
            <div className="pt-2 sm:pt-4">
              <h3 className="hidden sm:block font-nunito font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {t("categories")}
              </h3>
              <Button
                variant="ghost"
                className={`w-full justify-start p-2 sm:p-3 rounded-xl transition-all text-sm sm:text-base ${
                  currentCategory === 'images' 
                    ? 'bg-cinnamoroll-100 dark:bg-kuromi-800 text-cinnamoroll-700 dark:text-kuromi-300' 
                    : 'hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50'
                }`}
                onClick={() => setCurrentCategory('images')}
              >
                <Image className="w-4 h-4 sm:mr-3 text-green-500" />
                <span className="hidden sm:inline font-nunito font-medium">{t("images")}</span>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                  {files.filter(f => f.mimeType?.startsWith('image/')).length}
                </span>
              </Button>
              
              <Button
                variant="ghost"
                className={`w-full justify-start p-2 sm:p-3 rounded-xl transition-all text-sm sm:text-base ${
                  currentCategory === 'videos' 
                    ? 'bg-cinnamoroll-100 dark:bg-kuromi-800 text-cinnamoroll-700 dark:text-kuromi-300' 
                    : 'hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50'
                }`}
                onClick={() => setCurrentCategory('videos')}
              >
                <Video className="w-4 h-4 sm:mr-3 text-red-500" />
                <span className="hidden sm:inline font-nunito font-medium">{t("videos")}</span>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                  {files.filter(f => f.mimeType?.startsWith('video/')).length}
                </span>
              </Button>
              
              <Button
                variant="ghost"
                className={`w-full justify-start p-2 sm:p-3 rounded-xl transition-all text-sm sm:text-base ${
                  currentCategory === 'pdfs' 
                    ? 'bg-cinnamoroll-100 dark:bg-kuromi-800 text-cinnamoroll-700 dark:text-kuromi-300' 
                    : 'hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50'
                }`}
                onClick={() => setCurrentCategory('pdfs')}
              >
                <FileText className="w-4 h-4 sm:mr-3 text-red-600" />
                <span className="hidden sm:inline font-nunito font-medium">{t("pdfs")}</span>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                  {files.filter(f => f.mimeType?.includes('pdf')).length}
                </span>
              </Button>
              
              <Button
                variant="ghost"
                className={`w-full justify-start p-2 sm:p-3 rounded-xl transition-all text-sm sm:text-base ${
                  currentCategory === 'documents' 
                    ? 'bg-cinnamoroll-100 dark:bg-kuromi-800 text-cinnamoroll-700 dark:text-kuromi-300' 
                    : 'hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50'
                }`}
                onClick={() => setCurrentCategory('documents')}
              >
                <FileIcon className="w-4 h-4 sm:mr-3 text-blue-600" />
                <span className="hidden sm:inline font-nunito font-medium">{t("documents")}</span>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                  {files.filter(f => f.mimeType?.includes('document') || f.mimeType?.includes('word')).length}
                </span>
              </Button>
            </div>
          </nav>

          {/* Storage Info */}
          <Card className="mt-4 sm:mt-8 p-3 sm:p-4 bg-gradient-to-r from-cinnamoroll-100 to-kawaii-yellow dark:from-kuromi-800 dark:to-gray-700 border-none">
            <div className="flex items-center justify-between mb-2">
              <span className="hidden sm:inline font-nunito font-medium text-sm">{t("storage")}</span>
              <Infinity className="w-4 h-4 text-kawaii-pink dark:text-kuromi-400 animate-pulse-soft mx-auto sm:mx-0" />
            </div>
            <p className="hidden sm:block text-xs text-gray-600 dark:text-gray-300 mb-2">
              {t("unlimited_space")} ✨
            </p>
            <div className="h-2 bg-gradient-to-r from-kawaii-pink to-kawaii-purple rounded-full animate-pulse-soft"></div>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 2xl:p-10">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="cloud-shape cloud-shape-enhanced w-6 h-4 sm:w-8 sm:h-5 gradient-cinnamoroll dark:gradient-kuromi animate-float"></div>
              <h2 className="font-nunito font-bold text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl text-cinnamoroll-700 dark:text-kuromi-300">
                My Kawaii Drive
              </h2>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-cinnamoroll-100 dark:bg-kuromi-800"
                      : "hover:bg-cinnamoroll-100 dark:hover:bg-kuromi-800"
                  }`}
                >
                  <Grid3x3 className="w-3 h-3 sm:w-4 sm:h-4 text-cinnamoroll-600 dark:text-kuromi-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-cinnamoroll-100 dark:bg-kuromi-800"
                      : "hover:bg-cinnamoroll-100 dark:hover:bg-kuromi-800"
                  }`}
                >
                  <List className="w-3 h-3 sm:w-4 sm:h-4 text-cinnamoroll-600 dark:text-kuromi-400" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 border-cinnamoroll-200 dark:border-kuromi-600 hover:shadow-md transition-all text-sm sm:text-base"
                  >
                    <FolderPlus className="w-4 h-4 text-cinnamoroll-500 dark:text-kuromi-400" />
                    <span className="hidden sm:inline font-nunito font-medium">{t("new_folder")}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("create_folder")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="folderName">{t("folder_name")}</Label>
                      <Input
                        id="folderName"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder={t("folder_name")}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
                        {t("cancel")}
                      </Button>
                      <Button 
                        onClick={() => createFolderMutation.mutate(newFolderName)}
                        disabled={!newFolderName.trim() || createFolderMutation.isPending}
                      >
                        {createFolderMutation.isPending ? (
                          <div className="flex items-center space-x-2">
                            <CinnamorollSpinner />
                            <span>{t("loading")}</span>
                          </div>
                        ) : (
                          t("create")
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 gradient-cinnamoroll dark:gradient-kuromi text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Upload className="w-4 h-4" />
                <span className="font-nunito font-medium">Upload</span>
              </Button>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 mb-4 sm:mb-6 text-xs sm:text-sm">
            <Button
              variant="link"
              onClick={handleBackToParent}
              className="p-0 h-auto text-cinnamoroll-600 dark:text-kuromi-400 hover:underline font-nunito flex items-center text-xs sm:text-sm"
            >
              <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">My Drive</span>
            </Button>
            {currentFolderId && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600 dark:text-gray-300 font-nunito font-medium text-xs sm:text-sm truncate max-w-32 sm:max-w-none">
                  {folders.find(f => f.id === currentFolderId)?.name || "Current Folder"}
                </span>
              </>
            )}
          </nav>

          {/* Files Grid */}
          {foldersLoading || filesLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="cloud-shape w-20 h-12 gradient-cinnamoroll dark:gradient-kuromi animate-float"></div>
              <CinnamorollSpinner className="w-8 h-8 text-kawaii-pink dark:text-kuromi-400" />
              <p className="text-sm text-gray-600 dark:text-gray-300 font-nunito">
                {t("loading_files")}
              </p>
            </div>
          ) : (currentCategory === "all" ? [...folders, ...filteredFiles] : filteredFiles).length > 0 ? (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-3 lg:gap-4 xl:gap-5 2xl:gap-6"
              : "space-y-1 sm:space-y-2"
            }>
              {currentCategory === "all" ? (
                <>
                  {folders.map((folder) => (
                    <FileCard
                      key={`folder-${folder.id}`}
                      item={folder}
                      type="folder"
                      onFolderClick={handleFolderClick}
                      viewMode={viewMode}
                    />
                  ))}
                  {filteredFiles.map((file) => (
                    <FileCard
                      key={`file-${file.id}`}
                      item={file}
                      type="file"
                      onPreview={setSelectedFile}
                      viewMode={viewMode}
                      availableFolders={allFolders}
                    />
                  ))}
                </>
              ) : (
                filteredFiles.map((file) => (
                  <FileCard
                    key={`file-${file.id}`}
                    item={file}
                    type="file"
                    onPreview={setSelectedFile}
                    viewMode={viewMode}
                    availableFolders={allFolders}
                  />
                ))
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="cloud-shape w-24 h-16 gradient-cinnamoroll dark:gradient-kuromi mx-auto mb-6 animate-float"></div>
              <h3 className="font-nunito font-bold text-xl text-gray-600 dark:text-gray-300 mb-2">
                {t("empty_folder")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {t("drag_files_here")} {t("or_click_upload")}
              </p>
              <Button
                onClick={() => setUploadModalOpen(true)}
                className="px-6 py-3 gradient-cinnamoroll dark:gradient-kuromi text-white rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-nunito font-semibold"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First File
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <FilePreview
        file={selectedFile}
        open={!!selectedFile}
        onClose={() => setSelectedFile(null)}
      />
      
      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        folderId={currentFolderId}
      />
    </div>
  );
}
