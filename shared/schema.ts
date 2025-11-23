import { z } from "zod";

// AI Provider types
export type AIProvider = "openai" | "perplexity";

// Conversion Agent schema
export const conversionAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  instructions: z.string(),
  outputFormat: z.string(),
});

export type ConversionAgent = z.infer<typeof conversionAgentSchema>;

// Test Case from parsed file
export const testCaseSchema = z.object({
  testId: z.string(),
  testName: z.string(),
  steps: z.string(),
  expectedResults: z.string(),
});

export type TestCase = z.infer<typeof testCaseSchema>;

// File upload request
export const fileUploadSchema = z.object({
  filename: z.string(),
  data: z.string(), // base64 encoded
});

// Parse Excel request
export const parseExcelSchema = z.object({
  filename: z.string(),
  data: z.string(), // base64 encoded binary
});

// Parse manual content request
export const parseManualContentSchema = z.object({
  content: z.string().min(1, "Content is required"),
});

// Parse response
export const parseResponseSchema = z.object({
  success: z.boolean(),
  testCases: z.array(testCaseSchema),
  error: z.string().optional(),
});

export type ParseResponse = z.infer<typeof parseResponseSchema>;

// Conversion request
export const conversionRequestSchema = z.object({
  provider: z.enum(["openai", "perplexity"]),
  apiKey: z.string().min(1, "API key is required"),
  agentId: z.string().optional(),
  testCases: z.array(testCaseSchema),
  filename: z.string(),
  customAgentInstructions: z.string().optional(),
  customAgentName: z.string().optional(),
  customAgentOutputFormat: z.string().optional(),
}).refine(
  (data) => data.agentId || data.customAgentInstructions,
  {
    message: "Either agentId or customAgentInstructions must be provided",
    path: ["agentId"],
  }
);

export type ConversionRequest = z.infer<typeof conversionRequestSchema>;

// Conversion response
export const conversionResponseSchema = z.object({
  success: z.boolean(),
  convertedFiles: z.array(z.object({
    filename: z.string(),
    content: z.string(),
  })),
  error: z.string().optional(),
});

export type ConversionResponse = z.infer<typeof conversionResponseSchema>;

