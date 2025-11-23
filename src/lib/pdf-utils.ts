import jsPDF from 'jspdf';

export interface PDFBrandingConfig {
  companyName: string;
  primaryColor: [number, number, number];
  accentColor: [number, number, number];
  website?: string;
  logoBase64?: string;
  watermarkText?: string;
}

export const DEFAULT_BRANDING: PDFBrandingConfig = {
  companyName: 'Transformation Signal Intelligence',
  primaryColor: [59, 130, 246], // Blue
  accentColor: [16, 185, 129], // Green
  website: 'www.transformationsignal.ai',
  watermarkText: 'TSI INTELLIGENCE'
};

export class PDFReportBuilder {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 14;
  private yPosition: number = 20;
  private branding: PDFBrandingConfig;
  private pageNumber: number = 1;

  constructor(branding: PDFBrandingConfig = DEFAULT_BRANDING) {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.width;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.branding = branding;
    this.addWatermark();
  }

  addBrandedHeader(title: string, subtitle?: string): this {
    // Brand bar at top
    this.doc.setFillColor(...this.branding.primaryColor);
    this.doc.rect(0, 0, this.pageWidth, 12, 'F');
    
    // Add logo if provided
    if (this.branding.logoBase64) {
      try {
        this.doc.addImage(this.branding.logoBase64, 'PNG', this.margin, 2, 8, 8);
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(255, 255, 255);
        this.doc.text(this.branding.companyName, this.margin + 10, 8);
      } catch (e) {
        console.error('Failed to add logo:', e);
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(255, 255, 255);
        this.doc.text(this.branding.companyName, this.margin, 8);
      }
    } else {
      // Company name in white on brand bar
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(this.branding.companyName, this.margin, 8);
    }
    
    // Website on right side
    if (this.branding.website) {
      const websiteWidth = this.doc.getTextWidth(this.branding.website);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(this.branding.website, this.pageWidth - this.margin - websiteWidth, 8);
    }
    
    this.yPosition = 25;
    
    // Main title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(title, this.margin, this.yPosition);
    this.yPosition += 8;
    
    // Subtitle if provided
    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(subtitle, this.margin, this.yPosition);
      this.yPosition += 8;
    }
    
    // Separator line
    this.doc.setDrawColor(...this.branding.accentColor);
    this.doc.setLineWidth(0.8);
    this.doc.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    this.yPosition += 10;
    
