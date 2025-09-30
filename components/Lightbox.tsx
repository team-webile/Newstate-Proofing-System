"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onIndexChange?: (index: number) => void;
  imageAlt?: string;
  showNavigation?: boolean;
  showThumbnails?: boolean;
  className?: string;
}

export default function Lightbox({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange,
  imageAlt = "Image",
  showNavigation = true,
  showThumbnails = true,
  className,
}: LightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const currentImage = images[currentIndex];

  // Reset zoom and position when image changes
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setImageLoaded(false);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case "+":
        case "=":
          e.preventDefault();
          setZoom(prev => Math.min(prev * 1.2, 5));
          break;
        case "-":
          e.preventDefault();
          setZoom(prev => Math.max(prev / 1.2, 0.1));
          break;
        case "0":
          e.preventDefault();
          setZoom(1);
          setPosition({ x: 0, y: 0 });
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  const goToPrevious = useCallback(() => {
    if (onIndexChange) {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
      onIndexChange(newIndex);
    }
  }, [currentIndex, images.length, onIndexChange]);

  const goToNext = useCallback(() => {
    if (onIndexChange) {
      const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
      onIndexChange(newIndex);
    }
  }, [currentIndex, images.length, onIndexChange]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(prev * 1.1, 5));
    } else {
      setZoom(prev => Math.max(prev / 1.1, 0.1));
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleImageClick = useCallback((e: React.MouseEvent) => {
    // If not zoomed, close on click
    if (zoom <= 1) {
      onClose();
    }
  }, [zoom, onClose]);

  const resetView = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  if (!isOpen || !currentImage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0">
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/50 text-white">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {currentIndex + 1} of {images.length}
              </span>
              {zoom > 1 && (
                <span className="text-sm text-gray-300">
                  {Math.round(zoom * 100)}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetView}
                className="text-white hover:bg-white/20"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Main Image Container */}
          <div className="flex-1 relative overflow-hidden">
            <div
              className="w-full h-full flex items-center justify-center cursor-zoom-in"
              onWheel={handleWheel}
              onClick={handleImageClick}
            >
              <img
                src={currentImage}
                alt={imageAlt}
                className={cn(
                  "max-w-full max-h-full object-contain transition-transform duration-200",
                  isDragging ? "cursor-grabbing" : "cursor-grab",
                  className
                )}
                style={{
                  transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onLoad={() => setImageLoaded(true)}
                draggable={false}
              />
            </div>

            {/* Loading indicator */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}

            {/* Navigation Arrows */}
            {showNavigation && images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                >
                  <Icons.ChevronLeft />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                >
                  <Icons.ChevronRight />
                </Button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {showThumbnails && images.length > 1 && (
            <div className="p-4 bg-black/50">
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => onIndexChange?.(index)}
                    className={cn(
                      "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                      index === currentIndex
                        ? "border-white"
                        : "border-transparent hover:border-white/50"
                    )}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-lg p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.1))}
              className="text-white hover:bg-white/20"
            >
              <Icons.Minus />
            </Button>
            <span className="text-white text-sm min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(prev => Math.min(prev * 1.2, 5))}
              className="text-white hover:bg-white/20"
            >
              <Icons.Plus />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
