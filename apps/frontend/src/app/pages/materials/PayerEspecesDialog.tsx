"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet, CheckCircle, Loader2, Euro, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import orderService from "../../../services/orderService";

interface PayerEspecesDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId: string;
  orderNumber: string;
  materialName: string;
  supplierName: string;
  siteName: string;
  amount: number;
}

export default function PayerEspecesDialog({
  open,
  onClose,
  onSuccess,
  orderId,
  orderNumber,
  materialName,
  supplierName,
  siteName,
  amount,
}: PayerEspecesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [generateInvoice, setGenerateInvoice] = useState(true);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    setConfirmed(true);

    try {
      const result = await orderService.processPayment(orderId, "cash");

      if (!result.success) {
        throw new Error(result.message || "Erreur lors du paiement");
      }

      toast.success("✅ Paiement en espèces enregistré!");
      
      // Envoyer une notification via WebSocket
      try {
        const socketMessage = {
          type: 'payment_confirmation',
          orderId: orderId,
          amount: amount,
          method: 'cash',
          message: `💰 Paiement de ${amount}€ en espèces confirmé pour la commande ${orderNumber}`
        };
        // Émettre via socket si disponible
        if (typeof window !== 'undefined' && (window as any).socket) {
          (window as any).socket.emit('payment-confirmed', socketMessage);
        }
      } catch (socketError) {
        console.log('Socket notification non disponible');
      }
      
      if (generateInvoice) {
        try {
          const invoice = await orderService.generateInvoice(orderId, siteName);
          if (invoice) {
            setGeneratedInvoice(invoice);
            toast.success(`📄 Facture ${invoice.numeroFacture} générée!`);
          }
        } catch (invoiceError) {
          console.error("Error generating invoice:", invoiceError);
          toast.warning("Paiement réussi mais échec génération facture");
        }
      }
      
      // Attendre un peu avant de fermer pour montrer le succès
      setTimeout(() => {
        setLoading(false);
        onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error("Cash payment error:", error);
      toast.error(error.message || "Erreur lors de l'enregistrement du paiement");
      setLoading(false);
      setConfirmed(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (generatedInvoice?.pdfPath) {
      window.open(generatedInvoice.pdfPath, '_blank');
    } else if (generatedInvoice?.numeroFacture) {
      orderService.downloadInvoice(generatedInvoice.numeroFacture).then((blob) => {
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          window.URL.revokeObjectURL(url);
        }
      });
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen && !generatedInvoice && !loading) {
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wallet className="h-5 w-5 text-green-600" />
            Paiement en espèces
          </DialogTitle>
          <DialogDescription>
            Confirmez le paiement en espèces pour la commande.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Récapitulatif */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Commande:</span>
                  <span className="font-medium">{orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Matériau:</span>
                  <span className="font-medium">{materialName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fournisseur:</span>
                  <span className="font-medium">{supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chantier:</span>
                  <span className="font-medium">{siteName}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Montant à encaisser:</span>
                    <span className="text-2xl font-bold text-green-600 flex items-center gap-1">
                      <Euro className="h-5 w-5" />
                      {amount.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <Checkbox
              id="generate-invoice-cash"
              checked={generateInvoice}
              onCheckedChange={(checked) => setGenerateInvoice(checked === true)}
              disabled={loading}
            />
            <Label htmlFor="generate-invoice-cash" className="text-sm cursor-pointer flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Générer une facture après paiement
            </Label>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Confirmation requise:</p>
                <p>En confirmant, vous attesterez avoir reçu le paiement en espèces de {amount.toFixed(2)}€ de la part de {supplierName}.</p>
              </div>
            </div>
          </div>

          {generatedInvoice && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Paiement confirmé !</p>
                    <p className="text-sm text-green-600">Facture N° {generatedInvoice.numeroFacture}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadInvoice}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </Button>
              </div>
            </div>
          )}

          {loading && !generatedInvoice && (
            <div className="text-center py-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
              <p className="mt-2 text-gray-500">Traitement en cours...</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!generatedInvoice && !loading && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmer le paiement
              </Button>
            </>
          )}
          {generatedInvoice && (
            <Button onClick={onSuccess} className="bg-green-600 hover:bg-green-700">
              Terminer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}