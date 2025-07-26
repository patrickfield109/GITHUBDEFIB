/**
 * EKG Image Analysis and Labeling Service
 * Processes EKG images and generates labeled diagrams with clinical interpretations
 */

import { createCanvas, loadImage, CanvasRenderingContext2D } from 'canvas';

export interface EKGComponent {
  name: string;
  description: string;
  coordinates: { x: number; y: number };
  measurements?: string;
  normal: boolean;
}

export interface EKGAnalysis {
  components: EKGComponent[];
  findings: {
    abnormalities: string[];
    interpretation: string;
    severity: 'normal' | 'abnormal' | 'critical';
    recommendations: string[];
  };
  measurements: {
    heartRate: number;
    prInterval: number;
    qrsWidth: number;
    qtInterval: number;
  };
}

export class EKGLabeler {
  /**
   * Generate labeled EKG image with component annotations
   */
  async generateLabeledImage(originalImageBase64: string, analysisData: EKGAnalysis): Promise<string> {
    try {
      // Create canvas and load original image
      const canvas = createCanvas(1200, 800);
      const ctx = canvas.getContext('2d');
      
      // Load the original EKG image
      const imageBuffer = Buffer.from(originalImageBase64.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      const image = await loadImage(imageBuffer);
      
      // Scale image to fit canvas while maintaining aspect ratio
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;
      const offsetX = (canvas.width - scaledWidth) / 2;
      const offsetY = (canvas.height - scaledHeight) / 2;
      
      // Draw original image
      ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);
      
      // Add component labels
      this.addComponentLabels(ctx, analysisData.components, offsetX, offsetY, scale);
      
      // Add legend
      this.addLegend(ctx, analysisData);
      
      // Return labeled image as base64
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating labeled EKG image:', error);
      throw new Error('Failed to generate labeled EKG image');
    }
  }

  /**
   * Add component labels to the EKG image
   */
  private addComponentLabels(
    ctx: CanvasRenderingContext2D, 
    components: EKGComponent[], 
    offsetX: number, 
    offsetY: number, 
    scale: number
  ): void {
    ctx.font = '14px Arial';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    components.forEach((component, index) => {
      const x = offsetX + (component.coordinates.x * scale);
      const y = offsetY + (component.coordinates.y * scale);
      
      // Choose color based on component type and normality
      const color = component.normal ? '#22c55e' : '#ef4444'; // green for normal, red for abnormal
      ctx.fillStyle = color;
      
      // Draw arrow pointing to component
      this.drawArrow(ctx, x, y, x + 50, y - 30);
      
      // Draw label box
      const label = `${component.name}${component.measurements ? `: ${component.measurements}` : ''}`;
      const labelWidth = ctx.measureText(label).width + 10;
      const labelHeight = 25;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(x + 55, y - 45, labelWidth, labelHeight);
      
      ctx.strokeStyle = color;
      ctx.strokeRect(x + 55, y - 45, labelWidth, labelHeight);
      
      // Draw label text
      ctx.fillStyle = '#000000';
      ctx.fillText(label, x + 60, y - 25);
      
      // Add component number
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText((index + 1).toString(), x, y + 4);
      ctx.textAlign = 'left';
      ctx.font = '14px Arial';
    });
  }

  /**
   * Draw an arrow from start to end point
   */
  private drawArrow(ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number): void {
    const headLength = 10;
    const angle = Math.atan2(endY - startY, endX - startX);
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }

  /**
   * Add legend with analysis summary
   */
  private addLegend(ctx: CanvasRenderingContext2D, analysis: EKGAnalysis): void {
    const legendX = 20;
    const legendY = 20;
    const legendWidth = 350;
    const legendHeight = 200;
    
    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);
    
    // Title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('EKG Analysis Summary', legendX + 10, legendY + 25);
    
    // Measurements
    ctx.font = '12px Arial';
    let yPos = legendY + 50;
    ctx.fillText(`Heart Rate: ${analysis.measurements.heartRate} bpm`, legendX + 10, yPos);
    yPos += 20;
    ctx.fillText(`PR Interval: ${analysis.measurements.prInterval} ms`, legendX + 10, yPos);
    yPos += 20;
    ctx.fillText(`QRS Width: ${analysis.measurements.qrsWidth} ms`, legendX + 10, yPos);
    yPos += 20;
    ctx.fillText(`QT Interval: ${analysis.measurements.qtInterval} ms`, legendX + 10, yPos);
    
