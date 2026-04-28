import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import {
  BarChart3,
  Truck,
  MapPin,
  Building,
  Package,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
} from 'lucide-react';
import OrdersTrackingDashboard from './OrdersTrackingDashboard';

interface OrdersTrackingSidebarProps {
  className?: string;
}

export default function OrdersTrackingSidebar({ className }: OrdersTrackingSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-2 ${className}`}
        >
          <BarChart3 className="h-4 w-4" />
          Suivi des livraisons
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-[95vw] p-0 overflow-hidden"
      >
        <div className="h-full flex flex-col">
          <SheetHeader className="p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <SheetTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5" />
              Tableau de bord des livraisons
            </SheetTitle>
            <SheetDescription className="text-blue-100">
              Suivi en temps réel de toutes les commandes et camions
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">
                <OrdersTrackingDashboard />
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}