    return this;
  }

  addMetadata(data: Record<string, string>): this {
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(80, 80, 80);
    
    Object.entries(data).forEach(([key, value]) => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${key}: `, this.margin, this.yPosition);
      const keyWidth = this.doc.getTextWidth(`${key}: `);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(value, this.margin + keyWidth, this.yPosition);
      this.yPosition += 5;
    });
    
    this.yPosition += 5;
    return this;
  }

  addSectionHeader(text: string, level: 1 | 2 | 3 = 1): this {
    if (this.yPosition > this.pageHeight - 30) {
      this.addPage();
    }
    
    const sizes = { 1: 16, 2: 14, 3: 12 };
    const spacing = { 1: 10, 2: 8, 3: 6 };
    
    this.doc.setFontSize(sizes[level]);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(text, this.margin, this.yPosition);
    this.yPosition += spacing[level];
    
    return this;
  }

  addParagraph(text: string, options: { fontSize?: number; color?: [number, number, number] } = {}): this {
    const fontSize = options.fontSize || 10;
    const color = options.color || [0, 0, 0];
    
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...color);
    
    const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin);
    
    for (const line of lines) {
      if (this.yPosition > this.pageHeight - 20) {
        this.addPage();
      }
      this.doc.text(line, this.margin, this.yPosition);
      this.yPosition += fontSize * 0.5;
    }
    
    this.yPosition += 3;
    return this;
  }

  addBulletList(items: string[]): this {
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    items.forEach(item => {
      if (this.yPosition > this.pageHeight - 20) {
        this.addPage();
      }
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('•', this.margin + 2, this.yPosition);
      this.doc.setFont('helvetica', 'normal');
      
      const itemLines = this.doc.splitTextToSize(item, this.pageWidth - 2 * this.margin - 8);
      itemLines.forEach((line: string, idx: number) => {
        if (this.yPosition > this.pageHeight - 20) {
          this.addPage();
        }
        this.doc.text(line, this.margin + 8, this.yPosition);
        if (idx < itemLines.length - 1) this.yPosition += 5;
      });
      
      this.yPosition += 6;
    });
    
    return this;
  }

  addPage(): this {
    this.doc.addPage();
    this.pageNumber++;
    this.yPosition = 20;
    this.addWatermark();
    this.addPageFooter();
    return this;
  }

  private addWatermark(): void {
    if (!this.branding.watermarkText) return;
    
    const centerX = this.pageWidth / 2;
    const centerY = this.pageHeight / 2;
    
    this.doc.setTextColor(200, 200, 200);
    this.doc.setFontSize(60);
    this.doc.setFont('helvetica', 'bold');
    
    // Rotate and center the watermark
    this.doc.text(this.branding.watermarkText, centerX, centerY, {
      angle: 45,
      align: 'center'
    });
  }

  private addPageFooter(): void {
    const footerY = this.pageHeight - 10;
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(150, 150, 150);
    
    // Company name on left
    this.doc.text(this.branding.companyName, this.margin, footerY);
    
    // Page number on right
    const pageText = `Page ${this.pageNumber}`;
    const pageWidth = this.doc.getTextWidth(pageText);
    this.doc.text(pageText, this.pageWidth - this.margin - pageWidth, footerY);
  }

  getCurrentY(): number {
    return this.yPosition;
  }

  setY(y: number): this {
    this.yPosition = y;
    return this;
  }

  getDoc(): jsPDF {
    return this.doc;
  }

  save(filename: string): void {
    this.addPageFooter();
    this.doc.save(filename);
  }
}

// Helper to parse markdown-like formatting from AI responses
export function parseMarkdownSections(text: string): Array<{ type: 'header' | 'paragraph' | 'list', content: string, level?: number }> {
  const sections: Array<{ type: 'header' | 'paragraph' | 'list', content: string, level?: number }> = [];
  const lines = text.split('\n');
  let currentParagraph = '';
  let currentList: string[] = [];
  
  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      sections.push({ type: 'paragraph', content: currentParagraph.trim() });
      currentParagraph = '';
    }
  };
  
  const flushList = () => {
    if (currentList.length > 0) {
      sections.push({ type: 'list', content: currentList.join('|||') });
      currentList = [];
    }
  };
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Header detection
    if (trimmed.startsWith('###')) {
      flushParagraph();
      flushList();
      sections.push({ type: 'header', content: trimmed.replace(/^###\s*/, ''), level: 3 });
    } else if (trimmed.startsWith('##')) {
      flushParagraph();
      flushList();
      sections.push({ type: 'header', content: trimmed.replace(/^##\s*/, ''), level: 2 });
    } else if (trimmed.startsWith('#')) {
      flushParagraph();
      flushList();
      sections.push({ type: 'header', content: trimmed.replace(/^#\s*/, ''), level: 1 });
    }
    // List detection
    else if (trimmed.match(/^[-*•]\s/)) {
      flushParagraph();
      currentList.push(trimmed.replace(/^[-*•]\s/, ''));
    }
    // Numbered list
    else if (trimmed.match(/^\d+\.\s/)) {
      flushParagraph();
      currentList.push(trimmed.replace(/^\d+\.\s/, ''));
    }
    // Empty line
    else if (trimmed === '') {
      flushParagraph();
      flushList();
    }
    // Regular paragraph
    else if (trimmed) {
      flushList();
      currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
    }
  });
  
  flushParagraph();
  flushList();
  
  return sections;
}
