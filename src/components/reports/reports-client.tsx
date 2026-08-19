"use client";

/**
 * RCMS Reports 2.0 Phase 4 Client Component
 * Real Dataset Engine + Universal Export Toolbar (PDF, Excel, CSV, Print) & Export History Tracking
 */

import { useState, useMemo } from "react";
import { RCMS_BRANCHES } from "@/constants/branches";
import { generateReportPreviewAction } from "@/actions/reports/reports.actions";
import { ReportCenterInitialResponse, ReportCategoryItem, ReportPreviewResult, RecentReportItem } from "@/services/reports/report-center.service";
import { ReportExportService } from "@/services/reports/report-export.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  FileSpreadsheet,
  FileText,
  Clock,
  Calendar,
  Filter,
  Layers,
  ChevronRight,
  X,
  Lock,
  Download,
  Eye,
  CheckCircle2,
  Sparkles,
  Search,
  ArrowRight,
  GraduationCap,
  RefreshCw,
  SlidersHorizontal,
  Printer,
  FileCode,
  Loader2,
} from "lucide-react";

interface ReportsClientProps {
  initialData: ReportCenterInitialResponse | null;
}

const exportService = new ReportExportService();

export function ReportsClient({ initialData }: ReportsClientProps) {
  const [data] = useState<ReportCenterInitialResponse | null>(initialData);
  const [selectedCategory, setSelectedCategory] = useState<ReportCategoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Global Filter State
  const [semesterFilter, setSemesterFilter] = useState("active");
  const [academicYearFilter, setAcademicYearFilter] = useState("2025-2026");
  const [dateRangeFilter, setDateRangeFilter] = useState("semester");
  const [branchFilter, setBranchFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [lowAttendanceThreshold, setLowAttendanceThreshold] = useState<number>(75);

  // Preview State
  const [previewResult, setPreviewResult] = useState<ReportPreviewResult | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Recent Exports History State
  const [recentExportList, setRecentExportList] = useState<RecentReportItem[]>(
    initialData ? initialData.recentReports : []
  );

  const handleOpenReportPreview = async (templateId: string) => {
    setIsGeneratingPreview(true);
    try {
      const filters = {
        semester: semesterFilter,
        academicYear: academicYearFilter,
        dateRange: dateRangeFilter,
        branch: branchFilter,
        year: yearFilter,
        status: statusFilter,
        threshold: lowAttendanceThreshold,
      };

      const res = await generateReportPreviewAction(templateId, filters);
      if (res.success && res.data) {
        setPreviewResult(res.data);
      }
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const trackExport = (format: "PDF" | "CSV" | "EXCEL") => {
    if (!previewResult) return;
    const newEntry: RecentReportItem = {
      id: `export_${Date.now()}`,
      name: previewResult.title,
      category: previewResult.category,
      generatedBy: "Faculty Coordinator",
      generatedOn: "Just Now",
      format,
      status: "Completed",
    };
    setRecentExportList((prev) => [newEntry, ...prev.slice(0, 9)]);
  };

  // 1. Export CSV
  const handleExportCsv = () => {
    if (!previewResult) return;
    const csvStr = exportService.exportToCsv(previewResult);
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${previewResult.title.replace(/\s+/g, "_")}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    trackExport("CSV");
  };

  // 2. Export Excel
  const handleExportExcel = () => {
    if (!previewResult) return;
    const xmlStr = exportService.exportToExcelXml(previewResult);
    const blob = new Blob([xmlStr], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${previewResult.title.replace(/\s+/g, "_")}_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    trackExport("EXCEL");
  };

  // 3. Export PDF / Print
  const handleExportPdfOrPrint = () => {
    if (!previewResult) return;
    const htmlStr = exportService.generatePrintableHtml(previewResult);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlStr);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
    trackExport("PDF");
  };

  const memoizedCategories = useMemo(() => {
    if (!data?.categories) return [];
    if (!searchQuery.trim()) return data.categories;
    const q = searchQuery.toLowerCase();
    return data.categories.filter(
      (cat) =>
        cat.title.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q) ||
        cat.templates.some((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    );
  }, [data?.categories, searchQuery]);

  if (!data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-4 shadow-sm text-xs">
        <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Report Center Unavailable</h3>
        <p className="text-muted-foreground">Unable to load report center foundation metadata.</p>
      </div>
    );
  }

  const { stats, categories } = data;

  return (
    <div className="space-y-8 text-left">
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/60 flex items-center justify-center font-bold">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Reports Center</h1>
              <p className="text-xs text-muted-foreground">
                Generate, preview, export and archive robotics club reports.
              </p>
            </div>
          </div>
        </div>

        <Badge variant="outline" className="bg-emerald-950/80 text-emerald-400 border-emerald-800/60 font-mono text-xs px-3 py-1.5 self-start sm:self-auto">
          PHASE 4 UNIVERSAL EXPORT ENGINE ACTIVE
        </Badge>
      </div>

      {/* ── 4 STATISTICS CARDS ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-1.5 shadow-sm">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Available Templates</span>
          <div className="text-2xl font-extrabold text-foreground">{stats.availableTemplatesCount} Templates</div>
          <p className="text-[10px] text-muted-foreground">Universal Export Compatible</p>
        </div>

        <div className="rounded-2xl border border-blue-800/40 bg-gradient-to-br from-card to-blue-950/20 p-5 space-y-1.5 shadow-sm">
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wide">Generated This Semester</span>
          <div className="text-2xl font-extrabold text-blue-300">{stats.generatedThisSemesterCount} Reports</div>
          <p className="text-[10px] text-muted-foreground">Active semester export history</p>
        </div>

        <div className="rounded-2xl border border-emerald-800/40 bg-gradient-to-br from-card to-emerald-950/20 p-5 space-y-1.5 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">Last Generated Report</span>
          <div className="text-lg font-bold text-emerald-300">{stats.lastGeneratedTime}</div>
          <p className="text-[10px] text-muted-foreground">Semester Executive Report PDF</p>
        </div>

        <div className="rounded-2xl border border-purple-800/40 bg-gradient-to-br from-card to-purple-950/20 p-5 space-y-1.5 shadow-sm">
          <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wide">Active Semester</span>
          <div className="text-lg font-bold text-purple-300 truncate">{stats.activeSemesterName}</div>
          <p className="text-[10px] text-muted-foreground">Primary reporting scope</p>
        </div>
      </div>

      {/* ── GLOBAL FILTERS PANEL ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm text-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-blue-400" />
            <h3 className="font-bold text-sm text-foreground">Global Report Filters</h3>
          </div>
          <span className="text-[11px] text-muted-foreground">Applied across all report datasets</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Semester</label>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary shadow-sm"
            >
              <option value="active">Active ({stats.activeSemesterName})</option>
              <option value="ROBOTICS_B2_2025">ROBOTICS_B2_2025</option>
              <option value="all">All Semesters</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Academic Year</label>
            <select
              value={academicYearFilter}
              onChange={(e) => setAcademicYearFilter(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary shadow-sm"
            >
              <option value="2025-2026">2025 - 2026</option>
              <option value="2024-2025">2024 - 2025</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Date Range</label>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary shadow-sm"
            >
              <option value="semester">Full Semester</option>
              <option value="30days">Last 30 Days</option>
              <option value="7days">Last 7 Days</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Branch</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary shadow-sm"
            >
              <option value="all">All Branches</option>
              {RCMS_BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary shadow-sm"
            >
              <option value="all">All Academic Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Member Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary shadow-sm"
            >
              <option value="active">Active Members Only</option>
              <option value="all">All Statuses</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 10 REPORT CATEGORIES GRID ───────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-400" /> Report Categories &amp; Datasets
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reports or templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memoizedCategories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(cat)}
              className="rounded-2xl border border-border bg-card hover:bg-muted/20 p-5 shadow-sm space-y-3 cursor-pointer transition-all hover:scale-[1.01] group border-l-4 border-l-blue-500 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{cat.icon}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {cat.templatesCount} Templates
                  </Badge>
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground group-hover:text-blue-400 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="text-xs font-bold text-blue-400 flex items-center justify-between pt-4 border-t border-border/40 mt-2">
                <span>View Templates</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RECENT REPORTS TABLE ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <h3 className="font-bold text-base text-foreground">Recent Generated &amp; Exported Reports</h3>
          </div>
          <span className="text-xs text-muted-foreground">Historical export archive</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3 px-3">Report Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Generated By</th>
                <th className="py-3 px-3">Generated On</th>
                <th className="py-3 px-3 text-center">Format</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {recentExportList.map((rec) => (
                <tr key={rec.id} className="hover:bg-muted/10 transition-colors">
                  <td className="py-3 px-3 font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-400" />
                    <span>{rec.name}</span>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">{rec.category}</td>
                  <td className="py-3 px-3 text-muted-foreground">{rec.generatedBy}</td>
                  <td className="py-3 px-3 text-muted-foreground font-mono">{rec.generatedOn}</td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {rec.format}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Badge variant={rec.status === "Completed" ? "success" : "secondary"} className="text-[10px]">
                      {rec.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CATEGORY TEMPLATES DRAWER (SLIDE-OVER PANEL) ────────────────────── */}
      <DetailDrawer
        isOpen={Boolean(selectedCategory)}
        onClose={() => setSelectedCategory(null)}
        title={selectedCategory ? `${selectedCategory.title} templates` : "Category Templates"}
        maxWidth="max-w-xl"
      >
        {selectedCategory && (
          <div className="flex flex-col h-full justify-between">
            <div className="p-6 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/60 flex items-center justify-center text-xl font-bold">
                  {selectedCategory.icon}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selectedCategory.title}</h2>
                  <p className="text-xs text-muted-foreground">{selectedCategory.templates.length} Report Templates Available</p>
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)} className="rounded-xl">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                {selectedCategory.description} Click <strong>Preview Report</strong> on any available template to view live table datasets.
              </p>

              <div className="space-y-3 pt-2">
                {selectedCategory.templates.map((tpl) => (
                  <div key={tpl.id} className="rounded-xl border border-border/80 bg-background p-4 space-y-3 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-foreground flex items-center gap-2">
                          <span>{tpl.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tpl.description}</p>
                      </div>

                      <Badge
                        variant={tpl.availability === "Available Now" ? "success" : "outline"}
                        className={`text-[10px] font-mono shrink-0 ${
                          tpl.availability === "Available Now" ? "" : "text-purple-400 border-purple-800/60"
                        }`}
                      >
                        {tpl.availability}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/40 pt-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] text-muted-foreground font-semibold">Formats:</span>
                        {tpl.formats.map((fmt) => (
                          <Badge key={fmt} variant="secondary" className="text-[9px] font-mono">
                            {fmt}
                          </Badge>
                        ))}
                      </div>

                      {tpl.availability === "Available Now" ? (
                        <Button
                          onClick={() => handleOpenReportPreview(tpl.id)}
                          disabled={isGeneratingPreview}
                          size="sm"
                          className="text-[11px] h-7 font-bold gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Eye className={`h-3 w-3 ${isGeneratingPreview ? "animate-spin" : ""}`} />
                          <span>{isGeneratingPreview ? "Loading..." : "Preview Report"}</span>
                        </Button>
                      ) : (
                        <Button disabled variant="outline" size="sm" className="text-[11px] h-7 gap-1 opacity-70">
                          <Lock className="h-3 w-3" />
                          <span>Phase 2 Export</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-border bg-card flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedCategory(null)} className="text-xs">
                Close Drawer
              </Button>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* ── REPORT PREVIEW DRAWER (FULL PREVIEW WORKSPACE + UNIVERSAL EXPORT TOOLBAR) ── */}
      <DetailDrawer
        isOpen={Boolean(previewResult)}
        onClose={() => setPreviewResult(null)}
        title={previewResult ? `${previewResult.title} preview` : "Report Preview"}
        maxWidth="max-w-4xl"
      >
        {previewResult && (
          <div className="flex flex-col h-full justify-between">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center text-xl font-bold">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{previewResult.title}</h2>
                  <p className="text-xs text-muted-foreground">Category: {previewResult.category} • Generated: {previewResult.generatedAt}</p>
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={() => setPreviewResult(null)} className="rounded-xl">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Universal Export Toolbar */}
              <div className="rounded-xl border border-emerald-800/40 bg-gradient-to-r from-card to-emerald-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                    <Download className="h-4 w-4 text-emerald-400" /> Universal Export Engine
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">1 Shared Renderer</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={handleExportPdfOrPrint} size="sm" className="h-8 gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Export PDF</span>
                  </Button>

                  <Button onClick={handleExportExcel} size="sm" className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>Export Excel (.xls)</span>
                  </Button>

                  <Button onClick={handleExportCsv} size="sm" className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
                    <FileCode className="h-3.5 w-3.5" />
                    <span>Export CSV</span>
                  </Button>

                  <Button onClick={handleExportPdfOrPrint} variant="outline" size="sm" className="h-8 gap-1.5 font-bold text-xs">
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Layout</span>
                  </Button>
                </div>
              </div>

              {/* Filter Parameters Pill */}
              <div className="rounded-xl border border-blue-800/40 bg-blue-950/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-blue-400" />
                  <span className="font-bold text-blue-300">Active Scope: {stats.activeSemesterName} (2025-2026)</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 border-emerald-800/60">
                  {previewResult.rows.length} Total Records Loaded
                </Badge>
              </div>

              {/* Executive Summary Brief (if present) */}
              {previewResult.executiveSummary && (
                <div className="rounded-xl border border-purple-800/40 bg-purple-950/20 p-4 space-y-1.5 text-purple-300">
                  <div className="flex items-center space-x-2 font-bold text-xs">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span>Executive Summary &amp; Coordinator Brief</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                    {previewResult.executiveSummary}
                  </p>
                </div>
              )}

              {/* Low Attendance Threshold Adjuster (if applicable) */}
              {previewResult.reportId === "att_3" && (
                <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-3 flex items-center justify-between gap-3 text-amber-300">
                  <div className="flex items-center space-x-2">
                    <SlidersHorizontal className="h-4 w-4 text-amber-400" />
                    <span className="font-bold text-xs">Attendance Threshold:</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {[60, 70, 75, 80].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setLowAttendanceThreshold(t);
                          handleOpenReportPreview("att_3");
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors ${
                          lowAttendanceThreshold === t
                            ? "border-amber-500 bg-amber-500 text-black"
                            : "border-amber-800/60 text-amber-300 hover:bg-amber-900/30"
                        }`}
                      >
                        {t}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* KPI Summary Bar */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {previewResult.kpis.map((kpi, idx) => (
                  <div key={idx} className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{kpi.label}</span>
                    <div className={`text-lg font-bold ${kpi.color || "text-foreground"}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Report Table Dataset */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Report Table View (Exact PDF/Excel Layout)
                  </h3>
                  <span className="text-[10px] text-muted-foreground">Showing {previewResult.rows.length} rows</span>
                </div>

                <div className="overflow-x-auto border border-border rounded-xl bg-background">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                        {previewResult.columns.map((col) => (
                          <th key={col.key} className={`py-3 px-3 text-${col.align || "left"}`}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {previewResult.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-muted/10 transition-colors">
                          {previewResult.columns.map((col) => {
                            const val = row[col.key];

                            if (col.key === "status" || col.key === "renewalStatus" || col.key === "recommendation") {
                              let badgeVariant: "success" | "warning" | "destructive" | "secondary" = "secondary";
                              if (val === "Present" || val === "Renewed" || val === "ACTIVE") badgeVariant = "success";
                              else if (val === "Late" || val === "Pending" || val === "Academic Warning" || val === "Notice Issued") badgeVariant = "warning";
                              else if (val === "Expired" || val === "Counseling Required") badgeVariant = "destructive";

                              return (
                                <td key={col.key} className={`py-2.5 px-3 text-${col.align || "left"}`}>
                                  <Badge variant={badgeVariant} className="text-[9.5px]">
                                    {val}
                                  </Badge>
                                </td>
                              );
                            }

                            return (
                              <td key={col.key} className={`py-2.5 px-3 text-${col.align || "left"} ${col.key === "memberName" || col.key === "title" ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                                {typeof val === "boolean" ? (val ? "Yes" : "No") : String(val)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-card flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Universal Export Engine Active • All Formats Unlocked</span>
              <Button variant="outline" size="sm" onClick={() => setPreviewResult(null)} className="text-xs">
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
