
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { format } from 'date-fns';

interface QRISPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    studio_packages: {
      title: string;
    };
    start_time: string;
    end_time: string;
    booking_additional_services?: Array<{
      additional_services: {
        name: string;
      };
      quantity: number;
    }>;
  };
}

const QRISPaymentDialog = ({ isOpen, onClose, booking }: QRISPaymentDialogProps) => {
  const { userProfile } = useJWTAuth();

  const handleConfirmPayment = () => {
    const packageName = booking.studio_packages.title;
    const additionalServices = booking.booking_additional_services
      ?.map(service => `${service.additional_services.name} x${service.quantity}`)
      .join(', ') || '';
    
    const dateTime = format(new Date(booking.start_time), 'dd MMMM yyyy HH:mm');
    
    const services = additionalServices ? ` & ${additionalServices}` : '';
    const message = `Halo saya ${userProfile?.name} ingin konfirmasi booking ${packageName}${services} pada ${dateTime}, berikut bukti bayar terlampir. (mohon lampirkan bukti bayar)`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/6282211409298?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-peace-sans font-black text-xl">
            Pembayaran QRIS
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* QRIS Code Image */}
          <div className="flex justify-center">
            <div className="w-64 h-64 bg-white border border-gray-200 rounded-lg overflow-hidden">
              <img
                src="https://i.imgur.com/F3SovjY.jpeg" // Ganti dengan URL QRIS-mu
                alt="QRIS Payment Code"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-peace-sans font-bold text-sm mb-2">Detail Booking:</h3>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Paket:</span> {booking.studio_packages.title}
            </p>
            {booking.booking_additional_services && booking.booking_additional_services.length > 0 && (
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Layanan Tambahan:</span>{' '}
                {booking.booking_additional_services.map(service => 
                  `${service.additional_services.name} x${service.quantity}`
                ).join(', ')}
              </p>
            )}
            <p className="text-sm text-gray-600">
              <span className="font-medium">Waktu:</span> {format(new Date(booking.start_time), 'dd MMMM yyyy HH:mm')}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleConfirmPayment}
              className="bg-green-600 hover:bg-green-700 text-white font-peace-sans font-bold w-full"
            >
              Konfirmasi ke Admin
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="font-peace-sans font-medium"
            >
              Batal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRISPaymentDialog;
