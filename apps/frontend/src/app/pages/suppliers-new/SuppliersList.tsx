import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import {
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Package,
  ChevronRight,
  Edit,
  Archive,
  Trash2,
  Star,
} from 'lucide-react';

const API_URL = 'http://localhost:3011/suppliers';

interface Supplier {
  _id: string;
  supplierCode: string;
  name: string;
  category: string;
  email: string;
  phone: string;
  address: string;
  siret: string;
  status: 'pending_qhse' | 'approved' | 'rejected';
  createdByName: string;
  createdAt: string;
  averageRating?: number;
  ratingCount?: number;
}

const STATUS_CONFIG = {
  pending_qhse: { label: 'Pending QHSE', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  approved:     { label: 'Approved',      className: 'bg-green-100 text-green-800 border-green-300' },
  rejected:     { label: 'Rejected',      className: 'bg-red-100 text-red-800 border-red-300' },
};

export default function SuppliersList() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const userRole = (user as any)?.role?.name || (user as any)?.role;
  const isProcurement = userRole === 'procurement_manager';
  const isQhse = userRole === 'qhse_manager';

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchSuppliers();
  }, [user]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed to fetch suppliers');
      const data = await res.json();
      setSuppliers(data);
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (supplier: Supplier) => {
    try {
      const endpoint = supplier.estArchive ? 'unarchive' : 'archive';
      const res = await fetch(`${API_URL}/${supplier._id}/${endpoint}`, {
        method: 'PUT',
      });
      if (!res.ok) throw new Error();
      toast.success(supplier.estArchive ? 'Supplier unarchived' : 'Supplier archived');
      fetchSuppliers();
    } catch {
      toast.error('Failed to archive supplier');
    }
  };

  const filtered = suppliers.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.supplierCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: suppliers.length,
    pending_qhse: suppliers.filter((s) => s.status === 'pending_qhse').length,
    approved: suppliers.filter((s) => s.status === 'approved').length,
    rejected: suppliers.filter((s) => s.status === 'rejected').length,
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Suppliers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} total
          </p>
        </div>
        {isProcurement && (
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={() => navigate('/suppliers/add')}
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </Button>
        )}
      </div>

      {/* Filter tabs — visible for qhse only */}
      {isQhse && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'pending_qhse', label: `Pending (${counts.pending_qhse})` },
            { key: 'approved', label: `Approved (${counts.approved})` },
            { key: 'rejected', label: `Rejected (${counts.rejected})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                filterStatus === tab.key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by name, category or code..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No suppliers found</p>
          {isProcurement && (
            <p className="text-sm mt-1">
              Click <strong>Add Supplier</strong> to create the first one.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((supplier) => {
            const status = STATUS_CONFIG[supplier.status] || STATUS_CONFIG.pending_qhse;
            return (
              <Card
                key={supplier._id}
                className={`hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => navigate(`/suppliers/${supplier._id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                        <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {supplier.supplierCode}
                        </span>
                        <Badge className={`text-xs border ${status.className}`}>
                          {status.label}
                        </Badge>
                        {supplier.ratingCount && supplier.ratingCount > 0 && (
                          <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            {supplier.averageRating?.toFixed(1)}/10 ({supplier.ratingCount})
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{supplier.category}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {supplier.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {supplier.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {supplier.address}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-400 text-right shrink-0">
                        <p>By {supplier.createdByName}</p>
                        <p>{new Date(supplier.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button
                        className="p-1.5 rounded hover:bg-gray-100 text-blue-600"
                        title="View Details"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/suppliers/${supplier._id}`);
                        }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      {isProcurement && (
                        <div className="flex items-center gap-1">
                          <button
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                            title="Edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/suppliers/${supplier._id}/edit`);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className={`p-1.5 rounded hover:bg-gray-100 ${supplier.estArchive ? 'text-green-600' : 'text-gray-600'}`}
                            title={supplier.estArchive ? 'Unarchive' : 'Archive'}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive(supplier);
                            }}
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
