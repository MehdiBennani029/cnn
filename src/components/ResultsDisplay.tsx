import { CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ResultsDisplayProps {
  result: {
    predicted_class: string;
    predicted_confidence: number;
    class_probabilities: {
      Normal: number;
      Pneumonia: number;
    };
  };
}

export const ResultsDisplay = ({ result }: ResultsDisplayProps) => {
  const isPneumonia = result.predicted_class === "Pneumonia";
  const confidencePercent = (result.predicted_confidence * 100).toFixed(1);

  return (
    <div className="bg-card rounded-xl shadow-medical border border-border overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h3 className="text-2xl font-semibold text-foreground font-outfit">
            Analysis Results
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Main Prediction Card */}
          <div
            className={cn(
              "p-6 rounded-xl border-2 transition-smooth",
              isPneumonia
                ? "bg-warning/5 border-warning"
                : "bg-success/5 border-success"
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Diagnosis
                </p>
                <h4 className="text-3xl font-bold text-foreground font-outfit">
                  {result.predicted_class}
                </h4>
              </div>
              {isPneumonia ? (
                <AlertTriangle className="w-8 h-8 text-warning" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-success" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium text-muted-foreground">
                  Confidence
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {confidencePercent}%
                </span>
              </div>
              <Progress
                value={result.predicted_confidence * 100}
                className={cn(
                  "h-3",
                  isPneumonia
                    ? "[&>div]:bg-warning"
                    : "[&>div]:bg-success"
                )}
              />
            </div>
          </div>

          {/* Probabilities Breakdown */}
          <div className="p-6 rounded-xl border border-border bg-muted/30">
            <h4 className="text-lg font-semibold mb-4 text-foreground font-outfit">
              Class Probabilities
            </h4>
            <div className="space-y-4">
              {Object.entries(result.class_probabilities).map(([className, probability]) => {
                const percent = (probability * 100).toFixed(1);
                const isHighlighted = className === result.predicted_class;

                return (
                  <div key={className}>
                    <div className="flex justify-between items-baseline mb-2">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isHighlighted
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {className}
                      </span>
                      <span
                        className={cn(
                          "text-lg font-bold",
                          isHighlighted
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        {percent}%
                      </span>
                    </div>
                    <Progress
                      value={probability * 100}
                      className={cn(
                        "h-2",
                        isHighlighted
                          ? "[&>div]:bg-primary"
                          : "[&>div]:bg-muted-foreground/30"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground text-center">
            <strong className="text-foreground">Medical Disclaimer:</strong> This AI analysis is for educational and research purposes only. 
            Always consult qualified healthcare professionals for medical diagnosis and treatment decisions.
          </p>
        </div>
      </div>
    </div>
  );
};
