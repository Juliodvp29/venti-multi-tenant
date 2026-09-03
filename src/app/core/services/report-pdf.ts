import { Injectable } from '@angular/core';
import { PdfReportOptions } from '@core/types/table';

type PdfColor = [number, number, number];

@Injectable({
  providedIn: 'root',
})
export class ReportPdfService {
  async generate(options: PdfReportOptions): Promise<void> {
    const [{ default: JsPdf }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const document = new JsPdf({
      orientation: options.orientation ?? 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const primaryColor = this.parseColor(options.primaryColor, [14, 116, 144]);
    const secondaryColor = this.parseColor(options.secondaryColor, [71, 85, 105]);
    const pageWidth = document.internal.pageSize.getWidth();
    const margin = 16;

    document.setProperties({
      title: options.title,
      author: options.businessName ?? 'Venti',
      subject: 'Reporte generado desde Venti',
      creator: 'Venti',
    });

    let contentTop = margin;
    const logoData = await this.loadImage(options.logoUrl);
    if (logoData) {
      document.addImage(logoData, 'PNG', margin, contentTop, 24, 24, undefined, 'FAST');
      contentTop += 2;
    }

    document.setTextColor(...primaryColor);
    document.setFont('helvetica', 'bold');
    document.setFontSize(18);
    document.text(options.title, margin + (logoData ? 31 : 0), contentTop + 7);

    document.setTextColor(...secondaryColor);
    document.setFont('helvetica', 'normal');
    document.setFontSize(9);
    if (options.businessName) {
      document.text(options.businessName, margin + (logoData ? 31 : 0), contentTop + 13);
    }
    if (options.description) {
      document.text(options.description, margin + (logoData ? 31 : 0), contentTop + 18, {
        maxWidth: pageWidth - margin * 2 - (logoData ? 31 : 0),
      });
    }

    contentTop += logoData ? 31 : 24;
    document.setDrawColor(...primaryColor);
    document.setLineWidth(0.6);
    document.line(margin, contentTop, pageWidth - margin, contentTop);

    if (options.metrics?.length) {
      contentTop += 9;
      contentTop = this.drawMetrics(
        document,
        options.metrics,
        contentTop,
        pageWidth,
        margin,
        primaryColor,
      );
    }

    contentTop += 7;
    autoTable(document, {
      head: [options.columns],
      body: options.rows,
      startY: contentTop,
      margin: { left: margin, right: margin, bottom: 18 },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: 3,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didDrawPage: ({ pageNumber }) => {
        this.drawFooter(document, options, pageNumber, pageWidth, margin, secondaryColor);
      },
    });

    document.save(`${this.sanitizeFilename(options.filename ?? options.title)}.pdf`);
  }

  private drawMetrics(
    document: import('jspdf').jsPDF,
    metrics: NonNullable<PdfReportOptions['metrics']>,
    top: number,
    pageWidth: number,
    margin: number,
    color: PdfColor,
  ): number {
    const gap = 4;
    const width = (pageWidth - margin * 2 - gap * (metrics.length - 1)) / metrics.length;
    metrics.forEach((metric, index) => {
      const left = margin + index * (width + gap);
      document.setFillColor(248, 250, 252);
      document.setDrawColor(226, 232, 240);
      document.roundedRect(left, top, width, 18, 2, 2, 'FD');
      document.setTextColor(...color);
      document.setFontSize(7);
      document.setFont('helvetica', 'normal');
      document.text(metric.label, left + 4, top + 6);
      document.setFontSize(11);
      document.setFont('helvetica', 'bold');
      document.text(metric.value, left + 4, top + 13);
    });
    return top + 18;
  }

  private drawFooter(
    document: import('jspdf').jsPDF,
    options: PdfReportOptions,
    pageNumber: number,
    pageWidth: number,
    margin: number,
    color: PdfColor,
  ): void {
    const pageHeight = document.internal.pageSize.getHeight();
    document.setDrawColor(226, 232, 240);
    document.setLineWidth(0.2);
    document.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    document.setTextColor(...color);
    document.setFont('helvetica', 'normal');
    document.setFontSize(7);
    const date = this.formatDate(options.generatedAt ?? new Date(), options.timezone);
    const footer = options.footerText ?? `${options.businessName ?? 'Venti'} · Generado ${date}`;
    document.text(footer, margin, pageHeight - 7);
    document.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  private async loadImage(url?: string | null): Promise<string | null> {
    if (!url || typeof fetch === 'undefined') return null;
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('No se pudo cargar el logo para el PDF:', error);
      return null;
    }
  }

  private parseColor(value: string | undefined, fallback: PdfColor): PdfColor {
    if (!value) return fallback;
    const hex = value.replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(hex)) return fallback;
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }

  private formatDate(value: Date, timezone?: string): string {
    return new Intl.DateTimeFormat('es', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone,
    }).format(value);
  }

  private sanitizeFilename(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-');
  }
}
