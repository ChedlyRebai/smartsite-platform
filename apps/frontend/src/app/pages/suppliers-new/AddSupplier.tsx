import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
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

interface FormErrors {
  name?: string;
  category?: string;
  email?: string;
  phone?: string;
  address?: string;
  siret?: string;
  contract?: string;
  insuranceDocument?: string;
}

interface SuccessData {
  supplierCode: string;
  name: string;
  contractName: string;
  insuranceDocumentName: string;
}

const API_URL = 'http://localhost:3010/suppliers';

export default function AddSupplier() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Only procurement_manager can access this page
  useEffect(() => {
    const userRole = (user as any)?.role?.name || (user as any)?.role;
    if (!user) {
      navigate('/login');
    } else if (userRole !== 'procurement_manager') {
      toast.error('Access denied. This page is reserved for Procurement Managers.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [form, setForm] = useState({
    name: '',
    category: '',
    email: '',
    phone: '',
    address: '',
    siret: '',
  });

  const [contractFile, setContractFile] = useState<File | null>(null);
  const [insuranceDocumentFile, setInsuranceDocumentFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const contractRef = useRef<HTMLInputElement>(null);
  const insuranceDocumentRef = useRef<HTMLInputElement>(null);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name || form.name.trim().length < 2)
      newErrors.name = 'Supplier name is required (min 2 characters)';

    if (!form.category)
      newErrors.category = 'Please select a category';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !emailRegex.test(form.email))
      newErrors.email = 'Please enter a valid email address (e.g., name@domain.com)';

    const phoneClean = form.phone.replace(/[\s+]/g, '');
    if (!form.phone || phoneClean.length < 10 || !/^[0-9+\s]+$/.test(form.phone))
      newErrors.phone = 'Please enter a valid phone number (min 10 digits)';

    if (!form.address || form.address.trim().length < 5)
      newErrors.address = 'Address is required (min 5 characters)';

    if (!form.siret || !/^[0-9]{14}$/.test(form.siret))
      newErrors.siret = 'SIRET must be exactly 14 digits (numbers only)';

    if (!contractFile)
      newErrors.contract = 'Contract document is required. Please upload a PDF, JPG, or PNG file (max 5MB)';

    if (!insuranceDocumentFile)
      newErrors.insuranceDocument = 'Insurance document is required. Please upload a PDF, JPG, or PNG file (max 5MB)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── File handlers ────────────────────────────────────────────────────────────
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'contract' | 'insuranceDocument',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        [type]: 'Only PDF, JPG, and PNG files are allowed (max 5MB)',
      }));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({
        ...prev,
        [type]: 'File size must not exceed 5MB',
      }));
      return;
    }

    if (type === 'contract') {
      setContractFile(file);
      setErrors((prev) => ({ ...prev, contract: undefined }));
    } else {
      setInsuranceDocumentFile(file);
      setErrors((prev) => ({ ...prev, insuranceDocument: undefined }));
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
       const formData = new FormData();
       formData.append('name', form.name.trim());
       formData.append('category', form.category);
       formData.append('email', form.email.trim());
       formData.append('phone', form.phone.trim());
       formData.append('address', form.address.trim());
       formData.append('siret', form.siret.trim());
       formData.append('createdBy', (user as any)?._id || 'unknown');
       formData.append(
         'createdByName',
         `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || 'Procurement Manager',
       );
       formData.append('contract', contractFile!);
       formData.append('insuranceDocument', insuranceDocumentFile!);

       const res = await fetch(API_URL, { method: 'POST', body: formData });

       if (!res.ok) {
         const err = await res.json();
         console.error('Backend error:', err);
         throw new Error(err.message || 'Failed to create supplier');
       }

       const data = await res.json();

       setSuccessData({
         supplierCode: data.supplierCode,
         name: data.name,
         contractName: contractFile!.name,
         insuranceDocumentName: insuranceDocumentFile!.name,
       });
    } catch (err: any) {
      toast.error(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessData(null);
    navigate('/fournisseurs');
  };

  // ── Render ───────────────────────────────────────────────────────────────────
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
          <h1 className="text-2xl font-bold text-gray-900">Add New Supplier</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            All fields are required. Supplier will be pending QHSE validation.
          </p>
        </div>
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

            {/* Supplier Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Supplier Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Lafarge"
                value={form.name}
                onChange={(e) => {
                  setForm((p) => ({ ...p, name: e.target.value }));
                  if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                }}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.category}
                onValueChange={(val) => {
                  setForm((p) => ({ ...p, category: val }));
                  if (errors.category) setErrors((p) => ({ ...p, category: undefined }));
                }}
              >
                <SelectTrigger
                  id="category"
                  className={errors.category ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="-- Select --" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-red-500">{errors.category}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">
                <Mail className="w-3.5 h-3.5 inline mr-1" />
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@supplier.com"
                value={form.email}
                onChange={(e) => {
                  setForm((p) => ({ ...p, email: e.target.value }));
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                }}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">
                <Phone className="w-3.5 h-3.5 inline mr-1" />
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0123456789"
                value={form.phone}
                onChange={(e) => {
                  setForm((p) => ({ ...p, phone: e.target.value }));
                  if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
                }}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address">
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                Address <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="address"
                placeholder="10 rue du Béton, 75001 Paris"
                value={form.address}
                onChange={(e) => {
                  setForm((p) => ({ ...p, address: e.target.value }));
                  if (errors.address) setErrors((p) => ({ ...p, address: undefined }));
                }}
                className={errors.address ? 'border-red-500' : ''}
                rows={2}
              />
              {errors.address && (
                <p className="text-xs text-red-500">{errors.address}</p>
              )}
            </div>

            {/* SIRET */}
            <div className="space-y-1.5">
              <Label htmlFor="siret">
                SIRET <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-1">(14 digits)</span>
              </Label>
              <Input
                id="siret"
                placeholder="12345678900012"
                maxLength={14}
                value={form.siret}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setForm((p) => ({ ...p, siret: val }));
                  if (errors.siret) setErrors((p) => ({ ...p, siret: undefined }));
                }}
                className={errors.siret ? 'border-red-500' : ''}
              />
              <p className="text-xs text-gray-400">{form.siret.length}/14 digits</p>
              {errors.siret && (
                <p className="text-xs text-red-500">{errors.siret}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              Required Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Contract */}
            <div className="space-y-1.5">
              <Label>
                Contract Document <span className="text-red-500">*</span>
              </Label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  errors.contract
                    ? 'border-red-400 bg-red-50'
                    : contractFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onClick={() => contractRef.current?.click()}
              >
                <input
                  ref={contractRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'contract')}
                />
                {contractFile ? (
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">{contractFile.name}</span>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <Upload className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-sm">Click to upload contract</p>
                    <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG — max 5MB</p>
                  </div>
                )}
              </div>
              {errors.contract && (
                <p className="text-xs text-red-500">{errors.contract}</p>
              )}
            </div>

            {/* Insurance Document */}
            <div className="space-y-1.5">
              <Label>
                <Shield className="w-3.5 h-3.5 inline mr-1" />
                Insurance Document <span className="text-red-500">*</span>
              </Label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  errors.insuranceDocument
                    ? 'border-red-400 bg-red-50'
                    : insuranceDocumentFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onClick={() => insuranceDocumentRef.current?.click()}
              >
                <input
                  ref={insuranceDocumentRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'insuranceDocument')}
                />
                 {insuranceDocumentFile ? (
                   <div className="flex items-center justify-center gap-2 text-green-700">
                     <FileText className="w-4 h-4" />
                     <span className="text-sm font-medium">{insuranceDocumentFile.name}</span>
                   </div>
                 ) : (
                    <div className="text-gray-500">
                      <Upload className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <span className="text-sm">Click to upload insurance document (PDF, JPG, PNG)</span>
                    </div>
                 )}
               </div>
               {errors.insuranceDocument && (
                 <p className="text-xs text-red-500">{errors.insuranceDocument}</p>
               )}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'CREATE SUPPLIER'
            )}
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      <Dialog open={!!successData} onOpenChange={() => {}}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-6 h-6" />
              Supplier created successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Supplier</span>
                <span className="font-semibold">{successData?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Code</span>
                <span className="font-mono font-semibold text-blue-600">
                  {successData?.supplierCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Contract</span>
                <span className="text-green-700">{successData?.contractName} ✓</span>
              </div>
               <div className="flex justify-between">
                 <span className="text-gray-500">Insurance Document</span>
                 <span className="text-green-700">{successData?.insuranceDocumentName} ✓</span>
               </div>
               <div className="flex justify-between items-center pt-1 border-t">
                 <span className="text-gray-500">Status</span>
                 <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                   Pending QHSE validation
                 </Badge>
               </div>
             </div>

            <p className="text-xs text-gray-500 text-center">
              The supplier will be activated after QHSE Manager approval.
            </p>
          </div>
          <Button
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800"
            onClick={handleSuccessClose}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
