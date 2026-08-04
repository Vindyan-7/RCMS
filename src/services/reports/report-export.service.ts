/**
 * RCMS Reports 2.0 Universal Export Engine
 * Converts any ReportPreviewResult into PDF, Excel (.xlsx), CSV, and Print-Friendly HTML formats.
 */

import { ReportPreviewResult } from "./report-center.service";
import { logger } from "@/core/logger";

export class ReportExportService {

  /**
   * 1. UNIVERSAL CSV EXPORT (UTF-8 BOM, CRLF, Human Readable)
   */
  public exportToCsv(previewResult: ReportPreviewResult): string {
    logger.info(`[ReportExportService] Exporting CSV for ${previewResult.title}`);

    const bom = "\uFEFF";
    const headerRow = previewResult.columns.map((c) => this.escapeCsvField(c.label)).join(",");
    
    const dataRows = previewResult.rows.map((row) => {
      return previewResult.columns
        .map((c) => {
          const rawVal = row[c.key];
          let val = rawVal === null || rawVal === undefined ? "" : String(rawVal);
          if (typeof rawVal === "boolean") val = rawVal ? "Yes" : "No";
          return this.escapeCsvField(val);
        })
        .join(",");
    });

    const csvContent = [headerRow, ...dataRows].join("\r\n");
    return bom + csvContent;
  }

  /**
   * Helper to escape CSV field values
   */
  private escapeCsvField(val: string): string {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }

  /**
   * 2. UNIVERSAL EXCEL EXPORT (.xlsx XML Spreadsheet)
   */
  public exportToExcelXml(previewResult: ReportPreviewResult): string {
    logger.info(`[ReportExportService] Exporting Excel XML for ${previewResult.title}`);

    const columnsXml = previewResult.columns
      .map((c) => `<Cell><Data ss:Type="String">${this.escapeXml(c.label)}</Data></Cell>`)
      .join("");

    const rowsXml = previewResult.rows
      .map((row) => {
        const cells = previewResult.columns
          .map((c) => {
            const rawVal = row[c.key];
            let val = rawVal === null || rawVal === undefined ? "" : String(rawVal);
            if (typeof rawVal === "boolean") val = rawVal ? "Yes" : "No";
            const isNum = typeof rawVal === "number";
            const dataType = isNum ? "Number" : "String";
            return `<Cell><Data ss:Type="${dataType}">${this.escapeXml(val)}</Data></Cell>`;
          })
          .join("");
        return `<Row>${cells}</Row>`;
      })
      .join("");

    const kpisXml = previewResult.kpis
      .map(
        (kpi) =>
          `<Row><Cell><Data ss:Type="String">${this.escapeXml(kpi.label)}</Data></Cell><Cell><Data ss:Type="String">${this.escapeXml(
            String(kpi.value)
          )}</Data></Cell></Row>`
      )
      .join("");

    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Report Summary">
  <Table>
   <Row><Cell><Data ss:Type="String">RCMS - ${this.escapeXml(previewResult.title)}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Generated On: ${this.escapeXml(previewResult.generatedAt)}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Category: ${this.escapeXml(previewResult.category)}</Data></Cell></Row>
   <Row></Row>
   <Row><Cell><Data ss:Type="String">Summary KPIs</Data></Cell></Row>
   ${kpisXml}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Data Roster">
  <Table>
   <Row>${columnsXml}</Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;
  }

  /**
   * 3. UNIVERSAL PRINT / PDF HTML GENERATOR
   */
  public generatePrintableHtml(previewResult: ReportPreviewResult): string {
    logger.info(`[ReportExportService] Generating Printable HTML for ${previewResult.title}`);

    const kpisHtml = previewResult.kpis
      .map(
        (kpi) => `
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc;">
          <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">${this.escapeXml(kpi.label)}</div>
          <div style="font-size: 18px; font-weight: font-extrabold; color: #0f172a; margin-top: 4px;">${this.escapeXml(String(kpi.value))}</div>
        </div>
      `
      )
      .join("");

    const columnsHtml = previewResult.columns
      .map(
        (c) =>
          `<th style="border-bottom: 2px solid #cbd5e1; padding: 8px 10px; text-align: ${
            c.align || "left"
          }; font-size: 11px; color: #475569; text-transform: uppercase;">${this.escapeXml(c.label)}</th>`
      )
      .join("");

    const rowsHtml = previewResult.rows
      .map((row, rIdx) => {
        const bg = rIdx % 2 === 0 ? "#ffffff" : "#f8fafc";
        const cells = previewResult.columns
          .map((c) => {
            const rawVal = row[c.key];
            let val = rawVal === null || rawVal === undefined ? "" : String(rawVal);
            if (typeof rawVal === "boolean") val = rawVal ? "Yes" : "No";
            return `<td style="padding: 8px 10px; text-align: ${c.align || "left"}; font-size: 11px; border-bottom: 1px solid #e2e8f0;">${this.escapeXml(val)}</td>`;
          })
          .join("");
        return `<tr style="background: ${bg};">${cells}</tr>`;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${this.escapeXml(previewResult.title)} — RCMS Official Report</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #ffffff; }
          .header { border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 22px; font-weight: bold; color: #1e3a8a; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .meta { text-align: right; font-size: 11px; color: #475569; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; pt: 10px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">🤖 ROBOTICS CLUB MANAGEMENT SYSTEM</div>
            <div class="subtitle">Official Report: ${this.escapeXml(previewResult.title)}</div>
          </div>
          <div class="meta">
            <div><strong>Scope:</strong> ROBOTICS_B1_2026</div>
            <div><strong>Generated:</strong> ${this.escapeXml(previewResult.generatedAt)}</div>
          </div>
        </div>

        ${
          previewResult.executiveSummary
            ? `<div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px; margin-bottom: 20px; border-radius: 4px; font-size: 12px; color: #1e40af;">
                <strong>Executive Summary:</strong> ${this.escapeXml(previewResult.executiveSummary)}
              </div>`
            : ""
        }

        <div class="kpi-grid">
          ${kpisHtml}
        </div>

        <table class="table">
          <thead>
            <tr>${columnsHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer" style="margin-top: 40px; text-align: center; font-size: 10px; color: #64748b;">
          <div>Robotics Club Management System (RCMS v1.0) • Confidential Official Document</div>
          <div>Page 1 of 1</div>
        </div>
      </body>
      </html>
    `;
  }

  private escapeXml(val: string): string {
    return val
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
