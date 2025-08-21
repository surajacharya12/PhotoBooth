"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Sparkles, Download, RotateCcw, Palette } from "lucide-react";

type FilterType =
  | "Original"
  | "90s"
  | "2000s"
  | "Noir"
  | "Fisheye"
  | "Rainbow"
  | "Glitch"
  | "Crosshatch"
  | "Sepia"
  | "Vintage"
  | "Vivid"
  | "Blur"
  | "Brightness"
  | "Contrast"
  | "Grayscale"
  | "Invert"
  | "Pixelate";

interface CapturedPhoto {
  dataUrl: string;
  timestamp: number;
}

export default function PhotoBoothApp() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [currentFilter, setCurrentFilter] = useState<FilterType>("Original");
  const [showPhotoStrip, setShowPhotoStrip] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCurtains, setShowCurtains] = useState(true);
  const [curtainsAnimating, setCurtainsAnimating] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoStripCanvasRef = useRef<HTMLCanvasElement>(null);

  const availableFilters: {
    name: FilterType;
    label: string;
    css: string;
    color: string;
    icon: string;
  }[] = [
    {
      name: "Original",
      label: "Original",
      css: "none",
      color: "from-gray-200 to-gray-400",
      icon: "🟢",
    },
    {
      name: "90s",
      label: "90s",
      css: "sepia(0.8) saturate(1.4) hue-rotate(315deg) brightness(1.1)",
      color: "from-amber-400 to-orange-500",
      icon: "🌅",
    },
    {
      name: "2000s",
      label: "2000s",
      css: "saturate(1.6) contrast(1.2) brightness(1.1) hue-rotate(10deg)",
      color: "from-blue-400 to-purple-500",
      icon: "💫",
    },
    {
      name: "Noir",
      label: "Noir",
      css: "grayscale(1) contrast(1.3) brightness(0.9)",
      color: "from-gray-600 to-gray-800",
      icon: "🎭",
    },
    {
      name: "Fisheye",
      label: "Fisheye",
      css: "contrast(1.2) saturate(1.3)",
      color: "from-teal-400 to-cyan-500",
      icon: "🐠",
    },
    {
      name: "Rainbow",
      label: "Rainbow",
      css: "hue-rotate(180deg) saturate(2) brightness(1.2)",
      color: "from-pink-400 to-red-500",
      icon: "🌈",
    },
    {
      name: "Glitch",
      label: "Glitch",
      css: "hue-rotate(90deg) saturate(2) contrast(1.5)",
      color: "from-green-400 to-emerald-500",
      icon: "⚡",
    },
    {
      name: "Crosshatch",
      label: "Crosshatch",
      css: "contrast(1.4) brightness(0.8) saturate(0.8)",
      color: "from-indigo-400 to-purple-600",
      icon: "✨",
    },
    {
      name: "Sepia",
      label: "Sepia",
      css: "sepia(1)",
      color: "from-yellow-700 to-yellow-400",
      icon: "🟤",
    },
    {
      name: "Vintage",
      label: "Vintage",
      css: "sepia(0.6) contrast(1.1) brightness(0.95)",
      color: "from-yellow-900 to-yellow-600",
      icon: "📻",
    },
    {
      name: "Vivid",
      label: "Vivid",
      css: "saturate(2) brightness(1.2)",
      color: "from-red-400 to-yellow-400",
      icon: "🌞",
    },
    {
      name: "Blur",
      label: "Blur",
      css: "blur(2px)",
      color: "from-blue-200 to-blue-400",
      icon: "💧",
    },
    {
      name: "Brightness",
      label: "Brightness",
      css: "brightness(1.5)",
      color: "from-yellow-200 to-yellow-400",
      icon: "🔆",
    },
    {
      name: "Contrast",
      label: "Contrast",
      css: "contrast(2)",
      color: "from-gray-800 to-gray-400",
      icon: "⚫",
    },
    {
      name: "Grayscale",
      label: "Grayscale",
      css: "grayscale(1)",
      color: "from-gray-400 to-gray-700",
      icon: "⚪",
    },
    {
      name: "Invert",
      label: "Invert",
      css: "invert(1)",
      color: "from-black to-white",
      icon: "🔄",
    },
    {
      name: "Pixelate",
      label: "Pixelate",
      css: "contrast(1.2) saturate(1.2)", // Placeholder, true pixelate needs canvas manipulation
      color: "from-pink-200 to-pink-400",
      icon: "🟪",
    },
  ];

  const backgroundClouds = [
    { width: 80, height: 50, left: 10, top: 15 },
    { width: 120, height: 70, left: 25, top: 8 },
    { width: 90, height: 55, left: 45, top: 20 },
    { width: 110, height: 65, left: 65, top: 12 },
    { width: 85, height: 45, left: 80, top: 25 },
    { width: 95, height: 60, left: 15, top: 45 },
    { width: 130, height: 75, left: 35, top: 40 },
    { width: 75, height: 40, left: 55, top: 50 },
    { width: 100, height: 55, left: 75, top: 35 },
    { width: 115, height: 70, left: 5, top: 70 },
    { width: 90, height: 50, left: 30, top: 75 },
    { width: 105, height: 65, left: 50, top: 80 },
    { width: 80, height: 45, left: 70, top: 65 },
    { width: 125, height: 80, left: 85, top: 75 },
  ];

  const initializePhotoBooth = async () => {
    setCurtainsAnimating(true);
    setTimeout(() => {
      setShowCurtains(false);
      requestCameraAccess();
    }, 2000);
  };

  const requestCameraAccess = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported by this browser");
      }

      const cameraConfigs = [
        {
          video: {
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            facingMode: "user",
            frameRate: { ideal: 30, min: 15 },
          },
          audio: false,
        },
        {
          video: {
            width: { ideal: 1280, min: 960 },
            height: { ideal: 720, min: 540 },
            facingMode: "user",
            frameRate: { ideal: 30 },
          },
          audio: false,
        },
        {
          video: {
            width: { ideal: 960 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        },
        {
          video: {
            width: 640,
            height: 480,
          },
          audio: false,
        },
      ];

      let mediaStream = null;
      let lastError = null;

      for (const config of cameraConfigs) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(config);
          break;
        } catch (error) {
          lastError = error;
          continue;
        }
      }

      if (!mediaStream) {
        throw lastError || new Error("Could not access camera");
      }

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        await new Promise((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error("Video element not found"));
            return;
          }

          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current
                .play()
                .then(() => resolve(true))
                .catch(reject);
            }
          };

          videoRef.current.onerror = (error) => {
            reject(error);
          };

          setTimeout(() => {
            reject(new Error("Video loading timeout"));
          }, 10000);
        });
      }

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown camera error";
      alert(
        `Camera Error: ${errorMessage}\n\nPlease:\n1. Allow camera permissions\n2. Make sure no other app is using the camera\n3. Try refreshing the page`
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      video.srcObject = stream;

      const handleVideoReady = () => {
        video.play().catch(console.error);
      };

      video.addEventListener("canplay", handleVideoReady);

      return () => {
        video.removeEventListener("canplay", handleVideoReady);
      };
    }
  }, [stream]);

  const captureCurrentFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (!context) return null;

    // Set high-quality canvas dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Use higher resolution for better quality
    const scaleFactor = Math.min(2, Math.max(1, 1920 / videoWidth));
    canvas.width = videoWidth * scaleFactor;
    canvas.height = videoHeight * scaleFactor;

    // Enable high-quality rendering
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    const selectedFilter =
      availableFilters.find((f) => f.name === currentFilter)?.css || "";
    context.filter = selectedFilter;

    context.save();
    context.scale(-scaleFactor, scaleFactor);
    context.drawImage(
      video,
      -canvas.width / scaleFactor,
      0,
      videoWidth,
      videoHeight
    );
    context.restore();

    context.filter = "none";

    // Export with maximum quality
    return canvas.toDataURL("image/jpeg", 0.95);
  }, [currentFilter, availableFilters]);

  const handlePhotoCapture = useCallback(async () => {
    if (isCapturing || capturedPhotos.length >= 3) return;

    setIsCapturing(true);

    const countdownSequence = ["3...", "2...", "1...", "Smile..."];

    for (let i = 0; i < countdownSequence.length; i++) {
      setCountdown(countdownSequence[i]);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setCountdown(null);

    const photoData = captureCurrentFrame();
    if (photoData) {
      const newPhoto = {
        dataUrl: photoData,
        timestamp: Date.now(),
      };
      setCapturedPhotos((prevPhotos) => {
        const updatedPhotos = [...prevPhotos, newPhoto];
        if (updatedPhotos.length === 3) {
          setTimeout(() => setShowPhotoStrip(true), 500);
        }
        return updatedPhotos;
      });
    }

    setIsCapturing(false);
  }, [isCapturing, capturedPhotos.length, captureCurrentFrame]);

  const createPhotoStrip = useCallback(() => {
    if (!photoStripCanvasRef.current || capturedPhotos.length !== 3) return;

    const canvas = photoStripCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High-resolution photo strip for better quality
    const STRIP_WIDTH = 600; // Doubled for higher resolution
    const STRIP_HEIGHT = 1400; // Doubled for higher resolution
    const PHOTO_WIDTH = 500; // Doubled for higher resolution
    const PHOTO_HEIGHT = 370; // Doubled for higher resolution
    const MARGIN = 30; // Scaled margin
    const PHOTO_SPACING = 40; // Scaled spacing
    const TEXT_AREA_HEIGHT = 200; // Scaled text area

    canvas.width = STRIP_WIDTH;
    canvas.height = STRIP_HEIGHT;

    // Enable high-quality rendering for photo strip
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Helper function to draw high-quality text that fits within width
    const drawFittingText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      fontSize: number = 32 // Doubled for high-res canvas
    ) => {
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      let metrics = ctx.measureText(text);

      // Reduce font size if text is too wide
      let currentFontSize = fontSize;
      while (metrics.width > maxWidth && currentFontSize > 16) {
        currentFontSize--;
        ctx.font = `bold ${currentFontSize}px Arial, sans-serif`;
        metrics = ctx.measureText(text);
      }

      ctx.fillText(text, x, y);
      return currentFontSize;
    };

    const backgroundGradient = ctx.createLinearGradient(0, 0, 0, STRIP_HEIGHT);
    backgroundGradient.addColorStop(0, "#ffffff");
    backgroundGradient.addColorStop(1, "#f8f9fa");
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT);

    ctx.strokeStyle = "#e9ecef";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, STRIP_WIDTH - 2, STRIP_HEIGHT - 2);

    let loadedCount = 0;
    capturedPhotos.forEach((photo, index) => {
      const img = new Image();
      img.onload = () => {
        // Calculate photo position, ensuring photos stay in the upper area
        const availablePhotoHeight = STRIP_HEIGHT - TEXT_AREA_HEIGHT;
        const totalPhotosHeight = 3 * PHOTO_HEIGHT + 2 * PHOTO_SPACING;
        const topMargin = Math.max(
          MARGIN,
          (availablePhotoHeight - totalPhotosHeight) / 2
        );
        const yPosition = topMargin + index * (PHOTO_HEIGHT + PHOTO_SPACING);

        // High-quality shadows (scaled for high-res)
        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 16;
        ctx.shadowOffsetX = 6;
        ctx.shadowOffsetY = 6;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
          MARGIN - 10,
          yPosition - 10,
          PHOTO_WIDTH + 20,
          PHOTO_HEIGHT + 20
        );

        // Draw high-quality photo with anti-aliasing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, MARGIN, yPosition, PHOTO_WIDTH, PHOTO_HEIGHT);

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.strokeStyle = "#dee2e6";
        ctx.lineWidth = 2; // Scaled line width
        ctx.strokeRect(MARGIN, yPosition, PHOTO_WIDTH, PHOTO_HEIGHT);

        loadedCount++;

        if (loadedCount === 3) {
          // Reset any transformations and shadows
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // Set text properties
          ctx.fillStyle = "#495057";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          // Format the date properly
          const currentDate = new Date().toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });

          // Create the text lines with proper spacing
          const titleText = "📸 College Wishlist";
          const dateText = currentDate;

          // Available width for text (with generous padding) - scaled for high-res
          const maxTextWidth = STRIP_WIDTH - 100;

          // Position text in the reserved text area at the bottom
          const textAreaStart = STRIP_HEIGHT - TEXT_AREA_HEIGHT;

          // Draw the title with fitting font size (scaled for high-res)
          const titleFontSize = drawFittingText(
            titleText,
            STRIP_WIDTH / 2,
            textAreaStart + 70, // Position title in upper part of text area
            maxTextWidth,
            36 // Scaled font size
          );

          // Draw the date with smaller font
          drawFittingText(
            dateText,
            STRIP_WIDTH / 2,
            textAreaStart + 130, // Position date below title
            maxTextWidth,
            Math.max(titleFontSize - 6, 24) // Scaled font size
          );
        }
      };
      img.src = photo.dataUrl;
    });
  }, [capturedPhotos]);

  useEffect(() => {
    if (showPhotoStrip && capturedPhotos.length === 3) {
      setTimeout(createPhotoStrip, 100);
    }
  }, [showPhotoStrip, capturedPhotos, createPhotoStrip]);

  const downloadStrip = () => {
    if (!photoStripCanvasRef.current) return;

    const downloadLink = document.createElement("a");
    downloadLink.download = `college-wishlist-photos-${Date.now()}.jpg`;
    // Export with maximum quality for high-resolution canvas
    downloadLink.href = photoStripCanvasRef.current.toDataURL(
      "image/jpeg",
      0.98
    );
    downloadLink.click();
  };

  const resetPhotoBooth = () => {
    setShowPhotoStrip(false);
    setCapturedPhotos([]);
    setCountdown(null);
  };

  if (showCurtains) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        </div>

        <div className="flex items-center justify-center min-h-screen relative">
          <div className="text-center z-20">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-6 rounded-2xl text-3xl font-bold mb-8 shadow-2xl backdrop-blur-sm border border-white/20">
              <Sparkles className="inline w-8 h-8 mr-3" />
              Welcome To College Wishlist
            </div>
            <div
              className="bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 w-80 h-80 mx-auto rounded-3xl flex items-center justify-center shadow-2xl cursor-pointer hover:scale-105 transition-all duration-300 border-4 border-white/20 backdrop-blur-sm"
              onClick={initializePhotoBooth}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">📸</div>
                <div className="text-white text-lg font-bold leading-tight">
                  TAP TO START
                  <br />
                  <span className="text-sm opacity-80">Your Photo Journey</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modern curtains */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div
              className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-slate-900 via-purple-900 to-purple-800 shadow-2xl transition-transform duration-2000 ease-in-out ${
                curtainsAnimating ? "-translate-x-full" : "translate-x-0"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent"></div>
            </div>

            <div
              className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-slate-900 via-purple-900 to-purple-800 shadow-2xl transition-transform duration-2000 ease-in-out ${
                curtainsAnimating ? "translate-x-full" : "translate-x-0"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-l from-purple-600/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        </div>

        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-6 rounded-2xl text-3xl font-bold mb-8 shadow-2xl backdrop-blur-sm border border-white/20">
              <Sparkles className="inline w-8 h-8 mr-3" />
              College Wishlist
            </div>
            <div className="text-white text-xl flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              Initializing camera...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-12 gap-4 h-full">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border border-white/10"></div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        {!showPhotoStrip ? (
          <div className="w-full max-w-lg">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent mb-2">
                College Wishlist
              </h1>
              <p className="text-white/70 text-lg">
                Create amazing memories with style
              </p>
            </div>

            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              <div className="relative">
                {/* Camera viewport */}
                <div className="relative rounded-2xl overflow-hidden bg-black/50 aspect-[4/3] border border-white/20">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{
                      filter:
                        availableFilters.find((f) => f.name === currentFilter)
                          ?.css || "",
                      transform:
                        currentFilter === "Fisheye"
                          ? "scaleX(-1) scale(1.1)"
                          : "scaleX(-1)",
                    }}
                  />

                  {/* Countdown overlay */}
                  {countdown && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-white text-7xl font-bold animate-bounce text-center drop-shadow-2xl">
                        {countdown}
                      </div>
                    </div>
                  )}

                  {/* Photo counter */}
                  {capturedPhotos.length > 0 && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm">
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      {capturedPhotos.length}/3
                    </div>
                  )}

                  {/* Corner decorations */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-white/30 rounded-tl-lg"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-white/30 rounded-tr-lg"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-white/30 rounded-bl-lg"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-white/30 rounded-br-lg"></div>
                </div>

                {/* Filter selection */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-5 h-5 text-white/70" />
                    <span className="text-white/70 text-sm font-medium">
                      Choose your style
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent">
                    {availableFilters.map((filter) => (
                      <Button
                        key={filter.name}
                        variant="ghost"
                        size="sm"
                        className={`relative h-16 min-w-[80px] p-2 rounded-xl border transition-all duration-300 flex-shrink-0 ${
                          currentFilter === filter.name
                            ? `bg-gradient-to-r ${filter.color} text-white border-white/30 shadow-lg scale-105`
                            : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:border-white/20"
                        }`}
                        onClick={() => setCurrentFilter(filter.name)}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-lg">{filter.icon}</span>
                          <span className="text-xs font-medium">
                            {filter.label}
                          </span>
                        </div>
                        {currentFilter === filter.name && (
                          <div className="absolute inset-0 rounded-xl bg-white/10 backdrop-blur-sm"></div>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Capture button */}
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={handlePhotoCapture}
                    disabled={isCapturing || capturedPhotos.length >= 3}
                    className="relative w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-0 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110 transition-all duration-300 border-4 border-white/20"
                  >
                    <Camera className="w-8 h-8" />
                    {!isCapturing && (
                      <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
                    )}
                  </Button>
                </div>

                {/* Status message */}
                <div className="text-center mt-6">
                  <p className="text-white/80 text-sm font-medium">
                    {capturedPhotos.length === 0 &&
                      "✨ Ready to capture your first moment"}
                    {capturedPhotos.length === 1 &&
                      "🎉 Amazing! Two more to go"}
                    {capturedPhotos.length === 2 && "🔥 One final shot!"}
                    {capturedPhotos.length === 3 &&
                      "🎊 Perfect! Your strip is ready"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-4xl w-full shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                Your Photo Strip is Ready! 🎉
              </h2>
              <p className="text-white/70">
                Share your memories with the world
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
              <div className="relative">
                <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl shadow-2xl transform hover:rotate-1 transition-transform duration-300 border border-white/30">
                  <canvas
                    ref={photoStripCanvasRef}
                    className="max-w-[320px] w-full h-auto rounded-lg shadow-2xl"
                  />
                </div>
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-2 rounded-full shadow-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Button
                  onClick={resetPhotoBooth}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-white/20"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Take New Photos
                </Button>
                <Button
                  onClick={downloadStrip}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-white/20"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Strip
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
