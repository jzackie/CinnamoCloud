import { Cloud, Sparkles } from "lucide-react";

interface CinnamorollLoaderProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  variant?: "cloud" | "bounce" | "drift";
}

export function CinnamorollLoader({ 
  size = "md", 
  message = "Loading kawaii files...", 
  variant = "cloud" 
}: CinnamorollLoaderProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  if (variant === "cloud") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-6">
        {/* Floating Cinnamoroll clouds */}
        <div className="relative">
          <div className={`${sizeClasses[size]} gradient-cinnamoroll dark:gradient-kuromi cloud-shape animate-float`}>
            {/* Cinnamoroll ears */}
            <div className="absolute -top-2 left-2 w-3 h-3 bg-white dark:bg-kuromi-300 rounded-full animate-ears-wiggle opacity-90"></div>
            <div className="absolute -top-2 right-2 w-3 h-3 bg-white dark:bg-kuromi-300 rounded-full animate-ears-wiggle opacity-90" style={{ animationDelay: '0.2s' }}></div>
          </div>
          
          {/* Sparkles */}
          <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-kawaii-pink dark:text-kuromi-400 animate-sparkle" />
          <Sparkles className="absolute -bottom-1 -left-2 w-3 h-3 text-kawaii-purple dark:text-kuromi-500 animate-sparkle" style={{ animationDelay: '0.7s' }} />
        </div>
        
        <p className={`${textSizeClasses[size]} font-nunito text-cinnamoroll-600 dark:text-kuromi-300 text-center animate-pulse-soft`}>
          {message}
        </p>
      </div>
    );
  }

  if (variant === "bounce") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-6">
        {/* Bouncing Cinnamoroll */}
        <div className="relative">
          <div className={`${sizeClasses[size]} bg-gradient-to-br from-cinnamoroll-100 to-cinnamoroll-300 dark:from-kuromi-700 dark:to-kuromi-500 rounded-full animate-cinnamoroll-bounce shadow-lg`}>
            {/* Eyes */}
            <div className="absolute top-3 left-3 w-1 h-1 bg-cinnamoroll-800 dark:bg-white rounded-full"></div>
            <div className="absolute top-3 right-3 w-1 h-1 bg-cinnamoroll-800 dark:bg-white rounded-full"></div>
            
            {/* Blush */}
            <div className="absolute top-4 left-1 w-2 h-1 bg-kawaii-pink dark:bg-kuromi-400 rounded-full opacity-60"></div>
            <div className="absolute top-4 right-1 w-2 h-1 bg-kawaii-pink dark:bg-kuromi-400 rounded-full opacity-60"></div>
          </div>
          
          {/* Tail wiggle */}
          <div className="absolute -bottom-1 -right-1 w-3 h-2 bg-cinnamoroll-200 dark:bg-kuromi-600 rounded-full animate-wiggle"></div>
        </div>
        
        <p className={`${textSizeClasses[size]} font-nunito text-cinnamoroll-600 dark:text-kuromi-300 text-center animate-pulse-soft`}>
          {message}
        </p>
      </div>
    );
  }

  if (variant === "drift") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-6">
        {/* Drifting clouds */}
        <div className="relative w-20 h-12">
          <Cloud className={`absolute ${sizeClasses[size]} text-cinnamoroll-300 dark:text-kuromi-600 animate-cloud-drift`} />
          <Cloud className={`absolute ${sizeClasses[size]} text-cinnamoroll-400 dark:text-kuromi-500 animate-cloud-drift opacity-70`} style={{ animationDelay: '1s', left: '10px' }} />
          <Cloud className={`absolute ${sizeClasses[size]} text-cinnamoroll-500 dark:text-kuromi-400 animate-cloud-drift opacity-50`} style={{ animationDelay: '2s', left: '20px' }} />
        </div>
        
        <p className={`${textSizeClasses[size]} font-nunito text-cinnamoroll-600 dark:text-kuromi-300 text-center animate-pulse-soft`}>
          {message}
        </p>
      </div>
    );
  }

  return null;
}

// Quick inline loader for small spaces
export function CinnamorollSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`cloud-shape w-6 h-4 gradient-cinnamoroll dark:gradient-kuromi animate-spin-slow ${className}`}>
      <div className="absolute -top-1 left-1 w-2 h-2 bg-white dark:bg-kuromi-300 rounded-full animate-bounce-gentle opacity-80"></div>
      <div className="absolute -top-1 right-1 w-2 h-2 bg-white dark:bg-kuromi-300 rounded-full animate-bounce-gentle opacity-80" style={{ animationDelay: '0.3s' }}></div>
    </div>
  );
}

// Skeleton loader with kawaii theme
export function CinnamorollSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gradient-to-r from-cinnamoroll-100 via-cinnamoroll-200 to-cinnamoroll-100 dark:from-kuromi-800 dark:via-kuromi-700 dark:to-kuromi-800 animate-pulse-soft rounded-xl ${className}`}>
      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-cloud-drift"></div>
    </div>
  );
}