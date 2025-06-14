import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileMenu } from "@/components/profile-menu";
import { 
  ArrowLeft,
  Moon,
  Sun,
  User,
  Settings,
  Languages,
  Download,
  Upload,
  Save,
  Camera
} from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language-provider";
import { updateUserSchema, User as UserType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const profileFormSchema = updateUserSchema.extend({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Password confirmation doesn't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

const languages = [
  { code: "en", name: "English" },
  { code: "ja", name: "Japanese (日本語)" },
  { code: "ko", name: "Korean (한국어)" },
  { code: "zh", name: "Chinese (中文)" },
  { code: "es", name: "Spanish (Español)" },
  { code: "fr", name: "French (Français)" },
  { code: "de", name: "German (Deutsch)" },
];

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage, t, languages: availableLanguages } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const { data: profile } = useQuery<UserType>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileFormData>) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile Updated!",
        description: "Your kawaii profile has been saved successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await fetch('/api/profile/picture', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setProfilePicture(null);
      toast({
        title: "Profile Picture Updated!",
        description: "Your new profile picture has been saved!",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    },
  });

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      uploadProfilePictureMutation.mutate(file);
    }
  };

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: profile?.displayName || "",
      language: profile?.language || "en",
      preferences: profile?.preferences as any || {},
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      console.log('Profile loaded:', profile);
      console.log('Profile picture URL:', profile.profilePicture);
      form.reset({
        displayName: profile.displayName,
        language: profile.language,
        preferences: profile.preferences as any || {},
      });
    }
  }, [profile, form]);

  const onSubmit = (data: ProfileFormData) => {
    const { currentPassword, newPassword, confirmPassword, ...updateData } = data;
    updateProfileMutation.mutate(updateData);
  };

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
        title: "Reset Key Downloaded! 🔐",
        description: "Keep it safe - it's your only way to reset your password! ✨",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download reset key",
        variant: "destructive",
      });
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="cloud-shape w-24 h-16 gradient-cinnamoroll dark:gradient-kuromi animate-float"></div>
      </div>
    );
  }

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
      <main className="p-6 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 gradient-cinnamoroll dark:gradient-kuromi rounded-2xl">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="font-nunito font-bold text-3xl text-cinnamoroll-700 dark:text-kuromi-300">
              {t("profile_settings")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t("account_info")}
            </p>
          </div>
        </div>

        {/* Profile Content */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-cinnamoroll-200 dark:border-kuromi-700">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="profile" className="font-nunito">
                  <User className="w-4 h-4 mr-2" />
                  {t("edit_profile")}
                </TabsTrigger>
                <TabsTrigger value="preferences" className="font-nunito">
                  <Settings className="w-4 h-4 mr-2" />
                  {t("preferences")}
                </TabsTrigger>
                <TabsTrigger value="security" className="font-nunito">
                  <Download className="w-4 h-4 mr-2" />
                  {t("security")}
                </TabsTrigger>
              </TabsList>

              <form onSubmit={form.handleSubmit(onSubmit)}>
                <TabsContent value="profile" className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center space-x-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage 
                        src={profile?.profilePicture ? `${profile.profilePicture}?t=${Date.now()}` : undefined} 
                        alt={profile?.displayName || ""} 
                        className="object-cover"
                        onError={(e) => {
                          console.log('Avatar image failed to load:', profile?.profilePicture);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <AvatarFallback className="text-2xl bg-gradient-to-r from-cinnamoroll-300 to-kawaii-pink dark:from-kuromi-600 dark:to-kawaii-purple text-white">
                        {profile?.displayName?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-nunito font-semibold text-lg mb-2">Profile Picture</h3>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                        id="profile-picture-input"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-cinnamoroll-200 dark:border-kuromi-600"
                        onClick={() => document.getElementById('profile-picture-input')?.click()}
                        disabled={uploadProfilePictureMutation.isPending}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {uploadProfilePictureMutation.isPending ? t("loading") : t("upload")}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="displayName">{t("display_name")}</Label>
                      <Input
                        id="displayName"
                        {...form.register("displayName")}
                        placeholder="Your kawaii name"
                        className="border-cinnamoroll-200 dark:border-kuromi-600 focus:border-cinnamoroll-400 dark:focus:border-kuromi-400"
                      />
                      {form.formState.errors.displayName && (
                        <p className="text-red-500 text-sm mt-1">
                          {form.formState.errors.displayName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">{t("email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile?.email || ""}
                        disabled
                        className="border-cinnamoroll-200 dark:border-kuromi-600 bg-gray-100 dark:bg-gray-700"
                      />
                      <p className="text-xs text-gray-500 mt-1">{t("email")} {t("cannot_change")}</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile?.username || ""}
                      disabled
                      className="border-cinnamoroll-200 dark:border-kuromi-600 bg-gray-100 dark:bg-gray-700"
                    />
                    <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                  </div>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-6">
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={form.watch("language") || language}
                      onValueChange={async (value) => {
                        form.setValue("language", value);
                        await setLanguage(value as any);
                        // Trigger form submission to save the language preference
                        const formData = form.getValues();
                        updateProfileMutation.mutate({ ...formData, language: value });
                      }}
                    >
                      <SelectTrigger className="border-cinnamoroll-200 dark:border-kuromi-600">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLanguages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <h3 className="font-nunito font-semibold text-lg mb-4">Theme Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-cinnamoroll-200 dark:border-kuromi-600 rounded-lg">
                        <div>
                          <h4 className="font-medium">Current Theme</h4>
                          <p className="text-sm text-gray-500">
                            {theme === "light" ? "Cinnamoroll (Light)" : "Kuromi (Dark)"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={toggleTheme}
                          className="border-cinnamoroll-200 dark:border-kuromi-600"
                        >
                          Switch to {theme === "light" ? "Kuromi" : "Cinnamoroll"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                  <div className="p-4 border border-kawaii-pink bg-kawaii-pink/10 rounded-lg">
                    <h3 className="font-nunito font-semibold text-lg mb-2 flex items-center">
                      <Download className="w-5 h-5 mr-2" />
                      Reset Key
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Your reset key is the only way to reset your password. Keep it safe and download a new copy regularly.
                    </p>
                    <Button
                      type="button"
                      onClick={downloadResetKey}
                      className="gradient-cinnamoroll dark:gradient-kuromi text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Current Reset Key
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-nunito font-semibold text-lg mb-4">Account Information</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Account Created:</span>
                        <span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Loading..."}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Username:</span>
                        <span>{profile?.username || "Loading..."}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                        <span>{profile?.email || "Loading..."}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Save Button */}
                <div className="flex justify-end pt-6 border-t border-cinnamoroll-200 dark:border-kuromi-700">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="gradient-cinnamoroll dark:gradient-kuromi text-white font-nunito font-semibold"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
