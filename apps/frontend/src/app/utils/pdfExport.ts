import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Site, SiteTeam } from '../types';

export interface SiteWithTeams extends Site {
  teams?: SiteTeam[];
}

export const exportSitesToPDF = (sites: SiteWithTeams[], fileName: string = 'sites-report.pdf'): void => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('SmartSite - Chantiers Report', 14, 22);
  
  // Add generation date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generated: ${date}`, 14, 30);
  
  // Summary stats
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  const totalSites = sites.length;
  const inProgress = sites.filter(s => s.status === 'in_progress').length;
  const completed = sites.filter(s => s.status === 'completed').length;
  const planning = sites.filter(s => s.status === 'planning').length;
  
  doc.text(`Total Sites: ${totalSites} | In Progress: ${inProgress} | Completed: ${completed} | Planning: ${planning}`, 14, 38);
  
  // Add TND note
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Budget in Tunisian Dinar (TND)', 14, 44);
  
  // Sites table data
  const tableData = sites.map(site => {
    const statusLabels: Record<string, string> = {
      'planning': 'Planning',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'on_hold': 'On Hold',
      'cancelled': 'Cancelled'
    };
    
    // Format teams assigned to this site
    const teamsText = site.teams && site.teams.length > 0 
      ? site.teams.map(t => t.name || t._id).join(', ')
      : 'No team assigned';
    
    return [
      site.name,
      site.address,
      statusLabels[site.status] || site.status,
      `${site.progress}%`,
      site.area.toLocaleString() + ' m²',
      site.budget ? site.budget.toLocaleString('fr-TN', { style: 'currency', currency: 'TND' }) : '-',
      teamsText
    ];
  });
  
  // Create the main table
  autoTable(doc, {
    head: [['Site Name', 'Address', 'Status', 'Progress', 'Area', 'Budget (TND)', 'Assigned Teams']],
    body: tableData,
    startY: 50,
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [60, 60, 60]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { cellWidth: 25, fontStyle: 'bold' },
      1: { cellWidth: 35 },
      2: { cellWidth: 20 },
      3: { cellWidth: 15 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 45 }
    },
    didParseCell: function(data) {
      // Color code the status cells
      if (data.section === 'body' && data.column.index === 2) {
        const status = data.cell.raw as string;
        if (status === 'In Progress') {
          data.cell.styles.textColor = [39, 174, 96];
        } else if (status === 'Completed') {
          data.cell.styles.textColor = [41, 128, 185];
        } else if (status === 'Planning') {
          data.cell.styles.textColor = [241, 196, 15];
        }
      }
    }
  });
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  doc.save(fileName);
};

export const exportSingleSiteToPDF = (site: SiteWithTeams): void => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(`Site Details: ${site.name}`, 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Generated: ${date}`, 14, 30);
  
  // Site information
  const statusLabels: Record<string, string> = {
    'planning': 'Planning',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'on_hold': 'On Hold',
    'cancelled': 'Cancelled'
  };
  
  let yPos = 45;
  
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Site Information', 14, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  const siteInfo = [
    ['Name:', site.name],
    ['Address:', site.address],
    ['Status:', statusLabels[site.status] || site.status],
    ['Progress:', `${site.progress}%`],
    ['Area:', `${site.area.toLocaleString()} m²`],
    ['Budget:', site.budget ? site.budget.toLocaleString('fr-TN', { style: 'currency', currency: 'TND' }) : '-'],
    ['Start Date:', site.workStartDate ? new Date(site.workStartDate).toLocaleDateString() : '-'],
    ['End Date:', site.workEndDate ? new Date(site.workEndDate).toLocaleDateString() : '-'],
  ];
  
  siteInfo.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold');
    doc.text(label, 14, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(value as string, 60, yPos);
    yPos += 7;
  });
  
  // Teams section
  yPos += 10;
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Assigned Teams', 14, yPos);
  
  yPos += 10;
  
  if (site.teams && site.teams.length > 0) {
    const teamData = site.teams.map(team => [
      team.name || 'Team',
      team.description || '-',
      team.teamCode || '-'
    ]);
    
    autoTable(doc, {
      head: [['Team Name', 'Description', 'Team Code']],
      body: teamData,
      startY: yPos,
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('No teams assigned to this site', 14, yPos);
  }
  
  // Save the PDF
  const safeName = site.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`${safeName}_details.pdf`);
};
