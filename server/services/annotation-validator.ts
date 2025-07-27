/**
 * Annotation Validator for Expert-Level EKG Analysis
 * Ensures professional medical-grade annotation standards
 */

interface AnnotationQuality {
  pixelAccuracy: number;
  labelClarity: number;
  measurementPrecision: number;
  medicalStandards: number;
  overallScore: number;
}

interface AnnotationStandards {
  minimumPixelAccuracy: number;
  requiredLabelElements: string[];
  measurementTolerances: {
    timing_ms: number;
    amplitude_mv: number;
    coordinate_px: number;
  };
  colorCoding: {
    pWaves: string;
    qrsComplexes: string;
    tWaves: string;
    intervals: string;
    measurements: string;
  };
}

export class AnnotationValidator {
  private standards: AnnotationStandards = {
    minimumPixelAccuracy: 2, // ±2 pixel tolerance
    requiredLabelElements: [
      'component_type',
      'amplitude',
      'duration',
      'coordinates',
      'confidence'
    ],
    measurementTolerances: {
      timing_ms: 5,
      amplitude_mv: 0.02,
      coordinate_px: 2
    },
    colorCoding: {
      pWaves: '#FF0000',      // Red
      qrsComplexes: '#0000FF', // Blue  
      tWaves: '#00AA00',      // Green
      intervals: '#FF8800',    // Orange
      measurements: '#800080'  // Purple
    }
  };

  /**
   * Validates annotation quality against medical standards
   */
  validateAnnotation(annotationData: any, originalImage: Buffer): AnnotationQuality {
    const pixelAccuracy = this.assessPixelAccuracy(annotationData);
    const labelClarity = this.assessLabelClarity(annotationData);
    const measurementPrecision = this.assessMeasurementPrecision(annotationData);
    const medicalStandards = this.assessMedicalStandards(annotationData);
    
    const overallScore = (pixelAccuracy + labelClarity + measurementPrecision + medicalStandards) / 4;
    
    return {
      pixelAccuracy,
      labelClarity,
      measurementPrecision,
      medicalStandards,
      overallScore
    };
  }

  /**
   * Assesses pixel-level accuracy of component identification
   */
  private assessPixelAccuracy(annotationData: any): number {
    let accuracy = 1.0;
    
    // Check component coordinate precision
    const components = this.extractComponents(annotationData);
    components.forEach(component => {
      if (!component.coordinates || !this.isWithinTolerance(component.coordinates)) {
        accuracy *= 0.9;
      }
    });
    
    return Math.max(0, accuracy);
  }

  /**
   * Assesses clarity and completeness of labels
   */
  private assessLabelClarity(annotationData: any): number {
    let clarity = 1.0;
    
    // Check required label elements
    const labels = this.extractLabels(annotationData);
    labels.forEach(label => {
      this.standards.requiredLabelElements.forEach(element => {
        if (!label[element]) {
          clarity *= 0.95;
        }
      });
    });
    
    // Check text readability
    if (!this.hasReadableText(annotationData)) {
      clarity *= 0.8;
    }
    
    return Math.max(0, clarity);
  }

  /**
   * Assesses precision of measurements
   */
  private assessMeasurementPrecision(annotationData: any): number {
    let precision = 1.0;
    
    // Check measurement accuracy
    const measurements = this.extractMeasurements(annotationData);
    measurements.forEach(measurement => {
      if (!this.isValidMeasurement(measurement)) {
        precision *= 0.9;
      }
    });
    
    // Check interval calculations
    if (!this.hasAccurateIntervals(annotationData)) {
      precision *= 0.85;
    }
    
    return Math.max(0, precision);
  }

  /**
   * Assesses compliance with medical annotation standards
   */
  private assessMedicalStandards(annotationData: any): number {
    let standards = 1.0;
    
    // Check color coding compliance
    if (!this.hasCorrectColorCoding(annotationData)) {
      standards *= 0.9;
    }
    
    // Check annotation placement
    if (!this.hasProperPlacement(annotationData)) {
      standards *= 0.85;
    }
    
    // Check measurement units
    if (!this.hasCorrectUnits(annotationData)) {
      standards *= 0.9;
    }
    
    // Check legend and documentation
    if (!this.hasCompleteLegend(annotationData)) {
      standards *= 0.8;
    }
    
    return Math.max(0, standards);
  }

