import { ekgLabeler, EKGAnalysis, EKGComponent } from './ekg-labeler';

interface ProcessingResult {
  result: string;
  provider: 'openai' | 'anthropic' | 'mock';
  model?: string;
  usage?: any;
  labeledImage?: string;
}

interface EKGAnalysisInput {
  type: string;
  image: string;
  analysis_type?: string;
}

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
    // Handle EKG analysis with vision API
    if (taskType === "medical_analysis" && input.type === "ekg_analysis") {
      return await this.processEKGWithOpenAI(input);
    }
    
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

  /**
   * Process EKG analysis using OpenAI Vision API
   */
  private async processEKGWithOpenAI(input: EKGAnalysisInput): Promise<ProcessingResult> {
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
            content: this.getEnhancedEKGPrompt()
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this 12-lead EKG image using the systematic protocol. Provide precise measurements and comprehensive clinical interpretation with exact pixel coordinates for component annotation."
              },
              {
                type: "image_url",
                image_url: {
                  url: input.image
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI Vision API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content || "No analysis generated";
    
    // Parse the analysis and generate labeled image
    const ekgAnalysis = this.parseEKGAnalysis(analysisText);
    const labeledImage = await ekgLabeler.generateLabeledImage(input.image, ekgAnalysis);
    const interpretation = ekgLabeler.generateInterpretation(ekgAnalysis);

    return {
      result: interpretation,
      provider: 'openai',
      model: 'gpt-4o',
      usage: data.usage,
      labeledImage: labeledImage
    };
  }

  /**
   * Parse OpenAI response into structured EKG analysis
   */
  private parseEKGAnalysis(analysisText: string): EKGAnalysis {
    try {
      // Try to extract JSON if present
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.convertToEKGAnalysis(parsed);
      }
    } catch (error) {
      console.log("Could not parse JSON, using text analysis");
    }

    // Fallback: parse text response
    return this.parseTextAnalysis(analysisText);
  }

  private convertToEKGAnalysis(parsed: any): EKGAnalysis {
    return {
      components: parsed.components || this.generateDefaultComponents(),
      findings: {
        abnormalities: parsed.abnormalities || [],
        interpretation: parsed.interpretation || "EKG analysis completed",
        severity: parsed.severity || "normal",
        recommendations: parsed.recommendations || []
      },
      measurements: {
        heartRate: parsed.heartRate || 75,
        prInterval: parsed.prInterval || 160,
        qrsWidth: parsed.qrsWidth || 90,
        qtInterval: parsed.qtInterval || 400
      }
    };
  }

  private parseTextAnalysis(text: string): EKGAnalysis {
    // Extract measurements from text
    const hrMatch = text.match(/heart rate.*?(\d+)/i);
    const prMatch = text.match(/pr interval.*?(\d+)/i);
    const qrsMatch = text.match(/qrs.*?(\d+)/i);
    const qtMatch = text.match(/qt.*?(\d+)/i);

    return {
      components: this.generateDefaultComponents(),
      findings: {
        abnormalities: this.extractAbnormalities(text),
        interpretation: text,
        severity: text.toLowerCase().includes('abnormal') ? 'abnormal' : 'normal',
        recommendations: this.extractRecommendations(text)
      },
      measurements: {
        heartRate: hrMatch ? parseInt(hrMatch[1]) : 75,
        prInterval: prMatch ? parseInt(prMatch[1]) : 160,
        qrsWidth: qrsMatch ? parseInt(qrsMatch[1]) : 90,
        qtInterval: qtMatch ? parseInt(qtMatch[1]) : 400
      }
    };
  }

  private generateDefaultComponents(): EKGComponent[] {
    return [
      {
        name: "P Wave",
        description: "Atrial depolarization",
        coordinates: { x: 200, y: 300 },
        measurements: "Normal",
        normal: true
      },
      {
        name: "QRS Complex",
        description: "Ventricular depolarization",
        coordinates: { x: 400, y: 250 },
        measurements: "Normal width",
        normal: true
      },
      {
        name: "T Wave",
        description: "Ventricular repolarization",
        coordinates: { x: 600, y: 320 },
        measurements: "Normal",
        normal: true
      }
    ];
  }

  private extractAbnormalities(text: string): string[] {
    const abnormalities: string[] = [];
    const patterns = [
      'st elevation',
      'st depression',
      'q wave',
      'arrhythmia',
      'bradycardia',
      'tachycardia',
      'prolonged qt',
      'av block'
    ];

    patterns.forEach(pattern => {
      if (text.toLowerCase().includes(pattern)) {
        abnormalities.push(pattern);
      }
    });

    return abnormalities;
  }

  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('emergency')) {
      recommendations.push('Immediate cardiology consultation recommended');
    }
    if (text.toLowerCase().includes('follow up')) {
      recommendations.push('Follow-up EKG recommended');
    }
    return recommendations;
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

  /**
   * Enhanced EKG analysis prompt based on expert cardiologist protocols
   */
  private getEnhancedEKGPrompt(): string {
    return `You are an expert cardiologist with 20+ years of experience interpreting EKGs. Analyze this 12-lead EKG systematically using the following approach:

**SYSTEMATIC ANALYSIS PROTOCOL:**

1. **RHYTHM ANALYSIS:**
   - Determine if rhythm is regular or irregular
   - Identify P waves: present, morphology, relationship to QRS
   - Calculate heart rate using R-R intervals
   - Identify rhythm type (sinus, atrial fib, atrial flutter, etc.)

2. **AXIS DETERMINATION:**
   - Assess QRS axis in frontal plane using leads I and aVF
   - Normal axis: -30° to +90°
   - Left axis deviation: -30° to -90°
   - Right axis deviation: +90° to +180°

3. **INTERVAL MEASUREMENTS (in milliseconds):**
   - PR interval: Normal 120-200ms
   - QRS duration: Normal <120ms
   - QT interval: Calculate QTc using Bazett's formula
   - Measure precisely using grid squares (1 small square = 40ms)

4. **MORPHOLOGY ANALYSIS BY LEAD:**
   - **Limb leads (I, II, III, aVR, aVL, aVF):** Check for Q waves, R wave progression
   - **Precordial leads (V1-V6):** Assess R wave progression, ST segments, T waves
   - Look for pathological Q waves: >40ms wide or >25% of R wave height

5. **ST SEGMENT ANALYSIS:**
   - Measure ST elevation/depression 80ms after J point
   - Significant ST elevation: ≥1mm in limb leads, ≥2mm in precordial leads
   - Look for reciprocal changes

6. **T WAVE ANALYSIS:**
   - Normal T wave polarity should match QRS polarity
   - Look for T wave inversions, hyperacute T waves, flat T waves

7. **SPECIFIC PATTERN RECOGNITION:**
   - STEMI patterns: ST elevation with reciprocal depression
   - NSTEMI: ST depression, T wave inversions without ST elevation
   - Bundle branch blocks: QRS >120ms with specific morphology
   - Atrial fibrillation: Irregular R-R, no distinct P waves
   - Ventricular rhythms: Wide QRS, AV dissociation

**MEASUREMENT REQUIREMENTS:**
- Use the EKG grid: 1 small square = 0.04 seconds (40ms) horizontally
- 1 small square = 0.1 mV (1mm) vertically
- Count squares precisely for accurate measurements

**CLINICAL CORRELATION:**
- Identify territorial patterns (anterior, inferior, lateral, posterior)
- Assess for acute vs chronic changes
- Consider age-related normal variants

**COMPONENT IDENTIFICATION FOR PROFESSIONAL ANNOTATION:**
- Identify specific P wave locations with pixel coordinates (mark centers with red)
- Identify QRS complex peaks with pixel coordinates (mark centers with blue) 
- Identify T wave peaks with pixel coordinates (mark centers with green)
- Mark PR intervals, QRS width, and QT intervals with precise measurement lines
- Include lead-specific annotations for all 12 leads

**OUTPUT FORMAT:**
Return detailed JSON with:
- Precise measurements (HR, PR, QRS, QT, QTc)
- Component locations with pixel coordinates
- Abnormality severity scoring (1-10)
- Confidence levels for each finding (0-100%)
- Clinical urgency level (routine, urgent, emergent)
- Specific diagnostic considerations
- Territorial analysis if ischemic changes present

Be extremely precise with measurements and conservative with diagnoses. Flag any uncertainty clearly. This analysis is for educational purposes with appropriate medical disclaimers.`;
  }
}

export const openAIService = new OpenAIService();
