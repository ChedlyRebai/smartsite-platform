import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentApi } from "@/lib/api-client";
import { fetchSites, updateSite } from "@/app/action/site.action";
import type { Site } from "@/app/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Trash2, RefreshCw, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import StripeCardForm from "./StripeCardForm";

interface Payment {
  id: string;
  siteId: { id: string; nom: string; budget: number; status: string } | string;
  reference?: string;
  amount: number;
  status: "pending" | "completed" | "cancelled" | "refunded" | "paid";
  description?: string;
  paymentMethod: string;
  createdAt: string;
  paymentDate: string;
}

interface FormErrors {
  siteId?: string;
  amount?: string;
  paymentMethod?: string;
  description?: string;
}

type PaymentMethod = "cash" | "card" | "transfer" | "check";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Credit / Debit Card" },
  { value: "transfer", label: "Bank Transfer" },
  { value: "check", label: "Check" },
];

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending:   { color: "bg-yellow-500", label: "Pending" },
  completed: { color: "bg-green-500",  label: "Completed" },
  paid:      { color: "bg-green-500",  label: "Paid" },
  cancelled: { color: "bg-red-500",    label: "Cancelled" },
  refunded:  { color: "bg-orange-500", label: "Refunded" },
};

function getSiteName(payment: Payment, siteMap: Record<string, string>): string {
  if (typeof payment.siteId === "object" && payment.siteId !== null) {
    return payment.siteId.nom || "-";
  }
  return siteMap[String(payment.siteId)] || String(payment.siteId) || "-";
}

function validateForm(form: { siteId: string; amount: number | string; paymentMethod: string; description: string }): FormErrors {
  const errors: FormErrors = {};
  if (!form.siteId) errors.siteId = "Please select a site.";
  const amount = Number(form.amount);
  if (!form.amount && form.amount !== 0) {
    errors.amount = "Amount is required.";
  } else if (isNaN(amount) || amount <= 0) {
    errors.amount = "Amount must be a positive number.";
  } else if (amount > 99_999_999) {
    errors.amount = "Amount exceeds the maximum allowed value.";
  }
  if (!form.paymentMethod) errors.paymentMethod = "Please select a payment method.";
  if (form.description && form.description.length > 500) {
    errors.description = "Description must not exceed 500 characters.";
  }
  return errors;
}

const emptyForm = {
  siteId: "",
  amount: "" as number | string,
  description: "",
  paymentMethod: "cash" as PaymentMethod,
};

