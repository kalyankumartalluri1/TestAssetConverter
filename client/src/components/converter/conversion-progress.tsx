import { useEffect, useState, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { AIProvider, ConversionAgent, TestCase } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ConversionProgressProps {
  provider: AIProvider;
  apiKey: string;
  agent: ConversionAgent;
  testCases: TestCase[];
  filename: string;
  agentMode: "preset" | "custom";
  customAgentFile?: { name: string; content: string } | null;
  onProgress: (progress: number) => void;
  onComplete: (files: Array<{ filename: string; content: string }>) => void;
  onError: (error: string) => void;
}

export function ConversionProgress({
  provider,
  apiKey,
  agent,
  testCases,
  filename,
  agentMode,
  customAgentFile,
  onProgress,
  onComplete,
  onError,
}: ConversionProgressProps) {
  const [status, setStatus] = useState("Initializing conversion...");
  const [progress, setProgress] = useState(0);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const conversionMutation = useMutation({
    mutationFn: async () => {
      const requestData: any = {
        provider,
        apiKey,
        testCases,
        filename,
      };
      
      // Derive payload from actual data to avoid state divergence
      if (customAgentFile?.content?.trim()) {
        // Custom agent mode: send custom instructions
        requestData.customAgentInstructions = customAgentFile.content.trim();
        requestData.customAgentName = customAgentFile.name;
        requestData.customAgentOutputFormat = agent.outputFormat;
      } else {
        // Preset agent mode: send agent ID
        requestData.agentId = agent.id;
      }
      
      console.log("Starting conversion with data:", requestData);
      
      try {
        console.log("Making fetch request...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log("Request timeout - aborting");
          controller.abort();
        }, 300000); // 5 minute timeout for OpenAI API calls
        
        console.log("Fetch starting...");
        const response = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
          credentials: "include",
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log("API response received, status:", response.status);
        console.log("Response headers:", Object.fromEntries(response.headers.entries()));
        
        const jsonData = await response.json();
        console.log("Parsed JSON data:", jsonData);
        
        if (!response.ok) {
          console.error("API error response:", jsonData);
          throw new Error(jsonData.error || `API error ${response.status}`);
        }
        
        if (!jsonData.success) {
          console.error("Conversion failed:", jsonData.error);
          throw new Error(jsonData.error || "Conversion failed");
        }
        
        return jsonData;
      } catch (err: any) {
        const errorMessage = err?.message || err?.toString?.() || "Failed to convert test cases";
        console.error("Error during API call:", errorMessage);
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data: any) => {
      console.log("Mutation onSuccess called with:", data);
      
      // Stop the progress animation immediately
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      
      if (data.success) {
        setStatus("Conversion complete!");
        setProgress(100);
        onProgress(100);
        const files = data.convertedFiles || [];
        console.log("Calling onComplete with files:", files);
        onComplete(files);
      } else {
        console.error("Conversion failed:", data.error);
        onError(data.error || "Conversion failed");
      }
    },
    onError: (error: any) => {
      console.error("Mutation onError called with:", error);
      
      // Stop the progress animation on error too
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      onError(error.message || "Failed to convert test cases");
    },
  });

  useEffect(() => {
    console.log("ConversionProgress useEffect started");
    // Start conversion
    conversionMutation.mutate();
    
    // Add timeout to fail after 120 seconds
    const timeout = setTimeout(() => {
      console.error("Conversion timeout - took longer than 120 seconds");
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      onError("Conversion timeout - request took too long");
    }, 120000);

    // Update progress more dynamically - faster initial progress, then slower as it approaches completion
    let currentProgress = 10;
    const id = setInterval(() => {
      if (currentProgress < 30) {
        currentProgress += Math.random() * 8;
      } else if (currentProgress < 60) {
        currentProgress += Math.random() * 5;
      } else if (currentProgress < 85) {
        currentProgress += Math.random() * 3;
      } else {
        currentProgress += Math.random() * 1;
      }
      
      if (currentProgress > 95) {
        currentProgress = 95;
      }
      setProgress(currentProgress);
      onProgress(currentProgress);

      // Update status messages based on progress
      if (currentProgress < 30) {
        setStatus("Analyzing test cases...");
      } else if (currentProgress < 60) {
        setStatus(`Converting ${testCases.length} test cases with AI...`);
      } else if (currentProgress < 90) {
        setStatus("Generating output files...");
      } else {
        setStatus("Finalizing conversion...");
      }
    }, 300);

    intervalIdRef.current = id;

    return () => {
      if (id) clearInterval(id);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-1" data-testid="text-progress-title">Converting Test Cases</h2>
        <p className="text-sm text-muted-foreground" data-testid="text-progress-description">
          Using {provider === "openai" ? "OpenAI" : "Perplexity"} to convert your test cases
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" data-testid="icon-loading" />
          <span className="text-sm font-medium" data-testid="text-status">{status}</span>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-2" data-testid="progress-bar" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span data-testid="text-progress-percent">{Math.round(progress)}% complete</span>
            <span data-testid="text-test-count">{testCases.length} test cases</span>
          </div>
        </div>

        <div className="p-4 bg-muted rounded-md space-y-2">
          <p className="text-xs font-medium" data-testid="text-info-title">Conversion Details</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div data-testid="text-agent">Agent: {agent.name}</div>
            <div data-testid="text-format">Output Format: {agent.outputFormat}</div>
            <div data-testid="text-provider">Provider: {provider === "openai" ? "OpenAI GPT-5" : "Perplexity"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
