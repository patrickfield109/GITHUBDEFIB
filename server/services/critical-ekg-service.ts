/**
 * Critical EKG Analysis Service
 * Systematic component tracking to prevent missing complete heart block
 */

export interface ComponentAnalysis {
  pWaveTracking: PWaveAnalysis;
  qrsTracking: QRSAnalysis;
  tWaveValidation: TWaveAnalysis;
  avRelationship: AVConductionAnalysis;
}

export interface PWaveAnalysis {
  count: number;
  rate: number;
  regularity: 'regular' | 'irregular';
  morphology: string;
  locations: Array<{ time: number; amplitude: number }>;
}

export interface QRSAnalysis {
  count: number;
  rate: number;
  width: number;
  morphology: string;
  locations: Array<{ time: number; amplitude: number; duration: number }>;
}

export interface TWaveAnalysis {
  validated: boolean;
  qrsConfusions: Array<{ location: number; reason: string }>;
  confidence: number;
}

export interface AVConductionAnalysis {
  type: 'NORMAL' | '1ST_DEGREE' | '2ND_DEGREE' | 'COMPLETE_HEART_BLOCK';
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENT';
  findings: string[];
  avDissociation: boolean;
  rateDifference: number;
}

export interface BlockDetection {
  type: string;
  confidence: number;
  urgency: string;
  evidence: string[];
  action: string;
}

export class CardiacComponentTracker {
  
  async trackAllComponents(analysis: any): Promise<ComponentAnalysis> {
    return {
      pWaveTracking: await this.trackPWaves(analysis),
      qrsTracking: await this.trackQRSComplexes(analysis),
      tWaveValidation: await this.validateTWaves(analysis),
      avRelationship: await this.assessAVRelationship(analysis)
    };
  }

  private async trackPWaves(analysis: any): Promise<PWaveAnalysis> {
    // Systematic P wave identification
    const pWaves = this.identifyPWavesByCriteria(analysis);
    const pRate = this.calculateAtrialRate(pWaves);
    
    return {
      count: pWaves.length,
      rate: pRate,
      regularity: this.assessPWaveRegularity(pWaves),
      morphology: this.describePWaveMorphology(pWaves),
      locations: pWaves.map(p => ({ time: p.time, amplitude: p.amplitude }))
    };
  }

  private async trackQRSComplexes(analysis: any): Promise<QRSAnalysis> {
    // Distinguish QRS from T waves
    const qrsComplexes = this.identifyQRSByCriteria(analysis);
    const vRate = this.calculateVentricularRate(qrsComplexes);
    
    return {
      count: qrsComplexes.length,
      rate: vRate,
      width: this.measureQRSWidth(qrsComplexes),
      morphology: this.describeQRSMorphology(qrsComplexes),
      locations: qrsComplexes.map(q => ({ 
        time: q.time, 
        amplitude: q.amplitude, 
        duration: q.duration 
      }))
    };
  }

  private async validateTWaves(analysis: any): Promise<TWaveAnalysis> {
    const validator = new MorphologyValidator();
    const validation = validator.validateQRSvsTWave(analysis.components || []);
    
    return {
      validated: validation.isValid,
      qrsConfusions: validation.corrections.map(c => ({
        location: c.component.time,
        reason: c.reason
      })),
      confidence: validation.confidence
    };
  }

  private async assessAVRelationship(analysis: any): Promise<AVConductionAnalysis> {
    const pWaves = analysis.pWaveTracking;
    const qrsComplexes = analysis.qrsTracking;
    // Critical: Check for AV dissociation
    const heartBlockDetector = new HeartBlockDetector();
    const blockDetection = heartBlockDetector.detectCompleteHeartBlock(
      pWaves.locations,
      qrsComplexes.locations
    );
    
    const rateDifference = Math.abs(pWaves.rate - qrsComplexes.rate);
    
    if (blockDetection.type === "COMPLETE_HEART_BLOCK") {
      return {
        type: "COMPLETE_HEART_BLOCK",
        urgency: "EMERGENT",
        findings: [
          `Atrial rate: ${pWaves.rate} bpm`,
          `Ventricular rate: ${qrsComplexes.rate} bpm`,
          "AV dissociation confirmed",
          "🚨 COMPLETE HEART BLOCK DETECTED"
        ],
        avDissociation: true,
        rateDifference
      };
    }

    return this.assessPartialBlocks(pWaves, qrsComplexes);
  }