const Payments = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cardClientSecret, setCardClientSecret] = useState<string | null>(null);
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSuccessMessage(null); setErrorMessage(null); }, 5000);
    return () => clearTimeout(t);
  }, [successMessage, errorMessage]);

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await paymentApi.get("");
      return res.data;
    },
  });

  const { data: sitesData = [], isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: async () => {
      const res = await fetchSites({ limit: 100 });
      return res.data;
    },
  });

  const selectedSite = sitesData.find((s: Site) => s.id === form.siteId);
  const amount = Number(form.amount);

  const siteMap = useMemo(() => {
    const map: Record<string, string> = {};
    sitesData.forEach((site: Site) => { map[site.id] = site.name; });
    return map;
  }, [sitesData]);

  const createMutation = useMutation({
    mutationFn: (payload: { siteId: string; amount: number; [key: string]: any }) => paymentApi.post("", payload),
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      
      // Update site's remaining budget
      try {
        const currentSite = sitesData.find((s: Site) => s.id === variables.siteId);
        if (currentSite) {
          // Get total paid from backend
          const res = await paymentApi.get(`site/${variables.siteId}/paid?budget=${currentSite.budget}`);
          const { totalPaid, remaining } = res.data;
          // Update site with remaining budget
          await updateSite(variables.siteId, { budget: remaining });
        }
      } catch (e) {
        console.error("Failed to update site budget:", e);
      }
      
      setIsCreateOpen(false);
      setForm(emptyForm);
      setFormErrors({});
      setSuccessMessage("Payment created and saved successfully.");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Failed to create payment. Please try again.";
      setErrorMessage(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setSuccessMessage("Payment deleted.");
    },
    onError: () => setErrorMessage("Failed to delete payment."),
  });

  /** Check if selected site already has a completed payment */
  const checkSitePaid = useMutation({
    mutationFn: ({ siteId, budget }: { siteId: string; budget: number }) => {
      console.log("Checking site paid, siteId:", siteId, "budget:", budget);
      return paymentApi.get(`site/${siteId}/paid?budget=${budget}`);
    },
    onSuccess: (res) => {
      console.log("Site paid check result:", res.data);
      const { hasPaid, totalPaid, remaining } = res.data;
      if (hasPaid && remaining <= 0) {
        setErrorMessage("This site has already been fully paid. No more payments allowed.");
      } else if (hasPaid) {
        // Site has partial payment - show remaining
        setErrorMessage(`This site already has a payment of ${totalPaid.toFixed(3)} DT. Remaining to pay: ${remaining.toFixed(3)} DT.`);
      } else {
        // Site not paid yet → create payment intent immediately
        console.log("Creating payment intent for amount:", form.amount);
        createPaymentIntent.mutate({
          amount: Number(form.amount),
          description: `Payment for ${siteMap[form.siteId]}`,
        });
      }
    },
    onError: (err) => {
      console.error("Check site paid error:", err);
      setErrorMessage("Failed to check site payment status.");
    },
  });

  /** Get Stripe clientSecret */
  const createPaymentIntent = useMutation({
    mutationFn: (payload: { amount: number; description: string }) =>
      paymentApi.post("stripe/create-payment-intent", payload),
    onSuccess: (res) => {
      setCardClientSecret(res.data.clientSecret);
      setStripePaymentIntentId(res.data.paymentIntentId);
      setIsCardOpen(true);
    },
    onError: () => setErrorMessage("Failed to initialize card payment. Please try again."),
  });

  const handleCreatePayment = () => {
    const errors = validateForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (form.paymentMethod === "card") {
      if (form.siteId) {
        const site = sitesData.find((s: Site) => s.id === form.siteId);
        checkSitePaid.mutate({ siteId: form.siteId, budget: site?.budget || 0 });
      }
    } else {
      const payload = {
        siteId: form.siteId,
        amount: Number(form.amount),
        description: form.description || undefined,
        paymentMethod: form.paymentMethod,
        paymentDate: new Date().toISOString(),
        status: "completed",
      };
      createMutation.mutate(payload);
    }
  };

  const handleCardSubmit = (paymentIntentId: string) => {
    setIsCardOpen(false);
    const payload = {
      siteId: form.siteId,
      amount: Number(form.amount),
      description: form.description || undefined,
      paymentMethod: "card",
      paymentDate: new Date().toISOString(),
      status: "completed",
    };
    console.log("Saving payment:", payload);
    createMutation.mutate(payload);
  };

  const handleCardCancel = () => {
    setIsCardOpen(false);
    setCardClientSecret(null);
    setStripePaymentIntentId(null);
  };

  const openCardModal = () => {
    if (!form.siteId || !amount) {
      setErrorMessage("Please select a site and enter an amount first.");
      return;
    }
    createPaymentIntent.mutate({
      amount: Number(form.amount),
      description: `Payment for ${siteMap[form.siteId]}`,
    });
  };

  const getStatusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] || { color: "bg-gray-500", label: status };
    return <Badge className={`${cfg.color} text-white`}>{cfg.label}</Badge>;
  };

  const getMethodLabel = (method: string) =>
    PAYMENT_METHODS.find((m) => m.value === method)?.label || method;

  if (paymentsLoading || sitesLoading) {
    return <div className="flex justify-center items-center p-16 text-muted-foreground">Loading payments…</div>;
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <Alert className="border-green-300 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert className="border-red-300 bg-red-50 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" title="Refresh" onClick={() => queryClient.invalidateQueries({ queryKey: ["payments"] })}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) { setForm(emptyForm); setFormErrors({}); }}}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Payment</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Site *</label>
                  <Select value={form.siteId} onValueChange={(v) => { setForm({ ...form, siteId: v }); setFormErrors((e) => ({ ...e, siteId: undefined })); }}>
                    <SelectTrigger className={formErrors.siteId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select a site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sitesData.map((site: Site) => (<SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {formErrors.siteId && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.siteId}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Amount (DT) *</label>
                  <Input type="number" min={0.01} step="0.001" placeholder="0.000" value={form.amount} className={formErrors.amount ? "border-red-500" : ""} onChange={(e) => { setForm({ ...form, amount: e.target.value }); setFormErrors((err) => ({ ...err, amount: undefined })); }} />
                  {formErrors.amount && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.amount}</p>}
                </div>

                {selectedSite && amount > 0 && (
                  <div className={`p-3 rounded-md text-sm ${amount <= selectedSite.budget ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                    <p className="font-semibold">Site budget: {selectedSite.budget.toFixed(3)} DT</p>
                    {amount <= selectedSite.budget ? <p>✅ Budget sufficient — remaining: <strong>{(selectedSite.budget - amount).toFixed(3)} DT</strong></p> : <p>❌ Amount exceeds budget by <strong>{(amount - selectedSite.budget).toFixed(3)} DT</strong></p>}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-medium">Payment Method *</label>
                  <Select value={form.paymentMethod} onValueChange={(v) => { setForm({ ...form, paymentMethod: v as PaymentMethod }); setFormErrors((e) => ({ ...e, paymentMethod: undefined })); }}>
                    <SelectTrigger className={formErrors.paymentMethod ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {formErrors.paymentMethod && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.paymentMethod}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Description</label>
                  <Input placeholder="Optional description (max 500 chars)" value={form.description} maxLength={500} className={formErrors.description ? "border-red-500" : ""} onChange={(e) => { setForm({ ...form, description: e.target.value }); setFormErrors((err) => ({ ...err, description: undefined })); }} />
                  <p className="text-xs text-muted-foreground text-right">{form.description.length}/500</p>
                  {formErrors.description && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.description}</p>}
                </div>



                <Button className="w-full" onClick={handleCreatePayment} disabled={createMutation.isPending}>
                  {form.paymentMethod === "card" ? (<><CreditCard className="h-4 w-4 mr-2" />Pay by Card</>) : createMutation.isPending ? "Saving…" : "Create Payment"}
                </Button>

                {createMutation.isError && <p className="text-xs text-red-500 text-center">{(createMutation.error as any)?.response?.data?.message || "An error occurred. Please try again."}</p>}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment List <span className="text-sm font-normal text-muted-foreground">({payments.length} record{payments.length !== 1 ? "s" : ""})</span></CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: Payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-xs">{payment.reference || "-"}</TableCell>
                  <TableCell className="font-semibold">{getSiteName(payment, siteMap)}</TableCell>
                  <TableCell className="font-semibold tabular-nums">{payment.amount.toFixed(3)} DT</TableCell>
                  <TableCell>{getMethodLabel(payment.paymentMethod)}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{payment.description || "-"}</TableCell>
                  <TableCell className="text-sm tabular-nums">{new Date(payment.paymentDate || payment.createdAt).toLocaleDateString("en-GB")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" title="Edit (coming soon)" disabled><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Delete payment" className="text-red-500 hover:text-red-700" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm("Are you sure you want to delete this payment?")) { deleteMutation.mutate(payment.id); }}}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {payments.length === 0 && <div className="text-center py-12 text-muted-foreground">No payments found. Click <strong>New Payment</strong> to add one.</div>}
        </CardContent>
      </Card>

      <Dialog open={isCardOpen} onOpenChange={(open) => { if (!open) handleCardCancel(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay by Card</DialogTitle>
          </DialogHeader>
          {cardClientSecret ? (
            <StripeCardForm
              clientSecret={cardClientSecret}
              amount={amount}
              siteName={siteMap[form.siteId] || "Unknown Site"}
              onSuccess={handleCardSubmit}
              onCancel={handleCardCancel}
            />
          ) : (
            <div className="flex justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;