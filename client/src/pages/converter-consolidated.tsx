import { useState, useRef, useEffect } from "react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, CheckCircle2, Upload, X, Settings, Play, RotateCcw, Download, FileCode, Copy, Check, Loader2, AlertCircle, FileSpreadsheet, Edit2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { AIProvider, ConversionAgent, DEFAULT_AGENTS, TestCase } from "@shared/schema";

export default function ConverterPage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Configuration
  const [provider, setProvider] = useState<AIProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [agentMode, setAgentMode] = useState<"preset" | "custom">("preset");
  const [customAgentFile, setCustomAgentFile] = useState<{ name: string; content: string } | null>(null);
  const [isConfigValid, setIsConfigValid] = useState(false);
  
  // Step 2: File Upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualContent, setManualContent] = useState<string>("");
  const [isEditingContent, setIsEditingContent] = useState(false);
  const reviewSectionRef = useRef<HTMLDivElement>(null);
  
  // Step 3-4: Conversion
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStatus, setConversionStatus] = useState("");
  
  // Step 5: Output
  const [convertedFiles, setConvertedFiles] = useState<Array<{ filename: string; content: string }>>([]);
  const [selectedFile, setSelectedFile] = useState(0);
  const [copied, setCopied] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState<string>("");
  
  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Validation for Step 1
  const validateConfig = (key: string, mode: "preset" | "custom", agentId: string, customFile: { name: string; content: string } | null) => {
    if (mode === "preset") {
      setIsConfigValid(key.length > 0 && agentId.length > 0);
    } else {
      setIsConfigValid(key.length > 0 && customFile !== null);
    }
  };

  const handleProviderChange = (value: string) => {
    setProvider(value as AIProvider);
    setApiKey("");
    setIsConfigValid(false);
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    validateConfig(value, agentMode, selectedAgentId, customAgentFile);
  };

  const handleAgentModeChange = (mode: "preset" | "custom") => {
    setAgentMode(mode);
    setSelectedAgentId("");
    setCustomAgentFile(null);
    validateConfig(apiKey, mode, "", null);
  };

  const handleAgentChange = (value: string) => {
    setSelectedAgentId(value);
    validateConfig(apiKey, agentMode, value, customAgentFile);
  };

  const handleCustomAgentFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .md (Markdown) file",
        variant: "destructive",
      });
      return;
    }

    try {
      const content = await file.text();
      const agentFile = { name: file.name, content };
      setCustomAgentFile(agentFile);
      validateConfig(apiKey, agentMode, selectedAgentId, agentFile);
      toast({
        title: "Agent file uploaded",
        description: `${file.name} loaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not read the agent file",
        variant: "destructive",
      });
    }
  };

  const handleCompleteConfig = () => {
    if (!isConfigValid) return;
    setCurrentAgentId(agentMode === "preset" ? selectedAgentId : "custom");
    setCurrentStep(2);
    setError(null);
  };

  // File Upload Logic - Call Backend API
  const parseExcelFile = async (file: File): Promise<TestCase[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const binaryData = e.target?.result as string;
          const base64Data = btoa(binaryData);
          
          const response = await fetch("/api/parse/excel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: file.name, data: base64Data }),
            credentials: "include",
          });

          const result = await response.json();
          if (!response.ok || !result.success) {
            reject(new Error(result.error || "Failed to parse Excel file"));
          } else {
            resolve(result.testCases);
          }
        } catch (err: any) {
          reject(new Error(err.message || "Failed to parse Excel file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsBinaryString(file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      setUploadError(null);
      setIsProcessing(true);

      try {
        const cases = await parseExcelFile(file);
        setTestCases(cases);
        setManualContent("");
        setTimeout(() => {
          reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      } catch (err: any) {
        setUploadError(err.message);
        setUploadedFile(null);
      } finally {
        setIsProcessing(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  // Conversion Logic
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const handleStartConversion = async () => {
    setCurrentStep(4);
    setIsConverting(true);
    setConversionProgress(10);
    setConversionStatus("Analyzing test cases...");
    setError(null);
    
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

      if (currentProgress > 95) currentProgress = 95;
      setConversionProgress(currentProgress);

      if (currentProgress < 30) {
        setConversionStatus("Analyzing test cases...");
      } else if (currentProgress < 60) {
        setConversionStatus(`Converting ${testCases.length} test cases with AI...`);
      } else if (currentProgress < 90) {
        setConversionStatus("Generating output files...");
      } else {
        setConversionStatus("Finalizing conversion...");
      }
    }, 300);

    intervalIdRef.current = id;

    try {
      const requestData: any = {
        provider,
        apiKey,
        testCases,
        filename: uploadedFile?.name || "",
      };

      if (customAgentFile?.content?.trim()) {
        requestData.customAgentInstructions = customAgentFile.content.trim();
        requestData.customAgentName = customAgentFile.name;
        requestData.customAgentOutputFormat = DEFAULT_AGENTS[0].outputFormat;
      } else {
        const agent = DEFAULT_AGENTS.find(a => a.id === selectedAgentId);
        if (agent) {
          requestData.agentId = agent.id;
        }
      }

      console.log("[Frontend] Sending conversion request...", requestData);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout

      try {
        const response = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
          credentials: "include",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log("[Frontend] Response received, status:", response.status);
      
        const jsonData = await response.json();
        console.log("[Frontend] Response parsed:", jsonData);

        if (!response.ok) {
          throw new Error(jsonData.error || `API error ${response.status}`);
        }

        if (!jsonData.success) {
          throw new Error(jsonData.error || "Conversion failed");
        }

        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }

        setConversionProgress(100);
        setConversionStatus("Conversion complete!");
        setConvertedFiles(jsonData.convertedFiles || []);
        setSelectedFile(0);
        setCurrentStep(5);
        setIsConverting(false);
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          throw new Error("Conversion request timed out. Please try again with fewer test cases.");
        }
        throw fetchErr;
      }
    } catch (err: any) {
      console.error("[Frontend] Conversion error:", err);
      
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }

      setError(err.message || "Conversion failed");
      setIsConverting(false);
      setConversionProgress(0);
    }
  };

  const handleDownload = async () => {
    const zip = new JSZip();
    
    // Organize files by agent type
    const isSenseTalk = currentAgentId === "manual-eggplant" || currentAgentId === "gui-eggplant" || currentAgentId === "selenium-python-eggplant" || currentAgentId === "selenium-csharp-eggplant" || currentAgentId === "selenium-java-eggplant" || currentAgentId === "uipath-eggplant";
    
    if (isSenseTalk) {
      // Organize .script files into EggplantScripts folder
      convertedFiles.forEach(file => {
        zip.file(`EggplantScripts/${file.filename}`, file.content);
      });
    } else {
      // For other agents, organize by file extension in subfolders
      convertedFiles.forEach(file => {
        const ext = file.filename.split('.').pop() || 'txt';
        zip.file(`${ext}/${file.filename}`, file.content);
      });
    }
    
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted-tests.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(convertedFiles[selectedFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualContentChange = async (content: string) => {
    setManualContent(content);
    if (content.trim()) {
      try {
        const response = await fetch("/api/parse/manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
          credentials: "include",
        });

        const result = await response.json();
        if (response.ok && result.success) {
          setTestCases(result.testCases);
        } else {
          setTestCases([]);
        }
      } catch (err) {
        console.error("Error parsing manual content:", err);
        setTestCases([]);
      }
    } else {
      setTestCases([]);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setTestCases([]);
    setConvertedFiles([]);
    setIsConverting(false);
    setConversionProgress(0);
    setError(null);
    setSelectedFile(0);
    setCurrentAgentId("");
    setManualContent("");
    setIsEditingContent(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Test Asset Converter</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Test Automation</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of 5
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Error Banner */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setError(null)}
                className="h-6 w-6 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 1: Configuration */}
          <Card className={`p-6 transition-all ${currentStep >= 1 ? "border-primary" : ""}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant={currentStep > 1 ? "default" : "outline"}>Step 1</Badge>
                  <h2 className="text-lg font-semibold">Configure AI Provider</h2>
                </div>
                <p className="text-sm text-muted-foreground">Select your AI provider and choose a conversion agent</p>
              </div>
            </div>

            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Provider Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">AI Provider</Label>
                  <RadioGroup value={provider} onValueChange={handleProviderChange} className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="openai" id="openai" />
                      <Label htmlFor="openai" className="font-normal cursor-pointer">OpenAI (GPT-5)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="perplexity" id="perplexity" />
                      <Label htmlFor="perplexity" className="font-normal cursor-pointer">Perplexity</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="text-sm font-medium">API Key</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                      placeholder={`Enter your ${provider === "openai" ? "OpenAI" : "Perplexity"} API key`}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Your API key is used only for this conversion and is not stored</p>
                </div>

                {/* Agent Mode */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Agent Mode</Label>
                  <RadioGroup value={agentMode} onValueChange={(value) => handleAgentModeChange(value as "preset" | "custom")} className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="preset" id="preset" />
                      <Label htmlFor="preset" className="font-normal cursor-pointer">Pre-configured Agent</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom" className="font-normal cursor-pointer">Custom Agent File</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Preset Agent Selection */}
                {agentMode === "preset" && (
                  <div className="space-y-2">
                    <Label htmlFor="agent" className="text-sm font-medium">Conversion Agent</Label>
                    <Select value={selectedAgentId} onValueChange={handleAgentChange}>
                      <SelectTrigger id="agent">
                        <SelectValue placeholder="Select a conversion agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_AGENTS.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Custom Agent Upload */}
                {agentMode === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-agent" className="text-sm font-medium">Custom Agent Definition (.md)</Label>
                    {!customAgentFile ? (
                      <div className="relative">
                        <Input
                          id="custom-agent"
                          type="file"
                          accept=".md"
                          onChange={handleCustomAgentFileUpload}
                          className="hidden"
                        />
                        <Label htmlFor="custom-agent" className="flex items-center justify-center gap-2 h-24 border-2 border-dashed rounded-lg cursor-pointer hover:opacity-80">
                          <Upload className="h-5 w-5" />
                          <span className="text-sm">Upload .md agent file</span>
                        </Label>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                        <div className="flex items-center gap-2 flex-1">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span className="text-sm truncate">{customAgentFile.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCustomAgentFile(null);
                            validateConfig(apiKey, agentMode, selectedAgentId, null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleCompleteConfig}
                  disabled={!isConfigValid}
                  className="w-full"
                >
                  {isConfigValid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Continue to File Upload
                    </>
                  ) : (
                    "Complete Configuration"
                  )}
                </Button>
              </div>
            )}

            {currentStep > 1 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted rounded-md">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Configuration complete
              </div>
            )}
          </Card>

          {/* Step 2: File Upload */}
          {currentStep >= 2 && (
            <Card className={`p-6 transition-all ${currentStep >= 2 ? "border-primary" : ""}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={currentStep > 2 ? "default" : "outline"}>Step 2</Badge>
                    <h2 className="text-lg font-semibold">Upload Test Cases</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">Upload your Excel file containing test cases</p>
                </div>
              </div>

              {currentStep === 2 && (
                <div className="space-y-4">
                  {uploadError && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">{uploadError}</p>
                    </div>
                  )}

                  {!uploadedFile ? (
                    <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}>
                      <input {...getInputProps()} />
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Drag and drop your Excel file here, or click to select</p>
                      <p className="text-xs text-muted-foreground">Supported formats: .xlsx, .xls (optional - you can paste content in the next step)</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 border rounded-md bg-muted">
                      <FileSpreadsheet className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      Back
                    </Button>
                    <Button onClick={() => setCurrentStep(3)} className="flex-1">
                      <Play className="w-4 h-4 mr-2" />
                      Next: Review & Edit
                    </Button>
                  </div>
                </div>
              )}

              {currentStep > 2 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted rounded-md">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  File uploaded: {uploadedFile?.name}
                </div>
              )}
            </Card>
          )}

          {/* Step 3: Input Preview */}
          {currentStep >= 2 && (
            <Card ref={reviewSectionRef} className={`p-6 transition-all ${currentStep >= 3 ? "border-primary" : ""}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={currentStep > 3 ? "default" : "outline"}>Step 3</Badge>
                    <h2 className="text-lg font-semibold">Review & Edit Input</h2>
                  </div>
                  {testCases.length > 0 ? (
                    <p className="text-sm text-muted-foreground">{testCases.length} test case{testCases.length !== 1 ? 's' : ''} found</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Upload a file or paste test cases below</p>
                  )}
                </div>
                {currentStep === 3 && (
                  <div className="flex items-center gap-2">
                    {testCases.length > 0 && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditingContent(!isEditingContent)} data-testid="button-edit-content">
                        <Edit2 className="w-4 h-4 mr-2" />
                        {isEditingContent ? "View Table" : "Edit"}
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => {
                      setCurrentStep(2);
                      setUploadedFile(null);
                      setTestCases([]);
                      setManualContent("");
                      setIsEditingContent(false);
                    }} data-testid="button-back">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button onClick={handleStartConversion} disabled={testCases.length === 0} data-testid="button-convert">
                      <Play className="w-4 h-4 mr-2" />
                      Convert to Scripts
                    </Button>
                  </div>
                )}
              </div>

              {currentStep === 3 ? (
                testCases.length === 0 || isEditingContent ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 border border-muted-foreground/20 rounded-md p-3">
                      <p className="text-xs text-muted-foreground">
                        Format: TEST-ID | Test Name | Step Description | Expected Result (pipe-separated, CSV, TSV, or comma-separated)
                      </p>
                    </div>
                    <Textarea
                      value={manualContent}
                      onChange={(e) => handleManualContentChange(e.target.value)}
                      placeholder={`Example:
TEST-001 | Login Test | Enter username | Username field populated
TEST-001 | Login Test | Enter password | Password field populated
TEST-001 | Login Test | Click login | Dashboard loads`}
                      className="font-mono text-sm min-h-[400px]"
                      data-testid="textarea-manual-content"
                    />
                    <div className="text-xs text-muted-foreground">
                      {testCases.length > 0 && `${testCases.length} test case${testCases.length !== 1 ? 's' : ''} parsed`}
                    </div>
                  </div>
                ) : (
                  <>
                    {testCases.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <ScrollArea className="h-[600px] w-full">
                          <Table>
                            <TableHeader className="sticky top-0 bg-muted z-10">
                              <TableRow>
                                <TableHead className="w-24">Test ID</TableHead>
                                <TableHead className="w-40">Test Name</TableHead>
                                <TableHead className="w-96">Steps</TableHead>
                                <TableHead className="w-96">Expected Results</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {testCases.map((testCase, index) => (
                                <TableRow key={index} className="align-top">
                                  <TableCell className="font-mono text-xs align-top" data-testid={`cell-testid-${index}`}>{testCase.testId}</TableCell>
                                  <TableCell className="font-medium text-sm align-top" data-testid={`cell-testname-${index}`}>{testCase.testName}</TableCell>
                                  <TableCell className="text-sm align-top whitespace-pre-wrap max-w-96 break-words" data-testid={`cell-steps-${index}`}>
                                    {testCase.steps}
                                  </TableCell>
                                  <TableCell className="text-sm align-top whitespace-pre-wrap max-w-96 break-words" data-testid={`cell-results-${index}`}>
                                    {testCase.expectedResults}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </div>
                    ) : (
                      <div className="border border-dashed rounded-lg p-8 text-center bg-muted/30">
                        <p className="text-sm text-muted-foreground">No test cases yet. Upload an Excel file or paste content in edit mode.</p>
                      </div>
                    )}
                  </>
                )
              ) : testCases.length > 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted rounded-md">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Input review complete
                </div>
              ) : null}
            </Card>
          )}

          {/* Step 4: Conversion Progress */}
          {currentStep === 4 && isConverting && (
            <Card className="p-6 border-primary">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge>Step 4</Badge>
                    <h2 className="text-lg font-semibold">Converting Files</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">Your test cases are being converted using AI</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">{conversionStatus}</span>
                </div>
                <div className="space-y-2">
                  <Progress value={conversionProgress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{Math.round(conversionProgress)}% complete</span>
                    <span>{testCases.length} test cases</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Step 5: Output Preview */}
          {currentStep === 5 && convertedFiles.length > 0 && (
            <Card className="p-6 border-primary">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge>Step 5</Badge>
                    <h2 className="text-lg font-semibold">Download Results</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">{convertedFiles.length} files generated successfully</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Convert Another
                  </Button>
                  <Button onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download ZIP
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Tabs value={selectedFile.toString()} onValueChange={(v) => setSelectedFile(parseInt(v))}>
                  <div className="border-b bg-muted px-4 py-2 flex items-center justify-between">
                    <TabsList className="h-8">
                      {convertedFiles.map((file, index) => (
                        <TabsTrigger key={index} value={index.toString()} className="text-xs">
                          <FileCode className="w-3 h-3 mr-1" />
                          {file.filename}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>

                  {convertedFiles.map((file, index) => (
                    <TabsContent key={index} value={index.toString()} className="m-0">
                      <ScrollArea className="h-[500px]">
                        <pre className="p-6 text-sm font-mono whitespace-pre-wrap">
                          <code>{file.content}</code>
                        </pre>
                      </ScrollArea>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
