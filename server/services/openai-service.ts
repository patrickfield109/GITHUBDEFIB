export class OpenAIService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "";
    if (!this.apiKey) {
      console.warn("OpenAI API key not found. Using mock responses.");
    }
  }

  async processTask(taskType: string, input: any): Promise<any> {
    if (!this.apiKey) {
      return this.getMockResponse(taskType, input);
    }

    try {
      const prompt = this.buildPromptForTaskType(taskType, input);
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: this.getSystemPromptForTaskType(taskType),
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        result: data.choices[0]?.message?.content || "No response generated",
        usage: data.usage,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      return this.getMockResponse(taskType, input);
    }
  }

  private buildPromptForTaskType(taskType: string, input: any): string {
    switch (taskType) {
      case "medical_analysis":
        return `Please analyze the following medical symptoms and provide general guidance: ${JSON.stringify(input)}`;
      case "stock_analysis":
        return `Please analyze the following stock/investment request: ${JSON.stringify(input)}`;
      case "workflow_automation":
        return `Please help automate the following business process: ${JSON.stringify(input)}`;
      case "sports_betting":
        return `Please analyze the following sports data for strategic insights: ${JSON.stringify(input)}`;
      default:
        return `Please help with the following request: ${JSON.stringify(input)}`;
    }
  }

  private getSystemPromptForTaskType(taskType: string): string {
    switch (taskType) {
      case "medical_analysis":
        return "You are a helpful medical AI assistant. Provide general health information and guidance, but always recommend consulting with healthcare professionals for serious concerns.";
      case "stock_analysis":
        return "You are a financial analysis AI assistant. Provide investment insights and market analysis, but always include appropriate disclaimers about financial risks.";
      case "workflow_automation":
        return "You are a business automation AI assistant. Help users optimize their workflows and business processes with practical recommendations.";
      case "sports_betting":
        return "You are a sports analytics AI assistant. Provide data-driven insights about sports events and performance analysis.";
      default:
        return "You are a helpful AI assistant. Provide accurate and useful information to help users with their requests.";
    }
  }

  private getMockResponse(taskType: string, input: any): any {
    const mockResponses = {
      medical_analysis: {
        result: "Based on the symptoms provided, I recommend monitoring the condition and consulting with a healthcare professional if symptoms persist or worsen. This is general guidance only.",
        confidence: 0.85,
        recommendations: ["Monitor symptoms", "Stay hydrated", "Consult doctor if needed"],
      },
      stock_analysis: {
        result: "Analysis shows mixed signals for this investment. Consider market volatility and your risk tolerance. This is not financial advice.",
        confidence: 0.75,
        recommendation: "Hold/Monitor",
        risk_level: "Medium",
      },
      workflow_automation: {
        result: "I've identified several optimization opportunities in your workflow. Consider implementing automated notifications and task routing.",
        efficiency_gain: "25-30%",
        implementation_time: "2-3 weeks",
      },
      sports_betting: {
        result: "Statistical analysis indicates favorable conditions. Consider team performance metrics and recent trends.",
        confidence: 0.70,
        key_factors: ["Team form", "Head-to-head record", "Injury reports"],
      },
    };

    return mockResponses[taskType as keyof typeof mockResponses] || {
      result: "Task processed successfully",
      status: "completed",
    };
  }

  async createConversationAssistant(name: string, instructions: string): Promise<string> {
    if (!this.apiKey) {
      return `mock_assistant_${Date.now()}`;
    }

    try {
      const response = await fetch("https://api.openai.com/v1/assistants", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
        body: JSON.stringify({
          name,
          instructions,
          model: "gpt-4",
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error("Error creating assistant:", error);
      return `mock_assistant_${Date.now()}`;
    }
  }
}

export const openAIService = new OpenAIService();
