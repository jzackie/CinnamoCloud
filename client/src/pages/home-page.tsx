import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  Infinity
} from "lucide-react";
import { FileCard } from "@/components/file-card";
import { FilePreview } from "@/components/file-preview";
import { UploadModal } from "@/components/upload-modal";
import { ProfileMenu } from "@/components/profile-menu";
import { useTheme } from "@/lib/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { File, Folder } from "@shared/schema";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [currentCategory, setCurrentCategory] = useState<string>("all");
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ["/api/folders"],
  });

  const { data: files = [] } = useQuery<File[]>({
    queryKey: ["/api/files"],
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/folders", { name });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
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

  // Filter files based on current category
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    
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

  const filteredItems = [...folders, ...files].filter(item => {
    const name = "originalName" in item ? item.originalName : item.name;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-cinnamoroll-200 dark:border-kuromi-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3">
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
                  placeholder="Search your kawaii files..."
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

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-r border-cinnamoroll-200 dark:border-kuromi-700 p-4">
          {/* Upload Button */}
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="w-full mb-6 p-3 gradient-cinnamoroll dark:gradient-kuromi text-white rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-nunito font-semibold"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Kawaii Files
          </Button>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start p-3 text-cinnamoroll-600 dark:text-kuromi-400 bg-cinnamoroll-50 dark:bg-kuromi-900/50 rounded-xl"
              onClick={() => setLocation('/')}
            >
              <Home className="w-4 h-4 mr-3" />
              <span className="font-nunito font-medium">My Drive</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-3 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50 rounded-xl transition-all"
            >
              <Users className="w-4 h-4 mr-3" />
              <span className="font-nunito font-medium">Shared with me</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-3 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50 rounded-xl transition-all"
            >
              <Clock className="w-4 h-4 mr-3" />
              <span className="font-nunito font-medium">Recent</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-3 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50 rounded-xl transition-all"
              onClick={() => setLocation('/favorites')}
            >
              <Star className="w-4 h-4 mr-3" />
              <span className="font-nunito font-medium">Favorites</span>
              <span className="ml-auto bg-kawaii-pink dark:bg-kuromi-500 text-white text-xs px-2 py-1 rounded-full">
                {files.filter(f => f.isFavorite).length}
              </span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-3 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50 rounded-xl transition-all"
              onClick={() => setLocation('/trash')}
            >
              <Trash2 className="w-4 h-4 mr-3" />
              <span className="font-nunito font-medium">Trash</span>
              <span className="ml-auto bg-red-400 text-white text-xs px-2 py-1 rounded-full">
                {files.filter(f => f.isDeleted).length}
              </span>
            </Button>

            {/* File Categories */}
            <div className="pt-4">
              <h3 className="font-nunito font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Categories
              </h3>
              <Button
                variant="ghost"
                className="w-full justify-start p-3 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50 rounded-xl transition-all"
                onClick={() => setLocation('/category/images')}
              >
                <Image className="w-4 h-4 mr-3 text-green-500" />
                <span className="font-nunito font-medium">Images</span>
                <span className="ml-auto text-xs text-gray-500">
                  {files.filter(f => f.mimeType.startsWith('image/')).length}
                </span>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start p-3 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50 rounded-xl transition-all"
                onClick={() => setLocation('/category/videos')}
              >
                <Video className="w-4 h-4 mr-3 text-red-500" />
                <span className="font-nunito font-medium">Videos</span>
                <span className="ml-auto text-xs text-gray-500">
                  {files.filter(f => f.mimeType.startsWith('video/')).length}
                </span>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start p-3 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50 rounded-xl transition-all"
                onClick={() => setLocation('/category/pdfs')}
              >
                <FileText className="w-4 h-4 mr-3 text-red-600" />
                <span className="font-nunito font-medium">PDFs</span>
                <span className="ml-auto text-xs text-gray-500">
                  {files.filter(f => f.mimeType.includes('pdf')).length}
                </span>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start p-3 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-900/50 rounded-xl transition-all"
                onClick={() => setLocation('/category/documents')}
              >
                <FileIcon className="w-4 h-4 mr-3 text-blue-600" />
                <span className="font-nunito font-medium">Documents</span>
                <span className="ml-auto text-xs text-gray-500">
                  {files.filter(f => f.mimeType.includes('document') || f.mimeType.includes('word')).length}
                </span>
              </Button>
            </div>
          </nav>

          {/* Storage Info */}
          <Card className="mt-8 p-4 bg-gradient-to-r from-cinnamoroll-100 to-kawaii-yellow dark:from-kuromi-800 dark:to-gray-700 border-none">
            <div className="flex items-center justify-between mb-2">
              <span className="font-nunito font-medium text-sm">Storage</span>
              <Infinity className="w-4 h-4 text-kawaii-pink dark:text-kuromi-400 animate-pulse-soft" />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
              Unlimited kawaii space! ✨
            </p>
            <div className="h-2 bg-gradient-to-r from-kawaii-pink to-kawaii-purple rounded-full animate-pulse-soft"></div>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="font-nunito font-bold text-2xl text-cinnamoroll-700 dark:text-kuromi-300">
                My Kawaii Drive
              </h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-cinnamoroll-100 dark:bg-kuromi-800"
                      : "hover:bg-cinnamoroll-100 dark:hover:bg-kuromi-800"
                  }`}
                >
                  <Grid3x3 className="w-4 h-4 text-cinnamoroll-600 dark:text-kuromi-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-cinnamoroll-100 dark:bg-kuromi-800"
                      : "hover:bg-cinnamoroll-100 dark:hover:bg-kuromi-800"
                  }`}
                >
                  <List className="w-4 h-4 text-gray-400" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                className="flex items-center space-x-2 px-4 py-2 border-cinnamoroll-200 dark:border-kuromi-600 hover:shadow-md transition-all"
              >
                <FolderPlus className="w-4 h-4 text-cinnamoroll-500 dark:text-kuromi-400" />
                <span className="font-nunito font-medium">New Folder</span>
              </Button>
              <Button
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 gradient-cinnamoroll dark:gradient-kuromi text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Upload className="w-4 h-4" />
                <span className="font-nunito font-medium">Upload</span>
              </Button>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 mb-6 text-sm">
            <Button
              variant="link"
              className="p-0 h-auto text-cinnamoroll-600 dark:text-kuromi-400 hover:underline font-nunito"
            >
              My Drive
            </Button>
          </nav>

          {/* Files Grid */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredItems.map((item) => (
                <FileCard
                  key={item.id}
                  item={item}
                  type={"originalName" in item ? "file" : "folder"}
                  onPreview={setSelectedFile}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="cloud-shape w-24 h-16 gradient-cinnamoroll dark:gradient-kuromi mx-auto mb-6 animate-float"></div>
              <h3 className="font-nunito font-bold text-xl text-gray-600 dark:text-gray-300 mb-2">
                Your kawaii cloud is empty!
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Start uploading your cute files to see them here ✨
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
      />
    </div>
  );
}
