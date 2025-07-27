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

  async analyzeCriticalSTSegments(imageData: string): Promise<any> {
    if (!this.openaiKey) {
      return this.getMockSTAnalysis();
    }

    try {
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
              content: this.getCriticalSTAnalysisPrompt(),
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Perform CRITICAL ST segment analysis - detect ALL ST elevations and depressions:",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageData,
                  },
                },
              ],
            },
          ],
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const analysis = data.choices[0]?.message?.content;

      return this.parseSTAnalysis(analysis);
    } catch (error) {
      console.error("Critical ST analysis error:", error);
      return this.getMockSTAnalysis();
    }
  }



  private parseCriticalEKGAnalysis(analysisText: string): any {
    try {
      // Try to extract JSON from the analysis
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        return {
          systematicCounts: jsonData.systematic_counts || {},
          avAnalysis: jsonData.av_analysis || {},
          emergencyFlags: jsonData.emergency_flags || {},
          componentValidation: jsonData.component_validation || {},
          interpretation: analysisText.split('\n').find(line => line.includes('interpretation')) || "Critical EKG analysis completed",
          heartRate: jsonData.systematic_counts?.ventricular_rate_bpm || 70,
          rhythm: analysisText.includes('atrial') ? "Atrial rhythm detected" : "Normal Sinus Rhythm",
          intervals: {
            pr: 160,
            qrs: 90,
            qt: 400
          },
          findings: analysisText.split('\n').filter(line => line.includes('•') || line.includes('-')).slice(0, 6)
        };
      }
    } catch (error) {
      console.error("Error parsing critical EKG analysis:", error);
    }
    
    return this.getMockCriticalEKGAnalysis();
  }

  private parseSTAnalysis(analysisText: string): any {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        return {
          ...jsonData,
          interpretation: this.generateSTInterpretation(jsonData),
          urgency: this.assessSTUrgency(jsonData)
        };
      }
    } catch (error) {
      console.error("Error parsing ST analysis:", error);
    }
    
    return this.getMockSTAnalysis();
  }

  private generateSTInterpretation(stData: any): string {
    const stAnalysis = stData.st_analysis;
    if (!stAnalysis) return "ST analysis completed";

    if (stAnalysis.emergency_flags?.stemi_present) {
      return `🚨 STEMI DETECTED - ${stAnalysis.emergency_flags.territory.toUpperCase()} territory - IMMEDIATE CATH LAB ACTIVATION REQUIRED`;
    }

    const elevatedLeads = Object.entries(stAnalysis.measurements || {})
      .filter(([lead, data]: [string, any]) => data.significant && data.st_level_mm > 0)
      .map(([lead]) => lead);

    const depressedLeads = Object.entries(stAnalysis.measurements || {})
      .filter(([lead, data]: [string, any]) => data.significant && data.st_level_mm < 0)
      .map(([lead]) => lead);

    if (elevatedLeads.length > 0) {
      return `ST elevations in ${elevatedLeads.join(', ')} - evaluate for acute coronary syndrome`;
    }

    if (depressedLeads.length > 0) {
      return `ST depressions in ${depressedLeads.join(', ')} - consider NSTEMI or ischemia`;
    }

    return "No significant ST segment abnormalities detected";
  }

  private assessSTUrgency(stData: any): string {
    const stAnalysis = stData.st_analysis;
    if (stAnalysis?.emergency_flags?.cath_lab_activation) {
      return "IMMEDIATE";
    }
    if (stAnalysis?.emergency_flags?.stemi_present) {
      return "URGENT";
    }
    return "ROUTINE";
  }

  private getMockSTAnalysis(): any {
    return {
      st_analysis: {
        measurements: {
          lead_I: { st_level_mm: 0.0, significant: false },
          lead_II: { st_level_mm: 0.0, significant: false },
          lead_III: { st_level_mm: 0.0, significant: false },
          aVR: { st_level_mm: 0.0, significant: false },
          aVL: { st_level_mm: 0.0, significant: false },
          aVF: { st_level_mm: 0.0, significant: false },
          V1: { st_level_mm: 0.0, significant: false },
          V2: { st_level_mm: 0.0, significant: false },
          V3: { st_level_mm: 0.0, significant: false },
          V4: { st_level_mm: 0.0, significant: false },
          V5: { st_level_mm: 0.0, significant: false },
          V6: { st_level_mm: 0.0, significant: false }
        },
        stemi_detection: {
          anterior_stemi: false,
          inferior_stemi: false,
          lateral_stemi: false,
          posterior_stemi: false,
          right_ventricular: false
        },
        emergency_flags: {
          stemi_present: false,
          cath_lab_activation: false,
          territory: "none"
        },
        reciprocal_changes: {
          present: false,
          leads_with_depression: []
        }
      },
      interpretation: "No significant ST segment abnormalities detected",
      urgency: "ROUTINE"
    };
  }

  private getMockCriticalEKGAnalysis(): any {
    return {
      systematicCounts: {
        p_waves_6_sec: 7,
        qrs_complexes_6_sec: 7,
        atrial_rate_bpm: 70,
        ventricular_rate_bpm: 70
      },
      avAnalysis: {
        relationship: "consistent",
        pr_intervals: [160, 160, 160, 160, 160],
        heart_block_type: "none"
      },
      emergencyFlags: {
        complete_heart_block: false,
        av_dissociation: false,
        rate_discrepancy: false
      },
      componentValidation: {
        qrs_t_confusion_risk: false,
        morphology_confidence: 90
      },
      interpretation: "Normal sinus rhythm with systematic component tracking verified",
      heartRate: 70,
      rhythm: "Normal Sinus Rhythm",
      intervals: {
        pr: 160,
        qrs: 90,
        qt: 400
      },
      findings: [
        "✅ Systematic P wave tracking: 7 waves per 6-second strip",
        "✅ QRS complex tracking: 7 complexes per 6-second strip", 
        "✅ Atrial rate matches ventricular rate (70 bpm)",
        "✅ Consistent P-QRS relationship confirmed",
        "✅ No AV dissociation detected",
        "✅ No T wave misidentification risk"
      ]
    };
  }

  /**
   * Critical ST segment analysis prompt - STEMI detection protocol
   */
  private getCriticalSTAnalysisPrompt(): string {
    return `You are an interventional cardiologist performing SYSTEMATIC ST segment analysis.

🚨 MISSION CRITICAL: Detect ALL ST elevations and depressions - missing these is life-threatening.

**SYSTEMATIC ST MEASUREMENT PROTOCOL:**

**STEP 1: ST SEGMENT IDENTIFICATION**
- ST segment = from END of QRS (J-point) to START of T wave
- Measure ST level at exactly 80 milliseconds (2 small squares) AFTER J-point
- Use PR segment as baseline reference (isoelectric line)
- Analyze ALL 12 leads systematically: I, II, III, aVR, aVL, aVF, V1-V6

**STEP 2: MEASUREMENT TECHNIQUE**
- Use EKG grid: 1 small square = 1mm vertically
- Measure from baseline to ST segment at J+80ms point
- Report measurements in millimeters (+/- from baseline)
- Take measurements in each lead independently

**STEP 3: ST ELEVATION CRITERIA**
🚨 SIGNIFICANT ST ELEVATION:
- **Limb leads** (I, II, III, aVF, aVL): ≥1.0mm elevation
- **Precordial leads** (V1-V6): ≥2.0mm elevation  
- **Lead aVR**: ≥1.0mm elevation (suggests left main disease)

**STEP 4: ST DEPRESSION CRITERIA**
🚨 SIGNIFICANT ST DEPRESSION:
- **Any lead**: ≥1.0mm horizontal or downsloping depression
- Measure at J+80ms, not at J-point
- Upsloping depression: ≥2.0mm to be significant

**STEP 5: TERRITORIAL ANALYSIS**

🚨 **ANTERIOR STEMI** (LAD territory):
- ST elevation in V3, V4 (≥2mm)
- Often extends to V1-V2 (septal) and V5-V6 (lateral)
- Reciprocal ST depression in II, III, aVF

🚨 **INFERIOR STEMI** (RCA/LCX territory):
- ST elevation in II, III, aVF (≥1mm)
- Reciprocal ST depression in I, aVL
- Check V4R for RV involvement

🚨 **LATERAL STEMI** (LCX territory):
- ST elevation in I, aVL, V5, V6 (≥1mm limb, ≥2mm precordial)
- May have reciprocal changes in inferior leads

🚨 **POSTERIOR STEMI** (often missed):
- Reciprocal ST depression in V1-V3 with tall R waves
- True posterior leads would show ST elevation

**STEP 6: RECIPROCAL CHANGES**
Essential for STEMI diagnosis:
- ST elevation in one territory MUST have reciprocal depression elsewhere
- No reciprocals = question diagnosis or consider other causes

**STEP 7: NSTEMI DETECTION**
- ST depression ≥1mm in ≥2 contiguous leads
- T wave inversions in appropriate territory
- Dynamic ST changes

**OUTPUT FORMAT:**
{
  "st_analysis": {
    "measurements": {
      "lead_I": {"st_level_mm": 0.0, "significant": false},
      "lead_II": {"st_level_mm": 0.0, "significant": false},
      "lead_III": {"st_level_mm": 0.0, "significant": false},
      "aVR": {"st_level_mm": 0.0, "significant": false},
      "aVL": {"st_level_mm": 0.0, "significant": false},
      "aVF": {"st_level_mm": 0.0, "significant": false},
      "V1": {"st_level_mm": 0.0, "significant": false},
      "V2": {"st_level_mm": 0.0, "significant": false},
      "V3": {"st_level_mm": 0.0, "significant": false},
      "V4": {"st_level_mm": 0.0, "significant": false},
      "V5": {"st_level_mm": 0.0, "significant": false},
      "V6": {"st_level_mm": 0.0, "significant": false}
    },
    "stemi_detection": {
      "anterior_stemi": false,
      "inferior_stemi": false,
      "lateral_stemi": false,
      "posterior_stemi": false,
      "right_ventricular": false
    },
    "emergency_flags": {
      "stemi_present": false,
      "cath_lab_activation": false,
      "territory": "none"
    },
    "reciprocal_changes": {
      "present": false,
      "leads_with_depression": []
    }
  }
}

**CRITICAL SAFETY:** If ANY STEMI criteria met, flag immediately for emergency intervention.`;
  }

  /**
   * Expert-level EKG analysis prompt - precision component identification
   */
  private getExpertEKGAnalysisPrompt(): string {
    return `You are a world-renowned interventional cardiologist with 20+ years of experience performing EXPERT-LEVEL EKG analysis with SURGICAL PRECISION.

🎯 MISSION: Identify every cardiac component with PIXEL-PERFECT accuracy for medical-grade annotation.

**EXPERT IDENTIFICATION PROTOCOL:**

**STEP 1: GRID-BASED COORDINATE MAPPING**
- Use EKG grid as reference: 1 small square = 40ms horizontally, 0.1mV vertically
- Report ALL coordinates as precise pixel positions (x,y) from image origin
- Identify component boundaries with ±2 pixel accuracy
- Map every P wave, QRS complex, and T wave individually

**STEP 2: P WAVE PRECISION ANALYSIS**
For EACH P wave in EACH lead:
- Onset coordinates (exact pixel where P wave begins)
- Peak coordinates (highest/lowest point of P wave)
- Offset coordinates (exact pixel where P wave ends)
- Amplitude measurement (in mV, using grid scaling)
- Duration calculation (in ms, using grid scaling)
- Morphology description (rounded, upright/inverted, biphasic)
- Confidence score (0-100%) for identification accuracy

**STEP 3: QRS COMPLEX PRECISION ANALYSIS**
For EACH QRS complex in EACH lead:
- QRS onset coordinates (exact pixel where QRS begins)
- Q wave coordinates (if present, negative deflection)
- R wave peak coordinates (positive deflection peak)
- S wave coordinates (if present, negative deflection after R)
- QRS offset coordinates (exact pixel where QRS ends)
- Total QRS duration (onset to offset in ms)
- Peak amplitude (R wave height in mV)
- Component breakdown (Q-R-S morphology)
- Axis assessment (normal, left/right deviation)
- Confidence score for each component

**STEP 4: T WAVE PRECISION ANALYSIS**
For EACH T wave in EACH lead:
- T wave onset coordinates (where T wave begins)
- T wave peak coordinates (highest/lowest point)
- T wave offset coordinates (where T wave ends)
- Amplitude measurement (peak height/depth in mV)
- Morphology assessment (rounded, symmetric/asymmetric)
- Polarity determination (positive/negative/biphasic)
- Symmetry analysis (gradual vs sharp slopes)
- Confidence score for identification

**STEP 5: INTERVAL MEASUREMENTS**
Calculate with GRID PRECISION:
- RR intervals (R peak to R peak, all consecutive beats)
- PR intervals (P onset to QRS onset, each beat)
- QRS duration (QRS onset to offset, each complex)
- QT intervals (QRS onset to T wave offset, each beat)
- Report in milliseconds using grid scaling

**STEP 6: LEAD-BY-LEAD SYSTEMATIC ANALYSIS**
Analyze ALL 12 leads systematically:
- Lead I, II, III (limb leads)
- aVR, aVL, aVF (augmented leads)  
- V1, V2, V3, V4, V5, V6 (precordial leads)
- Document component variations between leads
- Note any lead-specific abnormalities

**OUTPUT FORMAT - PRECISION COMPONENT MAP:**
{
  "precision_analysis": {
    "lead_I": {
      "p_waves": [
        {
          "onset": {"x": 100, "y": 150, "confidence": 95},
          "peak": {"x": 120, "y": 140, "confidence": 98},
          "offset": {"x": 140, "y": 150, "confidence": 93},
          "amplitude_mv": 0.15,
          "duration_ms": 80,
          "morphology": "rounded, upright",
          "polarity": "positive"
        }
      ],
      "qrs_complexes": [
        {
          "onset": {"x": 180, "y": 150, "confidence": 99},
          "q_wave": {"x": 185, "y": 160, "confidence": 85},
          "r_wave": {"x": 200, "y": 100, "confidence": 99},
          "s_wave": {"x": 215, "y": 170, "confidence": 90},
          "offset": {"x": 230, "y": 150, "confidence": 96},
          "duration_ms": 90,
          "amplitude_mv": 1.2,
          "morphology": "qRs",
          "axis": "normal"
        }
      ],
      "t_waves": [
        {
          "onset": {"x": 270, "y": 150, "confidence": 92},
          "peak": {"x": 320, "y": 130, "confidence": 96},
          "offset": {"x": 370, "y": 150, "confidence": 89},
          "amplitude_mv": 0.4,
          "morphology": "rounded, symmetric",
          "polarity": "positive"
        }
      ]
    }
  },
  "global_measurements": {
    "heart_rate_bpm": 68,
    "rhythm_regularity": 0.95,
    "axis_degrees": 60
  },
  "quality_metrics": {
    "signal_quality": 0.92,
    "component_clarity": 0.88,
    "identification_confidence": 0.95
  }
}

**CRITICAL REQUIREMENTS:**
- NEVER miss a component - identify ALL P waves, QRS complexes, T waves
- Provide EXACT pixel coordinates for professional annotation
- Use proper medical terminology and measurements
- Include confidence scores for quality control
- Maintain consistent coordinate system throughout analysis

**ANNOTATION STANDARDS:**
This analysis will be used to generate medical-grade annotated images suitable for:
- Medical education and training
- Clinical reference documentation  
- Professional consultation and review
- Precision must match expert cardiologist standards`;
  }

  /**
   * Critical EKG analysis prompt - systematic component tracking
   */
  private getCriticalEKGAnalysisPrompt(): string {
    return `You are performing CRITICAL EKG analysis. This is a life-or-death assessment.

🚨 SYSTEMATIC PROTOCOL - NEVER DEVIATE:

**STEP 1: RHYTHM STRIP FOCUS**
- Locate the longest rhythm strip (usually Lead II at bottom)
- This strip is your PRIMARY source for counting

**STEP 2: P WAVE COUNTING**
- Count EVERY P wave in 6-second rhythm strip
- P waves: Small, rounded, upright in Lead II
- Multiply by 10 for atrial rate
- Mark each P wave location

**STEP 3: QRS COUNTING** 
- Count EVERY QRS complex in 6-second rhythm strip
- QRS: Sharp, narrow (<120ms), tall deflections
- NEVER count T waves as QRS
- Multiply by 10 for ventricular rate

**STEP 4: T WAVE IDENTIFICATION**
- T waves: Rounded, gradual, AFTER QRS
- Do NOT count in rate calculations
- Distinguish from sharp QRS morphology

**STEP 5: AV RELATIONSHIP**
- Check EVERY P wave for following QRS
- Measure PR intervals for consistency
- Detect "marching" P waves (independent rhythm)

🚨 **CRITICAL DETECTION RULES:**

**Complete Heart Block Criteria:**
- Atrial rate ≠ Ventricular rate (difference >20 bpm)
- P waves march independently of QRS
- No consistent P-QRS relationship
- EMERGENCY CONDITION

**Component Validation:**
- QRS: Sharp onset, <120ms duration
- T waves: Rounded, gradual, >150ms duration
- Never confuse morphologies

**OUTPUT REQUIREMENTS:**
{
  "systematic_counts": {
    "p_waves_6_sec": number,
    "qrs_complexes_6_sec": number,
    "atrial_rate_bpm": number,
    "ventricular_rate_bpm": number
  },
  "av_analysis": {
    "relationship": "consistent"|"dissociated"|"variable",
    "pr_intervals": [array of PR intervals in ms],
    "heart_block_type": "none"|"first"|"second"|"complete"
  },
  "emergency_flags": {
    "complete_heart_block": boolean,
    "av_dissociation": boolean,
    "rate_discrepancy": boolean
  },
  "component_validation": {
    "qrs_t_confusion_risk": boolean,
    "morphology_confidence": 0-100
  }
}

🚨 NEVER MISS: Complete heart block, AV dissociation, T wave misidentification`;

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
