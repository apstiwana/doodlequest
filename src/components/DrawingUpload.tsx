import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Upload, RefreshCw, Check } from "lucide-react";

interface DrawingUploadProps {
  playerName: string;
  onComplete: (imageDataUrl: string, description: string) => void;
}

export function DrawingUpload({ playerName, onComplete }: DrawingUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file! 🖼️");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image is too big! Please use a smaller one. 📏");
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/remove-background`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Processing failed");
      }

      const data = await response.json();
      setPreviewUrl(data.imageData);
      setDescription(data.description || "a wonderful drawing");
    } catch (err) {
      console.error(err);
      // Fallback: use the local file URL directly
      const localUrl = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPreviewUrl(dataUrl);
        setDescription("a wonderful drawing come to life");
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processImage(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/30 via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 animate-float inline-block">🎨</div>
          <h2 className="font-display text-4xl text-primary mb-2">
            Upload Your Drawing!
          </h2>
          <p className="font-body text-muted-foreground text-lg">
            {playerName}, let's bring your creation to life! ✨
          </p>
        </div>

        {!previewUrl ? (
          /* Drop Zone */
          <div
            className={`
              relative border-4 border-dashed rounded-3xl p-10 text-center cursor-pointer
              transition-all duration-300 ease-in-out
              ${isDragging
                ? "border-primary bg-primary/10 scale-105"
                : "border-secondary/50 bg-card hover:border-primary hover:bg-primary/5 hover:scale-102"
              }
              ${isProcessing ? "pointer-events-none opacity-80" : ""}
            `}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {isProcessing ? (
              <div className="space-y-4">
                <div className="text-6xl animate-spin inline-block">✨</div>
                <p className="font-display text-2xl text-primary">
                  Making your drawing magic!
                </p>
                <p className="font-body text-muted-foreground">
                  Just a moment... 🪄
                </p>
                <div className="flex justify-center gap-2 mt-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`text-6xl transition-transform duration-300 ${isDragging ? "scale-125" : ""}`}>
                  🖼️
                </div>
                <p className="font-display text-2xl text-foreground">
                  {isDragging ? "Drop it here! 🎯" : "Drop your drawing here!"}
                </p>
                <p className="font-body text-muted-foreground">
                  or click to choose a photo
                </p>
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-full font-body font-semibold text-sm">
                    <Upload className="w-4 h-4" />
                    Choose Photo
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Works best with drawings on white paper 📄
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Preview */
          <div className="bg-card rounded-3xl p-6 shadow-lg space-y-5 animate-bounce-in">
            <div className="flex items-center gap-2 text-teal font-body font-semibold">
              <Check className="w-5 h-5" />
              Looking amazing, {playerName}!
            </div>

            <div
              className="relative mx-auto w-48 h-48 rounded-2xl overflow-hidden shadow-inner bg-gradient-to-br from-muted to-background flex items-center justify-center"
              style={{ backgroundImage: "radial-gradient(circle at 30% 30%, hsl(var(--accent)/0.3), transparent)" }}
            >
              <img
                src={previewUrl}
                alt="Your drawing"
                className="w-full h-full object-contain mix-blend-multiply"
                style={{ filter: "contrast(1.1) saturate(1.2)" }}
              />
            </div>

            {description && (
              <p className="font-body text-sm text-muted-foreground text-center italic">
                "{description}"
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setPreviewUrl(null); setDescription(""); fileInputRef.current?.click(); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-border font-body font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => onComplete(previewUrl, description)}
                className="flex-2 flex-grow flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-primary text-primary-foreground font-display text-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/30"
              >
                <Sparkles className="w-5 h-5" />
                Let's Go!
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-destructive/10 text-destructive rounded-2xl p-4 font-body text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
