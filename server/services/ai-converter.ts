import OpenAI from "openai";
import { TestCase, ConversionAgent, AIProvider } from "@shared/schema";

interface ConversionResult {
  filename: string;
  content: string;
}

export class AIConverter {
  private openaiClient: OpenAI | null = null;
  private perplexityApiKey: string | null = null;

  constructor(provider: AIProvider, apiKey: string) {
    if (provider === "openai") {
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      this.openaiClient = new OpenAI({ apiKey });
    } else {
      this.perplexityApiKey = apiKey;
    }
  }

  async convertTestCases(
    testCases: TestCase[],
    agent: ConversionAgent,
    provider: AIProvider
  ): Promise<ConversionResult[]> {
    // Limit parallelism to 3 concurrent requests to avoid overwhelming APIs
    const results: ConversionResult[] = [];
    const batchSize = 3;
    
    for (let i = 0; i < testCases.length; i += batchSize) {
      const batch = testCases.slice(i, i + batchSize);
      const batchPromises = batch.map(async (testCase, batchIndex) => {
        const convertedScript = await this.convertSingleTestCase(testCase, agent, provider);
        const filename = this.generateFilename(testCase, agent.outputFormat, i + batchIndex);
        return {
          filename,
          content: convertedScript,
        };
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  private async convertSingleTestCase(
    testCase: TestCase,
    agent: ConversionAgent,
    provider: AIProvider
  ): Promise<string> {
    const prompt = this.buildPrompt(testCase, agent);

    if (provider === "openai") {
      return await this.convertWithOpenAI(prompt);
    } else {
      return await this.convertWithPerplexity(prompt);
    }
  }

  private buildPrompt(testCase: TestCase, agent: ConversionAgent): string {
    return `${agent.instructions}

Test Case Details:
- Test ID: ${testCase.testId}
- Test Name: ${testCase.testName}
- Steps: ${testCase.steps}
- Expected Results: ${testCase.expectedResults}

Generate the complete converted script based on the instructions above.`;
  }

  private async convertWithOpenAI(prompt: string): Promise<string> {
    if (!this.openaiClient) {
      throw new Error("OpenAI client not initialized");
    }

    try {
      console.log("[OpenAI] Starting conversion...");
      console.log("[OpenAI] Prompt length:", prompt.length);

      // Use gpt-4o model which is widely available and reliable
      const response = await this.openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert test automation engineer. Convert the provided manual test cases into high-quality automated test scripts following the exact instructions given."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_completion_tokens: 2000,
      });

      console.log("[OpenAI] Conversion completed");
      console.log("[OpenAI] Response choices:", response.choices.length);
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error("[OpenAI] No content in response");
        return "Error: No content generated";
      }
      
      console.log("[OpenAI] Content length:", content.length);
      return content;
    } catch (error: any) {
      console.error("[OpenAI] Conversion error - Full error:", JSON.stringify(error, null, 2));
      console.error("[OpenAI] Error message:", error.message);
      console.error("[OpenAI] Error status:", error.status);
      throw new Error(`OpenAI API error: ${error.message || String(error)}`);
    }
  }

  private async convertWithPerplexity(prompt: string): Promise<string> {
    if (!this.perplexityApiKey) {
      throw new Error("Perplexity API key not provided");
    }

    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.perplexityApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            {
              role: "system",
              content: "You are an expert test automation engineer. Convert the provided manual test cases into high-quality automated test scripts following the exact instructions given."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 4096,
          temperature: 0.2,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content || "Error: No content generated";
    } catch (error: any) {
      throw new Error(`Perplexity API error: ${error.message}`);
    }
  }

  private generateFilename(testCase: TestCase, format: string, index: number): string {
    const sanitizedName = testCase.testName
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()
      .substring(0, 50);

    const extension = this.getFileExtension(format);
    return `${testCase.testId}_${sanitizedName}.${extension}`;
  }

  private getFileExtension(format: string): string {
    const extensionMap: Record<string, string> = {
      sensetalk: "script",
      python: "py",
      javascript: "js",
      java: "java",
      markdown: "md",
      typescript: "ts",
    };

    return extensionMap[format.toLowerCase()] || "txt";
  }
}
