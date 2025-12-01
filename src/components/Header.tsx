import { Activity, Info } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-outfit font-semibold text-lg text-foreground">
                Medical AI
              </h2>
              <p className="text-xs text-muted-foreground">
                Diagnostic Assistance
              </p>
            </div>
          </div>

          <HoverCard>
            <HoverCardTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-smooth">
                <Info className="w-4 h-4 text-secondary-foreground" />
                <span className="text-sm font-medium text-secondary-foreground">
                  System Info
                </span>
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Model Information</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Model Type:</span>
                    <span className="font-medium text-foreground">CNN</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Input Size:</span>
                    <span className="font-medium text-foreground">224×224</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Classes:</span>
                    <span className="font-medium text-foreground">Normal, Pneumonia</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Backend:</span>
                    <span className="font-medium text-foreground">FastAPI + TensorFlow</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
    </header>
  );
};
