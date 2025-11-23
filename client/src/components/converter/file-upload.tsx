import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TestCase } from "@shared/schema";
import * as XLSX from "xlsx";

interface FileUploadProps {
  onFileUpload: (file: File, testCases: TestCase[]) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileUpload, disabled }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseExcelFile = async (file: File): Promise<TestCase[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          // Skip header row and parse test cases
          const testCases: TestCase[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row.length >= 4) {
              testCases.push({
                testId: String(row[0] || `TEST-${i}`),
                testName: String(row[1] || ""),
                steps: String(row[2] || ""),
                expectedResults: String(row[3] || ""),
              });
            }
          }

          if (testCases.length === 0) {
            reject(new Error("No valid test cases found in the file. Please ensure the file has columns: Test ID, Test Name, Steps, Expected Results"));
          } else {
            resolve(testCases);
          }
        } catch (err) {
          reject(new Error("Failed to parse Excel file. Please ensure it's a valid .xlsx or .xls file."));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsBinaryString(file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setError(null);
      setIsProcessing(true);

      try {
        const testCases = await parseExcelFile(file);
        onFileUpload(file, testCases);
      } catch (err: any) {
        setError(err.message || "Failed to process file");
        setSelectedFile(null);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    disabled: disabled || isProcessing,
  });

  const handleRemove = () => {
    setSelectedFile(null);
    setError(null);
  };

  if (disabled && selectedFile) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium mb-1" data-testid="text-upload-title">File Upload</h2>
          <p className="text-sm text-muted-foreground" data-testid="text-upload-description">
            Upload your Excel file containing test cases
          </p>
        </div>
        <div className="flex items-center gap-3 p-4 border rounded-md bg-muted" data-testid="file-uploaded">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium" data-testid="text-filename">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground" data-testid="text-filesize">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium mb-1" data-testid="text-upload-title">File Upload</h2>
        <p className="text-sm text-muted-foreground" data-testid="text-upload-description">
          Upload your Excel file containing test cases (.xlsx, .xls)
        </p>
      </div>

      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover-elevate ${
            isDragActive ? "border-primary bg-primary/5" : "border-border"
          } ${disabled || isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
          data-testid="dropzone-upload"
        >
          <input {...getInputProps()} data-testid="input-file" />
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1" data-testid="text-drag-drop">
                {isDragActive ? "Drop your file here" : "Drag and drop your Excel file"}
              </p>
              <p className="text-xs text-muted-foreground" data-testid="text-or-browse">
                or click to browse
              </p>
            </div>
            <div className="text-xs text-muted-foreground" data-testid="text-file-types">
              Supported formats: .xlsx, .xls (Max 10MB)
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 border rounded-md hover-elevate" data-testid="file-selected">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium" data-testid="text-filename">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground" data-testid="text-filesize">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              data-testid="button-remove-file"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 border border-destructive rounded-md bg-destructive/5" data-testid="error-message">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
          <p className="text-sm text-destructive flex-1" data-testid="text-error">{error}</p>
        </div>
      )}

      {isProcessing && (
        <div className="text-sm text-muted-foreground text-center" data-testid="status-processing">
          Processing file...
        </div>
      )}
    </div>
  );
}
