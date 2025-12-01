import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface ROCCurveProps {
  data: {
    fpr: number[];
    tpr: number[];
    thresholds: number[];
  };
  auc: number;
}

export const ROCCurve = ({ data, auc }: ROCCurveProps) => {
  // Transform data for recharts
  const chartData = data.fpr.map((fpr, index) => ({
    fpr: Number((fpr * 100).toFixed(2)),
    tpr: Number((data.tpr[index] * 100).toFixed(2)),
    threshold: Number(data.thresholds[index].toFixed(3)),
  }));

  // Diagonal reference line (random classifier)
  const diagonalData = [
    { fpr: 0, tpr: 0 },
    { fpr: 100, tpr: 100 },
  ];

  return (
    <div className="bg-card rounded-xl shadow-card border border-border p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground font-outfit mb-2">
          ROC Curve Analysis
        </h3>
        <p className="text-sm text-muted-foreground">
          Receiver Operating Characteristic curve showing model performance across all classification thresholds
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10">
          <span className="text-sm font-medium text-muted-foreground">AUC Score:</span>
          <span className="text-xl font-bold text-primary">{(auc * 100).toFixed(2)}%</span>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="fpr"
              label={{
                value: "False Positive Rate (%)",
                position: "insideBottom",
                offset: -5,
                className: "fill-muted-foreground text-xs",
              }}
              className="text-xs fill-muted-foreground"
            />
            <YAxis
              label={{
                value: "True Positive Rate (%)",
                angle: -90,
                position: "insideLeft",
                className: "fill-muted-foreground text-xs",
              }}
              className="text-xs fill-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: number, name: string) => {
                if (name === "tpr") return [`${value}%`, "True Positive Rate"];
                if (name === "fpr") return [`${value}%`, "False Positive Rate"];
                return [value, name];
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
              }}
            />
            
            {/* Diagonal reference line (random classifier) */}
            <Line
              data={diagonalData}
              type="monotone"
              dataKey="tpr"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="Random Classifier"
              legendType="line"
            />
            
            {/* ROC Curve */}
            <Line
              type="monotone"
              dataKey="tpr"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={false}
              name="Model ROC Curve"
              legendType="line"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
        <h4 className="font-semibold text-sm text-foreground mb-2">
          Understanding the ROC Curve
        </h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• The curve shows the trade-off between sensitivity (TPR) and specificity (1-FPR)</p>
          <p>• A perfect classifier would have an AUC of 100% (curve hugging the top-left corner)</p>
          <p>• The dashed diagonal line represents random guessing (AUC = 50%)</p>
          <p>• Your model's AUC of {(auc * 100).toFixed(1)}% indicates {auc > 0.9 ? "excellent" : auc > 0.8 ? "good" : "moderate"} discriminative ability</p>
        </div>
      </div>
    </div>
  );
};
