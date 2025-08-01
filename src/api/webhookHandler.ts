
import { supabase } from '@/integrations/supabase/client';
import { XenditAuthClient } from '@/utils/xenditAuth';

export interface XenditWebhookPayload {
  id: string;
  external_id: string;
  user_id?: string;
  is_high?: boolean;
  payment_method?: string;
  status: 'PAID' | 'SETTLED' | 'EXPIRED' | 'PENDING';
  merchant_name?: string;
  amount: number;
  paid_amount?: number;
  bank_code?: string;
  paid_at?: string;
  payer_email?: string;
  description?: string;
  adjusted_received_amount?: number;
  fees_paid_amount?: number;
  updated?: string;
  created?: string;
  currency?: string;
  payment_channel?: string;
  payment_destination?: string;
}

export class WebhookHandler {
  static async handleXenditWebhook(request: Request): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
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
          headers: corsHeaders
        }
      );
    }

    try {
      const payload: XenditWebhookPayload = await request.json();
      console.log('📥 Received Xendit webhook payload:', JSON.stringify(payload, null, 2));

      // Validate essential fields from Xendit payload
      if (!payload.id || !payload.external_id) {
        console.error('❌ Missing essential fields in webhook payload');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing essential fields: id or external_id',
            errorCode: 'INVALID_PAYLOAD'
          }),
          {
            status: 400,
            headers: corsHeaders
          }
        );
      }

      // Validate amount fields
      if (!payload.amount || payload.amount <= 0) {
        console.error('❌ Invalid amount in webhook payload:', payload.amount);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid amount in webhook payload',
            errorCode: 'INVALID_AMOUNT'
          }),
          {
            status: 400,
            headers: corsHeaders
          }
        );
      }

      const { id: invoiceId, external_id, status, amount, paid_amount } = payload;
      const actualPaidAmount = paid_amount || amount; // Fallback jika paid_amount tidak ada

      console.log('💰 Payment details:', {
        invoiceId,
        external_id,
        status,
        amount,
        paid_amount,
        actualPaidAmount
      });

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
            error: 'Booking not found',
            errorCode: 'BOOKING_NOT_FOUND'
          }),
          {
            status: 404,
            headers: corsHeaders
          }
        );
      }

      // Get Xendit credentials from payment providers
      const { data: provider, error: providerError } = await supabase
        .from('payment_providers')
        .select('secret_key, api_url')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (providerError || !provider) {
        console.error('❌ Payment provider not found:', providerError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Payment provider not configured',
            errorCode: 'PROVIDER_NOT_FOUND'
          }),
          {
            status: 500,
            headers: corsHeaders
          }
        );
      }

      // Verify invoice status directly from Xendit API
      const xenditClient = new XenditAuthClient(provider.secret_key, provider.api_url);
      console.log('🔍 Verifying invoice status from Xendit API for invoice:', invoiceId);
      
      const verificationResult = await xenditClient.getInvoice(invoiceId);
      
      if (!verificationResult.success) {
        console.error('❌ Failed to verify invoice from Xendit:', verificationResult.error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to verify invoice status: ' + verificationResult.error,
            errorCode: 'VERIFICATION_FAILED'
          }),
          {
            status: 400,
            headers: corsHeaders
          }
        );
      }

      const xenditInvoice = verificationResult.data;
      console.log('📊 Verified invoice from Xendit API:', xenditInvoice);

      // Use verified data from Xendit API
      const verifiedStatus = xenditInvoice.status;
      const verifiedPaidAmount = Number(xenditInvoice.paid_amount || xenditInvoice.amount || 0);
      const verifiedAmount = Number(xenditInvoice.amount || booking.total_amount || 0);

      // Check status and process accordingly
      if (verifiedStatus === 'SETTLED' || verifiedStatus === 'PAID') {
        await this.handlePaidStatus(payload, booking, xenditInvoice, verifiedPaidAmount, verifiedAmount);
      } else if (verifiedStatus === 'EXPIRED') {
        await this.handleExpiredStatus(payload, booking, xenditInvoice);
      } else {
        console.log('📝 Invoice status not actionable:', verifiedStatus);
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Invoice status not actionable: ' + verifiedStatus,
            status: verifiedStatus
          }),
          {
            status: 200,
            headers: corsHeaders
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook processed successfully',
          invoice_id: invoiceId,
          external_id: external_id,
          verified_status: verifiedStatus,
          verified_paid_amount: verifiedPaidAmount
        }),
        {
          status: 200,
          headers: corsHeaders
        }
      );

    } catch (error) {
      console.error('💥 Webhook processing error:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
          errorCode: 'INTERNAL_ERROR'
        }),
        {
          status: 500,
          headers: corsHeaders
        }
      );
    }
  }

  private static async handlePaidStatus(
    payload: XenditWebhookPayload, 
    booking: any, 
    xenditInvoice: any,
    paidAmount: number,
    invoiceAmount: number
  ) {
    console.log('💰 Processing PAID/SETTLED status for booking:', booking.id);
    console.log('💵 Payment analysis:', {
      paidAmount,
      invoiceAmount,
      bookingTotalAmount: booking.total_amount,
      isPartialPayment: paidAmount < invoiceAmount
    });

    if (!booking || !xenditInvoice?.id || !booking.id) {
      console.error('❌ Invalid booking or invoice data');
      return;
    }

    // Get existing installments to calculate total paid before this payment
    const { data: existingInstallments, error: installmentsError } = await supabase
      .from('installments')
      .select('amount')
      .eq('booking_id', booking.id);

    if (installmentsError) {
      console.error('❌ Error fetching existing installments:', installmentsError);
      return;
    }

    const totalPaidBefore = existingInstallments?.reduce((sum, inst) => sum + Number(inst.amount), 0) || 0;
    const totalPaidAfter = totalPaidBefore + paidAmount;
    const requiredAmount = Number(booking.total_amount || invoiceAmount);
    
    console.log('📊 Payment calculation:', {
      totalPaidBefore,
      currentPayment: paidAmount,
      totalPaidAfter,
      requiredAmount,
      remainingAmount: requiredAmount - totalPaidAfter
    });

    // Determine new booking status based on payment amount
    let newStatus: 'paid' | 'installment' = 'paid';
    
    // If this payment doesn't complete the total amount, it's an installment
    if (totalPaidAfter < requiredAmount) {
      newStatus = 'installment';
      console.log('📝 Marking as installment - payment incomplete');
    } else {
      console.log('✅ Payment complete - marking as paid');
    }

    // Create installment record
    const { error: installmentError } = await supabase
      .from('installments')
      .insert({
        booking_id: booking.id,
        amount: paidAmount,
        paid_at: xenditInvoice.paid_at || new Date().toISOString(),
        payment_method: 'online',
        performed_by: booking.user_id,
        note: `Payment via ${xenditInvoice.payment_method || 'Xendit'} - Invoice: ${xenditInvoice.id}`
      });

    if (installmentError) {
      console.error('❌ Error creating installment record:', installmentError);
    } else {
      console.log('✅ Installment record created successfully');
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

    console.log(`✅ Booking status updated to: ${newStatus}`);

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        reference_id: booking.id,
        booking_id: booking.id,
        amount: paidAmount,
        type: 'online',
        description: `Payment verified via ${xenditInvoice.payment_method || 'Xendit'} - Invoice: ${xenditInvoice.id}`,
        performed_by: booking.user_id,
        payment_type: newStatus === 'installment' ? 'installment' : 'online',
        status: 'paid'
      });

    if (transactionError) {
      console.error('❌ Error creating transaction record:', transactionError);
    } else {
      console.log('✅ Transaction record created successfully');
    }

    // Log booking activity
    const { error: logError } = await supabase
      .from('booking_logs')
      .insert({
        booking_id: booking.id,
        action_type: 'payment_received',
        performed_by: booking.user_id,
        new_data: JSON.parse(JSON.stringify(xenditInvoice)) as any,
        note: `Payment verified from Xendit API. Status: ${xenditInvoice.status}. Paid: ${paidAmount}. Updated booking to '${newStatus}'.`
      });

    if (logError) {
      console.error('❌ Error logging booking activity:', logError);
    } else {
      console.log('✅ Booking activity logged successfully');
    }

    console.log('🎉 Payment processing completed successfully');
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

    console.log('✅ Booking marked as expired');

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
    } else {
      console.log('✅ Expiration activity logged successfully');
    }

    console.log('✅ Booking expiration processing completed');
  }
}
