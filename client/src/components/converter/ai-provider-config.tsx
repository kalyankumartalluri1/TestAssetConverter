import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, CheckCircle2, Upload, X } from "lucide-react";
import { AIProvider, ConversionAgent, DEFAULT_AGENTS } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface AIProviderConfigProps {
  onConfigComplete: (provider: AIProvider, apiKey: string, agent: ConversionAgent, customAgentFile?: { name: string; content: string }) => void;
  disabled?: boolean;
}

export function AIProviderConfig({ onConfigComplete, disabled }: AIProviderConfigProps) {
  const [provider, setProvider] = useState<AIProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [agentMode, setAgentMode] = useState<"preset" | "custom">("preset");
  const [customAgentFile, setCustomAgentFile] = useState<{ name: string; content: string } | null>(null);
  const [isValid, setIsValid] = useState(false);
  const { toast } = useToast();

  const handleProviderChange = (value: string) => {
    setProvider(value as AIProvider);
    setApiKey("");
    setIsValid(false);
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    validateForm(value, agentMode, selectedAgentId, customAgentFile);
  };

  const handleAgentModeChange = (mode: "preset" | "custom") => {
    setAgentMode(mode);
    setSelectedAgentId("");
    setCustomAgentFile(null);
    validateForm(apiKey, mode, "", null);
  };

  const handleAgentChange = (value: string) => {
    setSelectedAgentId(value);
    validateForm(apiKey, agentMode, value, customAgentFile);
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
      validateForm(apiKey, agentMode, selectedAgentId, agentFile);
      
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

  const handleRemoveCustomAgent = () => {
    setCustomAgentFile(null);
    validateForm(apiKey, agentMode, selectedAgentId, null);
  };

  const validateForm = (
    key: string,
    mode: "preset" | "custom",
    agentId: string,
    customFile: { name: string; content: string } | null
  ) => {
    if (mode === "preset") {
      setIsValid(key.length > 0 && agentId.length > 0);
    } else {
      setIsValid(key.length > 0 && customFile !== null);
    }
  };

  const handleSubmit = () => {
    if (!isValid) return;
    
    if (agentMode === "preset") {
      const agent = DEFAULT_AGENTS.find(a => a.id === selectedAgentId);
      if (agent) {
        onConfigComplete(provider, apiKey, agent, undefined);
      }
    } else if (agentMode === "custom" && customAgentFile) {
      const fileExtension = customAgentFile.name.replace('.md', '').toLowerCase();
      const outputFormat = fileExtension.includes('sensetalk') ? 'sensetalk' :
                         fileExtension.includes('python') || fileExtension.includes('selenium') ? 'python' :
                         fileExtension.includes('doc') ? 'markdown' : 'txt';
      
      const customAgent: ConversionAgent = {
        id: "custom",
        name: customAgentFile.name.replace('.md', ''),
        description: "Custom agent from uploaded file",
        instructions: customAgentFile.content,
        outputFormat,
      };
      onConfigComplete(provider, apiKey, customAgent, customAgentFile);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-1" data-testid="text-config-title">Configuration</h2>
        <p className="text-sm text-muted-foreground" data-testid="text-config-description">
          Select your AI provider and configure the conversion agent
        </p>
      </div>

      <div className="space-y-6">
        {/* AI Provider Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium" data-testid="label-provider">AI Provider</Label>
          <RadioGroup
            value={provider}
            onValueChange={handleProviderChange}
            disabled={disabled}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="openai" id="openai" data-testid="radio-openai" />
              <Label htmlFor="openai" className="font-normal cursor-pointer flex-1">
                OpenAI (GPT-5)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="perplexity" id="perplexity" data-testid="radio-perplexity" />
              <Label htmlFor="perplexity" className="font-normal cursor-pointer flex-1">
                Perplexity
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="apiKey" className="text-sm font-medium" data-testid="label-api-key">
            API Key
          </Label>
          <div className="relative">
            <Input
              id="apiKey"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder={`Enter your ${provider === "openai" ? "OpenAI" : "Perplexity"} API key`}
              disabled={disabled}
              className="pr-10"
              data-testid="input-api-key"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowApiKey(!showApiKey)}
              disabled={disabled}
              data-testid="button-toggle-api-key"
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground" data-testid="text-api-key-help">
            Your API key is used only for this conversion and is not stored
          </p>
        </div>

        {/* Agent Selection Mode */}
        <div className="space-y-3">
          <Label className="text-sm font-medium" data-testid="label-agent-mode">Agent Mode</Label>
          <RadioGroup
            value={agentMode}
            onValueChange={(value) => handleAgentModeChange(value as "preset" | "custom")}
            disabled={disabled}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="preset" id="preset" data-testid="radio-preset" />
              <Label htmlFor="preset" className="font-normal cursor-pointer flex-1">
                Pre-configured Agent
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" data-testid="radio-custom" />
              <Label htmlFor="custom" className="font-normal cursor-pointer flex-1">
                Custom Agent File
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Pre-configured Agent Selection */}
        {agentMode === "preset" && (
          <div className="space-y-2">
            <Label htmlFor="agent" className="text-sm font-medium" data-testid="label-agent">
              Conversion Agent
            </Label>
            <Select
              value={selectedAgentId}
              onValueChange={handleAgentChange}
              disabled={disabled}
            >
              <SelectTrigger id="agent" data-testid="select-agent">
                <SelectValue placeholder="Select a conversion agent" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_AGENTS.map((agent) => (
                  <SelectItem
                    key={agent.id}
                    value={agent.id}
                    data-testid={`option-agent-${agent.id}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{agent.name}</span>
                      <span className="text-xs text-muted-foreground">{agent.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Custom Agent File Upload */}
        {agentMode === "custom" && (
          <div className="space-y-2">
            <Label htmlFor="custom-agent" className="text-sm font-medium" data-testid="label-custom-agent">
              Custom Agent Definition (.md)
            </Label>
            {!customAgentFile ? (
              <div className="relative">
                <Input
                  id="custom-agent"
                  type="file"
                  accept=".md"
                  onChange={handleCustomAgentFileUpload}
                  disabled={disabled}
                  className="hidden"
                  data-testid="input-custom-agent"
                />
                <Label
                  htmlFor="custom-agent"
                  className="flex items-center justify-center gap-2 h-24 border-2 border-dashed rounded-lg cursor-pointer hover-elevate transition-colors"
                  data-testid="label-upload-custom-agent"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-sm">Upload .md agent file</span>
                </Label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted" data-testid="status-custom-agent-uploaded">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm truncate">{customAgentFile.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveCustomAgent}
                  disabled={disabled}
                  data-testid="button-remove-custom-agent"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground" data-testid="text-custom-agent-help">
              Upload a Markdown file containing your custom agent instructions
            </p>
          </div>
        )}

        {/* Submit Button */}
        {!disabled && (
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full"
            data-testid="button-configure"
          >
            {isValid ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Configuration Complete
              </>
            ) : (
              "Complete Configuration"
            )}
          </Button>
        )}

        {disabled && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2 bg-muted rounded-md" data-testid="status-configured">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Configuration complete
          </div>
        )}
      </div>
    </div>
  );
}
