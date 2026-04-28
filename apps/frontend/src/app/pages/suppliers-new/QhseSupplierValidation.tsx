import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Shield,
  CheckCircle2,
  XCircle,
  Download,
  Eye,
  Loader2,
  Package,
  Search,
  ChevronDown,
  ChevronUp,
  Hash,
  User,
  Calendar,
} from 'lucide-react';

const API_URL = 'http://localhost:3014/suppliers';
const FILES_URL = 'http://localhost:3014';

interface Supplier {
  _id: string;
  supplierCode: string;
  name: string;
  category: string;
  email: string;
  phone: string;
  address: string;
  siret: string;
  contractUrl: string;
  insuranceDocumentUrl: string;
  status: 'pending_qhse' | 'approved' | 'rejected';
  createdByName: string;
  createdAt: string;
  qhseNotes?: string;
}

const STATUS_CONFIG = {
  pending_qhse: { label: 'Pending QHSE', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  approved:     { label: 'Approved',      className: 'bg-green-100 text-green-800 border-green-300' },
  rejected:     { label: 'Rejected',      className: 'bg-red-100 text-red-800 border-red-300' },
};

export default function QhseSupplierValidation() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<Supplier | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Approve confirm modal
  const [approveTarget, setApproveTarget] = useState<Supplier | null>(null);

  const userRole = (user as any)?.role?.name || (user as any)?.role;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (userRole !== 'qhse_manager') {
      toast.error('Access denied. This page is reserved for QHSE Managers.');
      navigate('/dashboard');
      return;
    }
    fetchSuppliers();
  }, [user]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/pending-qhse`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSuppliers(data);
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/${approveTarget._id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qhseUserId: (user as any)?._id || 'unknown',
          notes: 'Approved by QHSE Manager',
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${approveTarget.name} has been approved`);
      setApproveTarget(null);
      setExpandedId(null);
      fetchSuppliers();
    } catch {
      toast.error('Failed to approve supplier');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setRejectError('Please provide a reason for rejection');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/${rejectTarget._id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qhseUserId: (user as any)?._id || 'unknown',
          notes: rejectReason.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${rejectTarget.name} has been rejected`);
      setRejectTarget(null);
      setRejectReason('');
      setRejectError('');
      setExpandedId(null);
      fetchSuppliers();
    } catch {
      toast.error('Failed to reject supplier');
    } finally {
      setActionLoading(false);
    }
  };

  const getFileUrl = (path: string) => `${FILES_URL}${path}`;

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase()) ||
    s.supplierCode.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          Supplier Validation
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} pending your validation
        </p>
      </div>

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
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No suppliers pending validation</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((supplier) => {
            const isExpanded = expandedId === supplier._id;
            const status = STATUS_CONFIG[supplier.status];

            return (
              <Card key={supplier._id} className="overflow-hidden">
                {/* Summary row */}
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                        <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {supplier.supplierCode}
                        </span>
                        <Badge className={`text-xs border ${status.className}`}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{supplier.category}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : supplier._id)}
                      className="shrink-0 gap-1"
                    >
                      {isExpanded ? (
                        <><ChevronUp className="w-4 h-4" /> Hide</>
                      ) : (
                        <><ChevronDown className="w-4 h-4" /> View details</>
                      )}
                    </Button>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-4">

                      {/* Info grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-start gap-2">
                          <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">Email</p>
                            <p className="font-medium">{supplier.email}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">Phone</p>
                            <p className="font-medium">{supplier.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">Address</p>
                            <p className="font-medium">{supplier.address}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Hash className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">SIRET</p>
                            <p className="font-mono font-medium">{supplier.siret}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">Created by</p>
                            <p className="font-medium">{supplier.createdByName}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">Created at</p>
                            <p className="font-medium">
                              {new Date(supplier.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                        {/* Documents */}
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-700">Documents</p>
                          <div className="flex flex-wrap gap-2">
                            {/* Contract */}
                            <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-700">Contract</span>
                              <a
                                href={getFileUrl(supplier.contractUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                              <a
                                href={getFileUrl(supplier.contractUrl)}
                                download
                                className="text-green-600 hover:text-green-800"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>

                            {/* Insurance Document */}
                            <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
                              <Shield className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-700">Insurance Document</span>
                              <a
                                href={getFileUrl(supplier.insuranceDocumentUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                              <a
                                href={getFileUrl(supplier.insuranceDocumentUrl)}
                                download
                                className="text-green-600 hover:text-green-800"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-2">
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                          onClick={() => setApproveTarget(supplier)}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50 gap-2"
                          onClick={() => {
                            setRejectTarget(supplier);
                            setRejectReason('');
                            setRejectError('');
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve Confirm Modal */}
      <Dialog open={!!approveTarget} onOpenChange={() => setApproveTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              Approve Supplier
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to approve{' '}
            <strong>{approveTarget?.name}</strong>? The supplier will become active immediately.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApproveTarget(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleApprove}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={() => {
          setRejectTarget(null);
          setRejectReason('');
          setRejectError('');
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Reject Supplier
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              You are about to reject <strong>{rejectTarget?.name}</strong>.
              Please provide a reason so the procurement manager can take action.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="reject-reason">
                Reason for rejection <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reject-reason"
                placeholder="e.g. Missing insurance validity date, SIRET not verified..."
                rows={4}
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError('');
                }}
                className={rejectError ? 'border-red-500' : ''}
              />
              {rejectError && (
                <p className="text-xs text-red-500">{rejectError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason('');
                setRejectError('');
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleReject}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
