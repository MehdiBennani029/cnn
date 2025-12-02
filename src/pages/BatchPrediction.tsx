import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { 
  FileStack, 
  Upload, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Trash2,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BatchResult {
  fileName: string;
  predicted_class: string;
  predicted_confidence: number;
  class_probabilities: {
    Normal: number;
    Pneumonia: number;
  };
  status: "pending" | "processing" | "completed" | "error";
  error?: string;
}

const BatchPrediction = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(f => 
      f.type.startsWith("image/")
    );
    
    if (selectedFiles.length === 0) {
      toast({
        title: "No valid images",
        description: "Please select image files only",
        variant: "destructive",
      });
      return;
    }

    setFiles(prev => [...prev, ...selectedFiles]);
    setResults(prev => [
      ...prev,
      ...selectedFiles.map(f => ({
        fileName: f.name,
        predicted_class: "",
        predicted_confidence: 0,
        class_probabilities: { Normal: 0, Pneumonia: 0 },
        status: "pending" as const,
      }))
    ]);
    
    toast({
      title: "Files added",
      description: `Added ${selectedFiles.length} image(s) to batch`,
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => 
      f.type.startsWith("image/")
    );
    
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
      setResults(prev => [
        ...prev,
        ...droppedFiles.map(f => ({
          fileName: f.name,
          predicted_class: "",
          predicted_confidence: 0,
          class_probabilities: { Normal: 0, Pneumonia: 0 },
          status: "pending" as const,
        }))
      ]);
    }
  }, []);

  const processFiles = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    
    for (let i = 0; i < files.length; i++) {
      setCurrentIndex(i);
      
      // Update status to processing
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: "processing" } : r
      ));
      
      const formData = new FormData();
      formData.append("file", files[i]);
      
      try {
        const response = await fetch("http://localhost:8000/predict", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) throw new Error("Prediction failed");
        
        const data = await response.json();
        
        setResults(prev => prev.map((r, idx) => 
          idx === i ? {
            ...r,
            predicted_class: data.predicted_class,
            predicted_confidence: data.predicted_confidence,
            class_probabilities: data.class_probabilities,
            status: "completed",
          } : r
        ));
      } catch (error) {
        setResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: "error", error: "Failed to process" } : r
        ));
      }
    }
    
    setIsProcessing(false);
    toast({
      title: "Batch processing complete",
      description: `Processed ${files.length} images`,
    });
  };

  const clearAll = () => {
    setFiles([]);
    setResults([]);
    setCurrentIndex(0);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setResults(prev => prev.filter((_, i) => i !== index));
  };

  const exportResults = () => {
    const completedResults = results.filter(r => r.status === "completed");
    const csv = [
      "File Name,Prediction,Confidence,Normal Probability,Pneumonia Probability",
      ...completedResults.map(r => 
        `${r.fileName},${r.predicted_class},${(r.predicted_confidence * 100).toFixed(2)}%,${(r.class_probabilities.Normal * 100).toFixed(2)}%,${(r.class_probabilities.Pneumonia * 100).toFixed(2)}%`
      )
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch_results_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const completedCount = results.filter(r => r.status === "completed").length;
  const pneumoniaCount = results.filter(r => r.predicted_class === "Pneumonia").length;
  const normalCount = results.filter(r => r.predicted_class === "Normal").length;
  const progress = files.length > 0 ? (completedCount / files.length) * 100 : 0;

  return (
    <div className="min-h-screen gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
            <FileStack className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-foreground font-outfit">
            Batch Analysis
          </h1>
          <p className="text-muted-foreground">
            Process multiple X-ray images at once
          </p>
        </div>

        {/* Upload Zone */}
        <div 
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className={cn(
            "bg-card rounded-xl border-2 border-dashed border-border p-8 mb-6 transition-all",
            "hover:border-primary hover:bg-primary/5",
            isProcessing && "opacity-50 pointer-events-none"
          )}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="batch-upload"
            disabled={isProcessing}
          />
          <label htmlFor="batch-upload" className="flex flex-col items-center cursor-pointer">
            <Upload className="w-12 h-12 text-primary mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">
              Drop images here or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Select multiple X-ray images for batch processing
            </p>
          </label>
        </div>

        {/* Stats & Actions */}
        {files.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{files.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{normalCount}</p>
                  <p className="text-xs text-muted-foreground">Normal</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">{pneumoniaCount}</p>
                  <p className="text-xs text-muted-foreground">Pneumonia</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={processFiles}
                  disabled={isProcessing || files.length === 0}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing ({currentIndex + 1}/{files.length})
                    </>
                  ) : (
                    "Analyze All"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={exportResults}
                  disabled={completedCount === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="destructive"
                  onClick={clearAll}
                  disabled={isProcessing}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
            
            {isProcessing && (
              <Progress value={progress} className="h-2" />
            )}
          </div>
        )}

        {/* Results List */}
        {results.length > 0 && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Results</h3>
            </div>
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {results.map((result, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "p-4 flex items-center gap-4 transition-colors",
                    result.status === "processing" && "bg-primary/5"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{result.fileName}</p>
                    {result.status === "completed" && (
                      <p className="text-sm text-muted-foreground">
                        {(result.predicted_confidence * 100).toFixed(1)}% confidence
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {result.status === "pending" && (
                      <span className="text-sm text-muted-foreground">Pending</span>
                    )}
                    {result.status === "processing" && (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    )}
                    {result.status === "completed" && (
                      <div className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1",
                        result.predicted_class === "Normal" 
                          ? "bg-success/10 text-success" 
                          : "bg-warning/10 text-warning"
                      )}>
                        {result.predicted_class === "Normal" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        {result.predicted_class}
                      </div>
                    )}
                    {result.status === "error" && (
                      <div className="px-3 py-1 rounded-full text-sm font-medium bg-destructive/10 text-destructive flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        Error
                      </div>
                    )}
                    
                    {!isProcessing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(idx)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BatchPrediction;
