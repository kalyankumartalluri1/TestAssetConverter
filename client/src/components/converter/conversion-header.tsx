import { Settings } from "lucide-react";

interface ConversionHeaderProps {
  currentStep: number;
  totalSteps: number;
}

export function ConversionHeader({ currentStep, totalSteps }: ConversionHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary-foreground" data-testid="icon-logo" />
          </div>
          <div>
            <h1 className="text-lg font-semibold" data-testid="text-app-title">
              Test Asset Converter
            </h1>
            <p className="text-xs text-muted-foreground" data-testid="text-app-subtitle">
              AI-Powered Test Automation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground" data-testid="text-step-indicator">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      </div>
    </header>
  );
}
