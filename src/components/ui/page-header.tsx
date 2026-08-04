import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  badge,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 text-left", className)}>
      <div className="space-y-1">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="h-10 w-10 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/60 flex items-center justify-center font-bold">
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
              {badge}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      {action && <div className="self-start sm:self-auto">{action}</div>}
    </div>
  );
}
