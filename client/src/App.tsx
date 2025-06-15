import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/lib/theme-provider";
import { LanguageProvider } from "@/lib/language-provider";
import { UploadProgressProvider, useUploadProgress } from "@/hooks/use-upload-progress";
import { ProtectedRoute } from "./lib/protected-route";
import { BackgroundUploadProgress } from "@/components/background-upload-progress";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import FolderPage from "@/pages/folder-page";
import FavoritesPage from "@/pages/favorites-page";
import TrashPage from "@/pages/trash-page";
import CategoryPage from "@/pages/category-page";
import ProfilePage from "@/pages/profile-page";
import AchievementsPage from "@/pages/achievements-page";
import NotFound from "@/pages/not-found";


function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/folder/:id" component={FolderPage} />
      <ProtectedRoute path="/favorites" component={FavoritesPage} />
      <ProtectedRoute path="/trash" component={TrashPage} />
      <ProtectedRoute path="/category/:type" component={CategoryPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/achievements" component={AchievementsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { uploads, cancelUpload, cancelAllUploads } = useUploadProgress();
  
  return (
    <>
      <Toaster />
      <Router />
      <BackgroundUploadProgress 
        uploads={uploads}
        onCancel={cancelUpload}
        onCancelAll={cancelAllUploads}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <UploadProgressProvider>
              <TooltipProvider>
                <AppContent />
              </TooltipProvider>
            </UploadProgressProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
export default App;
