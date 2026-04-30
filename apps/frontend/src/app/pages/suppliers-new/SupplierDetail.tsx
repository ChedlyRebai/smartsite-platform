import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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
import RateSupplierModal from './RateSupplierModal';
import DelayPrediction from '../../components/supplier/DelayPrediction';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  User,
  Calendar,
  FileText,
  Shield,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  Star,
  TrendingUp,
} from 'lucide-react';

const BASE_SUPPLIERS_URL = (import.meta.env.VITE_GESTION_SUPPLIERS_URL as string) || 'http://localhost:3014';
const API_URL = `${BASE_SUPPLIERS_URL.replace(/\/$/, '')}/suppliers`;
const FILES_URL = BASE_SUPPLIERS_URL.replace(/\/$/, '');

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
  qhseValidatedAt?: string;
  estArchive?: boolean;
  averageRating?: number;
  ratingCount?: number;
  criteriaAverages?: Record<string, number>;
}

const STATUS_CONFIG = {
  pending_qhse: { label: 'Pending QHSE', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  approved:     { label: 'Approved',      className: 'bg-green-100 text-green-800 border-green-300' },
  rejected:     { label: 'Rejected',      className: 'bg-red-100 text-red-800 border-red-300' },
};

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

   // Modals
   const [showApprove, setShowApprove] = useState(false);
   const [showReject, setShowReject] = useState(false);
   const [showRateModal, setShowRateModal] = useState(false);
   const [rejectReason, setRejectReason] = useState('');
   const [rejectError, setRejectError] = useState('');
   const [activeTab, setActiveTab] = useState<'infos' | 'documents' | 'prediction'>('infos');

  const userRole = (user as any)?.role?.name || (user as any)?.role;
  const isQhse = userRole === 'qhse_manager';
  const isProcurement = userRole === 'procurement_manager';

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      console.log('Supplier data:', data);
      setSupplier(data);
    } catch {
      toast.error('Failed to load supplier');
      navigate('/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!supplier) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/${supplier._id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qhseUserId: (user as any)?._id || 'unknown',
          notes: 'Approved by QHSE Manager',
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${supplier.name} has been approved`);
      setShowApprove(false);
      navigate('/suppliers');
    } catch {
      toast.error('Failed to approve supplier');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!supplier) return;
    if (!rejectReason.trim()) {
      setRejectError('Please provide a reason for rejection');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/${supplier._id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qhseUserId: (user as any)?._id || 'unknown',
          notes: rejectReason.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${supplier.name} has been rejected`);
      setShowReject(false);
      navigate('/suppliers');
    } catch {
      toast.error('Failed to reject supplier');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!supplier) return null;

  const status = STATUS_CONFIG[supplier.status];
  const isPending = supplier.status === 'pending_qhse';
  const isApproved = supplier.status === 'approved';
  const canRate = isApproved && ['procurement_manager', 'site_manager', 'project_manager', 'qhse_manager'].includes(userRole);
  const hasRating = supplier.ratingCount && supplier.ratingCount > 0;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/suppliers')} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
            <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {supplier.supplierCode}
            </span>
            <Badge className={`text-xs border ${status.className}`}>
              {status.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-gray-500">{supplier.category}</p>
            {hasRating && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{supplier.averageRating?.toFixed(1)}/10</span>
                <span className="text-gray-400">({supplier.ratingCount} rating{supplier.ratingCount !== 1 ? 's' : ''})</span>
              </div>
            )}
          </div>
        </div>
        {canRate && (
          <Button onClick={() => setShowRateModal(true)} className="gap-2">
            <Star className="w-4 h-4" />
            Rate
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <Button
          variant={activeTab === 'infos' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('infos')}
          className="rounded-b-none"
        >
          <Building2 className="w-4 h-4 mr-2" />
          Infos
        </Button>
        <Button
          variant={activeTab === 'documents' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('documents')}
          className="rounded-b-none"
        >
          <FileText className="w-4 h-4 mr-2" />
          Documents
        </Button>
        <Button
          variant={activeTab === 'prediction' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('prediction')}
          className="rounded-b-none"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          📊 Prédiction
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'infos' && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-4 h-4 text-blue-600" />
              Supplier Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
                  <p className="font-medium">{new Date(supplier.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* QHSE notes if rejected */}
            {supplier.status === 'rejected' && supplier.qhseNotes && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs font-semibold text-red-700 mb-1">Rejection reason :</p>
                <p className="text-sm text-red-700">{supplier.qhseNotes}</p>
              </div>
            )}
            {supplier.status === 'approved' && supplier.qhseNotes && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs font-semibold text-green-700 mb-1">QHSE notes :</p>
                <p className="text-sm text-green-700">{supplier.qhseNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-blue-600" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {/* Contract */}
                <div className="flex items-center gap-3 bg-gray-50 border rounded-lg px-4 py-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Contract</span>
                  <a
                    href={`${FILES_URL}${supplier.contractUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </a>
                  <a
                    href={`${FILES_URL}${supplier.contractUrl}`}
                    download
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 border border-green-200 rounded px-2 py-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>

                {/* Insurance Document */}
                <div className="flex items-center gap-3 bg-gray-50 border rounded-lg px-4 py-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Insurance Document</span>
                  <a
                    href={`${FILES_URL}${supplier.insuranceDocumentUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </a>
                  <a
                    href={`${FILES_URL}${supplier.insuranceDocumentUrl}`}
                    download
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 border border-green-200 rounded px-2 py-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              </div>

              {/* Actions */}
              {isQhse && isPending && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                    onClick={() => setShowApprove(true)}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Supplier
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50 gap-2"
                    onClick={() => { setShowReject(true); setRejectReason(''); setRejectError(''); }}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Supplier
                  </Button>
                </div>
              )}

              {/* Edit button — for procurement manager */}
              {isProcurement && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/suppliers/${supplier._id}/edit`)}
                  >
                    Edit Supplier
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'prediction' && supplier && (supplier._id || (supplier as any).id) && (
        <DelayPrediction
          key={String(supplier._id || (supplier as any).id)}
          supplierId={String(supplier._id || (supplier as any).id)}
        />
      )}

      {/* Approve Modal */}
      <Dialog open={showApprove} onOpenChange={setShowApprove}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              Approve Supplier
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to approve <strong>{supplier.name}</strong>?
            The supplier will become active immediately.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowApprove(false)} disabled={actionLoading}>
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
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Reject Supplier
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              You are about to reject <strong>{supplier.name}</strong>.
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
              {rejectError && <p className="text-xs text-red-500">{rejectError}</p>}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReject(false)} disabled={actionLoading}>
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

       {/* Rate Supplier Modal */}
       <RateSupplierModal
         isOpen={showRateModal}
         onClose={() => setShowRateModal(false)}
         supplierId={supplier._id}
         supplierName={supplier.name}
         userRole={userRole}
         userId={(user as any)?._id || 'unknown'}
         userName={`${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || 'Unknown User'}
         onSubmitSuccess={() => fetchSupplier()}
         criteriaAverages={supplier.criteriaAverages}
       />
     </div>
  );
}
