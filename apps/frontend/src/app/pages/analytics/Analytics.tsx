import { BarChart3, TrendingUp, Users, Briefcase, AlertTriangle, Download, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

export default function Analytics() {
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exportData, setExportData] = useState({ format: 'csv', includeCharts: true });
  const [pdfData, setPdfData] = useState({ includeGraphs: true, includeDetails: true });
  const [shareData, setShareData] = useState({ email: '', message: '' });

  const projectMetrics = [
    { name: 'Jan', revenue: 120000, costs: 85000, profit: 35000 },
    { name: 'Feb', revenue: 150000, costs: 95000, profit: 55000 },
    { name: 'Mar', revenue: 180000, costs: 110000, profit: 70000 },
    { name: 'Apr', revenue: 220000, costs: 130000, profit: 90000 },
    { name: 'May', revenue: 260000, costs: 145000, profit: 115000 },
    { name: 'Jun', revenue: 310000, costs: 160000, profit: 150000 },
  ];

  const projectStatus = [
    { name: 'Completed', value: 12, color: '#10b981' },
    { name: 'In Progress', value: 8, color: '#3b82f6' },
    { name: 'Planning', value: 3, color: '#f59e0b' },
    { name: 'On Hold', value: 2, color: '#ef4444' },
  ];

  const teamProductivity = [
    { name: 'Week 1', productivity: 85, efficiency: 78 },
    { name: 'Week 2', productivity: 88, efficiency: 82 },
    { name: 'Week 3', productivity: 92, efficiency: 87 },
    { name: 'Week 4', productivity: 95, efficiency: 91 },
  ];

  const safetyStats = [
    { site: 'Site A', incidents: 2, nearmisses: 5, score: '95%' },
    { site: 'Site B', incidents: 1, nearmisses: 2, score: '98%' },
    { site: 'Site C', incidents: 3, nearmisses: 8, score: '90%' },
    { site: 'Site D', incidents: 0, nearmisses: 1, score: '99%' },
  ];

  const metrics = [
    { label: 'Active Projects', value: 8, icon: Briefcase, color: 'from-blue-600 to-cyan-600' },
    { label: 'Team Members', value: 24, icon: Users, color: 'from-green-600 to-emerald-600' },
    { label: 'Avg Safety Score', value: '95.5%', icon: AlertTriangle, color: 'from-orange-600 to-red-600' },
    { label: 'Growth Rate', value: '+28%', icon: TrendingUp, color: 'from-purple-600 to-pink-600' },
  ];

  const handleExportReport = () => {
    if (!exportData.format) {
      toast.error('Please select a format');
      return;
    }
    const fileName = `Analytics_Report_${new Date().toISOString().split('T')[0]}.${exportData.format}`;
    setExportDialogOpen(false);
    toast.success(`Report exported as ${fileName}`);
  };

  const handleDownloadPDF = () => {
    const fileName = `Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    setPdfDialogOpen(false);
    toast.success(`PDF downloaded: ${fileName}`);
  };

  const handleShareAnalytics = () => {
    if (!shareData.email) {
      toast.error('Please enter an email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setShareDialogOpen(false);
    setShareData({ email: '', message: '' });
    toast.success(`Analytics shared with ${shareData.email}`);
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Business insights and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  </div>
                  <div className={`bg-gradient-to-br ${metric.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue vs Costs Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Revenue vs Costs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
              <Bar dataKey="costs" fill="#ef4444" name="Costs" />
              <Bar dataKey="profit" fill="#10b981" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team Productivity Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Team Productivity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={teamProductivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="productivity" stroke="#3b82f6" name="Productivity %" />
                <Line type="monotone" dataKey="efficiency" stroke="#10b981" name="Efficiency %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Safety Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Statistics by Site</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {safetyStats.map((stat, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <h3 className="font-semibold text-gray-900 mb-3">{stat.site}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Incidents:</span>
                    <Badge variant={stat.incidents === 0 ? 'secondary' : 'destructive'}>
                      {stat.incidents}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Near Misses:</span>
                    <Badge variant="outline">{stat.nearmisses}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Safety Score:</span>
                    <span className="font-semibold text-green-600">{stat.score}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export & Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {/* Export Report Dialog */}
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                  Export Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Report</DialogTitle>
                  <DialogDescription>
                    Choose export format and options
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="format">Format</Label>
                    <select 
                      id="format"
                      className="w-full px-3 py-2 border rounded-md"
                      value={exportData.format}
                      onChange={(e) => setExportData({ ...exportData, format: e.target.value })}
                    >
                      <option value="csv">CSV</option>
                      <option value="xlsx">Excel (XLSX)</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-md">
                    <input 
                      type="checkbox" 
                      id="includeCharts"
                      checked={exportData.includeCharts}
                      onChange={(e) => setExportData({ ...exportData, includeCharts: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="includeCharts" className="cursor-pointer flex-1 mb-0">
                      Include chart data
                    </Label>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    onClick={handleExportReport}
                  >
                    Generate Report
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Download PDF Dialog */}
            <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Download PDF Report</DialogTitle>
                  <DialogDescription>
                    Select what to include in the PDF
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-md">
                    <input 
                      type="checkbox" 
                      id="includeGraphs"
                      checked={pdfData.includeGraphs}
                      onChange={(e) => setPdfData({ ...pdfData, includeGraphs: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="includeGraphs" className="cursor-pointer flex-1 mb-0">
                      Include charts and graphs
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-md">
                    <input 
                      type="checkbox" 
                      id="includeDetails"
                      checked={pdfData.includeDetails}
                      onChange={(e) => setPdfData({ ...pdfData, includeDetails: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="includeDetails" className="cursor-pointer flex-1 mb-0">
                      Include detailed statistics
                    </Label>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    onClick={handleDownloadPDF}
                  >
                    Download PDF
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Share Analytics Dialog */}
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Analytics
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Analytics Report</DialogTitle>
                  <DialogDescription>
                    Share this report with team members
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="share-email">Email Address</Label>
                    <Input
                      id="share-email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={shareData.email}
                      onChange={(e) => setShareData({ ...shareData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="share-message">Message (Optional)</Label>
                    <textarea
                      id="share-message"
                      placeholder="Add a message to include with the report..."
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      rows={4}
                      value={shareData.message}
                      onChange={(e) => setShareData({ ...shareData, message: e.target.value })}
                    />
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                    <p><strong>Recipients can:</strong></p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>View all charts and metrics</li>
                      <li>Download the report as PDF</li>
                      <li>Export data in multiple formats</li>
                    </ul>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    onClick={handleShareAnalytics}
                  >
                    Send Report
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
