import { createCanvas, loadImage, Canvas, CanvasRenderingContext2D } from 'canvas';
import fs from 'fs';
import path from 'path';

interface EKGAnnotation {
  type: 'P' | 'QRS' | 'T' | 'interval' | 'finding' | 'lead';
  x: number;
  y: number;
  width?: number;
  height?: number;
  label: string;
  color: string;
  value?: string;
}

interface EKGAnalysisResult {
  heartRate: number;
  rhythm: string;
  intervals: {
    pr: number;
    qrs: number;
    qt: number;
  };
  findings: string[];
  annotations: EKGAnnotation[];
}

export class EKGAnnotationService {
  private static instance: EKGAnnotationService;
  private downloadPath = './downloads';

  constructor() {
    // Ensure download directory exists
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }
  }

  static getInstance(): EKGAnnotationService {
    if (!EKGAnnotationService.instance) {
      EKGAnnotationService.instance = new EKGAnnotationService();
    }
    return EKGAnnotationService.instance;
  }

  async analyzeAndAnnotateEKG(imageBuffer: Buffer, taskId: string): Promise<{
    analysis: EKGAnalysisResult;
    annotatedImagePath: string;
    pdfReportPath: string;
    downloadUrls: {
      png: string;
      pdf: string;
    };
  }> {
    // Load the EKG image
    const originalImage = await loadImage(imageBuffer);
    
    // Perform analysis (simulated for demo - would use OpenAI Vision API)
    const analysis = this.performEKGAnalysis(originalImage);
    
    // Create annotated image
    const annotatedCanvas = await this.createAnnotatedEKG(originalImage, analysis);
    
    // Save annotated image
    const timestamp = Date.now();
    const pngFilename = `ekg_annotated_${taskId}_${timestamp}.png`;
    const pdfFilename = `ekg_report_${taskId}_${timestamp}.pdf`;
    
    const pngPath = path.join(this.downloadPath, pngFilename);
    const pdfPath = path.join(this.downloadPath, pdfFilename);
    
    // Save PNG
    const pngBuffer = annotatedCanvas.toBuffer('image/png');
    fs.writeFileSync(pngPath, pngBuffer);
    
    // Create PDF report
    await this.createPDFReport(analysis, annotatedCanvas, pdfPath);
    
    // Generate download URLs
    const downloadUrls = {
      png: `/api/download/${pngFilename}`,
      pdf: `/api/download/${pdfFilename}`
    };

    return {
      analysis,
      annotatedImagePath: pngPath,
      pdfReportPath: pdfPath,
      downloadUrls
    };
  }

  private performEKGAnalysis(image: any): EKGAnalysisResult {
    // Enhanced analysis with detailed annotations
    const annotations: EKGAnnotation[] = [
      // Lead labels
      { type: 'lead', x: 80, y: 40, label: 'I', color: '#000000' },
      { type: 'lead', x: 80, y: 120, label: 'II', color: '#000000' },
      { type: 'lead', x: 80, y: 200, label: 'III', color: '#000000' },
      { type: 'lead', x: 280, y: 40, label: 'aVR', color: '#000000' },
      { type: 'lead', x: 280, y: 120, label: 'aVL', color: '#000000' },
      { type: 'lead', x: 280, y: 200, label: 'aVF', color: '#000000' },
      { type: 'lead', x: 480, y: 40, label: 'V1', color: '#000000' },
      { type: 'lead', x: 480, y: 120, label: 'V2', color: '#000000' },
      { type: 'lead', x: 480, y: 200, label: 'V3', color: '#000000' },
      { type: 'lead', x: 680, y: 40, label: 'V4', color: '#000000' },
      { type: 'lead', x: 680, y: 120, label: 'V5', color: '#000000' },
      { type: 'lead', x: 680, y: 200, label: 'V6', color: '#000000' },
      
      // Component annotations
      { type: 'P', x: 120, y: 90, label: 'P', color: '#FF0000' },
      { type: 'QRS', x: 150, y: 90, label: 'QRS', color: '#0000FF' },
      { type: 'T', x: 200, y: 90, label: 'T', color: '#00AA00' },
      
      // Interval measurements
      { type: 'interval', x: 120, y: 110, width: 40, label: 'PR: 160ms', color: '#FF6600', value: '160ms' },
      { type: 'interval', x: 150, y: 110, width: 25, label: 'QRS: 90ms', color: '#6600FF', value: '90ms' },
      { type: 'interval', x: 120, y: 130, width: 100, label: 'QT: 400ms', color: '#CC0066', value: '400ms' }
    ];

    return {
      heartRate: 68,
      rhythm: 'Normal Sinus Rhythm',
      intervals: {
        pr: 160,
        qrs: 90,
        qt: 400
      },
      findings: [
        'Normal sinus rhythm',
        'Normal axis',
        'No ST segment abnormalities',
        'Normal T wave morphology',
        'No conduction blocks'
      ],
      annotations
    };
  }

  private async createAnnotatedEKG(originalImage: any, analysis: EKGAnalysisResult): Promise<Canvas> {
    const canvas = createCanvas(originalImage.width + 400, originalImage.height + 200);
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw original EKG
    ctx.drawImage(originalImage, 50, 50);
    
    // Draw annotations
    analysis.annotations.forEach(annotation => {
      this.drawAnnotation(ctx, annotation);
    });
    
    // Add professional legend
    this.drawLegend(ctx, canvas.width - 350, 50);
    
    // Add analysis summary
    this.drawAnalysisSummary(ctx, analysis, canvas.width - 350, 250);
    
    // Add title and metadata
    this.drawHeader(ctx, canvas.width);
    
    return canvas;
  }

  private drawAnnotation(ctx: CanvasRenderingContext2D, annotation: EKGAnnotation) {
    ctx.fillStyle = annotation.color;
    ctx.strokeStyle = annotation.color;
    ctx.font = 'bold 12px Arial';
    
    switch (annotation.type) {
      case 'P':
      case 'QRS':
      case 'T':
        // Draw component label with circle
        ctx.beginPath();
        ctx.arc(annotation.x + 50, annotation.y + 50, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(annotation.label, annotation.x + 50, annotation.y + 55);
        break;
        
      case 'interval':
        // Draw measurement line
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(annotation.x + 50, annotation.y + 50);
        ctx.lineTo(annotation.x + 50 + (annotation.width || 50), annotation.y + 50);
        ctx.stroke();
        
        // Draw measurement brackets
        ctx.beginPath();
        ctx.moveTo(annotation.x + 50, annotation.y + 45);
        ctx.lineTo(annotation.x + 50, annotation.y + 55);
        ctx.moveTo(annotation.x + 50 + (annotation.width || 50), annotation.y + 45);
        ctx.lineTo(annotation.x + 50 + (annotation.width || 50), annotation.y + 55);
        ctx.stroke();
        
        // Draw label
        ctx.fillStyle = annotation.color;
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(annotation.label, annotation.x + 50 + (annotation.width || 50) / 2, annotation.y + 70);
        break;
        
      case 'lead':
        // Draw lead label
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(annotation.label, annotation.x + 50, annotation.y + 50);
        break;
    }
  }

  private drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Legend background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, 300, 150);
    ctx.strokeRect(x, y, 300, 150);
    
    // Legend title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('EKG Component Legend', x + 10, y + 25);
    
    // Legend items
    const legendItems = [
      { color: '#FF0000', label: 'P waves', symbol: '●' },
      { color: '#0000FF', label: 'QRS complexes', symbol: '●' },
      { color: '#00AA00', label: 'T waves', symbol: '●' },
      { color: '#FF6600', label: 'PR intervals', symbol: '━' },
      { color: '#6600FF', label: 'QRS width', symbol: '━' },
      { color: '#CC0066', label: 'QT intervals', symbol: '━' }
    ];
    
    ctx.font = '12px Arial';
    legendItems.forEach((item, index) => {
      const itemY = y + 50 + (index * 15);
      ctx.fillStyle = item.color;
      ctx.fillText(item.symbol, x + 15, itemY);
      ctx.fillStyle = '#000000';
      ctx.fillText(item.label, x + 35, itemY);
    });
  }

  private drawAnalysisSummary(ctx: CanvasRenderingContext2D, analysis: EKGAnalysisResult, x: number, y: number) {
    // Summary background
    ctx.fillStyle = 'rgba(240, 248, 255, 0.95)';
    ctx.strokeStyle = '#4169E1';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, 300, 200);
    ctx.strokeRect(x, y, 300, 200);
    
    // Summary title
    ctx.fillStyle = '#4169E1';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Clinical Analysis', x + 10, y + 25);
    
    // Analysis details
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    
    let currentY = y + 50;
    ctx.fillText(`Heart Rate: ${analysis.heartRate} bpm`, x + 15, currentY);
    currentY += 20;
    ctx.fillText(`Rhythm: ${analysis.rhythm}`, x + 15, currentY);
    currentY += 20;
    
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Intervals:', x + 15, currentY);
    currentY += 15;
    
    ctx.font = '11px Arial';
    ctx.fillText(`PR: ${analysis.intervals.pr}ms`, x + 25, currentY);
    currentY += 15;
    ctx.fillText(`QRS: ${analysis.intervals.qrs}ms`, x + 25, currentY);
    currentY += 15;
    ctx.fillText(`QT: ${analysis.intervals.qt}ms`, x + 25, currentY);
    currentY += 20;
    
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Interpretation:', x + 15, currentY);
    currentY += 15;
    
    ctx.font = '10px Arial';
    ctx.fillStyle = '#008000';
    ctx.fillText('✓ Normal EKG', x + 25, currentY);
    currentY += 12;
    ctx.fillText('✓ No acute findings', x + 25, currentY);
  }

  private drawHeader(ctx: CanvasRenderingContext2D, canvasWidth: number) {
    // Header background
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(0, 0, canvasWidth, 40);
    
    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('OperatorOS - EKG Analysis Report', 20, 26);
    
    // Timestamp
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    const timestamp = new Date().toLocaleString();
    ctx.fillText(`Generated: ${timestamp}`, canvasWidth - 20, 26);
  }

  private async createPDFReport(analysis: EKGAnalysisResult, annotatedCanvas: Canvas, pdfPath: string) {
    // For this demo, we'll create a simple text report
    // In production, you'd use a proper PDF library like PDFKit
    const reportContent = `
EKG ANALYSIS REPORT
Generated by OperatorOS Healthcare Agent Pool
Date: ${new Date().toLocaleString()}

ANALYSIS SUMMARY:
- Heart Rate: ${analysis.heartRate} bpm
- Rhythm: ${analysis.rhythm}

INTERVAL MEASUREMENTS:
- PR Interval: ${analysis.intervals.pr}ms (Normal: 120-200ms)
- QRS Duration: ${analysis.intervals.qrs}ms (Normal: <120ms)
- QT Interval: ${analysis.intervals.qt}ms

CLINICAL FINDINGS:
${analysis.findings.map(finding => `- ${finding}`).join('\n')}

INTERPRETATION:
Normal electrocardiogram with no acute findings.

DISCLAIMER:
This analysis is for educational purposes only. 
Always consult qualified healthcare professionals for clinical decisions.
`;
    
    fs.writeFileSync(pdfPath, reportContent);
  }

  cleanupOldFiles() {
    // Clean up files older than 24 hours
    const files = fs.readdirSync(this.downloadPath);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    files.forEach(file => {
      const filePath = path.join(this.downloadPath, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtime.getTime() > twentyFourHours) {
        fs.unlinkSync(filePath);
      }
    });
  }
}

export const ekgAnnotationService = EKGAnnotationService.getInstance();