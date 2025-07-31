
import { supabase } from '@/integrations/supabase/client';
import { XenditAuthClient } from '@/utils/xenditAuth';

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

      const { id: invoiceId, external_id, status } = payload;

      if (!external_id || !invoiceId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing external_id or invoice_id in webhook payload'
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

      // Get Xendit credentials from payment providers
      const { data: provider, error: providerError } = await supabase
        .from('payment_providers')
        .select('secret_key, api_url')
        .eq('name', 'Xendit')
        .eq('status', 'active')
        .single();

      if (providerError || !provider) {
        console.error('❌ Xendit provider not found:', providerError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Payment provider not configured'
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

      // Verify invoice status directly from Xendit
      const xenditClient = new XenditAuthClient(provider.secret_key, provider.api_url);
      console.log('🔍 Verifying invoice status from Xendit API for invoice:', invoiceId);
      
      const verificationResult = await xenditClient.getInvoice(invoiceId);
      
      if (!verificationResult.success) {
        console.error('❌ Failed to verify invoice from Xendit:', verificationResult.error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to verify invoice status from Xendit: ' + verificationResult.error
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

      const xenditInvoice = verificationResult.data;
      console.log('📊 Verified invoice from Xendit:', xenditInvoice);

      // Check if the webhook status matches the actual Xendit status
      const xenditStatus = xenditInvoice.status;
      if (status !== xenditStatus) {
        console.warn('⚠️ Webhook status mismatch. Webhook:', status, 'Xendit API:', xenditStatus);
        // Use the status from Xendit API instead of webhook
      }

      // Only proceed if the Xendit API confirms SETTLED (PAID) or EXPIRED status
      if (xenditStatus === 'SETTLED' || xenditStatus === 'PAID') {
        await this.handlePaidStatus(payload, booking, xenditInvoice);
      } else if (xenditStatus === 'EXPIRED') {
        await this.handleExpiredStatus(payload, booking, xenditInvoice);
      } else {
        console.log('📝 Invoice status not actionable:', xenditStatus);
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Invoice status not actionable: ' + xenditStatus
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook processed successfully',
          verifiedStatus: xenditStatus
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

  private static async handlePaidStatus(payload: XenditWebhookPayload, booking: any, xenditInvoice: any) {
    console.log('💰 Processing PAID/SETTLED status for booking:', booking.id);

    // Use the actual paid amount from Xendit verification
    const paidAmount = xenditInvoice.paid_amount || xenditInvoice.amount;

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

      console.log('📊 Installment check:', { totalPaid, totalAmount, paidAmount });

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

    // Create transaction record with verified data
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        reference_id: xenditInvoice.id,
        booking_id: booking.id,
        amount: paidAmount,
        type: 'online',
        description: `Payment verified via ${xenditInvoice.payment_method || 'Xendit'} - Invoice: ${xenditInvoice.id}`,
        performed_by: booking.user_id,
        payment_type: hasInstallments ? 'installment' : 'online',
        status: 'paid'
      });

    if (transactionError) {
      console.error('❌ Error creating transaction:', transactionError);
    }

    // Log booking activity with verified data
    const { error: logError } = await supabase
      .from('booking_logs')
      .insert({
        booking_id: booking.id,
        action_type: 'payment_received',
        performed_by: booking.user_id,
        new_data: JSON.parse(JSON.stringify(xenditInvoice)) as any,
        note: `Payment verified from Xendit API. Status: ${xenditInvoice.status}. Amount: ${paidAmount}. Updated booking status to ${newStatus}`
      });

    if (logError) {
      console.error('❌ Error logging activity:', logError);
    }

    console.log('✅ Payment processed and verified successfully');
  }

  private static async handleExpiredStatus(payload: XenditWebhookPayload, booking: any, xenditInvoice: any) {
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

    // Log booking activity with verified data
    const { error: logError } = await supabase
      .from('booking_logs')
      .insert({
        booking_id: booking.id,
        action_type: 'payment_expired',
        performed_by: booking.user_id,
        new_data: JSON.parse(JSON.stringify(xenditInvoice)) as any,
        note: `Invoice expiration verified from Xendit API. Invoice ID: ${xenditInvoice.id}`
      });

    if (logError) {
      console.error('❌ Error logging expired activity:', logError);
    }

    console.log('✅ Booking marked as expired after verification');
  }
}
