
import { supabase } from '@/integrations/supabase/client';

export class WebhookHandler {
  static async handleXenditWebhook(request: Request): Promise<Response> {
    // Handle CORS
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
      // Parse JSON body
      const payload = await request.json();
      console.log('📥 Received Xendit webhook:', payload);

      const { external_id, status, amount, paid_amount, payment_method, paid_at } = payload;

      if (!external_id || !status) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing required fields: external_id and status',
            errorCode: 'MISSING_FIELDS'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Find booking by external_id (which is booking ID)
      console.log('🔍 Looking for booking with ID:', external_id);
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, user_id, total_amount, status')
        .eq('id', external_id)
        .single();

      if (bookingError || !booking) {
        console.error('❌ Booking not found:', bookingError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Booking not found with the provided external_id',
            errorCode: 'BOOKING_NOT_FOUND'
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('✅ Found booking:', booking);

      if (status === 'PAID') {
        console.log('💰 Processing PAID status');
        
        // Check if booking has installments
        const { data: installments, error: installmentsError } = await supabase
          .from('installments')
          .select('amount')
          .eq('booking_id', external_id);

        if (installmentsError) {
          console.error('❌ Error fetching installments:', installmentsError);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Error checking installments',
              errorCode: 'DATABASE_ERROR'
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        let newBookingStatus = 'paid';
        
        if (installments && installments.length > 0) {
          // Booking has installments, check total paid
          const totalPaidFromInstallments = installments.reduce((sum, inst) => sum + Number(inst.amount), 0);
          const totalPaidWithThisPayment = totalPaidFromInstallments + Number(paid_amount || amount);
          
          console.log('📊 Payment calculation:', {
            totalBookingAmount: booking.total_amount,
            totalPaidFromInstallments,
            thisPaymentAmount: paid_amount || amount,
            totalPaidWithThisPayment
          });
          
          if (totalPaidWithThisPayment >= Number(booking.total_amount)) {
            newBookingStatus = 'paid';
            console.log('✅ Full payment completed, setting status to paid');
          } else {
            newBookingStatus = 'installment';
            console.log('📝 Partial payment, keeping installment status');
          }
        } else {
          // No installments, this is a full payment
          newBookingStatus = 'paid';
          console.log('✅ Full payment without installments, setting status to paid');
        }

        // Update booking status
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ status: newBookingStatus })
          .eq('id', external_id);

        if (updateError) {
          console.error('❌ Error updating booking status:', updateError);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to update booking status',
              errorCode: 'UPDATE_ERROR'
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // Create transaction record
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            reference_id: payload.id, // Xendit invoice ID
            booking_id: external_id,
            amount: paid_amount || amount,
            type: 'online',
            description: `Online payment via ${payment_method || 'Xendit'} - Invoice ID: ${payload.id}`,
            performed_by: booking.user_id,
            payment_type: installments && installments.length > 0 ? 'installment' : 'online',
            status: 'paid'
          });

        if (transactionError) {
          console.error('❌ Error creating transaction record:', transactionError);
          // Don't return error here as the main operation succeeded
        } else {
          console.log('✅ Transaction record created');
        }

        // Log booking activity
        const { error: logError } = await supabase
          .from('booking_logs')
          .insert({
            booking_id: external_id,
            action_type: 'payment_received',
            performed_by: booking.user_id,
            new_data: payload,
            note: `Payment received via Xendit webhook - Status: ${status}, Amount: ${paid_amount || amount}`
          });

        if (logError) {
          console.error('❌ Error logging activity:', logError);
        }

        console.log('🎉 PAID status processed successfully');
        
      } else if (status === 'EXPIRED') {
        console.log('⏰ Processing EXPIRED status');
        
        // Update booking status to expired
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ status: 'expired' })
          .eq('id', external_id);

        if (updateError) {
          console.error('❌ Error updating booking to expired:', updateError);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to update booking to expired status',
              errorCode: 'UPDATE_ERROR'
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // Log booking activity
        const { error: logError } = await supabase
          .from('booking_logs')
          .insert({
            booking_id: external_id,
            action_type: 'invoice_expired',
            performed_by: booking.user_id,
            new_data: payload,
            note: `Invoice expired - Xendit Invoice ID: ${payload.id}`
          });

        if (logError) {
          console.error('❌ Error logging expired activity:', logError);
        }

        console.log('⏰ EXPIRED status processed successfully');
        
      } else {
        console.log('ℹ️ Unhandled status:', status);
        // For other statuses, we just log them but don't take action
        const { error: logError } = await supabase
          .from('booking_logs')
          .insert({
            booking_id: external_id,
            action_type: 'webhook_received',
            performed_by: booking.user_id,
            new_data: payload,
            note: `Xendit webhook received with status: ${status}`
          });

        if (logError) {
          console.error('❌ Error logging webhook activity:', logError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Webhook processed successfully for status: ${status}`,
          external_id: external_id
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('💥 Unexpected error in xendit webhook:', error);
      
      // Handle JSON parsing errors
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid JSON format in request body',
            errorCode: 'INVALID_JSON'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Terjadi kesalahan sistem: ' + (error instanceof Error ? error.message : 'Unknown error'),
          errorCode: 'INTERNAL_SERVER_ERROR'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }
}