    // Severity indicator
    yPos += 30;
    ctx.font = 'bold 14px Arial';
    const severityColor = analysis.findings.severity === 'normal' ? '#22c55e' : 
                         analysis.findings.severity === 'abnormal' ? '#f59e0b' : '#ef4444';
    ctx.fillStyle = severityColor;
    ctx.fillText(`Status: ${analysis.findings.severity.toUpperCase()}`, legendX + 10, yPos);
    
    // Color legend
    yPos += 25;
    ctx.font = '10px Arial';
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(legendX + 10, yPos - 8, 12, 12);
    ctx.fillStyle = '#000000';
    ctx.fillText('Normal', legendX + 30, yPos);
    
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(legendX + 80, yPos - 8, 12, 12);
    ctx.fillStyle = '#000000';
    ctx.fillText('Abnormal', legendX + 100, yPos);
  }

  /**
   * Generate comprehensive clinical interpretation
   */
  generateInterpretation(analysis: EKGAnalysis): string {
    const { components, findings, measurements } = analysis;
    
    let interpretation = `🏥 **EKG Analysis Complete**\n\n`;
    
    // Measurements section
    interpretation += `📊 **Measurements:**\n`;
    interpretation += `• Heart Rate: ${measurements.heartRate} bpm ${this.interpretHeartRate(measurements.heartRate)}\n`;
    interpretation += `• PR Interval: ${measurements.prInterval} ms ${this.interpretPRInterval(measurements.prInterval)}\n`;
    interpretation += `• QRS Width: ${measurements.qrsWidth} ms ${this.interpretQRSWidth(measurements.qrsWidth)}\n`;
    interpretation += `• QT Interval: ${measurements.qtInterval} ms ${this.interpretQTInterval(measurements.qtInterval)}\n\n`;
    
    // Components section
    interpretation += `🔍 **Components Identified:**\n`;
    components.forEach(component => {
      const status = component.normal ? '✓' : '⚠️';
      interpretation += `${status} ${component.name}: ${component.description}`;
      if (component.measurements) {
        interpretation += ` (${component.measurements})`;
      }
      interpretation += '\n';
    });
    
    // Findings section
    if (findings.abnormalities.length > 0) {
      interpretation += `\n⚠️ **Abnormal Findings:**\n`;
      findings.abnormalities.forEach(abnormality => {
        interpretation += `• ${abnormality}\n`;
      });
    }
    
    // Clinical interpretation
    interpretation += `\n📋 **Clinical Interpretation:**\n${findings.interpretation}\n`;
    
    // Recommendations
    if (findings.recommendations.length > 0) {
      interpretation += `\n💡 **Recommendations:**\n`;
      findings.recommendations.forEach(rec => {
        interpretation += `• ${rec}\n`;
      });
    }
    
    // Disclaimer
    interpretation += `\n*⚠️ Important: This is AI-assisted analysis for educational purposes. Always consult with qualified medical professionals for clinical decisions.*`;
    
    return interpretation;
  }

  /**
   * Helper methods for interpreting measurements
   */
  private interpretHeartRate(hr: number): string {
    if (hr < 60) return '(Bradycardia)';
    if (hr > 100) return '(Tachycardia)';
    return '(Normal)';
  }

  private interpretPRInterval(pr: number): string {
    if (pr < 120) return '(Short)';
    if (pr > 200) return '(Prolonged - possible AV block)';
    return '(Normal)';
  }

  private interpretQRSWidth(qrs: number): string {
    if (qrs > 120) return '(Wide - possible bundle branch block)';
    return '(Normal)';
  }

  private interpretQTInterval(qt: number): string {
    if (qt > 440) return '(Prolonged - risk of arrhythmia)';
    if (qt < 340) return '(Short)';
    return '(Normal)';
  }
}

export const ekgLabeler = new EKGLabeler();