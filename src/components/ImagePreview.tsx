import { Loader2, Scan, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  previewUrl: string;
  isLoading: boolean;
  onPredict: () => void;
  onReset: () => void;
  hasFile: boolean;
}

export const ImagePreview = ({
  previewUrl,
  isLoading,
  onPredict,
  onReset,
  hasFile,
}: ImagePreviewProps) => {
  return (
    <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden h-full">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-4 text-foreground font-outfit">
          Image Preview
        </h3>

        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted/50 border border-border mb-6">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="X-ray preview"
              className={cn(
                "w-full h-full object-contain transition-smooth",
                isLoading && "opacity-50"
              )}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Scan className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No image selected</p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">
                  Analyzing image...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This may take a few seconds
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onPredict}
            disabled={!hasFile || isLoading}
            className="flex-1 h-12 text-base font-medium gradient-primary hover:opacity-90 transition-smooth"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Scan className="w-5 h-5 mr-2" />
                Analyze Image
              </>
            )}
          </Button>

          {hasFile && (
            <Button
              onClick={onReset}
              disabled={isLoading}
              variant="outline"
              className="h-12 px-6"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
