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
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Wallet, Euro, FileText, Bell } from "lucide-react";
import { toast } from "sonner";
import PayerAvecCarteDialog from "./PayerAvecCarteDialog";
import PayerEspecesDialog from "./PayerEspecesDialog";

interface PaymentDialogProps {
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

export default function PaymentDialog({
  open,
  onClose,
  onSuccess,
  orderId,
  orderNumber,
  materialName,
  supplierName,
  siteName,
  amount,
}: PaymentDialogProps) {
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [showCashDialog, setShowCashDialog] = useState(false);

  const handleSelectCard = () => {
    setShowCardDialog(true);
  };

  const handleSelectCash = () => {
    setShowCashDialog(true);
  };

  const handleCardSuccess = () => {
    setShowCardDialog(false);
    // Notification de succès
    toast.success(`💰 Paiement de ${amount}€ par carte confirmé!`);
    // Envoyer une notification WebSocket
    sendPaymentNotification('card');
    onSuccess();
  };

  const handleCashSuccess = () => {
    setShowCashDialog(false);
    // Notification de succès
    toast.success(`💰 Paiement de ${amount}€ en espèces confirmé!`);
    // Envoyer une notification WebSocket
    sendPaymentNotification('cash');
    onSuccess();
  };

  const sendPaymentNotification = (method: string) => {
    try {
      // Notification via le chat si disponible
      const message = {
        type: 'payment',
        orderId: orderId,
        amount: amount,
        method: method,
        message: `💰 Paiement de ${amount}€ ${method === 'card' ? 'par carte' : 'en espèces'} confirmé pour la commande ${orderNumber}`,
        timestamp: new Date().toISOString()
      };
      
      // Stocker dans localStorage pour affichage
      const notifications = JSON.parse(localStorage.getItem('payment_notifications') || '[]');
      notifications.unshift(message);
      localStorage.setItem('payment_notifications', JSON.stringify(notifications.slice(0, 10)));
      
      // Afficher une notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Paiement confirmé', {
          body: `${amount}€ payés par ${method === 'card' ? 'carte' : 'espèces'} pour ${materialName}`,
          icon: '/logo.png'
        });
      }
    } catch (error) {
      console.log('Notification error:', error);
    }
  };

  // Demander la permission pour les notifications
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <>
      {/* Dialogue principal de sélection */}
      <Dialog open={open && !showCardDialog && !showCashDialog} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Bell className="h-5 w-5 text-orange-500" />
              Paiement requis
            </DialogTitle>
            <DialogDescription>
              Le camion est arrivé chez {supplierName}. Veuillez procéder au paiement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Message d'alerte */}
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">
                  💰 Vous devez payer {amount.toFixed(2)} €
                </span>
              </div>
            </div>

            {/* Récapitulatif */}
            <Card className="bg-blue-50 border-blue-200">
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
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Montant total:</span>
                      <span className="text-2xl font-bold text-green-600 flex items-center gap-1">
                        <Euro className="h-5 w-5" />
                        {amount.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Options de paiement */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Choisissez votre mode de paiement:</p>
              
              <button
                onClick={handleSelectCash}
                className="w-full p-4 border-2 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200">
                    <Wallet className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Espèces</div>
                    <div className="text-sm text-gray-500">Paiement en espèces à la livraison</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-green-500" />
              </button>

              <button
                onClick={handleSelectCard}
                className="w-full p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Carte Bancaire</div>
                    <div className="text-sm text-gray-500">Paiement sécurisé par Stripe</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500" />
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue paiement par carte */}
      <PayerAvecCarteDialog
        open={showCardDialog}
        onClose={() => setShowCardDialog(false)}
        onSuccess={handleCardSuccess}
        orderId={orderId}
        orderNumber={orderNumber}
        materialName={materialName}
        supplierName={supplierName}
        siteName={siteName}
        amount={amount}
      />

      {/* Dialogue paiement en espèces */}
      <PayerEspecesDialog
        open={showCashDialog}
        onClose={() => setShowCashDialog(false)}
        onSuccess={handleCashSuccess}
        orderId={orderId}
        orderNumber={orderNumber}
        materialName={materialName}
        supplierName={supplierName}
        siteName={siteName}
        amount={amount}
      />
    </>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}