// Pre-configured agents
export const DEFAULT_AGENTS: ConversionAgent[] = [
  {
    id: "manual-eggplant",
    name: "Manual to Eggplant SenseTalk",
    description: "Converts manual test cases to modular, scalable Eggplant SenseTalk scripts with OCR-first approach",
    instructions: `Convert manual test cases (CSV, Excel, JIRA, text) to modular, scalable Eggplant SenseTalk scripts. 

Architecture:
1. Separate into Core Modules (reusable handlers) and Individual Test Scripts
2. Maximize OCR usage with optimized OCR toolkit properties
3. Use searchRectangle, validCharacters, caseSensitive for resilient automation
4. Implement data-driven testing with external test data
5. Include comprehensive synchronization and error handling
6. Create detailed conversion documentation with OCR coverage statistics
7. Package outputs as zip archive for delivery

Generate production-ready modular Eggplant scripts with reusable Core Modules.`,
    outputFormat: "sensetalk",
  },
  {
    id: "eggplant-manual",
    name: "Eggplant to Manual Test Cases",
    description: "Converts Eggplant SenseTalk scripts to detailed manual test cases in multiple formats",
    instructions: `Convert Eggplant SenseTalk modular test scripts into detailed manual test cases.

Process:
1. Analyze Core Module handlers and test flow structure
2. Extract test data from parametric property lists and external data files
3. Convert each automation action to clear manual step instructions
4. Generate multi-format outputs: CSV, Excel, JIRA, TestRail, Gherkin, Markdown
5. Include test data tables with field-level documentation
6. Document synchronization steps and error recovery handlers
7. Provide traceability matrix and coverage statistics

Generate comprehensive manual test documentation with all formats.`,
    outputFormat: "markdown",
  },
  {
    id: "manual-functionize",
    name: "Manual to Functionize",
    description: "Converts manual test cases to Functionize AI-powered test scripts with self-healing",
    instructions: `Convert manual test cases to Functionize test automation scripts leveraging AI element detection.

Key Features:
1. Analyze manual test case format (CSV, Excel, JIRA, TestRail, Gherkin, Word/PDF)
2. Create Functionize test organization and suites by category/module
3. Use AI-powered element detection instead of brittle selectors
4. Create page fragments for reusable component interactions
5. Implement data-driven testing with parameterized test data
6. Leverage Functionize's intelligent waits and visual testing capabilities
7. Generate comprehensive conversion documentation with step mappings

Produce complete Functionize test scripts with AI element detection and visual regression testing.`,
    outputFormat: "javascript",
  },
  {
    id: "manual-tosca",
    name: "Manual to Tricentis Tosca",
    description: "Converts manual test cases to Tosca model-driven test scenarios with SAP support",
    instructions: `Convert manual test cases to Tricentis Tosca automated test scenarios.

Architecture:
1. Analyze manual test format and identify test flow dependencies
2. Create business and technical models using Tosca's model-driven approach
3. Generate Tosca Test Cases (TCO), Modules (TMO), and Data Sheets (TDS)
4. Implement Tosca controls with DynamIQ AI-powered recognition
5. Use Tosca's built-in synchronization and error handling
6. Support SAP-specific configurations and transactions
7. Create execution strategy and optimization recommendations

Generate production-ready Tosca test artifacts with model-driven architecture.`,
    outputFormat: "xml",
  },
  {
    id: "gui-playwright",
    name: "GUI to Playwright",
    description: "Analyzes HTML/CSS/React/Angular GUIs and generates Playwright test automation",
    instructions: `Analyze HTML/CSS/React/Angular GUI layouts and convert to Playwright test scripts.

Process:
1. Identify all interactive widgets (buttons, inputs, dropdowns, checkboxes, modals, etc.)
2. Generate robust locators using priority: data-testid > role-based > semantic > CSS/XPath
3. Create Page Object Model (POM) with async/await patterns
4. Implement intelligent wait strategies using Playwright's auto-waiting
5. Generate comprehensive test scenarios (positive, negative, edge cases)
6. Create data-driven tests with multiple datasets
7. Document all generated locators and test scenarios

Produce complete Playwright test framework with comprehensive coverage.`,
    outputFormat: "typescript",
  },
  {
    id: "gui-eggplant",
    name: "GUI to Eggplant SenseTalk",
    description: "Analyzes GUIs and generates Eggplant SenseTalk scripts using computer vision and OCR",
    instructions: `Analyze HTML/CSS/React/Angular GUIs and generate Eggplant SenseTalk test automation.

Visual Analysis:
1. Identify all interactive widgets by visual appearance and positioning
2. Classify elements: buttons, inputs, dropdowns, checkboxes, modals, tables, etc.
3. Generate image recognition patterns and OCR strategies
4. Create coordinate-based and spatial relationship mappings
5. Develop resilient recognition using multiple visual characteristics
6. Generate image capture specifications for element repository
7. Create comprehensive test scenarios with visual verification

Produce SenseTalk scripts with image-based and OCR recognition strategies.`,
    outputFormat: "sensetalk",
  },
  {
    id: "selenium-python-eggplant",
    name: "Selenium Python to Eggplant",
    description: "Converts Selenium Python WebDriver tests to Eggplant SenseTalk automation",
    instructions: `Convert Selenium Python WebDriver tests to Eggplant SenseTalk scripts.

Conversion Process:
1. Map Selenium element locators (By.ID, By.CSS, By.XPATH) to Eggplant image recognition
2. Translate WebDriver waits to Eggplant synchronization patterns
3. Convert pytest/unittest frameworks to Eggplant test structures
4. Transform page object models to Eggplant page handlers
5. Generate image capture specifications for UI elements
6. Handle data-driven test conversion and assertion patterns
7. Document migration guide and behavioral differences

Generate complete Eggplant SenseTalk test suite from Selenium Python code.`,
    outputFormat: "sensetalk",
  },
  {
    id: "selenium-csharp-eggplant",
    name: "Selenium C# to Eggplant",
    description: "Converts Selenium C# Page Object Model code to Eggplant SenseTalk",
    instructions: `Convert Selenium C# POM code to Keysight Eggplant SenseTalk implementation.

Migration Strategy:
1. Analyze Selenium C# page object classes and methods
2. Map By.* locator strategies to Eggplant image recognition or OCR
3. Replace WebDriver waits with Eggplant built-in auto-synchronization
4. Convert test class structure to SenseTalk handler architecture
5. Translate assertion patterns to Eggplant validation commands
6. Implement DynamIQ self-healing capabilities
7. Generate image repository requirements and setup instructions

Produce complete Eggplant SenseTalk implementation with detailed migration guide.`,
    outputFormat: "sensetalk",
  },
  {
    id: "selenium-java-eggplant",
    name: "Selenium Java to Eggplant",
    description: "Converts Selenium Java Page Object Model code to Eggplant SenseTalk",
    instructions: `Convert Selenium Java POM code to Keysight Eggplant SenseTalk implementation.

Conversion Approach:
1. Analyze Selenium Java test structure and locator strategies
2. Map By.* selectors to Eggplant image recognition and OCR matching
3. Convert WebDriver synchronization to Eggplant event-driven model
4. Transform Page Object classes to SenseTalk handler collections
5. Update assertion patterns to Eggplant image/text validation
6. Handle data-driven testing and parameterization conversion
7. Include platform considerations (Windows, Mac, Linux via RDP/VNC)

Generate comprehensive Eggplant SenseTalk test suite with conversion documentation.`,
    outputFormat: "sensetalk",
  },
  {
    id: "uipath-eggplant",
    name: "UiPath to Eggplant",
    description: "Converts UiPath RPA workflows to Eggplant SenseTalk test automation scripts",
    instructions: `Convert UiPath RPA scripts and workflows to Eggplant SenseTalk automation.

Workflow Conversion:
1. Map UiPath activities to SenseTalk equivalents (Click, Type, GetText, etc.)
2. Convert UI element selectors to Eggplant image recognition or OCR
3. Translate workflow logic, decision branches, and loops
4. Handle data tables, variables, and parameters
5. Convert exception handling and retry logic
6. Implement proper synchronization and error management
7. Generate image capture specifications for all UI interactions

Produce complete Eggplant SenseTalk test suite with maintainable structure.`,
    outputFormat: "sensetalk",
  },
];