  private identifyPWavesByCriteria(analysis: any): any[] {
    // Mock implementation - would use actual signal processing
    return analysis.pWaves || [];
  }

  private identifyQRSByCriteria(analysis: any): any[] {
    // Mock implementation - would use actual signal processing
    return analysis.qrsComplexes || [];
  }

  private calculateAtrialRate(pWaves: any[]): number {
    if (pWaves.length < 2) return 0;
    
    // Calculate average P-P interval
    const intervals = [];
    for (let i = 1; i < pWaves.length; i++) {
      intervals.push(pWaves[i].time - pWaves[i-1].time);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return Math.round(60000 / avgInterval); // Convert to BPM
  }

  private calculateVentricularRate(qrsComplexes: any[]): number {
    if (qrsComplexes.length < 2) return 0;
    
    // Calculate average R-R interval
    const intervals = [];
    for (let i = 1; i < qrsComplexes.length; i++) {
      intervals.push(qrsComplexes[i].time - qrsComplexes[i-1].time);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return Math.round(60000 / avgInterval); // Convert to BPM
  }

  private assessPWaveRegularity(pWaves: any[]): 'regular' | 'irregular' {
    if (pWaves.length < 3) return 'irregular';
    
    const intervals = [];
    for (let i = 1; i < pWaves.length; i++) {
      intervals.push(pWaves[i].time - pWaves[i-1].time);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    return variance < (avgInterval * 0.1) ? 'regular' : 'irregular';
  }

  private describePWaveMorphology(pWaves: any[]): string {
    return "Normal upright P waves in Lead II";
  }

  private measureQRSWidth(qrsComplexes: any[]): number {
    if (qrsComplexes.length === 0) return 0;
    
    const widths = qrsComplexes.map(qrs => qrs.duration || 80);
    return widths.reduce((a, b) => a + b, 0) / widths.length;
  }

  private describeQRSMorphology(qrsComplexes: any[]): string {
    const avgWidth = this.measureQRSWidth(qrsComplexes);
    return avgWidth > 120 ? "Wide QRS complexes" : "Normal narrow QRS complexes";
  }

  private assessPartialBlocks(pWaves: PWaveAnalysis, qrsComplexes: QRSAnalysis): AVConductionAnalysis {
    const rateDifference = Math.abs(pWaves.rate - qrsComplexes.rate);
    
    if (rateDifference > 10) {
      return {
        type: '2ND_DEGREE',
        urgency: 'URGENT',
        findings: [`Possible 2nd degree AV block - rate difference: ${rateDifference} bpm`],
        avDissociation: false,
        rateDifference
      };
    }
    
    return {
      type: 'NORMAL',
      urgency: 'ROUTINE',
      findings: ['Normal AV conduction'],
      avDissociation: false,
      rateDifference
    };
  }
}

export class HeartBlockDetector {
  
  detectCompleteHeartBlock(pWaves: any[], qrsComplexes: any[]): BlockDetection {
    // Rule 1: Rate comparison
    const atrialRate = this.calculateRate(pWaves);
    const ventricularRate = this.calculateRate(qrsComplexes);
    const rateDifference = Math.abs(atrialRate - ventricularRate);
    
    // Rule 2: AV dissociation check
    const dissociation = this.checkAVDissociation(pWaves, qrsComplexes);
    
    // Rule 3: Independent marching
    const independentRhythms = this.assessIndependentRhythms(pWaves, qrsComplexes);
    
    if (rateDifference > 20 && dissociation && independentRhythms) {
      return {
        type: "COMPLETE_HEART_BLOCK",
        confidence: 0.95,
        urgency: "EMERGENT",
        evidence: [
          `Atrial rate: ${atrialRate} bpm (P waves)`,
          `Ventricular rate: ${ventricularRate} bpm (QRS)`,
          "No consistent P-QRS relationship",
          "P waves march independently of QRS"
        ],
        action: "IMMEDIATE CARDIOLOGY CONSULTATION"
      };
    }

    return this.checkPartialBlocks(pWaves, qrsComplexes);
  }

  private calculateRate(complexes: any[]): number {
    if (complexes.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < complexes.length; i++) {
      intervals.push(complexes[i].time - complexes[i-1].time);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return Math.round(60000 / avgInterval);
  }

  private checkAVDissociation(pWaves: any[], qrsComplexes: any[]): boolean {
    // Check if P waves and QRS have consistent relationship
    let consistentRelationships = 0;
    
    for (let i = 0; i < Math.min(pWaves.length, qrsComplexes.length); i++) {
      const pTime = pWaves[i].time;
      const qrsTime = qrsComplexes[i].time;
      const prInterval = qrsTime - pTime;
      
      // Check if PR interval is consistent and physiological
      if (prInterval > 120 && prInterval < 300) {
        consistentRelationships++;
      }
    }
    
    // If less than 70% have consistent relationships = dissociation
    return consistentRelationships / Math.min(pWaves.length, qrsComplexes.length) < 0.7;
  }

  private assessIndependentRhythms(pWaves: any[], qrsComplexes: any[]): boolean {
    // Check if P waves and QRS complexes have independent regular rhythms
    const pRegularity = this.assessRhythmRegularity(pWaves);
    const qrsRegularity = this.assessRhythmRegularity(qrsComplexes);
    
    return pRegularity && qrsRegularity;
  }

  private assessRhythmRegularity(complexes: any[]): boolean {
    if (complexes.length < 3) return false;
    
    const intervals = [];
    for (let i = 1; i < complexes.length; i++) {
      intervals.push(complexes[i].time - complexes[i-1].time);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    return variance < (avgInterval * 0.15); // Allow 15% variance for "regular"
  }

  private checkPartialBlocks(pWaves: any[], qrsComplexes: any[]): BlockDetection {
    const atrialRate = this.calculateRate(pWaves);
    const ventricularRate = this.calculateRate(qrsComplexes);
    const rateDifference = Math.abs(atrialRate - ventricularRate);
    
    if (rateDifference > 10) {
      return {
        type: "SECOND_DEGREE_BLOCK",
        confidence: 0.8,
        urgency: "URGENT",
        evidence: [`Rate difference: ${rateDifference} bpm suggests AV block`],
        action: "CARDIOLOGY EVALUATION RECOMMENDED"
      };
    }
    
    return {
      type: "NO_BLOCK",
      confidence: 0.9,
      urgency: "ROUTINE",
      evidence: ["Normal AV conduction pattern"],
      action: "ROUTINE FOLLOW-UP"
    };
  }
}

export class MorphologyValidator {
  
  validateQRSvsTWave(components: any[]): { isValid: boolean; issues: string[]; corrections: any[]; confidence: number } {
    const issues = [];
    const corrections = [];
    
    for (const component of components) {
      if (component.type === "QRS") {
        // QRS validation criteria
        if (!this.hasSharpOnset(component)) {
          issues.push(`Component at ${component.time}ms may be T wave, not QRS`);
          corrections.push({
            component: component,
            suggestion: "Reclassify as T wave",
            reason: "Gradual onset, not sharp QRS pattern"
          });
        }
        
        if (this.isRoundedMorphology(component)) {
          issues.push(`Component at ${component.time}ms has rounded morphology typical of T wave`);
        }
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues,
      corrections: corrections,
      confidence: this.calculateMorphologyConfidence(components)
    };
  }

  private hasSharpOnset(component: any): boolean {
    // QRS should have rapid deflection from baseline
    return (component.onset_slope || 0.6) > 0.5 && (component.duration || 90) < 120;
  }

  private isRoundedMorphology(component: any): boolean {
    // T waves are typically rounded and gradual
    return (component.peak_sharpness || 0.4) < 0.3 && (component.duration || 160) > 150;
  }

  private calculateMorphologyConfidence(components: any[]): number {
    if (components.length === 0) return 0.5;
    
    let totalConfidence = 0;
    for (const component of components) {
      if (component.type === "QRS" && this.hasSharpOnset(component)) {
        totalConfidence += 0.9;
      } else if (component.type === "T" && this.isRoundedMorphology(component)) {
        totalConfidence += 0.9;
      } else {
        totalConfidence += 0.6;
      }
    }
    
    return totalConfidence / components.length;
  }
}