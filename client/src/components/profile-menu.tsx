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
      const response = await fetch('/api/download-reset-key', {
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
          className="flex items-center space-x-2 p-2 rounded-full bg-gradient-to-r from-cinnamoroll-300 to-kawaii-pink dark:from-kuromi-600 dark:to-kawaii-purple hover:shadow-lg transition-all"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.profilePicture || undefined} alt={user.displayName} />
            <AvatarFallback className="bg-white/50 text-cinnamoroll-600 dark:text-kuromi-400">
              {user.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-nunito font-medium text-white hidden sm:block">
            {user.displayName}
          </span>
          <ChevronDown className="w-4 h-4 text-white" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-cinnamoroll-200 dark:border-kuromi-700"
        align="end"
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
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center space-x-3 p-3 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-800 cursor-pointer">
            <Languages className="w-4 h-4 text-cinnamoroll-500 dark:text-kuromi-400" />
            <span>{t("language")}</span>
            <ChevronDown className="w-3 h-3 ml-auto" />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent 
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-cinnamoroll-200 dark:border-kuromi-700 min-w-[200px]"
            sideOffset={5}
          >
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code as any)}
                className={`flex items-center space-x-3 p-2 hover:bg-cinnamoroll-50 dark:hover:bg-kuromi-800 cursor-pointer ${
                  language === lang.code ? 'bg-cinnamoroll-100 dark:bg-kuromi-700' : ''
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
                {language === lang.code && (
                  <div className="ml-auto w-2 h-2 bg-cinnamoroll-500 dark:bg-kuromi-400 rounded-full"></div>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
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
