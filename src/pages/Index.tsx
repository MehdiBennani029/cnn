import { useState } from "react";
import { Activity, Upload, AlertCircle } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { ImagePreview } from "@/components/ImagePreview";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { Header } from "@/components/Header";
import { toast } from "@/hooks/use-toast";

interface PredictionResult {
  predicted_class: string;
  predicted_confidence: number;
  class_probabilities: {
    Normal: number;
    Pneumonia: number;
  };
}

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResult(null);
  };

  const handlePredict = async () => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please upload a chest X-ray image first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Prediction failed");
      }

      const data: PredictionResult = await response.json();
      
      if (data.predicted_class === "error") {
        throw new Error("Could not process the image");
      }

      setResult(data);
      
      toast({
        title: "Analysis Complete",
        description: `Prediction: ${data.predicted_class}`,
      });
    } catch (error) {
      console.error("Prediction error:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not connect to the prediction service. Make sure the FastAPI server is running on localhost:8000",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setResult(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground font-outfit">
            Pneumonia Detection AI
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Advanced CNN-powered analysis for chest X-ray images. Upload an image to receive instant diagnostic insights.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <UploadZone 
              onFileSelect={handleFileSelect}
              disabled={isLoading}
            />
            
            {!selectedFile && (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-medium text-foreground">Important Guidelines:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Upload clear chest X-ray images (JPEG, PNG)</li>
                      <li>Ensure proper image quality and positioning</li>
                      <li>This tool is for educational purposes only</li>
                      <li>Always consult healthcare professionals</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <ImagePreview
              previewUrl={previewUrl}
              isLoading={isLoading}
              onPredict={handlePredict}
              onReset={handleReset}
              hasFile={!!selectedFile}
            />
          </div>
        </div>

        {result && (
          <div className="animate-scale-in">
            <ResultsDisplay result={result} />
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Medical AI Systems. For research and educational purposes.</p>
          <p className="mt-2">Always seek professional medical advice for diagnosis and treatment.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
