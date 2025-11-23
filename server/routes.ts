import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import * as XLSX from "xlsx";
import { 
  conversionRequestSchema,
  parseExcelSchema,
  parseManualContentSchema,
  DEFAULT_AGENTS,
  type ConversionRequest,
  type ConversionResponse,
  type ParseResponse,
  type TestCase
} from "@shared/schema";
import { AIConverter } from "./services/ai-converter";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable JSON parsing with larger limit for file uploads
  app.use(express.json({ limit: "50mb" }));

  // Convert test cases endpoint
  app.post("/api/convert", async (req, res) => {
    console.log("[API] /api/convert endpoint called");
    try {
      // Validate request body
      const validationResult = conversionRequestSchema.safeParse(req.body);
      console.log("[API] Validation result:", validationResult.success);
      
      if (!validationResult.success) {
        console.log("[API] Validation failed:", validationResult.error.message);
        return res.status(400).json({
          success: false,
          error: `Validation error: ${validationResult.error.message}`,
          convertedFiles: [],
        } as ConversionResponse);
      }

      const { 
        provider, 
        apiKey, 
        agentId, 
        testCases, 
        filename,
        customAgentInstructions,
        customAgentName,
        customAgentOutputFormat 
      } = validationResult.data;

      // Determine which agent to use
      let agent;
      if (customAgentInstructions) {
        // Use custom agent from uploaded file
        agent = {
          id: "custom",
          name: customAgentName || "Custom Agent",
          description: "Custom agent from uploaded file",
          instructions: customAgentInstructions,
          outputFormat: customAgentOutputFormat || "txt",
        };
      } else if (agentId) {
        // Find pre-configured agent
        agent = DEFAULT_AGENTS.find(a => a.id === agentId);
        if (!agent) {
          return res.status(400).json({
            success: false,
            error: "Invalid agent ID",
            convertedFiles: [],
          } as ConversionResponse);
        }
      } else {
        return res.status(400).json({
          success: false,
          error: "Either agent ID or custom agent instructions must be provided",
          convertedFiles: [],
        } as ConversionResponse);
      }

      // Validate test cases
      if (testCases.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No test cases provided",
          convertedFiles: [],
        } as ConversionResponse);
      }

      // Create AI converter and process
      console.log("[API] Creating converter and processing test cases...");
      const converter = new AIConverter(provider, apiKey);
      const convertedFiles = await converter.convertTestCases(testCases, agent, provider);

      console.log("[API] Conversion complete. Files:", convertedFiles.length);
      const response = {
        success: true,
        convertedFiles,
      } as ConversionResponse;
      
      console.log("[API] Sending response");
      return res.json(response);

    } catch (error: any) {
      console.error("[API] Conversion error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "An error occurred during conversion",
        convertedFiles: [],
      } as ConversionResponse);
    }
  });

  // Parse Excel file endpoint
  app.post("/api/parse/excel", (req, res) => {
    try {
      const validationResult = parseExcelSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          testCases: [],
          error: `Validation error: ${validationResult.error.message}`,
        } as ParseResponse);
      }

      const { data: binaryData } = validationResult.data;
      const workbook = XLSX.read(binaryData, { type: "base64" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Group rows by test ID to consolidate steps and expected results
      // Expected columns: [0]Test ID, [1]Test Name, [2]Step No (ignored), [3]Step Description, [4]Expected Result
      const testCaseMap: Record<string, { testName: string; steps: string[]; expectedResults: string[] }> = {};
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row.length >= 5) {
          const testId = String(row[0] || `TEST-${i}`).trim();
          const testName = String(row[1] || "").trim();
          // Skip column [2] - Step No (ignored)
          const stepDescription = String(row[3] || "").trim(); // Column 3: Step Description
          const expectedResult = String(row[4] || "").trim();   // Column 4: Expected Result

          if (!testCaseMap[testId]) {
            testCaseMap[testId] = {
              testName: testName || testId,
              steps: [],
              expectedResults: []
            };
          }

          if (stepDescription) testCaseMap[testId].steps.push(stepDescription);
          if (expectedResult) testCaseMap[testId].expectedResults.push(expectedResult);
        }
      }

      // Convert grouped data to TestCase array, filtering out empty test cases
      const testCases: TestCase[] = Object.entries(testCaseMap)
        .filter(([_, data]) => data.steps.length > 0 || data.expectedResults.length > 0)
        .map(([testId, data]) => ({
          testId,
          testName: data.testName,
          steps: data.steps.join("\n"),
          expectedResults: data.expectedResults.join("\n"),
        }));

      if (testCases.length === 0) {
        return res.status(400).json({
          success: false,
          testCases: [],
          error: "No valid test cases found. Ensure columns: Test ID, Test Name, Step No, Step Description, Expected Result",
        } as ParseResponse);
      }

      return res.json({
        success: true,
        testCases,
      } as ParseResponse);
    } catch (error: any) {
      console.error("[API] Excel parsing error:", error);
      return res.status(500).json({
        success: false,
        testCases: [],
        error: "Failed to parse Excel file. Ensure it's a valid .xlsx or .xls file.",
      } as ParseResponse);
    }
  });

  // Parse manual content endpoint
  app.post("/api/parse/manual", (req, res) => {
    try {
      const validationResult = parseManualContentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          testCases: [],
          error: `Validation error: ${validationResult.error.message}`,
        } as ParseResponse);
      }

      const { content } = validationResult.data;
      const lines = content.trim().split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        return res.status(400).json({
          success: false,
          testCases: [],
          error: "No content provided",
        } as ParseResponse);
      }

      const testCases: TestCase[] = [];
      let currentTestId = "";
      let currentTestName = "";
      let currentSteps: string[] = [];
      let currentExpectedResults: string[] = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Look for pattern: TEST-ID | Test Name | Step | Result (tab or pipe separated)
        const parts = trimmedLine.split(/[|,\t]+/).map(p => p.trim()).filter(p => p);
        
        if (parts.length >= 4) {
          // If we have a new test ID, save the previous one
          if (currentTestId && (parts[0] !== currentTestId)) {
            if (currentSteps.length > 0 || currentExpectedResults.length > 0) {
              testCases.push({
                testId: currentTestId,
                testName: currentTestName,
                steps: currentSteps.join("\n"),
                expectedResults: currentExpectedResults.join("\n"),
              });
            }
            currentSteps = [];
            currentExpectedResults = [];
          }
          
          currentTestId = parts[0];
          currentTestName = parts[1];
          if (parts[2]) currentSteps.push(parts[2]);
          if (parts[3]) currentExpectedResults.push(parts[3]);
        } else if (parts.length >= 2 && !currentTestId) {
          // First line case
          currentTestId = parts[0];
          currentTestName = parts[1];
          if (parts[2]) currentSteps.push(parts[2]);
          if (parts[3]) currentExpectedResults.push(parts[3]);
        } else if (currentTestId && parts.length >= 2) {
          // Additional steps/results for current test
          currentSteps.push(parts[0]);
          if (parts[1]) currentExpectedResults.push(parts[1]);
        }
      }
      
      // Add last test case
      if (currentTestId && (currentSteps.length > 0 || currentExpectedResults.length > 0)) {
        testCases.push({
          testId: currentTestId,
          testName: currentTestName,
          steps: currentSteps.join("\n"),
          expectedResults: currentExpectedResults.join("\n"),
        });
      }

      if (testCases.length === 0) {
        return res.status(400).json({
          success: false,
          testCases: [],
          error: "No valid test cases found in the provided content",
        } as ParseResponse);
      }

      return res.json({
        success: true,
        testCases,
      } as ParseResponse);
    } catch (error: any) {
      console.error("[API] Manual content parsing error:", error);
      return res.status(500).json({
        success: false,
        testCases: [],
        error: "Failed to parse manual content",
      } as ParseResponse);
    }
  });

  // Get available agents
  app.get("/api/agents", (req, res) => {
    res.json(DEFAULT_AGENTS);
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
