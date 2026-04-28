import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import axios from 'axios';
import { Plus, MapPin, Search, Filter, Trash2, Edit, ChevronRight, AlertCircle, CheckCircle2, Clock, PauseCircle, Users, FileDown, SortAsc, SortDesc, RefreshCw, MessageSquare, AlertTriangle, Flag, X, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { useAuthStore } from '../../store/authStore';
import { mockSites, mockTeamMembers } from '../../utils/mockData';
import { toast } from 'sonner';
import type { Site } from '../../types';
import { fetchSites, createSite, updateSite, deleteSite, assignTeamToSite, removeTeamFromSite, getTeamsAssignedToSite, getAllSitesWithTeams } from '../../action/site.action';
import { getAllUsers, assignUserToSite } from '../../action/user.action';
import { getAllTeams, getTeamById, assignSiteToTeam } from '../../action/team.action';
import { exportSitesToPDF, exportSingleSiteToPDF } from '../../utils/pdfExport';
import { exportSitesToCSV, exportSitesToExcel, exportSitesToJSON } from '../../utils/exportUtils';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Tunisia center coordinates - proper tuple type for Leaflet
const TUNISIA_CENTER: LatLngExpression = [33.8869, 9.5375];

// Status configuration for consistent styling
const STATUS_CONFIG = {
  planning: {
    label: 'Planning',
    variant: 'outline' as const,
    icon: Clock,
    color: 'text-blue-600 bg-blue-50',
    progressColor: 'bg-blue-600'
  },
  in_progress: {
    label: 'In Progress',
    variant: 'default' as const,
    icon: CheckCircle2,
    color: 'text-green-600 bg-green-50',
    progressColor: 'bg-green-600'
  },
  on_hold: {
    label: 'On Hold',
    variant: 'destructive' as const,
    icon: PauseCircle,
    color: 'text-amber-600 bg-amber-50',
    progressColor: 'bg-amber-600'
  },
  completed: {
    label: 'Completed',
    variant: 'secondary' as const,
    icon: CheckCircle2,
    color: 'text-gray-600 bg-gray-50',
    progressColor: 'bg-gray-600'
  }
};

// Priority configuration
const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Flag },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Flag },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: Flag },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-300', icon: Flag }
};

// Issue type configuration
const ISSUE_CONFIG = {
  delay: { label: 'Delay', color: 'text-amber-600 bg-amber-50', icon: Clock },
  budget: { label: 'Budget', color: 'text-red-600 bg-red-50', icon: AlertCircle },
  safety: { label: 'Safety', color: 'text-red-600 bg-red-50', icon: AlertTriangle },
  quality: { label: 'Quality', color: 'text-purple-600 bg-purple-50', icon: AlertCircle },
  resource: { label: 'Resource', color: 'text-blue-600 bg-blue-50', icon: Users },
  other: { label: 'Other', color: 'text-gray-600 bg-gray-50', icon: AlertCircle }
};

// Map picker component
function MapPicker({ position, setPosition, onLocationSelect }: { position: { lat: number; lng: number } | null; setPosition: (pos: { lat: number; lng: number }) => void; onLocationSelect?: (pos: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPos);
      if (onLocationSelect) {
        onLocationSelect(newPos);
      }
    },
  });
  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

