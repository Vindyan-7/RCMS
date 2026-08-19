"use client";

import React, { useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  maxWidth?: string; // e.g. "max-w-md", "max-w-xl", "max-w-2xl", "max-w-3xl", "max-w-4xl"
  title?: string;
}

export function DetailDrawer({
  isOpen,
  onClose,
  children,
  className,
  maxWidth = "max-w-md",
  title = "Workspace Drawer",
}: DetailDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when drawer is active
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
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const drawerContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 top-0 bottom-0 left-0 right-0 z-[9999] flex justify-end bg-black/70 backdrop-blur-md h-[100dvh] w-screen transition-opacity animate-in fade-in duration-200"
      style={{ top: 0, right: 0, bottom: 0, left: 0, zIndex: 9999 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full bg-card border-l border-border h-[100dvh] max-h-[100dvh] shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 text-left relative z-[10000]",
          maxWidth,
          className
        )}
        style={{ height: "100dvh", maxHeight: "100dvh", top: 0, bottom: 0, right: 0 }}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
