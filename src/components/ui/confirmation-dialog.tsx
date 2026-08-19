"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "warning" | "default";
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm Action",
  cancelLabel = "Cancel",
  variant = "destructive",
  isLoading = false,
}: ConfirmationDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when dialog is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keyboard listener for Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !mounted) return null;

  const dialogContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 top-0 bottom-0 left-0 right-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      style={{ top: 0, right: 0, bottom: 0, left: 0, zIndex: 9999 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-desc"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 text-left animate-in zoom-in-95 duration-150 relative z-[10000]"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center font-bold",
                variant === "destructive"
                  ? "bg-red-950 text-red-400 border border-red-800/60"
                  : variant === "warning"
                  ? "bg-amber-950 text-amber-400 border border-amber-800/60"
                  : "bg-blue-950 text-blue-400 border border-blue-800/60"
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 id="confirmation-title" className="text-base font-bold text-foreground">
                {title}
              </h3>
              <p id="confirmation-desc" className="text-xs text-muted-foreground mt-0.5">
                {description}
              </p>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog" className="rounded-xl">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border/60">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading} className="text-xs font-semibold">
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className="text-xs font-bold gap-1"
          >
            {isLoading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
