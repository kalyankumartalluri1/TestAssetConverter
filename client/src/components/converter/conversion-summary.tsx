import { AIProvider, ConversionAgent } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface ConversionSummaryProps {
  provider: AIProvider | null;
  agent: ConversionAgent | null;
  testCaseCount: number;
}

export function ConversionSummary({
  provider,
  agent,
  testCaseCount,
}: ConversionSummaryProps) {
  if (!provider || !agent) return null;

  return (
    <div className="p-4 bg-muted rounded-lg space-y-2" data-testid="conversion-summary">
      <p className="text-xs font-medium text-muted-foreground" data-testid="summary-label">
        Conversion Details
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div data-testid="summary-provider">
          <p className="text-xs text-muted-foreground">Provider</p>
          <p className="text-sm font-medium">
            {provider === "openai" ? "OpenAI GPT-5" : "Perplexity"}
          </p>
        </div>
        <div data-testid="summary-agent">
          <p className="text-xs text-muted-foreground">Agent</p>
          <p className="text-sm font-medium">{agent.name}</p>
        </div>
        <div data-testid="summary-format">
          <p className="text-xs text-muted-foreground">Format</p>
          <Badge variant="outline" className="text-xs">
            {agent.outputFormat}
          </Badge>
        </div>
      </div>
      {testCaseCount > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">Test Cases</p>
          <p className="text-sm font-medium" data-testid="summary-test-count">
            {testCaseCount} case{testCaseCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
