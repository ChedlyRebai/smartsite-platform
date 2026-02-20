import { MapPin, Search, Filter, Navigation } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { mockSites } from '../../utils/mockData';
import { toast } from 'sonner';

export default function Map() {
  const [selectedSite, setSelectedSite] = useState<typeof mockSites[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredSites = mockSites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || site.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSelectSite = (site: typeof mockSites[0]) => {
    setSelectedSite(site);
    toast.info(`Selected: ${site.name}`);
  };

  const handleNavigate = (site: typeof mockSites[0]) => {
    toast.success(`Navigating to ${site.name}...`);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'in_progress': return 'bg-blue-500';
      case 'planning': return 'bg-yellow-500';
      case 'on_hold': return 'bg-red-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Map View</h1>
        <p className="text-gray-500 mt-1">Interactive map of all construction sites</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Site Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-green-50 relative overflow-hidden">
                  {/* Map Grid Background */}
                  <svg className="absolute inset-0 w-full h-full opacity-10">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>

                  {/* Site Markers */}
                  {filteredSites.map((site, idx) => {
                    const x = 10 + (idx % 3) * 30;
                    const y = 20 + Math.floor(idx / 3) * 25;
                    return (
                      <button
                        key={site.id}
                        onClick={() => handleSelectSite(site)}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 focus:outline-none transition-transform hover:scale-110"
                        style={{ left: `${x}%`, top: `${y}%` }}
                        title={site.name}
                      >
                        <div className={`w-10 h-10 rounded-full ${getStatusColor(site.status)} shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transition-shadow `}>
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                          {site.name}
                        </div>
                      </button>
                    );
                  })}

                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 text-xs space-y-1">
                    <p className="font-semibold text-gray-900 mb-2">Status:</p>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>Planning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>On Hold</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Completed</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedSite && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedSite.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{selectedSite.address}</p>
                      <p className="text-xs text-gray-500 mt-2">Area: {selectedSite.area} m²</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                      onClick={() => handleNavigate(selectedSite)}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Navigate
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sites List Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sites Near You</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search sites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Filter className="h-3 w-3 mr-2" />
                    Filter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Filter Sites</DialogTitle>
                    <DialogDescription>Filter by status</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    {['all', 'planning', 'in_progress', 'on_hold', 'completed'].map((status) => (
                      <Button
                        key={status}
                        variant={selectedStatus === status ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setSelectedStatus(status)}
                      >
                        {status === 'all' ? 'All Sites' : status.replace('_', ' ').toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="max-h-96 overflow-y-auto">
            <CardContent className="p-0">
              <div className="space-y-2">
                {filteredSites.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No sites found
                  </div>
                ) : (
                  filteredSites.map((site) => (
                    <button
                      key={site.id}
                      onClick={() => handleSelectSite(site)}
                      className={`w-full text-left p-3 border-l-4 transition-colors hover:bg-gray-50 ${
                        selectedSite?.id === site.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{site.name}</h4>
                          <p className="text-xs text-gray-500 mt-1 truncate">{site.address}</p>
                        </div>
                        <Badge
                          variant={
                            site.status === 'in_progress'
                              ? 'default'
                              : site.status === 'completed'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-xs whitespace-nowrap"
                        >
                          {site.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                        <span>{site.progress}% complete</span>
                        <span>${(site.budget / 1000000).toFixed(1)}M</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
