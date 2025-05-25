import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// Import the PDF export utility
import { exportToPDF as exportReportsToPDF } from '@/components/utils/PDF';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useReports, Report, ReportStatus } from '@/contexts/ReportContext';
import { toast } from '@/components/ui/use-toast';
import { format as dateFormat, formatDistanceToNow } from 'date-fns';
import { 
  Search, 
  Filter, 
  BarChart2,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Loader2,
  Download,
  Plus,
  ArrowUpDown,
  ChevronDown,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Trash2,
  Check,
  MessageSquare,
  User
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/ui/loading";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 30, 50];

type SortField = 'createdAt' | 'title' | 'status' | 'severity';
type SortDirection = 'asc' | 'desc';

interface DashboardSettings {
  defaultItemsPerPage: number;
  showAnalytics: boolean;
  enableNotifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  defaultSort: SortField;
  defaultSortDirection: SortDirection;
  showSeverity: boolean;
  showCategory: boolean;
  showLocation: boolean;
  showReportedBy: boolean;
}

const DEFAULT_SETTINGS: DashboardSettings = {
  defaultItemsPerPage: 10,
  showAnalytics: true,
  enableNotifications: false,
  autoRefresh: false,
  refreshInterval: 30,
  defaultSort: 'createdAt',
  defaultSortDirection: 'desc',
  showSeverity: true,
  showCategory: true,
  showLocation: true,
  showReportedBy: true,
};

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: DashboardSettings;
  onSettingsChange: (settings: DashboardSettings) => void;
  onSave: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  onSave,
}) => {
  const updateSettings = (updates: Partial<DashboardSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0">
        {/* Fixed Header */}
        <div className="p-6 border-b">
          <DialogTitle className="text-2xl font-bold">Dashboard Settings</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Customize your dashboard experience and preferences
          </DialogDescription>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            {/* Display Settings Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Display Settings</h3>
              </div>
              <div className="grid gap-4 pl-7">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-analytics" className="text-base">Show Analytics Tab</Label>
                    <p className="text-sm text-muted-foreground">Display the analytics dashboard with charts and statistics</p>
                  </div>
                  <Switch
                    id="show-analytics"
                    checked={settings.showAnalytics}
                    onCheckedChange={(checked) => 
                      updateSettings({ showAnalytics: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-severity" className="text-base">Show Severity Column</Label>
                    <p className="text-sm text-muted-foreground">Display the severity level of each issue</p>
                  </div>
                  <Switch
                    id="show-severity"
                    checked={settings.showSeverity}
                    onCheckedChange={(checked) => 
                      updateSettings({ showSeverity: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-category" className="text-base">Show Category Column</Label>
                    <p className="text-sm text-muted-foreground">Display the category of each issue</p>
                  </div>
                  <Switch
                    id="show-category"
                    checked={settings.showCategory}
                    onCheckedChange={(checked) => 
                      updateSettings({ showCategory: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-location" className="text-base">Show Location Column</Label>
                    <p className="text-sm text-muted-foreground">Display the location of each issue</p>
                  </div>
                  <Switch
                    id="show-location"
                    checked={settings.showLocation}
                    onCheckedChange={(checked) => 
                      updateSettings({ showLocation: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-reported-by" className="text-base">Show Reported By Column</Label>
                    <p className="text-sm text-muted-foreground">Display who reported each issue</p>
                  </div>
                  <Switch
                    id="show-reported-by"
                    checked={settings.showReportedBy}
                    onCheckedChange={(checked) => 
                      updateSettings({ showReportedBy: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Default Settings Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Default Settings</h3>
              </div>
              <div className="grid gap-4 pl-7">
                <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <Label htmlFor="items-per-page" className="text-base mb-2 block">
                    Items per page
                  </Label>
                  <Select
                    value={settings.defaultItemsPerPage.toString()}
                    onValueChange={(value) => 
                      updateSettings({ defaultItemsPerPage: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select items per page" />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option.toString()}>
                          {option} items
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <Label htmlFor="default-sort" className="text-base mb-2 block">
                    Default sort field
                  </Label>
                  <Select
                    value={settings.defaultSort}
                    onValueChange={(value: SortField) => 
                      updateSettings({ defaultSort: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Reported Date</SelectItem>
                      <SelectItem value="title">Issue Title</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="severity">Severity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <Label htmlFor="sort-direction" className="text-base mb-2 block">
                    Default sort direction
                  </Label>
                  <Select
                    value={settings.defaultSortDirection}
                    onValueChange={(value: SortDirection) => 
                      updateSettings({ defaultSortDirection: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sort direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Notifications & Updates Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Updates</h3>
              </div>
              <div className="grid gap-4 pl-7">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-refresh" className="text-base">Auto Refresh</Label>
                    <p className="text-sm text-muted-foreground">Automatically refresh the dashboard data</p>
                  </div>
                  <Switch
                    id="auto-refresh"
                    checked={settings.autoRefresh}
                    onCheckedChange={(checked) => 
                      updateSettings({ autoRefresh: checked })
                    }
                  />
                </div>

                <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <Label htmlFor="refresh-interval" className="text-base mb-2 block">
                    Refresh interval
                  </Label>
                  <Select
                    value={settings.refreshInterval.toString()}
                    onValueChange={(value) => 
                      updateSettings({ refreshInterval: parseInt(value) })
                    }
                    disabled={!settings.autoRefresh}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select refresh interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">Every 15 seconds</SelectItem>
                      <SelectItem value="30">Every 30 seconds</SelectItem>
                      <SelectItem value="60">Every minute</SelectItem>
                      <SelectItem value="300">Every 5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Fixed Footer */}
        <div className="p-6 border-t bg-background">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reports: Report[];
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  reports,
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const getStatusBackgroundColor = (status: ReportStatus) => {
    switch (status) {
      case 'reported':
        return '#fef3c7'; // yellow-100
      case 'in_progress':
        return '#ffedd5'; // orange-100
      case 'resolved':
        return '#dcfce7'; // green-100
      case 'closed':
        return '#f3f4f6'; // gray-100
      default:
        return '#f3f4f6'; // gray-100
    }
  };

  const handleExport = () => {
    let filteredReports = [...reports];

    // Apply date filtering
    if (dateRange !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            filteredReports = filteredReports.filter(report => {
              const reportDate = new Date(report.createdAt);
              return reportDate >= start && reportDate <= end;
            });
          }
          break;
      }

      if (dateRange !== 'custom') {
        filteredReports = filteredReports.filter(report => {
          const reportDate = new Date(report.createdAt);
          return reportDate >= startDate && reportDate <= now;
        });
      }
    }

    // Prepare data based on format
    switch (exportFormat) {
      case 'csv':
        exportToCSV(filteredReports);
        break;
      case 'pdf':
        exportReportsToPDF({
          data: filteredReports,
          dateRange,
          customStartDate,
          customEndDate
        });
        break;
    }

    onOpenChange(false);
    toast({
      title: "Export Successful",
      description: `Reports exported in ${exportFormat.toUpperCase()} format.`,
    });
  };

  const exportToCSV = (data: Report[]) => {
    // Define headers with proper formatting
    const headers = [
      'ID',
      'Title',
      'Category',
      'Status',
      'Severity',
      'Location',
      'Coordinates',
      'Reported By',
      'Created At',
      'Updated At',
      'Description',
      'Images',
      'Upvotes',
      'Assigned To'
    ];

    // Format the data rows
    const rows = data.map(report => [
      report.id,
      `"${report.title.replace(/"/g, '""')}"`,
      report.category.replace('_', ' '),
      report.status.replace('_', ' '),
      report.severity,
      `"${report.location.address.replace(/"/g, '""')}"`,
      `${report.location.coordinates.lat},${report.location.coordinates.lng}`,
      report.reportedBy.name,
      new Date(report.createdAt).toISOString(),
      new Date(report.updatedAt).toISOString(),
      `"${report.description.replace(/"/g, '""')}"`,
      report.images.join(';'),
      report.upvotes.toString(),
      report.assignedTo?.name || 'Unassigned'
    ]);

    // Create CSV content with BOM for proper Excel encoding
    const csvContent = [
      '\ufeff', // Add BOM for Excel
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reports_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = (data: Report[]) => {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Export Failed",
        description: "Please allow popups for this website to export PDFs.",
        variant: "destructive",
      });
      return;
    }

    // Format the date for display
    const formattedDate = dateFormat(new Date(), 'MMMM d, yyyy');
    const formattedTime = dateFormat(new Date(), 'h:mm a');

    // Get time frame information for the report header
    let timeFrameText = 'All Reports';
    if (dateRange === 'week') {
      timeFrameText = 'Reports from the Last 7 Days';
    } else if (dateRange === 'month') {
      timeFrameText = 'Reports from the Last 30 Days';
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      const start = dateFormat(new Date(customStartDate), 'MMM d, yyyy');
      const end = dateFormat(new Date(customEndDate), 'MMM d, yyyy');
      timeFrameText = `Reports from ${start} to ${end}`;
    }

    // Create a count by status for the summary section
    const statusCounts = data.reduce((acc, report) => {
      const status = report.status.replace('_', ' ');
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Create a count by category for the summary section
    const categoryCounts = data.reduce((acc, report) => {
      const category = report.category.replace('_', ' ');
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Format status and category counts for display
    const statusSummary = Object.entries(statusCounts)
      .map(([status, count]) => `${status}: ${count}`)
      .join(' | ');
      
    const categorySummary = Object.entries(categoryCounts)
      .map(([category, count]) => `${category}: ${count}`)
      .join(' | ');

    // Generate HTML content with improved styling
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CityFix Reports Export</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #374151;
              font-size: 11pt;
              line-height: 1.5;
            }
            
            .page-container {
              max-width: 100%;
              margin: 0 auto;
              padding: 25px;
              box-sizing: border-box;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .logo-container {
              display: flex;
              align-items: center;
            }
            
            .logo {
              font-size: 28px;
              font-weight: 700;
              color: #2563eb;
              margin-right: 10px;
            }
            
            .logo-text {
              font-size: 28px;
              font-weight: 700;
              color: #111827;
            }
            
            .document-info {
              text-align: right;
              font-size: 10pt;
            }
            
            .document-title {
              font-size: 24px;
              font-weight: 700;
              color: #111827;
              margin-bottom: 10px;
              text-align: center;
            }
            
            .document-subtitle {
              font-size: 14px;
              font-weight: 400;
              color: #6b7280;
              margin-bottom: 20px;
              text-align: center;
            }
            
            .summary-section {
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 20px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            }
            
            .summary-title {
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 10px;
              color: #4b5563;
            }
            
            .summary-content {
              font-size: 12px;
              color: #6b7280;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 10pt;
            }
            
            thead th {
              background-color: #f9fafb;
              border-bottom: 2px solid #e5e7eb;
              padding: 10px 8px;
              text-align: left;
              font-weight: 600;
              color: #4b5563;
            }
            
            tbody td {
              padding: 10px 8px;
              border-bottom: 1px solid #e5e7eb;
              vertical-align: top;
            }
            
            tbody tr:nth-child(even) {
              background-color: #f9fafb;
            }
            
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 9pt;
              font-weight: 500;
              line-height: 1;
              text-align: center;
              white-space: nowrap;
            }
            
            .severity-high {
              color: #b91c1c;
              font-weight: 600;
            }
            
            .severity-medium {
              color: #b45309;
              font-weight: 500;
            }
            
            .severity-low {
              color: #1d4ed8;
              font-weight: 400;
            }
            
            .description-cell {
              max-width: 250px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              color: #9ca3af;
              font-size: 9pt;
              page-break-inside: avoid;
            }
            
            @media print {
              thead {
                display: table-header-group;
              }
              
              tfoot {
                display: table-footer-group;
              }
              
              .page-break {
                page-break-before: always;
              }
              
              tr {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="header">
              <div class="logo-container">
                <div class="logo">🏙️</div>
                <div class="logo-text">CityFix</div>
              </div>
              <div class="document-info">
                <div>Date: ${formattedDate}</div>
                <div>Time: ${formattedTime}</div>
                <div>Total Reports: ${data.length}</div>
              </div>
            </div>
            
            <div class="document-title">Reports Export</div>
            <div class="document-subtitle">${timeFrameText}</div>
            
            <div class="summary-section">
              <div class="summary-title">Summary</div>
              <div class="summary-content">
                <div><strong>Status Distribution:</strong> ${statusSummary}</div>
                <div><strong>Category Distribution:</strong> ${categorySummary}</div>
                <div><strong>Total Exported Records:</strong> ${data.length}</div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th style="width: 20%">Title</th>
                  <th style="width: 10%">Category</th>
                  <th style="width: 12%">Status</th>
                  <th style="width: 8%">Severity</th>
                  <th style="width: 15%">Location</th>
                  <th style="width: 12%">Reported By</th>
                  <th style="width: 10%">Created At</th>
                  <th style="width: 13%">Description</th>
                </tr>
              </thead>
              <tbody>
                ${data.map((report, index) => {
                  // Add page break every 25 items for better printing
                  const pageBreak = index > 0 && index % 25 === 0 ? 'page-break' : '';
                  
                  // Format the status badge style
                  let statusStyle = '';
                  switch(report.status) {
                    case 'reported':
                      statusStyle = 'background-color: #fef3c7; color: #92400e;'; // yellow
                      break;
                    case 'in_progress':
                      statusStyle = 'background-color: #ffedd5; color: #9a3412;'; // orange
                      break;
                    case 'resolved':
                      statusStyle = 'background-color: #dcfce7; color: #166534;'; // green
                      break;
                    case 'closed':
                      statusStyle = 'background-color: #f3f4f6; color: #4b5563;'; // gray
                      break;
                    default:
                      statusStyle = 'background-color: #f3f4f6; color: #4b5563;'; // gray
                  }
                  
                  // Format the severity style
                  let severityClass = '';
                  switch(report.severity.toLowerCase()) {
                    case 'high':
                      severityClass = 'severity-high';
                      break;
                    case 'medium':
                      severityClass = 'severity-medium';
                      break;
                    case 'low':
                      severityClass = 'severity-low';
                      break;
                  }
                  
                  // Format date
                  const createdDate = dateFormat(new Date(report.createdAt), 'MMM d, yyyy');
                  
                  return `
                    <tr class="${pageBreak}">
                      <td><strong>${report.title}</strong></td>
                      <td>${report.category.replace('_', ' ')}</td>
                      <td>
                        <span class="status-badge" style="${statusStyle}">
                          ${report.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td class="${severityClass}">${report.severity}</td>
                      <td>${report.location.address}</td>
                      <td>${report.reportedBy.name}</td>
                      <td>${createdDate}</td>
                      <td class="description-cell">${report.description}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <div>CityFix Reports Export | Generated on ${formattedDate} at ${formattedTime}</div>
              <div>This document contains confidential information and is for authorized use only.</div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Write content to the new window
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      // Short delay to ensure styles are fully loaded
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Reports</DialogTitle>
          <DialogDescription>
            Choose the format and date range for your export.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'pdf') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Date Range</Label>
            <Select value={dateRange} onValueChange={(value: 'all' | 'week' | 'month' | 'custom') => setDateRange(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AdminDashboard = () => {
  // 1. Helper functions first
  const formatStatusLabel = (status: ReportStatus) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusBackgroundColor = (status: ReportStatus) => {
    switch (status) {
      case 'reported':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
      case 'in_progress':
        return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
      case 'resolved':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case 'closed':
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600 font-medium';
      case 'medium':
        return 'text-amber-500 font-medium';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-muted-foreground';
    }
  };

  // 2. All hooks at the top level
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const { reports, updateReport, isLoading, refreshReports } = useReports();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // 3. Memoized values with performance optimizations
  const statusData = useMemo(() => {
    // Skip calculation if no reports are available
    if (!reports.length) return [];
    
    const statusCounts = {};
    
    // Use a faster loop instead of reduce
    for (let i = 0; i < reports.length; i++) {
      const status = reports[i].status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: formatStatusLabel(status as ReportStatus),
      value: count
    }));
  }, [reports, formatStatusLabel]);

  const categoryData = useMemo(() => {
    // Skip calculation if no reports are available
    if (!reports.length) return [];
    
    const categoryCounts = {};
    
    // Use a faster loop instead of reduce
    for (let i = 0; i < reports.length; i++) {
      const category = reports[i].category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }

    return Object.entries(categoryCounts).map(([category, count]) => ({
      name: category.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: count
    }));
  }, [reports]);

  // 4. Effects with optimization
  useEffect(() => {
    const savedSettings = localStorage.getItem('adminDashboardSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings) as DashboardSettings;
        setSettings(parsedSettings);
        setItemsPerPage(parsedSettings.defaultItemsPerPage);
        setSortField(parsedSettings.defaultSort);
        setSortDirection(parsedSettings.defaultSortDirection);
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
  }, []);

  // Auto-refresh implementation when enabled
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (settings.autoRefresh && settings.refreshInterval > 0) {
      // Convert minutes to milliseconds
      const refreshIntervalMs = settings.refreshInterval * 60 * 1000;
      
      intervalId = setInterval(() => {
        // Refresh data by forcing a re-fetch in the ReportContext
        const { refreshReports } = useReports();
        if (refreshReports) {
          refreshReports();
        }
      }, refreshIntervalMs);
    }
    
    // Clear interval on component unmount or settings change
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [settings.autoRefresh, settings.refreshInterval]);

  // Debounce search term to prevent excessive filtering
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce delay
    
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, categoryFilter]);

  // 5. Data processing with optimizations
  const filteredReports = useMemo(() => {
    // Skip processing if there are no reports
    if (!reports.length) return [];
    
    const searchTermLower = debouncedSearchTerm.toLowerCase();
    const needsSearchFilter = searchTermLower.length > 0;
    const needsStatusFilter = statusFilter !== 'all';
    const needsCategoryFilter = categoryFilter !== 'all';
    
    // Fast path - no filtering needed
    if (!needsSearchFilter && !needsStatusFilter && !needsCategoryFilter) {
      return reports;
    }
    
    return reports.filter(report => {
      // Only perform text search if search term exists
      const matchesSearch = !needsSearchFilter || (
        report.title.toLowerCase().includes(searchTermLower) ||
        report.description.toLowerCase().includes(searchTermLower) ||
        report.location.address.toLowerCase().includes(searchTermLower)
      );
      
      const matchesStatus = !needsStatusFilter || report.status === statusFilter;
      const matchesCategory = !needsCategoryFilter || report.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [reports, debouncedSearchTerm, statusFilter, categoryFilter]);

  // Memoized sorting function
  const getSortedReports = useCallback((reportsToSort) => {
    if (!reportsToSort.length) return [];
    
    // Create a copy only if we need to sort
    const reportsCopy = [...reportsToSort];
    
    return reportsCopy.sort((a, b) => {
      const aValue = a[sortField as keyof Report];
      const bValue = b[sortField as keyof Report];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      // Handle createdAt as string dates
      if (sortField === 'createdAt' && typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? new Date(aValue).getTime() - new Date(bValue).getTime()
          : new Date(bValue).getTime() - new Date(aValue).getTime();
      }
      
      return 0;
    });
  }, [sortField, sortDirection]);

  // Apply sorting with memoization
  const sortedReports = useMemo(() => getSortedReports(filteredReports), 
    [filteredReports, getSortedReports]);

  // 6. Pagination calculations with performance optimization
  const totalPages = useMemo(() => Math.ceil(sortedReports.length / itemsPerPage), 
    [sortedReports.length, itemsPerPage]);
  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage]);
  const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex, itemsPerPage]);
  const paginatedReports = useMemo(() => sortedReports.slice(startIndex, endIndex), 
    [sortedReports, startIndex, endIndex]);

  // 7. Event handlers
  const handleSaveSettings = () => {
    setItemsPerPage(settings.defaultItemsPerPage);
    setSortField(settings.defaultSort);
    setSortDirection(settings.defaultSortDirection);
    localStorage.setItem('adminDashboardSettings', JSON.stringify(settings));
    setIsSettingsOpen(false);
    toast({
      title: "Settings saved",
      description: "Your dashboard settings have been updated.",
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleStatusChange = (reportId: string, newStatus: ReportStatus) => {
    updateReport(reportId, { status: newStatus });
    toast({
      title: "Status Updated",
      description: `Report status has been updated to "${newStatus.replace('_', ' ')}".`,
    });
  };

  // 8. Early returns
  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return <Loading fullScreen text="Loading reports..." />;
  }

  // 9. Render
  return (
    <div className="container py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage and respond to reported urban issues
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={() => setIsExportOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onSettingsChange={setSettings}
        onSave={handleSaveSettings}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Total Reports
              </CardTitle>
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <CardDescription className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-2">
              {reports.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600 dark:text-blue-400">New Reports</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {reports.filter(r => 
                      new Date(r.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                    ).length}
                  </span>
                  <span className="text-xs text-blue-600/60 dark:text-blue-400/60">today</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600 dark:text-blue-400">This Week</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {reports.filter(r => 
                      new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length}
                  </span>
                  <span className="text-xs text-blue-600/60 dark:text-blue-400/60">reports</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                Pending Review
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardDescription className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-2">
              {reports.filter(r => r.status === 'reported').length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-yellow-600 dark:text-yellow-400">Percentage</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                    {Math.round((reports.filter(r => r.status === 'reported').length / reports.length) * 100)}%
                  </span>
                  <span className="text-xs text-yellow-600/60 dark:text-yellow-400/60">of total</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-yellow-600 dark:text-yellow-400">Response Time</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">2.5h</span>
                  <span className="text-xs text-yellow-600/60 dark:text-yellow-400/60">average</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">
                In Progress
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <CardDescription className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-2">
              {reports.filter(r => r.status === 'in_progress' || r.status === 'under_review').length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-orange-600 dark:text-orange-400">Active Issues</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                    {reports.filter(r => r.status === 'in_progress').length}
                  </span>
                  <span className="text-xs text-orange-600/60 dark:text-orange-400/60">in progress</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-orange-600 dark:text-orange-400">Under Review</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                    {reports.filter(r => r.status === 'under_review').length}
                  </span>
                  <span className="text-xs text-orange-600/60 dark:text-orange-400/60">issues</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
                Resolved
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <CardDescription className="text-2xl font-bold text-green-700 dark:text-green-300 mt-2">
              {reports.filter(r => r.status === 'resolved' || r.status === 'closed').length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600 dark:text-green-400">Resolution Rate</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    {Math.round((reports.filter(r => r.status === 'resolved' || r.status === 'closed').length / reports.length) * 100)}%
                  </span>
                  <span className="text-xs text-green-600/60 dark:text-green-400/60">success rate</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600 dark:text-green-400">Avg. Resolution</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">3.2d</span>
                  <span className="text-xs text-green-600/60 dark:text-green-400/60">time</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8 shadow-sm border-border">
        <CardContent className="p-4 md:p-6">
          {/* Mobile filter layout */}
          <div className="md:hidden space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search reports..." 
                className="pl-9 w-full h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="reported">Reported</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="pothole">Pothole</SelectItem>
                  <SelectItem value="streetlight">Streetlight</SelectItem>
                  <SelectItem value="garbage">Garbage</SelectItem>
                  <SelectItem value="graffiti">Graffiti</SelectItem>
                  <SelectItem value="road_damage">Road Damage</SelectItem>
                  <SelectItem value="flooding">Flooding</SelectItem>
                  <SelectItem value="sign_damage">Sign Damage</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full" 
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
          </div>
          
          {/* Desktop filter layout */}
          <div className="hidden md:flex md:flex-row md:items-center md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search reports by title, description, or location..." 
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="reported">Reported</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="pothole">Pothole</SelectItem>
                  <SelectItem value="streetlight">Streetlight</SelectItem>
                  <SelectItem value="garbage">Garbage</SelectItem>
                  <SelectItem value="graffiti">Graffiti</SelectItem>
                  <SelectItem value="road_damage">Road Damage</SelectItem>
                  <SelectItem value="flooding">Flooding</SelectItem>
                  <SelectItem value="sign_damage">Sign Damage</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                className="flex items-center" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
          
          {/* Applied filters indicators - shows on both mobile and desktop */}
          {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
              <p className="text-xs text-muted-foreground mr-2 flex items-center">
                <Filter className="h-3 w-3 mr-1" />
                Applied filters:
              </p>
              
              {searchTerm && (
                <Badge variant="secondary" className="text-xs bg-muted flex items-center gap-1">
                  Search: {searchTerm.length > 15 ? searchTerm.substring(0, 15) + '...' : searchTerm}
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="ml-1 hover:text-foreground transition-colors" 
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs bg-muted flex items-center gap-1">
                  Status: {statusFilter.replace('_', ' ')}
                  <button 
                    onClick={() => setStatusFilter('all')} 
                    className="ml-1 hover:text-foreground transition-colors" 
                    aria-label="Clear status filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {categoryFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs bg-muted flex items-center gap-1">
                  Category: {categoryFilter.replace('_', ' ')}
                  <button 
                    onClick={() => setCategoryFilter('all')} 
                    className="ml-1 hover:text-foreground transition-colors" 
                    aria-label="Clear category filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-5 text-xs ml-auto" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                >
                  Clear all
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="analytics" className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Issue Status Distribution</CardTitle>
                <CardDescription>
                  Current distribution of issue statuses
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Issue Categories</CardTitle>
                <CardDescription>
                  Distribution of issues by category
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolution Timeline</CardTitle>
                <CardDescription>
                  Average time to resolve issues
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Pothole', time: 2.5 },
                    { name: 'Streetlight', time: 1.8 },
                    { name: 'Garbage', time: 1.2 },
                    { name: 'Graffiti', time: 3.1 },
                    { name: 'Road Damage', time: 4.2 },
                    { name: 'Flooding', time: 3.8 },
                    { name: 'Sign Damage', time: 2.1 },
                    { name: 'Other', time: 2.9 }
                  ]}>
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="time" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Analysis</CardTitle>
                <CardDescription>
                  Time taken to respond to issues
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Under 1h', value: 45 },
                    { name: '1-2h', value: 30 },
                    { name: '2-4h', value: 15 },
                    { name: '4-8h', value: 7 },
                    { name: '8h+', value: 3 }
                  ]}>
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Number of Issues', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Issue Management</CardTitle>
                  <CardDescription>
                    Review and manage reported urban issues
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsExportOpen(true)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px] min-w-[200px]">
                        <div className="flex items-center gap-2">
                          Issue
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSortField('title');
                              setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            }}
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">Location</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          Reported
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSortField('createdAt');
                              setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            }}
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No reports match your filters</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setCategoryFilter('all');
                              }}
                            >
                              Reset Filters
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedReports.map((report) => {
                        // Pre-calculate derived values to improve performance
                        const reportIdShort = report.id.substring(0, 8);
                        const reportCreatedDate = new Date(report.createdAt);
                        const timeAgo = formatDistanceToNow(reportCreatedDate, { addSuffix: true });
                        const formattedDate = dateFormat(reportCreatedDate, 'dd MMM yyyy');
                        const avatarInitials = report.reportedBy?.name?.substring(0, 2)?.toUpperCase() || 'U';
                        const categoryFormatted = report.category.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                        
                        return (
                          <TableRow 
                            key={report.id} 
                            className="hover:bg-muted/30"
                          >
                            <TableCell 
                              className="font-medium cursor-pointer"
                              onClick={() => navigate(`/issue/${report.id}`)}
                            >
                              <div className="max-w-sm">
                                <p className="truncate font-medium hover:text-urban-600">
                                  {report.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {categoryFormatted}
                                  </Badge>
                                  <span className={`text-xs ${getPriorityColor(report.severity)}`}>
                                    {report.severity} priority
                                  </span>
                                  <span className="hidden sm:inline text-xs text-muted-foreground">
                                    • {formattedDate}
                                  </span>
                                </div>
                                <div className="mt-2 md:hidden">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm truncate">
                                      {report.location.address}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      variant="outline" 
                                      className={getStatusBackgroundColor(report.status)}
                                    >
                                      {formatStatusLabel(report.status)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell 
                              className="hidden md:table-cell cursor-pointer"
                              onClick={() => navigate(`/issue/${report.id}`)}
                            >
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                                <span className="text-sm truncate max-w-[200px]">
                                  {report.location.address}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell 
                              className="hidden lg:table-cell cursor-pointer"
                              onClick={() => navigate(`/issue/${report.id}`)}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm">
                                  {formattedDate}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  by {report.reportedBy.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell 
                              className="hidden sm:table-cell cursor-pointer"
                              onClick={() => navigate(`/issue/${report.id}`)}
                            >
                              <Badge 
                                variant="outline" 
                                className={getStatusBackgroundColor(report.status)}
                              >
                                {formatStatusLabel(report.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Select
                                  value={report.status}
                                  onValueChange={(value) => handleStatusChange(report.id, value as ReportStatus)}
                                >
                                  <SelectTrigger className="w-[120px]" onClick={(e) => e.stopPropagation()}>
                                    <SelectValue placeholder="Update status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="reported">Reported</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, sortedReports.length)} of {sortedReports.length} results
                  </p>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={handleItemsPerPageChange}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={itemsPerPage} />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option.toString()}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ExportDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        reports={reports}
      />
    </div>
  );
};

export default AdminDashboard;
