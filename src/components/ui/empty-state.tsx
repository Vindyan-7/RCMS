import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center space-y-4 shadow-xs text-xs flex flex-col items-center justify-center",
        className
      )}
    >
      <div className="h-12 w-12 rounded-2xl bg-muted/30 text-muted-foreground flex items-center justify-center font-bold">
        {icon || <Inbox className="h-6 w-6 text-muted-foreground" />}
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="text-xs font-bold gap-1 mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