export default function Sites() {
  const user = useAuthStore((state) => state.user);
  const { projectId: projectIdFromUrl } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const isProjectContext = !!projectIdFromUrl;
  const currentProjectId = isProjectContext ? projectIdFromUrl : null;

  const [projectSiteLimit, setProjectSiteLimit] = useState<number | null>(null);
  const [projectBudget, setProjectBudget] = useState<number | null>(null);

  useEffect(() => {
    if (isProjectContext && currentProjectId) {
      axios.get(`http://localhost:3010/projects/${currentProjectId}`)
        .then(res => {
          if (res.data?.siteCount !== undefined) {
            setProjectSiteLimit(res.data.siteCount);
          }
          if (res.data?.budget !== undefined) {
            setProjectBudget(res.data.budget);
          }
        })
        .catch(err => console.error('Error fetching project:', err));
    }
  }, [isProjectContext, currentProjectId]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'progress' | 'priority' | 'budget'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showProblemsOnly, setShowProblemsOnly] = useState(false);

  // Sites data
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesWithTeams, setSitesWithTeams] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  const canManageSites = true;
  const currentSiteCount = sites.filter(s => s.projectId === currentProjectId).length;
  const isLimitReached = projectSiteLimit !== null && currentSiteCount >= projectSiteLimit;

  // Real-time refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Form state
  const [newSite, setNewSite] = useState({ name: '', address: '', area: '', budget: '', clientName: '' });
  const [selectedStatusEdit, setSelectedStatusEdit] = useState('all');
  const [addressSearchLoading, setAddressSearchLoading] = useState(false);
  const [nearbyFournisseurs, setNearbyFournisseurs] = useState<Array<{ _id: string; nom: string; adresse: string; telephone: string; categories: string[] }>>([]);

  // Dialog state
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [issuesDialogOpen, setIssuesDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  // Manage data
  const [manageData, setManageData] = useState({
    status: '',
    progress: 0,
    name: '',
    address: '',
    area: 0,
    budget: 0,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    clientName: '',
    teamId: ''
  });
  const [mapPosition, setMapPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [editMapPosition, setEditMapPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; address?: string; area?: string; budget?: string }>({});
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [availableTeams, setAvailableTeams] = useState<Array<{ _id: string; name: string }>>([]);

  // Comments state
  const [newComment, setNewComment] = useState('');
  const [siteComments, setSiteComments] = useState<Record<string, Array<{ id: string; text: string; author: string; createdAt: string }>>>(() => {
    // Load comments from localStorage on initial render
    const saved = localStorage.getItem('siteComments');
    return saved ? JSON.parse(saved) : {};
  });

  // Issues state
  const [newIssue, setNewIssue] = useState({ type: 'other', severity: 'medium', description: '' });
  const [siteIssues, setSiteIssues] = useState<Record<string, Array<{ id: string; type: string; severity: string; description: string; createdAt: string; resolved: boolean }>>>(() => {
    // Load issues from localStorage on initial render
    const saved = localStorage.getItem('siteIssues');
    return saved ? JSON.parse(saved) : {};
  });

  // Export history state
  const [exportHistoryOpen, setExportHistoryOpen] = useState(false);
  const [exportHistory, setExportHistory] = useState<Array<{ id: string; format: string; filename: string; siteCount: number; downloadedAt: string; downloadedBy: string }>>(() => {
    // Load export history from localStorage on initial render
    const saved = localStorage.getItem('exportHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // Team management state
  const [siteTeams, setSiteTeams] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Clients list state — only users with role "client"
  const [clientsList, setClientsList] = useState<Array<{ _id: string; firstName?: string; lastName?: string; email?: string; name?: string }>>([]);

  useEffect(() => {
    const token = user?.access_token;
    // Use /users/role/client which filters by role in DB (approved users only)
    axios.get(`${import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3000'}/users/role/client`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((res) => {
      if (Array.isArray(res.data)) {
        setClientsList(res.data);
      }
    }).catch(() => {});
  }, []);

  // Auto-refresh for real-time updates
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadSites();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Load sites from API
  useEffect(() => {
    loadSites();
  }, [selectedStatus, selectedPriority]);

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedPriority, sortBy, sortOrder]);

  // Load available teams when add dialog opens
  useEffect(() => {
    if (addDialogOpen) {
      loadAvailableTeams();
    }
  }, [addDialogOpen]);

  const loadAvailableTeams = async () => {
    try {
      const response = await getAllTeams();
      // Check if response is successful and data is an array
      if (!response || response.status !== 200 || !Array.isArray(response.data)) {
        console.error('Invalid response:', response);
        // Fallback to mock data
        setAvailableTeams(mockTeamMembers.map(user => ({
          _id: user._id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
        })));
        return;
      }
      // Load all teams from the database
      const teams = response.data
        .map((team: any) => ({
          _id: team._id,
          name: team.name
        }));
      setAvailableTeams(teams);
    } catch (err) {
      console.error('Error loading teams, using mock data:', err);
      // Fallback to mock data
      setAvailableTeams(mockTeamMembers.map(user => ({
        _id: user._id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
      })));
    }
  };

  const loadSites = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        limit: 100,
        status: selectedStatus === 'all' ? undefined : selectedStatus
      };

      if (currentProjectId) {
        filters.projectId = currentProjectId;
      }

      const [response, sitesWithTeamsData] = await Promise.all([
        fetchSites(filters),
        getAllSitesWithTeams()
      ]);

      console.log('Sites loaded from API:', response.data);
      console.log('Sites with teams:', sitesWithTeamsData);
      setSites(response.data);
      setSitesWithTeams(sitesWithTeamsData as Site[]);
      setUseMockData(false);
    } catch (err) {
      console.error('Error loading sites, using mock data:', err);
      setError('Backend not available, using mock data');
      setSites(mockSites);
      setUseMockData(true);
      toast.warning('Offline mode - demo data');
    } finally {
      setLoading(false);
    }
  };

  const searchAddressOnMap = async (address: string) => {
    if (!address.trim() || address.length < 5) {
      toast.warning('Veuillez entrer une adresse plus complète');
      return;
    }

    setAddressSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=tn`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newPosition = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
        setMapPosition(newPosition);
        setErrors(prev => ({ ...prev, address: undefined }));
        toast.success(`Localisation trouvée!`);

        // Search for nearby fournisseurs
        await searchNearbyFournisseurs(newPosition);
      } else {
        toast.warning('Adresse non trouvée en Tunisie. Cliquez sur la carte pour sélectionner.');
        setNearbyFournisseurs([]);
      }
    } catch (error) {
      console.error('Erreur géocodage:', error);
      toast.error('Erreur lors de la recherche');
      setNearbyFournisseurs([]);
    } finally {
      setAddressSearchLoading(false);
    }
  };

  // Search for nearby fournisseurs based on coordinates
  const searchNearbyFournisseurs = async (position: { lat: number; lng: number }) => {
    try {
      // Get all active fournisseurs from API
      const response = await fetch('/api/fournisseurs?actif=true');
      let fournisseurs = [];

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          fournisseurs = data;
        } else if (data?.data) {
          fournisseurs = data.data;
        }
      }

      // Filter fournisseurs that have coordinates and calculate distance
      const fournisseursWithDistance = fournisseurs
        .filter((f: any) => f.coordinates?.lat && f.coordinates?.lng)
        .map((f: any) => {
          const fLat = f.coordinates.lat;
          const fLng = f.coordinates.lng;
          // Simple distance calculation (approximate)
          const distance = Math.sqrt(
            Math.pow((fLat - position.lat) * 111, 2) +
            Math.pow((fLng - position.lng) * 111 * Math.cos(position.lat * Math.PI / 180), 2)
          );
          return { ...f, distance };
        })
        .sort((a: any, b: any) => a.distance - b.distance)
        .slice(0, 10); // Top 10 nearest

      setNearbyFournisseurs(fournisseursWithDistance.map((f: any) => ({
        _id: f._id,
        nom: f.nom || '',
        adresse: f.adresse || '',
        telephone: f.telephone || '',
        categories: f.categories || []
      })));

      if (fournisseursWithDistance.length > 0) {
        toast.info(`${fournisseursWithDistance.length} fournisseurs trouvés à proximité`);
      }
    } catch (error) {
      console.error('Erreur recherche fournisseurs:', error);
      setNearbyFournisseurs([]);
    }
  };

  const handleAddressChange = (value: string) => {
    setNewSite({ ...newSite, address: value });
  };

  const filteredAndSortedSites = sites
    .filter(site => {
      const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.address.toLowerCase().includes(searchTerm.toLowerCase());

      // Check priority filter
      const matchesPriority = selectedPriority === 'all' || site.priority === selectedPriority;

      // Check for problems (issues or delays)
      const hasIssues = siteIssues[site.id]?.some(issue => !issue.resolved) || false;
      const isOverdue = site.status !== 'completed' && new Date(site.workEndDate || site.workStartDate) < new Date();
      const hasProblems = hasIssues || isOverdue;

      if (showProblemsOnly && !hasProblems) return false;
      if (!matchesPriority) return false;
      return matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.workStartDate).getTime() - new Date(b.workStartDate).getTime();
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          comparison = (priorityOrder[a.priority || 'low'] || 3) - (priorityOrder[b.priority || 'low'] || 3);
          break;
        case 'budget':
          comparison = a.budget - b.budget;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 3;

  // Reset page when filters change
  const paginatedSites = filteredAndSortedSites.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalSitePages = Math.ceil(filteredAndSortedSites.length / PAGE_SIZE);

  // Format budget in Tunisian Dinar
  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(budget);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-TN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Handle add comment
  const handleAddComment = () => {
    if (!selectedSite || !newComment.trim()) return;

    const comment = {
      id: Date.now().toString(),
      text: newComment,
      author: user?.firstName || 'User',
      createdAt: new Date().toISOString()
    };

    setSiteComments(prev => {
      const newComments = {
        ...prev,
        [selectedSite.id]: [...(prev[selectedSite.id] || []), comment]
      };
      localStorage.setItem('siteComments', JSON.stringify(newComments));
      return newComments;
    });

    setNewComment('');
    toast.success('Comment added');
  };

  // Handle add issue
  const handleAddIssue = () => {
    if (!selectedSite || !newIssue.description.trim()) return;

    const issue = {
      id: Date.now().toString(),
      type: newIssue.type,
      severity: newIssue.severity,
      description: newIssue.description,
      createdAt: new Date().toISOString(),
      resolved: false
    };

    setSiteIssues(prev => {
      const newIssues = {
        ...prev,
        [selectedSite.id]: [...(prev[selectedSite.id] || []), issue]
      };
      localStorage.setItem('siteIssues', JSON.stringify(newIssues));
      return newIssues;
    });

    setNewIssue({ type: 'other', severity: 'medium', description: '' });
    toast.success('Issue reported');
  };

  // Handle resolve issue
  const handleResolveIssue = (issueId: string) => {
    if (!selectedSite) return;

    setSiteIssues(prev => {
      const newIssues = {
        ...prev,
        [selectedSite.id]: prev[selectedSite.id].map(issue =>
          issue.id === issueId ? { ...issue, resolved: true } : issue
        )
      };
      localStorage.setItem('siteIssues', JSON.stringify(newIssues));
      return newIssues;
    });
    toast.success('Issue resolved');
  };

  // Validate new site form
  const validateForm = () => {
    const newErrors: { name?: string; address?: string; area?: string; budget?: string } = {};

    if (!newSite.name.trim()) {
      newErrors.name = 'Site name is required';
    }

    if (!newSite.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!newSite.area) {
      newErrors.area = 'Area is required';
    } else if (parseInt(newSite.area) <= 0) {
      newErrors.area = 'Area must be greater than 0';
    }

    if (!newSite.budget) {
      newErrors.budget = 'Budget is required';
    } else if (parseInt(newSite.budget) <= 0) {
      newErrors.budget = 'Budget must be greater than 0';
    } else if (currentProjectId && projectBudget !== null) {
      // Sum of existing sites budgets for this project
      const existingSitesBudget = sites
        .filter(s => s.projectId === currentProjectId)
        .reduce((sum, s) => sum + (s.budget || 0), 0);
      const newBudget = parseInt(newSite.budget);
      if (existingSitesBudget + newBudget > projectBudget) {
        const remaining = projectBudget - existingSitesBudget;
        newErrors.budget = `Budget exceeds project limit. Remaining: ${new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', minimumFractionDigits: 0 }).format(remaining > 0 ? remaining : 0)}`;
      }
    }

    if (!mapPosition) {
      toast.error('Please select a location on the map');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validateEditForm = () => {
    const newErrors: { name?: string; address?: string; area?: string; budget?: string } = {};

    if (!manageData.name.trim()) {
      newErrors.name = 'Site name is required';
    }

    if (!manageData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!manageData.area || manageData.area <= 0) {
      newErrors.area = 'Area must be greater than 0';
    }

    if (!manageData.budget || manageData.budget <= 0) {
      newErrors.budget = 'Budget must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle open team dialog
  const handleOpenTeamDialog = async (site: Site) => {
    setSelectedSite(site);
    setLoadingTeams(true);
    try {
      const teams = await getTeamsAssignedToSite(site.id);
      setSiteTeams(teams || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setSiteTeams([]);
    }
    setLoadingTeams(false);
    setTeamDialogOpen(true);
  };

  // Handle assign team to site
  const handleAssignTeam = async () => {
    if (!selectedSite || !selectedUserId) {
      toast.error('Please select a team to assign');
      return;
    }

    // Get the team details to check if it has members
    const team = availableTeams.find((t: any) => t._id === selectedUserId);
    if (!team) {
      toast.error('Team not found');
      return;
    }

    // Check if team has members - this is a requirement
    // We need to fetch the team details to check members count
    try {
      const teamDetails = await getTeamById(selectedUserId);
      if (teamDetails && teamDetails.data && teamDetails.data.members) {
        const memberCount = teamDetails.data.members.length;
        if (memberCount === 0) {
          toast.error('This team has no members. Please add members to the team before assigning it to a site.');
          return;
        }
      }

      // First, assign team to site in gestion-sites (site knows about the team)
      await assignTeamToSite(selectedSite.id, selectedUserId);

      // Also update the team to record which site it's assigned to (team knows about the site)
      await assignSiteToTeam(selectedUserId, selectedSite.id);

      toast.success('Team assigned successfully');
      const teams = await getTeamsAssignedToSite(selectedSite.id);
      setSiteTeams(teams || []);
      setSelectedUserId('');
    } catch (error: any) {
      toast.error(error?.message || 'Error assigning team');
    }
  };

  // Handle remove team from site
  const handleRemoveTeam = async (userId: string) => {
    if (!selectedSite) return;
    try {
      await removeTeamFromSite(selectedSite.id, userId);
      toast.success('Team removed successfully');
      const teams = await getTeamsAssignedToSite(selectedSite.id);
      setSiteTeams(teams || []);
    } catch (error: any) {
      toast.error(error?.message || 'Error removing team');
    }
  };

  const handleAddSite = async () => {
    if (!validateForm()) {
      toast.error('Please correct the form errors');
      return;
    }

    if (isLimitReached) {
      return;
    }

    try {
      if (useMockData) {
        const site: Site = {
          id: String(sites.length + 1),
          name: newSite.name,
          address: newSite.address,
          status: 'planning',
          area: parseInt(newSite.area),
          budget: parseInt(newSite.budget),
          progress: 0,
          workStartDate: new Date().toISOString(),
          projectId: currentProjectId || String(sites.length + 1),
          coordinates: mapPosition || { lat: 0, lng: 0 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSites([...sites, site]);
        resetAddForm();
        toast.success('Site added successfully!');
      } else {
        const site: Partial<Site> = {
          name: newSite.name,
          address: newSite.address,
          area: parseInt(newSite.area),
          budget: parseInt(newSite.budget),
          status: 'planning',
          progress: 0,
          workStartDate: new Date().toISOString(),
          projectId: currentProjectId || undefined,
          clientName: newSite.clientName || undefined,
          coordinates: mapPosition || { lat: 0, lng: 0 },
        };

        const createdSite = await createSite(site);
        setSites([...sites, createdSite]);

        // Assign team to site if selected
        if (selectedTeam && createdSite.id) {
          try {
            await assignTeamToSite(createdSite.id, selectedTeam);
            toast.success('Site created and team assigned successfully!');
          } catch (teamError) {
            console.error('Error assigning team to site:', teamError);
            toast.warning('Site created but team assignment failed');
          }
        } else {
          toast.success('Site added successfully!');
        }
        resetAddForm();
      }
    } catch (error: any) {
      console.error('Error creating site:', error);
      const errorData = error?.response?.data;
      const backendMessage = errorData?.message || error?.message || '';
      console.log('Backend error:', backendMessage);

      if (backendMessage.toLowerCase().includes('budget') || backendMessage.toLowerCase().includes('exceeds')) {
        setBudgetError(backendMessage);
      } else {
        toast.error(backendMessage || 'Error creating site');
      }
    }
  };

  const resetAddForm = () => {
    setNewSite({ name: '', address: '', area: '', budget: '', clientName: '' });
    setMapPosition(null);
    setErrors({});
    setBudgetError(null);
    setSelectedTeam('');
    setNearbyFournisseurs([]);
    setAddDialogOpen(false);
  };

  const handleViewDetails = (site: Site) => {
    setSelectedSite(site);
    setViewDetailsOpen(true);
  };

  const handleManageSite = (site: Site) => {
    setSelectedSite(site);
    setManageData({
      status: site.status,
      progress: site.progress,
      name: site.name,
      address: site.address,
      area: site.area,
      budget: site.budget,
      priority: site.priority || 'medium',
      clientName: site.clientName || '',
      teamId: (site.teams?.[0] as any)?._id || (site.teams?.[0] as any) || ''
    });
    setEditMapPosition(site.coordinates || null);
    setErrors({});
    // Charger les teams disponibles si pas encore chargées
    if (availableTeams.length === 0) {
      loadAvailableTeams();
    }
    setManageDialogOpen(true);
  };

  const handleDeleteSite = (site: Site) => {
    setSelectedSite(site);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedSite) return;

    try {
      if (useMockData) {
        setSites(sites.filter(s => s.id !== selectedSite.id));
        toast.success('Site deleted successfully!');
      } else {
        await deleteSite(selectedSite.id);
        setSites(sites.filter(s => s.id !== selectedSite.id));
        toast.success('Site deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting site:', error);
      toast.error('Error deleting site');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedSite(null);
    }
  };

  const handleSaveManage = async () => {
    if (!validateEditForm()) {
      toast.error('Please correct the form errors');
      return;
    }

    try {
      if (useMockData) {
        setSites(sites.map(s =>
          s.id === selectedSite.id
            ? {
              ...s,
              status: manageData.status as 'planning' | 'in_progress' | 'on_hold' | 'completed',
              progress: manageData.progress,
              name: manageData.name,
              address: manageData.address,
              area: manageData.area,
              budget: manageData.budget,
              coordinates: editMapPosition || s.coordinates
            }
            : s
        ));
        setManageDialogOpen(false);
        toast.success('Site updated successfully!');
      } else {
        const updatedSite = await updateSite(selectedSite!.id, {
          status: manageData.status as 'planning' | 'in_progress' | 'on_hold' | 'completed',
          progress: manageData.progress,
          name: manageData.name,
          address: manageData.address,
          area: manageData.area,
          coordinates: editMapPosition || undefined,
          clientName: manageData.clientName,
          ...(manageData.teamId && { teamIds: [manageData.teamId] }),
        });

        setSites(sites.map(s =>
          s.id === selectedSite.id
            ? updatedSite
            : s
        ));
        setManageDialogOpen(false);
        toast.success('Site updated successfully!');
      }
    } catch (error) {
      console.error('Error updating site:', error);
      toast.error('Error updating site');
    }
  };

  // Get status icon component
  const StatusIcon = ({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.planning;
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color.split(' ')[0]}`} />;
  };

  // Handle PDF export - always fetch fresh data from MongoDB
  const handleExportPDF = async () => {
    try {
      const sitesData = await getAllSitesWithTeams();
      if (sitesData && sitesData.length > 0) {
        exportSitesToPDF(sitesData as Site[], `smartsite-sites-${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('PDF exported successfully with ' + sitesData.length + ' sites!');
      } else {
        toast.error('No sites found in database');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF - please ensure backend is running');
    }
  };

  // Handle export in different formats
  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      toast.info('Generating export...');

      // Fetch sites filtered by current project if in project context
      const SITE_URL = (import.meta as any).env?.VITE_GESTION_SITE_URL ?? 'http://localhost:3001/api';
      const params: any = { limit: 1000 };
      if (currentProjectId) params.projectId = currentProjectId;
      const res = await axios.get(`${SITE_URL}/gestion-sites`, { params });
      const sitesData: any[] = res.data?.data || res.data || [];

      if (!sitesData || sitesData.length === 0) {
        toast.error('No sites found');
        return;
      }

      const dateStr = new Date().toISOString().split('T')[0];

      if (format === 'excel') {
        exportSitesToExcel(sitesData as Site[], `smartsite-sites-${dateStr}.xls`);
        toast.success(`Excel exported with ${sitesData.length} sites!`);
        return;
      }

      // ── PDF with SmartSite design ──
      const fmtBudget = (n: number) =>
        Number(n).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' DT';

      const statusLabel2 = (s: string) => {
        const map: Record<string, string> = {
          planning: 'Planning', in_progress: 'In Progress',
          on_hold: 'On Hold', completed: 'Completed',
        };
        return map[s] || s || '-';
      };

      const logoBase64 = await fetch('/logo.png')
        .then(r => r.blob())
        .then(blob => new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }))
        .catch(() => null);

      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // Header banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 36, 'F');
      if (logoBase64) doc.addImage(logoBase64, 'PNG', 10, 5, 24, 24);
      const textX = logoBase64 ? 40 : 14;
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SmartSite - Sites Report', textX, 17);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      const now = new Date();
      doc.text(
        `Generated: ${now.toLocaleDateString('fr-FR')} ${now.toLocaleTimeString('fr-FR')}   |   Total sites: ${sitesData.length}`,
        textX, 26
      );

      let y = 44;

      // Summary box
      const totalBudget = sitesData.reduce((s: number, site: any) => s + (Number(site.budget) || 0), 0);
      const completed = sitesData.filter((s: any) => s.status === 'completed').length;
      const inProgress = sitesData.filter((s: any) => s.status === 'in_progress').length;

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(10, y, pageW - 20, 20, 3, 3, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(10, y, pageW - 20, 20, 3, 3, 'S');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY', 15, y + 6);
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`Total Budget: ${fmtBudget(totalBudget)}`, 15, y + 14);
      doc.text(`Completed: ${completed}   |   In Progress: ${inProgress}   |   Total: ${sitesData.length}`, pageW / 2 + 5, y + 14);

      y += 28;

      // Sites table
      autoTable(doc, {
        startY: y,
        head: [['Site Name', 'Location', 'Client', 'Budget (DT)', 'Status', 'Progress', 'Area (m2)']],
        body: sitesData.map((s: any) => [
          s.nom || s.name || '-',
          s.localisation || s.adresse || s.address || '-',
          s.clientName || '-',
          fmtBudget(Number(s.budget) || 0),
          statusLabel2(s.status || ''),
          `${s.progress || 0}%`,
          (s.area || 0).toLocaleString('de-DE'),
        ]),
        foot: [[
          { content: `${sitesData.length} site(s)`, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
          { content: `Total: ${fmtBudget(totalBudget)}`, colSpan: 4, styles: { fontStyle: 'bold', halign: 'right', fillColor: [226, 232, 240] } },
        ]],
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8, fontStyle: 'bold', cellPadding: 3 },
        footStyles: { textColor: [15, 23, 42], fontSize: 8, cellPadding: 3 },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 36 },
          1: { cellWidth: 32 },
          2: { cellWidth: 26 },
          3: { cellWidth: 28, halign: 'right' },
          4: { cellWidth: 22 },
          5: { cellWidth: 16, halign: 'center' },
          6: { cellWidth: 18, halign: 'right' },
        },
        margin: { left: 10, right: 10 },
      });

      // Footer on every page
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(15, 23, 42);
        doc.rect(0, pageH - 10, pageW, 10, 'F');
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('SmartSite Platform - Confidential', 10, pageH - 4);
        doc.text(`Page ${i} / ${totalPages}`, pageW - 10, pageH - 4, { align: 'right' });
      }

      doc.save(`smartsite-sites-${dateStr}.pdf`);
      toast.success(`PDF exported with ${sitesData.length} sites!`);

    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export');
    }
  };

  return (
    <div className="space-y-6">
      {isProjectContext && (
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-2 pl-0 hover:bg-transparent hover:text-blue-600"
        >
          <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
          Back to Projects
        </Button>
      )}
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isProjectContext ? `Sites - Project` : 'Sites'}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            {filteredAndSortedSites.length} site{filteredAndSortedSites.length !== 1 ? 's' : ''} •
            <span className="ml-1">
              {sites.filter(s => s.status === 'in_progress').length} in progress
            </span>
            {projectSiteLimit !== null && (
              <span className="ml-1 text-blue-600">
                {' • '}{currentSiteCount} / {projectSiteLimit} sites
              </span>
            )}
          </p>
        </div>
        {canManageSites && isProjectContext ? (
          <div className="flex gap-2">
            {/* Export PDF */}
            <Button
              variant="outline"
              className="border-gray-200 hover:bg-gray-50 font-semibold"
              onClick={() => handleExport('pdf')}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>

            {/* Export Excel */}
            <Button
              variant="outline"
              className="border-gray-200 hover:bg-gray-50 font-semibold"
              onClick={() => handleExport('excel')}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export Excel
            </Button>

            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLimitReached}
                  title={isLimitReached ? `Limite de ${projectSiteLimit} site(s) atteinte` : undefined}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Site
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Add New Site</DialogTitle>
                  <DialogDescription>
                    Fill in the information below to create a new site
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="site-name" className="text-sm font-medium">
                        Site Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="site-name"
                        placeholder="e.g., Downtown Office Tower"
                        value={newSite.name}
                        onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                        className={errors.name ? 'border-red-500 focus:ring-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium">
                        Address <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            id="address"
                            placeholder="e.g., 123 Main Street, City, Tunisia"
                            value={newSite.address}
                            onChange={(e) => handleAddressChange(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                searchAddressOnMap(newSite.address);
                              }
                            }}
                            className={errors.address ? 'border-red-500 focus:ring-red-500' : ''}
                          />
                          {errors.address && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.address}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => searchAddressOnMap(newSite.address)}
                          disabled={addressSearchLoading || !newSite.address.trim()}
                          className="whitespace-nowrap"
                        >
                          {addressSearchLoading ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <MapPin className="h-4 w-4 mr-1" />
                              Chercher
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Tapez l'adresse et cliquez sur "Chercher" pour localiser automatiquement sur la carte
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="area" className="text-sm font-medium">
                          Area (m²) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="area"
                          type="number"
                          min="1"
                          placeholder="e.g., 5000"
                          value={newSite.area}
                          onChange={(e) => setNewSite({ ...newSite, area: e.target.value })}
                          className={errors.area ? 'border-red-500 focus:ring-red-500' : ''}
                        />
                        {errors.area && (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.area}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="budget" className="text-sm font-medium">
                          Budget (TND) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="budget"
                          type="number"
                          min="1"
                          placeholder="e.g., 2500000"
                          value={newSite.budget}
                          onChange={(e) => { setNewSite({ ...newSite, budget: e.target.value }); setBudgetError(null); }}
                          className={errors.budget ? 'border-red-500 focus:ring-red-500' : ''}
                        />
                        {errors.budget && (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.budget}
                          </p>
                        )}
                        {!errors.budget && currentProjectId && projectBudget !== null && (() => {
                          const existingSitesBudget = sites
                            .filter(s => s.projectId === currentProjectId)
                            .reduce((sum, s) => sum + (s.budget || 0), 0);
                          const remaining = projectBudget - existingSitesBudget;
                          const entered = parseInt(newSite.budget) || 0;
                          const afterNew = existingSitesBudget + entered;
                          const isOver = afterNew > projectBudget;
                          return (
                            <p className={`text-xs flex items-center gap-1 ${isOver ? 'text-red-500' : 'text-gray-500'}`}>
                              {isOver
                                ? `⚠ Exceeds project budget by ${new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', minimumFractionDigits: 0 }).format(afterNew - projectBudget)}`
                                : `Remaining project budget: ${new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', minimumFractionDigits: 0 }).format(remaining)}`
                              }
                            </p>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientName" className="text-sm font-medium">
                        Client Name <span className="text-gray-500">(Optional)</span>
                      </Label>
                      <select
                        id="clientName"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={newSite.clientName}
                        onChange={(e) => setNewSite({ ...newSite, clientName: e.target.value })}
                      >
                        <option value="">-- Select a client --</option>
                        {clientsList.map((c) => {
                          const label = c.firstName && c.lastName
                            ? `${c.firstName} ${c.lastName}`
                            : c.name || c.email || c._id;
                          return (
                            <option key={c._id} value={label}>{label}</option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="team" className="text-sm font-medium">
                        Team <span className="text-gray-500">(Optional)</span>
                      </Label>
                      <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                        <SelectTrigger id="team" className="w-full">
                          <SelectValue placeholder="Select a team" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTeams.length > 0 ? (
                            availableTeams.map((team) => (
                              <SelectItem key={team._id} value={team._id}>
                                {team.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-teams" disabled>
                              No teams available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Assign a team to this site (Workers / Team Leader)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Location on Map <span className="text-red-500">*</span>
                      </Label>
                      <div className="h-64 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors">
                        <MapContainer
                          center={mapPosition ? [mapPosition.lat, mapPosition.lng] : TUNISIA_CENTER}
                          zoom={mapPosition ? 15 : 7}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; OpenStreetMap contributors"
                          />
                          <MapPicker position={mapPosition} setPosition={setMapPosition} onLocationSelect={(pos) => searchNearbyFournisseurs(pos)} />
                        </MapContainer>
                      </div>
                      {mapPosition ? (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          Selected position: {mapPosition.lat.toFixed(4)}, {mapPosition.lng.toFixed(4)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Click on the map to select a location
                        </p>
                      )}
                    </div>

                    {/* Nearby Fournisseurs Section */}
                    {nearbyFournisseurs.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Fournisseurs à proximité <span className="text-xs font-normal text-gray-500">({nearbyFournisseurs.length} trouvés)</span>
                        </Label>
                        <div className="bg-blue-50 rounded-lg border border-blue-200 max-h-48 overflow-y-auto">
                          {nearbyFournisseurs.map((fournisseur, index) => (
                            <div
                              key={fournisseur._id || index}
                              className="p-3 border-b border-blue-100 last:border-b-0 hover:bg-blue-100 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-blue-900">{fournisseur.nom}</p>
                                  <p className="text-xs text-gray-600 mt-0.5">{fournisseur.adresse}</p>
                                  {fournisseur.telephone && (
                                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                      <span>📞</span> {fournisseur.telephone}
                                    </p>
                                  )}
                                </div>
                                {fournisseur.categories && fournisseur.categories.length > 0 && (
                                  <div className="flex flex-wrap gap-1 justify-end">
                                    {fournisseur.categories.slice(0, 2).map((cat, i) => (
                                      <Badge key={i} variant="outline" className="text-xs py-0 h-5 bg-white">
                                        {cat}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    {budgetError && (
                      <div className="w-full flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-1">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-red-700 text-sm">Budget exceeded</p>
                          <p className="text-sm text-red-600 mt-0.5">{budgetError}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                      onClick={handleAddSite}
                    >
                      Create Site
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : null}
      </div>

      {/* Search and Filter Card */}
      {isLimitReached && isProjectContext && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-4">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-700">Site limit reached</p>
            <p className="text-sm text-red-600 mt-0.5">
              This project is limited to <span className="font-bold">{projectSiteLimit} site{projectSiteLimit !== 1 ? 's' : ''}</span>.
              You already have {currentSiteCount} site{currentSiteCount !== 1 ? 's' : ''} created.
              To add a new site, update the limit in the project settings.
            </p>
          </div>
        </div>
      )}

      {/* Search and Filter Card */}
      <Card className="border-none shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[160px] border-gray-200">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="border-gray-200"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>

            {/* Status/Priority Filter */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="sm:w-auto w-full border-gray-200">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {(selectedStatus !== 'all' || selectedPriority !== 'all') && (
                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                      {(selectedStatus !== 'all' ? 1 : 0) + (selectedPriority !== 'all' ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filter Sites</DialogTitle>
                  <DialogDescription>
                    Select status and priority filters
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'all', label: 'All' },
                        { value: 'planning', label: 'Planning' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'on_hold', label: 'On Hold' },
                        { value: 'completed', label: 'Completed' }
                      ].map((status) => (
                        <Button
                          key={status.value}
                          variant={selectedStatus === status.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedStatus(status.value)}
                          className={selectedStatus === status.value ? 'bg-blue-600' : ''}
                        >
                          {status.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Priority</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'all', label: 'All' },
                        { value: 'critical', label: 'Critical', color: 'text-red-600' },
                        { value: 'high', label: 'High', color: 'text-orange-600' },
                        { value: 'medium', label: 'Medium', color: 'text-blue-600' },
                        { value: 'low', label: 'Low', color: 'text-gray-600' }
                      ].map((priority) => (
                        <Button
                          key={priority.value}
                          variant={selectedPriority === priority.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedPriority(priority.value)}
                          className={selectedPriority === priority.value ? 'bg-blue-600' : ''}
                        >
                          {priority.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Active Filters Display */}
          {(selectedStatus !== 'all' || selectedPriority !== 'all' || showProblemsOnly || searchTerm) && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
              {searchTerm && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedStatus !== 'all' && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Status: {selectedStatus.replace('_', ' ')}
                  <button onClick={() => setSelectedStatus('all')} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedPriority !== 'all' && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Priority: {selectedPriority}
                  <button onClick={() => setSelectedPriority('all')} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {showProblemsOnly && (
                <Badge variant="destructive" className="bg-amber-500">
                  Problems only
                  <button onClick={() => setShowProblemsOnly(false)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('all');
                  setSelectedPriority('all');
                  setShowProblemsOnly(false);
                }}
                className="text-xs text-gray-500"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Last updated timestamp */}
          {lastUpdated && autoRefresh && (
            <p className="text-xs text-gray-400 mt-2">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sites Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading sites...</p>
            <p className="text-sm text-gray-400 mt-1">Please wait</p>
          </div>
        </div>
      ) : error ? (
        <Card className="border-none shadow-md">
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <p className="text-gray-800 font-medium mb-2">{error}</p>
              <p className="text-sm text-gray-500 mb-4">Demo mode active</p>
              <Button onClick={loadSites} variant="outline" className="gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredAndSortedSites.length === 0 ? (
        <Card className="border-none shadow-md">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="bg-gray-50 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No sites found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedStatus !== 'all' || selectedPriority !== 'all' || showProblemsOnly
                  ? 'No results match your criteria'
                  : 'Start by adding your first site'}
              </p>
              {(searchTerm || selectedStatus !== 'all' || selectedPriority !== 'all' || showProblemsOnly) && (
                <div className="flex gap-3 justify-center">
                  {searchTerm && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear search
                    </Button>
                  )}
                  {selectedStatus !== 'all' && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedStatus('all')}
                    >
                      Clear status
                    </Button>
                  )}
                  {selectedPriority !== 'all' && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPriority('all')}
                    >
                      Clear priority
                    </Button>
                  )}
                  {showProblemsOnly && (
                    <Button
                      variant="outline"
                      onClick={() => setShowProblemsOnly(false)}
                    >
                      Show all
                    </Button>
                  )}
                </div>
              )}
              {!searchTerm && selectedStatus === 'all' && selectedPriority === 'all' && !showProblemsOnly && canManageSites && (
                <Button
                  className="bg-gradient-to-r from-blue-600 to-green-600"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Site
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {paginatedSites.map((site) => {
            const statusConfig = STATUS_CONFIG[site.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.planning;
            const StatusIcon = statusConfig.icon;
            const priorityConfig = PRIORITY_CONFIG[site.priority || 'medium'];
            const siteIssueCount = siteIssues[site.id]?.filter(i => !i.resolved).length || 0;
            const siteCommentCount = siteComments[site.id]?.length || 0;

            return (
              <Card
                key={site.id}
                className="group hover:shadow-xl transition-all duration-300 border-none shadow-md overflow-hidden"
              >
                <div className={`h-1 ${statusConfig.progressColor}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${statusConfig.color}`}>
                        <MapPin className={`h-5 w-5 ${statusConfig.color.split(' ')[0]}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                            {site.name}
                          </CardTitle>
                          {/* Priority Badge */}
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${priorityConfig.color}`}>
                            {priorityConfig.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(site.workStartDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={statusConfig.variant}
                        className={`flex items-center gap-1 px-2 py-1 ${statusConfig.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        <span className="text-xs font-medium">{statusConfig.label}</span>
                      </Badge>
                      {/* Problem Indicator removed */}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-gray-600 line-clamp-2">{site.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Area</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {site.area.toLocaleString()} <span className="text-xs font-normal text-gray-500">m²</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Budget</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{formatBudget(site.budget)}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{site.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${statusConfig.progressColor} transition-all duration-300`}
                        style={{ width: `${site.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      onClick={() => handleViewDetails(site)}
                    >
                      Details
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors"
                      onClick={() => handleManageSite(site)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors px-2"
                      onClick={() => {
                        setSelectedSite(site);
                        setCommentsDialogOpen(true);
                      }}
                      title="Comments"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {siteCommentCount > 0 && (
                        <span className="ml-1 text-xs bg-blue-100 text-blue-700 rounded-full px-1">
                          {siteCommentCount}
                        </span>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      onClick={() => handleOpenTeamDialog(site)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      className="hover:bg-red-600 transition-colors"
                      onClick={() => handleDeleteSite(site)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredAndSortedSites.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredAndSortedSites.length)} of {filteredAndSortedSites.length} sites
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Button>
            {Array.from({ length: totalSitePages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={`h-8 w-8 p-0 ${page === currentPage ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline" size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalSitePages, p + 1))}
              disabled={currentPage === totalSitePages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Site</DialogTitle>
            <DialogDescription>
              Update site information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium">
                  Site Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={manageData.name}
                  onChange={(e) => setManageData({ ...manageData, name: e.target.value })}
                  className={errors.name ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address" className="text-sm font-medium">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-address"
                  value={manageData.address}
                  onChange={(e) => setManageData({ ...manageData, address: e.target.value })}
                  className={errors.address ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.address}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-area" className="text-sm font-medium">
                    Area (m²) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-area"
                    type="number"
                    min="1"
                    value={manageData.area}
                    onChange={(e) => setManageData({ ...manageData, area: parseInt(e.target.value) || 0 })}
                    className={errors.area ? 'border-red-500 focus:ring-red-500' : ''}
                  />
                  {errors.area && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.area}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-budget" className="text-sm font-medium">
                    Budget (TND)
                  </Label>
                  <Input
                    id="edit-budget"
                    type="number"
                    value={manageData.budget}
                    disabled
                    className="bg-gray-100 cursor-not-allowed text-gray-500"
                  />
                  <p className="text-gray-400 text-xs">Budget cannot be modified after site creation.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-sm font-medium">Status</Label>
                <select
                  id="edit-status"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={manageData.status}
                  onChange={(e) => setManageData({ ...manageData, status: e.target.value })}
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-progress" className="text-sm font-medium">Progress (%))</Label>
                <Input
                  id="edit-progress"
                  type="number"
                  min="0"
                  max="100"
                  value={manageData.progress}
                  onChange={(e) => setManageData({ ...manageData, progress: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-priority" className="text-sm font-medium">Priority</Label>
                <select
                  id="edit-priority"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={manageData.priority}
                  onChange={(e) => setManageData({ ...manageData, priority: e.target.value as any })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-client" className="text-sm font-medium">Client Name</Label>
                  <select
                    id="edit-client"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={manageData.clientName}
                    onChange={(e) => setManageData({ ...manageData, clientName: e.target.value })}
                  >
                    <option value="">-- Select a client --</option>
                    {clientsList.map((c) => {
                      const label = c.firstName && c.lastName
                        ? `${c.firstName} ${c.lastName}`
                        : c.name || c.email || c._id;
                      return (
                        <option key={c._id} value={label}>{label}</option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-team" className="text-sm font-medium">Assigned Team</Label>
                  <select
                    id="edit-team"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={manageData.teamId}
                    onChange={(e) => setManageData({ ...manageData, teamId: e.target.value })}
                  >
                    <option value="">-- No team assigned --</option>
                    {availableTeams.map((team) => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Location on Map</Label>
                <div className="h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                  <MapContainer
                    center={editMapPosition ? [editMapPosition.lat, editMapPosition.lng] : TUNISIA_CENTER}
                    zoom={editMapPosition ? 15 : 7}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapPicker position={editMapPosition} setPosition={setEditMapPosition} />
                  </MapContainer>
                </div>
                {editMapPosition && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Position: {editMapPosition.lat.toFixed(4)}, {editMapPosition.lng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setManageDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                onClick={handleSaveManage}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Site Details</DialogTitle>
          </DialogHeader>
          {selectedSite && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Site Name</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">{selectedSite.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Address</p>
                    <p className="text-gray-900 dark:text-white">{selectedSite.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Area</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedSite.area.toLocaleString()} m²
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Budget</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatBudget(selectedSite.budget)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <Badge className={`${STATUS_CONFIG[selectedSite.status as keyof typeof STATUS_CONFIG]?.color}`}>
                      {STATUS_CONFIG[selectedSite.status as keyof typeof STATUS_CONFIG]?.label}
                    </Badge>
                  </div>

                  {/* Progress bar in details */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Progress</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${STATUS_CONFIG[selectedSite.status as keyof typeof STATUS_CONFIG]?.progressColor} transition-all duration-300`}
                          style={{ width: `${selectedSite.progress}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white min-w-[3rem]">
                        {selectedSite.progress}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Start Date</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatDate(selectedSite.workStartDate)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedSite.coordinates && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Location</p>
                  <div className="h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                    <MapContainer
                      center={[selectedSite.coordinates.lat, selectedSite.coordinates.lng]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[selectedSite.coordinates.lat, selectedSite.coordinates.lng]} />
                    </MapContainer>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setViewDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  onClick={() => {
                    setViewDetailsOpen(false);
                    handleManageSite(selectedSite);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl text-red-600">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-gray-600">
              This action is irreversible. All data associated with this site will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          {selectedSite && (
            <div className="space-y-4 py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium text-gray-900 dark:text-white mb-2">Site to delete:</p>
                <p className="text-gray-700"><span className="font-medium">Name:</span> {selectedSite.name}</p>
                <p className="text-gray-700"><span className="font-medium">Address:</span> {selectedSite.address}</p>
                <p className="text-gray-700"><span className="font-medium">Budget:</span> {formatBudget(selectedSite.budget)}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 hover:bg-red-600"
                  onClick={confirmDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Team Dialog */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Team Management</DialogTitle>
            <DialogDescription>
              Site: {selectedSite?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Assigned Teams</h3>
              {loadingTeams ? (
                <p className="text-gray-500">Chargement...</p>
              ) : siteTeams.length === 0 ? (
                <p className="text-gray-500">No team assigned</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {siteTeams.map((team: any) => (
                    <div key={team._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        {/* Handle both old format (UserSimple) and new format (Team) */}
                        {team.name ? (
                          <>
                            <p className="font-medium">{team.name}</p>
                            <p className="text-sm text-gray-500">{team.description || 'Équipe'}</p>
                            {team.members && team.members.length > 0 && (
                              <p className="text-xs text-gray-400">{team.members.length} membre(s)</p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="font-medium">{team.firstName} {team.lastName}</p>
                            <p className="text-sm text-gray-500">{team.email}</p>
                          </>
                        )}
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => handleRemoveTeam(team._id)}>
                        Retirer
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={commentsDialogOpen} onOpenChange={setCommentsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments & Notes
            </DialogTitle>
            <DialogDescription>
              Site: {selectedSite?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Add comment form */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment or note..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                className="flex-1"
              />
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Comments list */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {siteComments[selectedSite?.id || '']?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              ) : (
                siteComments[selectedSite?.id || '']?.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{comment.author}</span>
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Issues Dialog */}
      <Dialog open={issuesDialogOpen} onOpenChange={setIssuesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Issues & Problems
            </DialogTitle>
            <DialogDescription>
              Site: {selectedSite?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Add issue form */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
              <p className="font-medium text-sm text-amber-800">Report an issue</p>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="px-3 py-2 border border-amber-300 rounded-md text-sm"
                  value={newIssue.type}
                  onChange={(e) => setNewIssue({ ...newIssue, type: e.target.value })}
                >
                  <option value="delay">Delay</option>
                  <option value="budget">Budget</option>
                  <option value="safety">Safety</option>
                  <option value="quality">Quality</option>
                  <option value="resource">Resource</option>
                  <option value="other">Other</option>
                </select>
                <select
                  className="px-3 py-2 border border-amber-300 rounded-md text-sm"
                  value={newIssue.severity}
                  onChange={(e) => setNewIssue({ ...newIssue, severity: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Describe the issue..."
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddIssue}
                  disabled={!newIssue.description.trim()}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <AlertCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Issues list */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {siteIssues[selectedSite?.id || '']?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No issues reported</p>
              ) : (
                siteIssues[selectedSite?.id || '']?.map((issue) => {
                  const issueConfig = ISSUE_CONFIG[issue.type as keyof typeof ISSUE_CONFIG];
                  return (
                    <div
                      key={issue.id}
                      className={`rounded-lg p-3 border ${issue.resolved
                          ? 'bg-gray-50 border-gray-200 opacity-60'
                          : 'bg-red-50 border-red-200'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${issueConfig?.color || ''}`}>
                            {issueConfig?.label || issue.type}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${issue.severity === 'critical' ? 'bg-red-100 text-red-700' :
                              issue.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                            }`}>
                            {issue.severity}
                          </span>
                          {issue.resolved && (
                            <Badge variant="secondary" className="text-xs">Resolved</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {formatDate(issue.createdAt)}
                          </span>
                          {!issue.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveIssue(issue.id)}
                              className="text-xs"
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{issue.description}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export History Dialog */}
      <Dialog open={exportHistoryOpen} onOpenChange={setExportHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Export History
            </DialogTitle>
            <DialogDescription>
              History of downloaded documents with dates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {exportHistory.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No exports yet</p>
                <p className="text-sm text-gray-400">Downloaded documents will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {exportHistory.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${record.format === 'PDF' ? 'bg-red-100 text-red-600' :
                          record.format === 'Excel' ? 'bg-green-100 text-green-600' :
                            record.format === 'CSV' ? 'bg-blue-100 text-blue-600' :
                              'bg-purple-100 text-purple-600'
                        }`}>
                        <FileDown className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{record.format}</p>
                        <p className="text-xs text-gray-500">{record.filename}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {record.siteCount} site{record.siteCount !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(record.downloadedAt)}
                      </p>
                      <p className="text-xs text-gray-400">
                        by {record.downloadedBy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {exportHistory.length > 0 && (
              <div className="flex justify-between items-center pt-2 border-t">
                <p className="text-sm text-gray-500">
                  Total exports: {exportHistory.length}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setExportHistory([]);
                    localStorage.setItem('exportHistory', JSON.stringify([]));
                  }}
                >
                  Clear History
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}