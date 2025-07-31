
import { supabase } from '@/integrations/supabase/client';

export interface XenditWebhookPayload {
  id: string;
  external_id: string;
  user_id?: string;
  status: 'PAID' | 'EXPIRED' | 'PENDING';
  amount: number;
  paid_amount?: number;
  payment_method?: string;
  bank_code?: string;
  paid_at?: string;
  payment_channel?: string;
  payment_destination?: string;
  created?: string;
  updated?: string;
}

export class WebhookHandler {
  static async handleXenditWebhook(request: Request): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Only allow POST method
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Method not allowed. Use POST method.',
          errorCode: 'METHOD_NOT_ALLOWED'
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    try {
      const payload: XenditWebhookPayload = await request.json();
      console.log('📥 Received Xendit webhook:', payload);

      const { external_id, status } = payload;

      if (!external_id) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing external_id in webhook payload'
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Find booking by external_id (which is the booking ID)
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', external_id)
        .single();

      if (bookingError || !booking) {
        console.error('❌ Booking not found:', bookingError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Booking not found'
          }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      if (status === 'PAID') {
        await this.handlePaidStatus(payload, booking);
      } else if (status === 'EXPIRED') {
        await this.handleExpiredStatus(payload, booking);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook processed successfully'
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );

    } catch (error) {
      console.error('💥 Webhook processing error:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }

  private static async handlePaidStatus(payload: XenditWebhookPayload, booking: any) {
    console.log('💰 Processing PAID status for booking:', booking.id);

    // Check if booking has installments
    const { data: installments, error: installmentsError } = await supabase
      .from('installments')
      .select('amount')
      .eq('booking_id', booking.id);

    if (installmentsError) {
      console.error('❌ Error fetching installments:', installmentsError);
      return;
    }

    const hasInstallments = installments && installments.length > 0;
    let newStatus: 'paid' | 'installment' = 'paid';

    if (hasInstallments) {
      // Calculate total paid installments
      const totalPaid = installments.reduce((sum, inst) => sum + Number(inst.amount), 0);
      const totalAmount = Number(booking.total_amount);

      console.log('📊 Installment check:', { totalPaid, totalAmount });

      if (totalPaid >= totalAmount) {
        newStatus = 'paid';
      } else {
        newStatus = 'installment';
      }
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('❌ Error updating booking status:', updateError);
      return;
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        reference_id: payload.id,
        booking_id: booking.id,
        amount: payload.paid_amount || payload.amount,
        type: 'online',
        description: `Payment received via ${payload.payment_method || 'Xendit'}`,
        performed_by: booking.user_id,
        payment_type: hasInstallments ? 'installment' : 'online',
        status: 'paid'
      });

    if (transactionError) {
      console.error('❌ Error creating transaction:', transactionError);
    }

    // Log booking activity - convert payload to JSON string to satisfy Json type
    const { error: logError } = await supabase
      .from('booking_logs')
      .insert({
        booking_id: booking.id,
        action_type: 'payment_received',
        performed_by: booking.user_id,
        new_data: JSON.parse(JSON.stringify(payload)) as any,
        note: `Payment received via Xendit. Status updated to ${newStatus}`
      });

    if (logError) {
      console.error('❌ Error logging activity:', logError);
    }

    console.log('✅ Payment processed successfully');
  }

  private static async handleExpiredStatus(payload: XenditWebhookPayload, booking: any) {
    console.log('⏰ Processing EXPIRED status for booking:', booking.id);

    // Update booking status to expired
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'expired' as const,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('❌ Error updating booking to expired:', updateError);
      return;
    }

    // Log booking activity - convert payload to JSON string to satisfy Json type
    const { error: logError } = await supabase
      .from('booking_logs')
      .insert({
        booking_id: booking.id,
        action_type: 'payment_expired',
        performed_by: booking.user_id,
        new_data: JSON.parse(JSON.stringify(payload)) as any,
        note: 'Invoice expired via Xendit webhook'
      });

    if (logError) {
      console.error('❌ Error logging expired activity:', logError);
    }

    console.log('✅ Booking marked as expired');
  }
}
