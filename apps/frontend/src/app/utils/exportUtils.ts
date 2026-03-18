import type { Site, SiteTeam } from '../types';

export interface SiteWithTeams extends Site {
  teams?: SiteTeam[];
}

// Format status for display
const formatStatus = (status: string): string => {
  const statusLabels: Record<string, string> = {
    'planning': 'Planning',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'on_hold': 'On Hold',
    'cancelled': 'Cancelled'
  };
  return statusLabels[status] || status;
};

// Format budget in TND
const formatBudget = (budget: number): string => {
  if (!budget) return '-';
  return budget.toLocaleString('fr-TN', { style: 'currency', currency: 'TND' });
};

// Format teams for export
const formatTeams = (teams: SiteTeam[] | undefined): string => {
  if (!teams || teams.length === 0) return 'No team assigned';
  return teams.map(t => {
    // Try different possible field names for team name
    if (t.name) return t.name;
    if (t.teamCode) return t.teamCode;
    if (t._id) return `Team ${t._id.substring(0, 8)}`;
    return 'Team';
  }).join(', ');
};

// Prepare site data for export
const prepareSiteData = (sites: SiteWithTeams[]) => {
  return sites.map(site => ({
    'Site Name': site.name,
    'Address': site.address,
    'Status': formatStatus(site.status),
    'Progress': `${site.progress}%`,
    'Area (m²)': site.area.toLocaleString(),
    'Budget (TND)': formatBudget(site.budget),
    'Start Date': site.workStartDate ? new Date(site.workStartDate).toLocaleDateString() : '-',
    'End Date': site.workEndDate ? new Date(site.workEndDate).toLocaleDateString() : '-',
    'Assigned Teams': formatTeams(site.teams)
  }));
};

// Export to CSV
export const exportSitesToCSV = (sites: SiteWithTeams[], fileName: string = 'sites.csv'): void => {
  const data = prepareSiteData(sites);
  
  if (data.length === 0) {
    alert('No data to export');
    return;
  }
  
  // Get headers from first row
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header as keyof typeof row];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
};

// Export to Excel (XLSX using simple HTML table method)
export const exportSitesToExcel = (sites: SiteWithTeams[], fileName: string = 'sites.xlsx'): void => {
  const data = prepareSiteData(sites);
  
  if (data.length === 0) {
    alert('No data to export');
    return;
  }
  
  // Get headers from first row
  const headers = Object.keys(data[0]);
  
  // Create HTML table for Excel
  let tableHtml = '<table>';
  
  // Add headers
  tableHtml += '<thead><tr>';
  headers.forEach(header => {
    tableHtml += `<th>${header}</th>`;
  });
  tableHtml += '</tr></thead>';
  
  // Add data rows
  tableHtml += '<tbody>';
  data.forEach(row => {
    tableHtml += '<tr>';
    headers.forEach(header => {
      tableHtml += `<td>${row[header as keyof typeof row]}</td>`;
    });
    tableHtml += '</tr>';
  });
  tableHtml += '</tbody></table>';
  
  // Create blob and download as .xls (Excel can open HTML tables)
  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
};

// Export to JSON
export const exportSitesToJSON = (sites: SiteWithTeams[], fileName: string = 'sites.json'): void => {
  const data = prepareSiteData(sites);
  
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
};
