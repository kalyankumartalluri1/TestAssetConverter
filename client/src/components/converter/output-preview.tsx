import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, RotateCcw, FileCode, Copy, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JSZip from "jszip";

interface OutputPreviewProps {
  files: Array<{ filename: string; content: string }>;
  onReset: () => void;
}

export function OutputPreview({ files, onReset }: OutputPreviewProps) {
  const [selectedFile, setSelectedFile] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    const zip = new JSZip();

    files.forEach(file => {
      zip.file(file.filename, file.content);
    });

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
    await navigator.clipboard.writeText(files[selectedFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium mb-1" data-testid="text-output-title">Output Preview</h2>
          <p className="text-sm text-muted-foreground" data-testid="text-output-description">
            {files.length} file{files.length !== 1 ? "s" : ""} generated successfully
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onReset}
            data-testid="button-reset"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Convert Another
          </Button>
          <Button
            onClick={handleDownload}
            data-testid="button-download"
          >
            <Download className="w-4 h-4 mr-2" />
            Download ZIP
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Tabs value={selectedFile.toString()} onValueChange={(v) => setSelectedFile(parseInt(v))}>
          <div className="border-b bg-muted px-4 py-2 flex items-center justify-between">
            <TabsList className="h-8">
              {files.map((file, index) => (
                <TabsTrigger
                  key={index}
                  value={index.toString()}
                  className="text-xs"
                  data-testid={`tab-file-${index}`}
                >
                  <FileCode className="w-3 h-3 mr-1" />
                  {file.filename}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              data-testid="button-copy"
            >
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

          {files.map((file, index) => (
            <TabsContent key={index} value={index.toString()} className="m-0">
              <ScrollArea className="h-[500px]">
                <pre className="p-6 text-sm font-mono" data-testid={`code-preview-${index}`}>
                  <code>{file.content}</code>
                </pre>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
