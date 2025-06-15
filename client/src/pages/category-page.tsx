import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileCard } from "@/components/file-card";
import { FilePreview } from "@/components/file-preview";
import { ProfileMenu } from "@/components/profile-menu";
import { 
  Search, 
  Moon, 
  Sun, 
  ArrowLeft,
  Image,
  Video,
  FileText,
  File as FileIcon
} from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useLocation } from "wouter";
import { File } from "@shared/schema";

const categoryConfig = {
  images: {
    icon: Image,
    title: "Images",
    description: "Your image collection",
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    mimeTypes: ["image/"]
  },
  videos: {
    icon: Video,
    title: "Videos",
    description: "Your adorable video files",
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    mimeTypes: ["video/"]
  },
  pdfs: {
    icon: FileText,
    title: "PDFs",
    description: "Your PDF documents",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    mimeTypes: ["application/pdf"]
  },
  documents: {
    icon: FileIcon,
    title: "Documents",
    description: "Your text documents",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    mimeTypes: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/"]
  }
};

export default function CategoryPage() {
  const { type } = useParams<{ type: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const category = categoryConfig[type as keyof typeof categoryConfig];
  
  if (!category) {
    setLocation('/');
    return null;
  }

  const { data: files = [] } = useQuery<File[]>({
    queryKey: ["/api/files", { category: type }],
  });

  const filteredFiles = files.filter(file =>
    file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const Icon = category.icon;

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
                CinnaCloud
              </h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder={`Search your ${category.title.toLowerCase()}...`}
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
        <div className="flex items-center space-x-4 mb-6">
          <div className={`p-3 ${category.bgColor} rounded-2xl`}>
            <Icon className={`w-8 h-8 ${category.color}`} />
          </div>
          <div>
            <h2 className="font-nunito font-bold text-3xl text-cinnamoroll-700 dark:text-kuromi-300">
              {category.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {files.length} {category.description.toLowerCase()} ✨
            </p>
          </div>
        </div>

        {/* Files Grid */}
        {filteredFiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <FileCard
                key={file.id}
                item={file}
                type="file"
                onPreview={setSelectedFile}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className={`p-6 ${category.bgColor} rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center`}>
              <Icon className={`w-12 h-12 ${category.color}`} />
            </div>
            <h3 className="font-nunito font-bold text-xl text-gray-600 dark:text-gray-300 mb-2">
              No {category.title.toLowerCase()} found!
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery 
                ? `No ${category.title.toLowerCase()} match your search`
                : `Upload some ${category.title.toLowerCase()} to see them here`
              } ✨
            </p>
            <Button
              onClick={() => setLocation('/')}
              className="gradient-cinnamoroll dark:gradient-kuromi text-white rounded-2xl font-nunito font-semibold"
            >
              {searchQuery ? "Clear Search" : "Browse Files"}
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
