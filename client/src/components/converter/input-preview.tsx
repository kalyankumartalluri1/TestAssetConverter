import { TestCase } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, RotateCcw } from "lucide-react";

interface InputPreviewProps {
  testCases: TestCase[];
  filename: string;
  onConvert: () => void;
  onReset: () => void;
}

export function InputPreview({ testCases, filename, onConvert, onReset }: InputPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium mb-1" data-testid="text-preview-title">Input Preview</h2>
          <p className="text-sm text-muted-foreground" data-testid="text-preview-description">
            {testCases.length} test case{testCases.length !== 1 ? "s" : ""} found in {filename}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onReset}
            data-testid="button-reset"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
          <Button
            onClick={onConvert}
            data-testid="button-convert"
          >
            <Play className="w-4 h-4 mr-2" />
            Convert to Scripts
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-muted z-10">
              <TableRow>
                <TableHead className="w-32" data-testid="header-test-id">Test ID</TableHead>
                <TableHead className="w-48" data-testid="header-test-name">Test Name</TableHead>
                <TableHead data-testid="header-steps">Steps</TableHead>
                <TableHead data-testid="header-expected">Expected Results</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testCases.map((testCase, index) => (
                <TableRow key={index} className="hover-elevate" data-testid={`row-test-${index}`}>
                  <TableCell className="font-mono text-xs" data-testid={`cell-id-${index}`}>
                    {testCase.testId}
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`cell-name-${index}`}>
                    {testCase.testName}
                  </TableCell>
                  <TableCell className="text-sm" data-testid={`cell-steps-${index}`}>
                    <div className="max-w-md line-clamp-3">
                      {testCase.steps}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm" data-testid={`cell-expected-${index}`}>
                    <div className="max-w-md line-clamp-3">
                      {testCase.expectedResults}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
