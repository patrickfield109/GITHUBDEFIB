export class OpenAIService {
  private openaiKey: string;
  private anthropicKey: string;

  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY || "";
    this.anthropicKey = process.env.ANTHROPIC_API_KEY || "";
    
    if (this.openaiKey) {
      console.log("✅ OpenAI API key loaded successfully");
    } else {
      console.warn("⚠️ OpenAI API key not found. Using mock responses.");
    }
    
    if (this.anthropicKey) {
      console.log("✅ Anthropic API key loaded successfully");
    } else {
      console.warn("⚠️ Anthropic API key not found.");
    }
  }

  async processTask(taskType: string, input: any): Promise<any> {
    // Try OpenAI first, then Anthropic as fallback
    if (this.openaiKey) {
      try {
        return await this.processWithOpenAI(taskType, input);
      } catch (error) {
        console.error("OpenAI API error, trying Anthropic fallback:", error);
        if (this.anthropicKey) {
          return await this.processWithAnthropic(taskType, input);
        }
      }
    } else if (this.anthropicKey) {
      try {
        return await this.processWithAnthropic(taskType, input);
      } catch (error) {
        console.error("Anthropic API error:", error);
      }
    }

    // Fallback to mock response if all APIs fail
    console.warn("All AI services failed, using mock response");
    return this.getMockResponse(taskType, input);
  }

  private async processWithOpenAI(taskType: string, input: any): Promise<any> {
    const prompt = this.buildPromptForTaskType(taskType, input);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
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
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      result: data.choices[0]?.message?.content || "No response generated",
      usage: data.usage,
      timestamp: new Date().toISOString(),
      provider: "openai",
      model: "gpt-4o",
    };
  }

  private async processWithAnthropic(taskType: string, input: any): Promise<any> {
    const prompt = this.buildPromptForTaskType(taskType, input);
    const systemPrompt = this.getSystemPromptForTaskType(taskType);
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.anthropicKey}`,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      result: data.content[0]?.text || "No response generated",
      usage: data.usage,
      timestamp: new Date().toISOString(),
      provider: "anthropic",
      model: "claude-3-5-sonnet",
    };
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
    if (!this.openaiKey) {
      return `mock_assistant_${Date.now()}`;
    }

    try {
      const response = await fetch("https://api.openai.com/v1/assistants", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.openaiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
        body: JSON.stringify({
          name,
          instructions,
          model: "gpt-4o",
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

  // Enhanced conversational processing using Anthropic for more natural interactions
  async processConversationalCommand(command: string, context?: any): Promise<string> {
    if (this.anthropicKey) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.anthropicKey}`,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            system: `You are the OperatorOS AI agent orchestration assistant. You help users manage AI agent pools, submit tasks, and monitor system health through natural conversation. 

            Your capabilities include:
            - Managing agent pools (Healthcare, Financial, Business Automation, Sports Analytics)
            - Processing and routing tasks to appropriate agents
            - Providing system status and health information
            - Scaling agent resources based on demand
            - Running interactive demos of agent capabilities

            Respond in a helpful, professional manner. Keep responses concise but informative.`,
            messages: [
              {
                role: "user",
                content: `Context: ${JSON.stringify(context || {})}\n\nUser command: ${command}`,
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        return data.content[0]?.text || "I'm having trouble processing that request right now.";
      } catch (error) {
        console.error("Anthropic conversation error:", error);
      }
    }

    // Fallback to basic command processing
    return `I understand you want to: "${command}". Let me process that for you.`;
  }
}

export const openAIService = new OpenAIService();
