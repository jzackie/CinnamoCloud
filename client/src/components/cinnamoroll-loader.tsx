interface CinnamorollLoaderProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  variant?: "classic" | "bounce" | "pulse";
}

export function CinnamorollLoader({ 
  size = "md", 
  message = "Loading files...", 
  variant = "classic" 
}: CinnamorollLoaderProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  const strokeWidths = {
    sm: "3",
    md: "4",
    lg: "6"
  };

  if (variant === "bounce") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-6">
        <div className={`${sizeClasses[size]} relative`}>
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth={strokeWidths[size]}
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth={strokeWidths[size]}
              fill="none"
              strokeLinecap="round"
              strokeDasharray="62.8"
              strokeDashoffset="251.2"
              className="text-red-400 animate-spin"
              style={{
                transformOrigin: '50% 50%',
                animationDuration: '1s'
              }}
            />
          </svg>
        </div>
        <p className={`${textSizeClasses[size]} font-nunito text-cinnamoroll-600 dark:text-kuromi-300 text-center`}>
          {message}
        </p>
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-6">
        <div className={`${sizeClasses[size]} relative`}>
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth={strokeWidths[size]}
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth={strokeWidths[size]}
              fill="none"
              strokeLinecap="round"
              strokeDasharray="62.8"
              strokeDashoffset="251.2"
              className="text-yellow-400 animate-spin"
              style={{
                transformOrigin: '50% 50%',
                animationDuration: '0.8s'
              }}
            />
          </svg>
        </div>
        <p className={`${textSizeClasses[size]} font-nunito text-cinnamoroll-600 dark:text-kuromi-300 text-center`}>
          {message}
        </p>
      </div>
    );
  }

  // Default classic spinning donut
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-6">
      <div className={`${sizeClasses[size]} relative`}>
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth={strokeWidths[size]}
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth={strokeWidths[size]}
            fill="none"
            strokeLinecap="round"
            strokeDasharray="62.8"
            strokeDashoffset="251.2"
            className="text-cinnamoroll-500 dark:text-kuromi-400 animate-spin"
            style={{
              transformOrigin: '50% 50%',
              animationDuration: '1.2s'
            }}
          />
        </svg>
      </div>
      <p className={`${textSizeClasses[size]} font-nunito text-cinnamoroll-600 dark:text-kuromi-300 text-center`}>
        {message}
      </p>
    </div>
  );
}

// Quick inline loader for small spaces
export function CinnamorollSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-block ${className}`}>
      <svg className="animate-spin w-5 h-5" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="251.2"
          strokeDashoffset="62.8"
          className="text-kawaii-pink"
        />
      </svg>
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