import { cn } from "@/lib/utils";

interface ConfusionMatrixProps {
  matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
  };
}

export const ConfusionMatrix = ({ matrix }: ConfusionMatrixProps) => {
  const total = matrix.true_negative + matrix.false_positive + matrix.false_negative + matrix.true_positive;

  const getPercentage = (value: number) => ((value / total) * 100).toFixed(1);

  return (
    <div className="bg-card rounded-xl shadow-card border border-border p-6">
      <h3 className="text-xl font-semibold mb-4 text-foreground font-outfit">
        Confusion Matrix
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div></div>
          <div className="font-semibold text-muted-foreground">Predicted Normal</div>
          <div className="font-semibold text-muted-foreground">Predicted Pneumonia</div>
        </div>

        {/* Actual Normal Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center font-semibold text-sm text-muted-foreground">
            Actual Normal
          </div>
          <div className="p-4 rounded-lg bg-success/10 border-2 border-success/30">
            <div className="text-2xl font-bold text-success">
              {matrix.true_negative}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              True Negative ({getPercentage(matrix.true_negative)}%)
            </div>
          </div>
          <div className="p-4 rounded-lg bg-warning/10 border-2 border-warning/30">
            <div className="text-2xl font-bold text-warning">
              {matrix.false_positive}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              False Positive ({getPercentage(matrix.false_positive)}%)
            </div>
          </div>
        </div>

        {/* Actual Pneumonia Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center font-semibold text-sm text-muted-foreground">
            Actual Pneumonia
          </div>
          <div className="p-4 rounded-lg bg-destructive/10 border-2 border-destructive/30">
            <div className="text-2xl font-bold text-destructive">
              {matrix.false_negative}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              False Negative ({getPercentage(matrix.false_negative)}%)
            </div>
          </div>
          <div className="p-4 rounded-lg bg-success/10 border-2 border-success/30">
            <div className="text-2xl font-bold text-success">
              {matrix.true_positive}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              True Positive ({getPercentage(matrix.true_positive)}%)
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-success"></div>
            <span className="text-muted-foreground">Correct Predictions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive"></div>
            <span className="text-muted-foreground">Critical Miss</span>
          </div>
        </div>
      </div>
    </div>
  );
};
