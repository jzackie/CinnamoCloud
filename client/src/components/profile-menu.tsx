import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, Languages, LogOut, ChevronDown, Download } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/language-provider";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function ProfileMenu() {
  const { user, logoutMutation } = useAuth();
  const { t, language, setLanguage, languages } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const downloadResetKey = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/download-reset-key`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to download reset key');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${user?.username}-reset-key.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Reset key downloaded! Keep it safe! 🔐✨",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download reset key",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center space-x-1 sm:space-x-2 p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-cinnamoroll-300 to-kawaii-pink dark:from-kuromi-600 dark:to-kawaii-purple hover:shadow-lg transition-all min-w-0"
        >
          <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
            <AvatarImage src={user.profilePicture || undefined} alt={user.displayName} />
            <AvatarFallback className="bg-white/50 text-cinnamoroll-600 dark:text-kuromi-400 text-xs sm:text-sm">
              {user.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-nunito font-medium text-white hidden sm:block truncate max-w-24 lg:max-w-32">
            {user.displayName}
          </span>
          <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-white flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-cinnamoroll-200 dark:border-kuromi-700"
        align="end"
        side="bottom"
        sideOffset={8}
        alignOffset={-8}
        avoidCollisions={true}
        collisionPadding={16}
      >
        <DropdownMenuLabel className="gradient-cinnamoroll dark:gradient-kuromi p-4 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.profilePicture || undefined} alt={user.displayName} />
              <AvatarFallback className="bg-white/50 text-cinnamoroll-600 dark:text-kuromi-400">
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-nunito font-semibold text-white">
                {user.displayName}
              </h3>
              <p className="text-white/80 text-sm">{user.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuItem 
          onClick={() => setLocation('/profile')}
          className="flex items-center space-x-3 p-3 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-800 cursor-pointer"
        >
          <User className="w-4 h-4 text-cinnamoroll-500 dark:text-kuromi-400" />
          <span>{t("edit_profile")}</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setLocation('/profile')}
          className="flex items-center space-x-3 p-3 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-800 cursor-pointer"
        >
          <Settings className="w-4 h-4 text-cinnamoroll-500 dark:text-kuromi-400" />
          <span>{t("preferences")}</span>
        </DropdownMenuItem>
        
        <div className="border-t border-cinnamoroll-200 dark:border-kuromi-700 my-2"></div>
        
        <div className="px-3 py-2">
          <div className="flex items-center space-x-3 mb-3">
            <Languages className="w-4 h-4 text-cinnamoroll-500 dark:text-kuromi-400" />
            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">{t("language")}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code as any)}
                className={`flex items-center space-x-2 p-2 rounded-md text-sm transition-colors ${
                  language === lang.code 
                    ? 'bg-cinnamoroll-100 dark:bg-kuromi-700 text-cinnamoroll-700 dark:text-kuromi-300' 
                    : 'hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="font-medium text-xs">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        <DropdownMenuItem 
          onClick={downloadResetKey}
          className="flex items-center space-x-3 p-3 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-800 cursor-pointer"
        >
          <Download className="w-4 h-4 text-cinnamoroll-500 dark:text-kuromi-400" />
          <span>{t("download_reset_key")}</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="border-cinnamoroll-200 dark:border-kuromi-700" />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="flex items-center space-x-3 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer text-red-600"
        >
          <LogOut className="w-4 h-4" />
          <span>{t("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
