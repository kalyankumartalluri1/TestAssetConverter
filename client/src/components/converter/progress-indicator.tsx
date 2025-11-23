import { Check } from "lucide-react";

interface ProgressStep {
  label: string;
  completed: boolean;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div className="space-y-3" data-testid="progress-indicator">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
              step.completed
                ? "bg-primary text-primary-foreground"
                : index < currentStep
                ? "bg-muted text-muted-foreground"
                : "bg-muted text-muted-foreground"
            }`}
            data-testid={`progress-step-${index}`}
          >
            {step.completed ? (
              <Check className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>
          <span
            className={`text-sm ${
              step.completed ? "text-primary font-medium" : "text-muted-foreground"
            }`}
            data-testid={`step-label-${index}`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
