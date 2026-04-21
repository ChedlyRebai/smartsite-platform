import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Shield,
  Upload,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Trash2,
} from 'lucide-react';

const CATEGORIES = [
  'Materials',
  'Equipment Rental',
  'Transport',
  'Subcontracting',
  'Safety Equipment',
  'Office Supplies',
  'Energy',
  'Other',
];

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
  insuranceUrl: string;
  status: 'pending_qhse' | 'approved' | 'rejected';
  createdByName: string;
  createdAt: string;
  estArchive: boolean;
}

const API_URL = 'http://localhost:3010/suppliers';

export default function EditSupplier() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [form, setForm] = useState({
    name: '',
    category: '',
    email: '',
    phone: '',
    address: '',
    siret: '',
  });

  const [contractFile, setContractFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const contractRef = useRef<HTMLInputElement>(null);
  const insuranceRef = useRef<HTMLInputElement>(null);

  const userRole = (user as any)?.role?.name || (user as any)?.role;
  const isProcurement = userRole === 'procurement_manager';

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!isProcurement) {
      toast.error('Access denied. This page is reserved for Procurement Managers.');
      navigate('/suppliers');
      return;
    }
    fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSupplier(data);
      setForm({
        name: data.name,
        category: data.category,
        email: data.email,
        phone: data.phone,
        address: data.address,
        siret: data.siret,
      });
    } catch {
      toast.error('Failed to load supplier');
      navigate('/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'contract' | 'insurance',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only PDF, JPG, and PNG files are allowed (max 5MB)');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size must not exceed 5MB');
      return;
    }

    if (type === 'contract') {
      setContractFile(file);
    } else {
      setInsuranceFile(file);
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('category', form.category);
      formData.append('email', form.email.trim());
      formData.append('phone', form.phone.trim());
      formData.append('address', form.address.trim());
      formData.append('siret', form.siret.trim());
      if (contractFile) formData.append('contract', contractFile);
      if (insuranceFile) formData.append('insurance', insuranceFile);

      const res = await fetch(`${API_URL}/${supplier._id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update supplier');
      }

      toast.success('Supplier updated successfully');
      navigate('/suppliers');
    } catch (err: any) {
      toast.error(err.message || 'An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResend = async () => {
    if (!supplier) return;
    try {
      const res = await fetch(`${API_URL}/${supplier._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: supplier.name,
          category: supplier.category,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          siret: supplier.siret,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Supplier resent for approval');
      navigate('/suppliers');
    } catch {
      toast.error('Failed to resend for approval');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      const res = await fetch(`${API_URL}/${supplier?._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      toast.success('Supplier deleted successfully');
      navigate('/suppliers');
    } catch {
      toast.error('Failed to delete supplier');
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Supplier</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Update supplier information. New files will replace the existing ones.
          </p>
        </div>
      </div>

      {/* Status badge */}
      <div className="mb-4">
        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
          Code: {supplier.supplierCode}
        </Badge>
        <Badge className="ml-2 bg-gray-100 text-gray-800 border-gray-300">
          Created: {new Date(supplier.createdAt).toLocaleDateString()}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
              Supplier Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Lafarge"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:ring-ring focus:border-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="siret">SIRET (14 digits) *</Label>
              <Input
                id="siret"
                maxLength={14}
                value={form.siret}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setForm((p) => ({ ...p, siret: val }));
                }}
              />
              <p className="text-xs text-gray-400">{form.siret.length}/14 digits</p>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label>Contract Document</Label>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-700">
                  {supplier.contractUrl.split('/').pop()}
                </span>
                <a
                  href={supplier.contractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View
                </a>
              </div>
              <input
                ref={contractRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'contract')}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => contractRef.current?.click()}
              >
                Replace contract file
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label>Insurance Document</Label>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-700">
                  {supplier.insuranceUrl.split('/').pop()}
                </span>
                <a
                  href={supplier.insuranceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View
                </a>
              </div>
              <input
                ref={insuranceRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'insurance')}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => insuranceRef.current?.click()}
              >
                Replace insurance file
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>

        {/* Resend for approval button — only if rejected */}
        {supplier.status === 'rejected' && (
          <div className="mt-4">
            <Button
              type="button"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={handleResend}
              disabled={saving}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Resend for Approval
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This will reset the status to "Pending QHSE" and notify QHSE Manager again.
            </p>
          </div>
        )}

        {/* Delete button */}
        <div className="mt-4">
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            onClick={handleDelete}
            disabled={saving}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Supplier
          </Button>
        </div>
      </form>
    </div>
  );
}