  /**
   * Generates detailed validation report
   */
  generateValidationReport(quality: AnnotationQuality): any {
    const grade = this.calculateGrade(quality.overallScore);
    
    return {
      grade: grade,
      overallScore: quality.overallScore,
      breakdown: {
        pixelAccuracy: {
          score: quality.pixelAccuracy,
          status: quality.pixelAccuracy >= 0.9 ? 'excellent' : quality.pixelAccuracy >= 0.8 ? 'good' : 'needs_improvement'
        },
        labelClarity: {
          score: quality.labelClarity,
          status: quality.labelClarity >= 0.9 ? 'excellent' : quality.labelClarity >= 0.8 ? 'good' : 'needs_improvement'
        },
        measurementPrecision: {
          score: quality.measurementPrecision,
          status: quality.measurementPrecision >= 0.9 ? 'excellent' : quality.measurementPrecision >= 0.8 ? 'good' : 'needs_improvement'
        },
        medicalStandards: {
          score: quality.medicalStandards,
          status: quality.medicalStandards >= 0.9 ? 'excellent' : quality.medicalStandards >= 0.8 ? 'good' : 'needs_improvement'
        }
      },
      recommendations: this.generateRecommendations(quality),
      certification: quality.overallScore >= 0.9 ? 'medical_grade' : quality.overallScore >= 0.8 ? 'clinical_reference' : 'educational_use'
    };
  }

  private calculateGrade(score: number): string {
    if (score >= 0.95) return 'A+';
    if (score >= 0.9) return 'A';
    if (score >= 0.85) return 'B+';
    if (score >= 0.8) return 'B';
    if (score >= 0.75) return 'C+';
    if (score >= 0.7) return 'C';
    return 'F';
  }

  private generateRecommendations(quality: AnnotationQuality): string[] {
    const recommendations = [];
    
    if (quality.pixelAccuracy < 0.9) {
      recommendations.push('Improve component coordinate precision to ±2 pixel accuracy');
    }
    
    if (quality.labelClarity < 0.9) {
      recommendations.push('Enhance label completeness and readability');
    }
    
    if (quality.measurementPrecision < 0.9) {
      recommendations.push('Refine measurement calculations and interval analysis');
    }
    
    if (quality.medicalStandards < 0.9) {
      recommendations.push('Ensure compliance with medical annotation standards');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Annotation meets excellent professional standards');
    }
    
    return recommendations;
  }

  // Helper methods for validation checks
  private extractComponents(data: any): any[] {
    return data.components || [];
  }

  private extractLabels(data: any): any[] {
    return data.labels || [];
  }

  private extractMeasurements(data: any): any[] {
    return data.measurements || [];
  }

  private isWithinTolerance(coordinates: any): boolean {
    return coordinates && typeof coordinates.x === 'number' && typeof coordinates.y === 'number';
  }

  private hasReadableText(data: any): boolean {
    return data.textQuality !== undefined && data.textQuality > 0.8;
  }

  private isValidMeasurement(measurement: any): boolean {
    return measurement.value !== undefined && measurement.unit !== undefined;
  }

  private hasAccurateIntervals(data: any): boolean {
    return data.intervals && Object.keys(data.intervals).length > 0;
  }

  private hasCorrectColorCoding(data: any): boolean {
    return data.colorCoding !== undefined;
  }

  private hasProperPlacement(data: any): boolean {
    return data.placement !== undefined;
  }

  private hasCorrectUnits(data: any): boolean {
    return data.units !== undefined;
  }

  private hasCompleteLegend(data: any): boolean {
    return data.legend !== undefined;
  }
}

export const annotationValidator = new AnnotationValidator();