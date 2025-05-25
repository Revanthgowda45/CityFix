import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export function Loading({ 
  size = "md", 
  text = "Loading...", 
  className,
  fullScreen = false 
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-16 w-16"
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center gap-2",
    fullScreen && "min-h-screen",
    className
  );

  return (
    <div className={containerClasses}>
      <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
} 