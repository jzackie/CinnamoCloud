import { useAuth } from "@/hooks/use-auth";
import { CinnamorollLoader } from "@/components/cinnamoroll-loader";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element | null;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cinnamoroll-50 to-kawaii-blue dark:from-kuromi-900 dark:to-kuromi-800">
          <CinnamorollLoader 
            size="lg" 
            message="Authenticating your session..." 
            variant="bounce" 
          />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return <Component />
}
