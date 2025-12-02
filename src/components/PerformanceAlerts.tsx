import { useEffect } from "react";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AlertConfig {
  metric: string;
  value: number;
  threshold: number;
  type: "min" | "max";
}

interface PerformanceAlertsProps {
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    specificity: number;
    auc_roc: number;
  };
  thresholds?: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    specificity: number;
    auc_roc: number;
  };
  showToasts?: boolean;
}

const defaultThresholds = {
  accuracy: 0.85,
  precision: 0.80,
  recall: 0.85,
  f1_score: 0.82,
  specificity: 0.80,
  auc_roc: 0.85,
};

const metricLabels: Record<string, string> = {
  accuracy: "Accuracy",
  precision: "Precision",
  recall: "Recall (Sensitivity)",
  f1_score: "F1 Score",
  specificity: "Specificity",
  auc_roc: "AUC-ROC",
};

export const PerformanceAlerts = ({
  metrics,
  thresholds = defaultThresholds,
  showToasts = true,
}: PerformanceAlertsProps) => {
  const alerts: AlertConfig[] = [
    { metric: "accuracy", value: metrics.accuracy, threshold: thresholds.accuracy, type: "min" },
    { metric: "precision", value: metrics.precision, threshold: thresholds.precision, type: "min" },
    { metric: "recall", value: metrics.recall, threshold: thresholds.recall, type: "min" },
    { metric: "f1_score", value: metrics.f1_score, threshold: thresholds.f1_score, type: "min" },
    { metric: "specificity", value: metrics.specificity, threshold: thresholds.specificity, type: "min" },
    { metric: "auc_roc", value: metrics.auc_roc, threshold: thresholds.auc_roc, type: "min" },
  ];

  const criticalAlerts = alerts.filter(a => a.value < a.threshold * 0.9); // More than 10% below
  const warningAlerts = alerts.filter(a => a.value < a.threshold && a.value >= a.threshold * 0.9);
  const healthyMetrics = alerts.filter(a => a.value >= a.threshold);

  useEffect(() => {
    if (!showToasts) return;

    criticalAlerts.forEach(alert => {
      toast({
        title: `Critical: ${metricLabels[alert.metric]} Below Threshold`,
        description: `${metricLabels[alert.metric]} is at ${(alert.value * 100).toFixed(1)}% (threshold: ${(alert.threshold * 100).toFixed(0)}%)`,
        variant: "destructive",
      });
    });

    if (warningAlerts.length > 0 && criticalAlerts.length === 0) {
      toast({
        title: "Performance Warning",
        description: `${warningAlerts.length} metric(s) slightly below threshold`,
      });
    }
  }, []);

  const getAlertLevel = (value: number, threshold: number) => {
    if (value >= threshold) return "healthy";
    if (value >= threshold * 0.9) return "warning";
    return "critical";
  };

  return (
    <div className="bg-card rounded-xl shadow-card border border-border p-6">
      <h3 className="text-xl font-semibold mb-4 text-foreground font-outfit flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-warning" />
        Performance Monitoring
      </h3>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-destructive/10 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-destructive">{criticalAlerts.length}</div>
          <div className="text-sm text-muted-foreground">Critical</div>
        </div>
        <div className="bg-warning/10 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-warning">{warningAlerts.length}</div>
          <div className="text-sm text-muted-foreground">Warnings</div>
        </div>
        <div className="bg-success/10 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-success">{healthyMetrics.length}</div>
          <div className="text-sm text-muted-foreground">Healthy</div>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {alerts.map(alert => {
          const level = getAlertLevel(alert.value, alert.threshold);
          return (
            <div
              key={alert.metric}
              className={cn(
                "p-3 rounded-lg border flex items-center justify-between",
                level === "critical" && "bg-destructive/5 border-destructive/30",
                level === "warning" && "bg-warning/5 border-warning/30",
                level === "healthy" && "bg-success/5 border-success/30"
              )}
            >
              <div className="flex items-center gap-3">
                {level === "critical" && <XCircle className="w-5 h-5 text-destructive" />}
                {level === "warning" && <AlertTriangle className="w-5 h-5 text-warning" />}
                {level === "healthy" && <CheckCircle className="w-5 h-5 text-success" />}
                <div>
                  <p className="font-medium text-foreground">{metricLabels[alert.metric]}</p>
                  <p className="text-xs text-muted-foreground">
                    Threshold: {(alert.threshold * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-lg font-bold",
                  level === "critical" && "text-destructive",
                  level === "warning" && "text-warning",
                  level === "healthy" && "text-success"
                )}>
                  {(alert.value * 100).toFixed(1)}%
                </p>
                <p className={cn(
                  "text-xs",
                  level === "critical" && "text-destructive",
                  level === "warning" && "text-warning",
                  level === "healthy" && "text-success"
                )}>
                  {level === "healthy" ? "Above threshold" : `${((alert.threshold - alert.value) * 100).toFixed(1)}% below`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-start gap-2">
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Alerts are triggered when metrics fall below configured thresholds. 
          Critical alerts indicate performance more than 10% below threshold.
        </p>
      </div>
    </div>
  );
};
