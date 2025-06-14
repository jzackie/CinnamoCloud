import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Key, Download, Upload, Languages } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme-provider";
import { useLanguage } from "@/lib/language-provider";
import { useLocation } from "wouter";
import { insertUserSchema, resetPasswordSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const loginSchema = insertUserSchema.pick({ username: true, password: true });
const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;
type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetKeyData, setResetKeyData] = useState<any>(null);
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t, language, setLanguage, languages } = useLanguage();
  const { toast } = useToast();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const resetForm = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      resetKey: "",
      newPassword: "",
    },
  });

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegister = async (data: RegisterData) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData, {
      onSuccess: (user) => {
        toast({
          title: "Welcome to CinnamoCloud! 🎉",
          description: "Your account has been created successfully. Don't forget to download your reset key!",
        });
        downloadResetKey(user.currentResetKey);
      },
    });
  };

  const onResetPassword = async (data: ResetPasswordData) => {
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      setResetKeyData({
        username: "user",
        resetKey: result.newResetKey,
        generatedAt: new Date().toISOString(),
        warning: "Keep this file safe! It's the only way to reset your password."
      });
      
      toast({
        title: "Password Reset Successful! 🎉",
        description: "Your password has been reset. Download your new reset key!",
      });
      
      setShowResetModal(false);
      resetForm.reset();
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  const downloadResetKey = (resetKey: string) => {
    const resetKeyData = {
      username: registerForm.getValues().username,
      resetKey: resetKey,
      generatedAt: new Date().toISOString(),
      warning: "Keep this file safe! It's the only way to reset your password."
    };
    
    const blob = new Blob([JSON.stringify(resetKeyData, null, 2)], {
      type: 'application/json',
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${resetKeyData.username}-reset-key.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resetForm.setValue('resetKey', data.resetKey);
          toast({
            title: "Reset Key Loaded! 🔐",
            description: "Your reset key has been loaded successfully.",
          });
        } catch (error) {
          toast({
            title: "Invalid File",
            description: "Please select a valid reset key file.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Header with Language Selector */}
      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <Languages className="w-4 h-4 mr-2" />
              <span className="text-sm">{languages.find(l => l.code === language)?.flag}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-cinnamoroll-200 dark:border-kuromi-700"
            align="end"
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Left Side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-cinnamoroll-200 dark:border-kuromi-700">
          <CardHeader className="text-center gradient-cinnamoroll dark:gradient-kuromi rounded-t-lg">
            <div className="cloud-shape w-16 h-10 bg-white/20 mx-auto mb-4 animate-float"></div>
            <CardTitle className="font-nunito font-bold text-2xl text-white mb-2">
              {t("welcome_to_cinnamocloud")}
            </CardTitle>
            <p className="text-white/80">{t("kawaii_cloud_storage")} ✨</p>
          </CardHeader>
          
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger 
                  value="login"
                  className="font-nunito font-semibold data-[state=active]:text-cinnamoroll-600 dark:data-[state=active]:text-kuromi-400"
                >
                  {t("sign_in")}
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="font-nunito font-semibold data-[state=active]:text-cinnamoroll-600 dark:data-[state=active]:text-kuromi-400"
                >
                  {t("sign_up")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div>
                    <Label htmlFor="username">{t("username")}</Label>
                    <Input
                      id="username"
                      {...loginForm.register("username")}
                      placeholder={t("username")}
                      className="border-cinnamoroll-200 dark:border-kuromi-600 focus:border-cinnamoroll-400 dark:focus:border-kuromi-400"
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-red-500 text-sm mt-1">
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password">{t("password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      {...loginForm.register("password")}
                      placeholder={t("password")}
                      className="border-cinnamoroll-200 dark:border-kuromi-600 focus:border-cinnamoroll-400 dark:focus:border-kuromi-400"
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full gradient-cinnamoroll dark:gradient-kuromi text-white font-nunito font-semibold"
                  >
                    {loginMutation.isPending ? t("loading") : t("sign_in_button")}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <Button
                    variant="link"
                    onClick={() => setShowResetModal(true)}
                    className="text-cinnamoroll-600 dark:text-kuromi-400 hover:underline"
                  >
                    Forgot your password?
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div>
                    <Label htmlFor="reg-username">{t("username")}</Label>
                    <Input
                      id="reg-username"
                      {...registerForm.register("username")}
                      placeholder={t("username")}
                      className="border-cinnamoroll-200 dark:border-kuromi-600 focus:border-cinnamoroll-400 dark:focus:border-kuromi-400"
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-red-500 text-sm mt-1">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      {...registerForm.register("email")}
                      placeholder={t("email")}
                      className="border-cinnamoroll-200 dark:border-kuromi-600 focus:border-cinnamoroll-400 dark:focus:border-kuromi-400"
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="displayName">{t("display_name")}</Label>
                    <Input
                      id="displayName"
                      {...registerForm.register("displayName")}
                      placeholder={t("display_name")}
                      className="border-cinnamoroll-200 dark:border-kuromi-600 focus:border-cinnamoroll-400 dark:focus:border-kuromi-400"
                    />
                    {registerForm.formState.errors.displayName && (
                      <p className="text-red-500 text-sm mt-1">
                        {registerForm.formState.errors.displayName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="reg-password">{t("password")}</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      {...registerForm.register("password")}
                      placeholder={t("password")}
                      className="border-cinnamoroll-200 dark:border-kuromi-600 focus:border-cinnamoroll-400 dark:focus:border-kuromi-400"
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">{t("confirm_password_label")}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...registerForm.register("confirmPassword")}
                      placeholder={t("confirm_password_label")}
                      className="border-cinnamoroll-200 dark:border-kuromi-600 focus:border-cinnamoroll-400 dark:focus:border-kuromi-400"
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">
                        {registerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full gradient-cinnamoroll dark:gradient-kuromi text-white font-nunito font-semibold"
                  >
                    {registerMutation.isPending ? t("loading") : t("create_account_button")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <Alert className="mt-6 border-cinnamoroll-200 dark:border-kuromi-600 bg-cinnamoroll-50 dark:bg-kuromi-900/50">
              <Key className="w-4 h-4 text-kawaii-pink dark:text-kuromi-400" />
              <AlertDescription className="text-sm">
                <strong>{t("reset_key_download")}:</strong> {t("reset_key_info_alert")} 🔐✨
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Hero Section */}
      <div className="flex-1 gradient-cinnamoroll dark:gradient-kuromi p-8 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="cloud-shape w-32 h-20 bg-white/20 mx-auto mb-8 animate-float"></div>
          <h2 className="font-nunito font-bold text-4xl mb-4">
            {t("store_kawaii_files")} ☁️
          </h2>
          <p className="text-xl mb-6 text-white/90">
            {t("unlimited_storage")} ✨
          </p>
          <div className="space-y-4 text-white/80">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-white/60 rounded-full"></div>
              <span>{t("unlimited_kawaii_storage")}</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-white/60 rounded-full"></div>
              <span>{t("preview_files")}</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-white/60 rounded-full"></div>
              <span>{t("organize_folders")}</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-white/60 rounded-full"></div>
              <span>{t("secure_reset")}</span>
            </div>
          </div>
          
          <Button
            onClick={toggleTheme}
            variant="outline"
            className="mt-8 border-white/30 text-white hover:bg-white/10"
          >
            Switch to {theme === "light" ? "Kuromi" : "Cinnamoroll"} Theme
          </Button>
        </div>
      </div>

      {/* Reset Password Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="font-nunito font-bold text-lg flex items-center space-x-2">
              <Key className="w-5 h-5 text-kawaii-pink dark:text-kuromi-400" />
              <span>Reset Password with Key</span>
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
            <div>
              <Label htmlFor="resetKeyFile">Upload Reset Key File</Label>
              <div className="mt-2">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="border-cinnamoroll-200 dark:border-kuromi-600"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="resetKey">Or Enter Reset Key Manually</Label>
              <Input
                id="resetKey"
                {...resetForm.register("resetKey")}
                placeholder="Enter your reset key"
                className="border-cinnamoroll-200 dark:border-kuromi-600 focus:border-cinnamoroll-400 dark:focus:border-kuromi-400"
              />
              {resetForm.formState.errors.resetKey && (
                <p className="text-red-500 text-sm mt-1">
                  {resetForm.formState.errors.resetKey.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                {...resetForm.register("newPassword")}
                placeholder="Enter your new password"
                className="border-cinnamoroll-200 dark:border-kuromi-600 focus:border-cinnamoroll-400 dark:focus:border-kuromi-400"
              />
              {resetForm.formState.errors.newPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {resetForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full gradient-cinnamoroll dark:gradient-kuromi text-white font-nunito font-semibold"
            >
              Reset Password
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Download New Reset Key Modal */}
      {resetKeyData && (
        <Dialog open={true} onOpenChange={() => setResetKeyData(null)}>
          <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle className="font-nunito font-bold text-lg flex items-center space-x-2">
                <Download className="w-5 h-5 text-kawaii-pink dark:text-kuromi-400" />
                <span>Download Your New Reset Key</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <Alert className="border-kawaii-pink bg-kawaii-pink/10">
                <Key className="w-4 h-4" />
                <AlertDescription>
                  Your password has been reset successfully! Download your new reset key and keep it safe.
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(resetKeyData, null, 2)], {
                    type: 'application/json',
                  });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${resetKeyData.username}-new-reset-key.json`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  setResetKeyData(null);
                }}
                className="w-full gradient-cinnamoroll dark:gradient-kuromi text-white font-nunito font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                Download New Reset Key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
