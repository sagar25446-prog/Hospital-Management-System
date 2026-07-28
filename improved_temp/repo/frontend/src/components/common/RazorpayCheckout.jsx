import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { verifyPayment } from '../../api/payment.api';

/**
 * Opens the real Razorpay Checkout widget (loaded globally via the
 * <script> tag in index.html) as soon as `isOpen` + `intent` are set.
 *
 * `intent` is the object returned by POST /payments/create-order:
 *   { appointmentId, orderId, amountInPaise, currency, keyId, amount, tax, total }
 *
 * This intentionally mirrors the old <RazorpayMockModal> prop shape
 * (isOpen, intent, onSuccess, onClose) so call sites barely change —
 * but there's no custom UI here; Razorpay renders its own trusted modal.
 */
export default function RazorpayCheckout({ isOpen, intent, onSuccess, onClose, onError }) {
  const { user } = useAuth();
  const openedForOrderId = useRef(null);

  useEffect(() => {
    if (!isOpen || !intent) return;
    if (openedForOrderId.current === intent.orderId) return; // avoid double-opening on re-render

    if (typeof window.Razorpay !== 'function') {
      onError?.('Payment widget failed to load. Please check your connection and try again.');
      onClose?.();
      return;
    }

    openedForOrderId.current = intent.orderId;

    const rzp = new window.Razorpay({
      key: intent.keyId,
      amount: intent.amountInPaise,
      currency: intent.currency || 'INR',
      name: 'Q-Care',
      description: 'Consultation Fee',
      order_id: intent.orderId,
      prefill: {
        name: user ? `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim() : undefined,
        email: user?.email,
        contact: user?.profile?.phone,
      },
      theme: { color: '#6366f1' },
      handler: async function (response) {
        try {
          const result = await verifyPayment({
            appointmentId: intent.appointmentId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          onSuccess?.(result.invoice);
        } catch (err) {
          onError?.(err.response?.data?.message || err.message || 'Payment verification failed.');
        } finally {
          openedForOrderId.current = null;
        }
      },
      modal: {
        ondismiss: function () {
          openedForOrderId.current = null;
          onClose?.();
        },
      },
    });

    rzp.on('payment.failed', function (response) {
      openedForOrderId.current = null;
      onError?.(response.error?.description || 'Payment failed. Please try again.');
    });

    rzp.open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, intent]);

  return null; // Razorpay renders its own overlay outside React's tree
}
