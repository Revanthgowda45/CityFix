import React from 'react';
import { format as dateFormat } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { Report, ReportStatus } from '@/contexts/ReportContext';

interface PDFExportProps {
  data: Report[];
  dateRange: string;
  customStartDate?: string;
  customEndDate?: string;
}

/**
 * Exports report data to PDF by opening a new window with formatted HTML content
 * that can be printed or saved as PDF by the user
 */
export const exportToPDF = ({
  data,
  dateRange,
  customStartDate,
  customEndDate
}: PDFExportProps) => {
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
            width: 42px;
            height: 42px;
            margin-right: 10px;
            color: #2563eb;
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
            padding: 3px 6px;
            border-radius: 4px;
            font-size: 9pt;
            font-weight: 500;
            text-transform: uppercase;
          }
          
          .severity-high {
            color: #b91c1c;
          }
          
          .severity-medium {
            color: #b45309;
          }
          
          .severity-low {
            color: #047857;
          }
          
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            font-size: 9pt;
            color: #6b7280;
            text-align: center;
          }
          
          @media print {
            thead {
              display: table-header-group;
            }
            
            .page-break {
              page-break-before: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="header">
            <div class="logo-container">
              <svg 
                class="logo" 
                viewBox="0 0 48 48" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <defs>
                  <linearGradient id="cityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#2563eb" stop-opacity="0.9" />
                    <stop offset="100%" stop-color="#2563eb" stop-opacity="0.6" />
                  </linearGradient>
                  <clipPath id="circleClip">
                    <circle cx="24" cy="24" r="18" />
                  </clipPath>
                </defs>

                <circle 
                  cx="24" 
                  cy="24" 
                  r="22" 
                  fill="url(#cityGradient)" 
                  opacity="0.1"
                  stroke="#2563eb"
                  stroke-width="1.5"
                />
                
                <g clip-path="url(#circleClip)">
                  <rect x="10" y="18" width="4" height="20" rx="0" fill="#2563eb" opacity="0.7" />
                  <rect x="16" y="12" width="4" height="26" rx="0" fill="#2563eb" opacity="0.8" />
                  <rect x="22" y="8" width="4" height="30" rx="0" fill="#2563eb" opacity="0.9" />
                  <rect x="28" y="14" width="4" height="24" rx="0" fill="#2563eb" opacity="0.8" />
                  <rect x="34" y="19" width="4" height="19" rx="0" fill="#2563eb" opacity="0.7" />
                </g>
                
                <rect x="11" y="21" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
                <rect x="11" y="26" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
                <rect x="17" y="16" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
                <rect x="17" y="22" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
                <rect x="23" y="12" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
                <rect x="23" y="18" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
                <rect x="23" y="24" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
                <rect x="29" y="18" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
                <rect x="29" y="24" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
                <rect x="35" y="22" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
                <rect x="35" y="28" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
                
                <circle 
                  cx="33" 
                  cy="33" 
                  r="10" 
                  fill="#2563eb" 
                  stroke="white" 
                  stroke-width="1.5" 
                />
                
                <path 
                  d="M29 33L32 36L38 30" 
                  stroke="white" 
                  stroke-width="2"
                />
              </svg>
              <div class="logo-text">CityFix</div>
            </div>
            <div class="document-info">
              <div>Date: ${formattedDate}</div>
              <div>Time: ${formattedTime}</div>
            </div>
          </div>
          
          <div class="document-title">Issue Reports Summary</div>
          <div class="document-subtitle">${timeFrameText}</div>
          
          <div class="summary-section">
            <div class="summary-title">Report Summary</div>
            <div class="summary-content">
              <div><strong>Total Reports:</strong> ${data.length}</div>
              <div><strong>Status Distribution:</strong> ${statusSummary}</div>
              <div><strong>Category Distribution:</strong> ${categorySummary}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Created</th>
                <th>Location</th>
                <th>Upvotes</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((report, index) => {
                // Determine status color
                let statusStyle = '';
                const statusValue = report.status as string;
                if (statusValue === 'resolved' || statusValue === 'resolved_as_duplicate') {
                  statusStyle = 'background-color: #d1fae5; color: #065f46;';
                } else if (statusValue === 'in_progress') {
                  statusStyle = 'background-color: #fee2e2; color: #7f1d1d;';
                } else if (statusValue === 'under_review') {
                  statusStyle = 'background-color: #fef3c7; color: #92400e;';
                } else {
                  statusStyle = 'background-color: #e5e7eb; color: #374151;';
                }
                
                // Determine severity class
                let severityClass = '';
                switch (report.severity) {
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
                
                // Create page breaks every 10 rows for better printing
                const pageBreak = (index > 0 && index % 20 === 0) ? 'page-break' : '';
                
                return `
                  <tr class="${pageBreak}">
                    <td><strong>${report.title}</strong></td>
                    <td>${report.category.replace('_', ' ')}</td>
                    <td>
                      <span class="status-badge" style="${statusStyle}">
                        ${report.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td class="${severityClass}">${report.severity.toUpperCase()}</td>
                    <td>${createdDate}</td>
                    <td>${report.location.address || `${report.location.coordinates.lat.toFixed(6)}, ${report.location.coordinates.lng.toFixed(6)}`}</td>
                    <td>${report.upvotes}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            CityFix Reports Export - Generated on ${formattedDate} at ${formattedTime}
          </div>
        </div>
        
        <script>
          // Auto-print when loaded
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `;

  // Write the HTML content to the new window
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// Export a React component wrapper for the PDF export functionality
const PDFExport: React.FC<PDFExportProps> = (props) => {
  return null; // This is a utility component with no UI
};

export default PDFExport;
