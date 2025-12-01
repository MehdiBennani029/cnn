import { useCallback } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const UploadZone = ({ onFileSelect, disabled }: UploadZoneProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find(file => file.type.startsWith("image/"));
      
      if (imageFile) {
        onFileSelect(imageFile);
      }
    },
    [onFileSelect, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-4 text-foreground font-outfit">
          Upload X-Ray Image
        </h3>
        
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 transition-smooth",
            "hover:border-primary hover:bg-primary/5",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            "bg-muted/30"
          )}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            disabled={disabled}
            className="hidden"
            id="file-upload"
          />
          
          <label
            htmlFor="file-upload"
            className={cn(
              "flex flex-col items-center gap-4",
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            )}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            
            <div className="text-center">
              <p className="text-base font-medium text-foreground mb-1">
                Drop your X-ray image here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse files
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="w-4 h-4" />
              <span>Supports: JPEG, PNG</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
