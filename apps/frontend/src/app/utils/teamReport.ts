import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TeamReportData {
  _id: string;
  name: string;
  description?: string;
  teamCode?: string;
  members: any[];
  isActive: boolean;
  siteName?: string;
}

export const generateTeamsPDFReport = (teams: TeamReportData[], siteAssignments: Record<string, { siteName: string }>) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Rapport des Équipes', 14, 22);
  
  // Date
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
  
  // Summary statistics
  const totalTeams = teams.length;
  const activeTeams = teams.filter(t => t.isActive).length;
  const totalMembers = teams.reduce((sum, t) => sum + (t.members?.length || 0), 0);
  
  doc.setFontSize(12);
  doc.text(`Total des équipes: ${totalTeams}`, 14, 40);
  doc.text(`Équipes actives: ${activeTeams}`, 14, 46);
  doc.text(`Total des membres: ${totalMembers}`, 14, 52);
  
  // Table
  const tableData = teams.map((team, index) => [
    index + 1,
    team.name,
    team.teamCode || '-',
    team.members?.length?.toString() || '0',
    team.isActive ? 'Oui' : 'Non',
    siteAssignments[team._id]?.siteName || '-'
  ]);
  
  autoTable(doc, {
    head: [['#', 'Nom', 'Code', 'Membres', 'Active', 'Chantier']],
    body: tableData,
    startY: 60,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save
  doc.save(`rapport-equipes-${new Date().toISOString().split('T')[0]}.pdf`);
};
