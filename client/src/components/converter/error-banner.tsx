import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3"
      data-testid="error-banner"
    >
      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-destructive font-medium" data-testid="error-message">
          {message}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        className="h-6 w-6 flex-shrink-0"
        data-testid="button-dismiss-error"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
