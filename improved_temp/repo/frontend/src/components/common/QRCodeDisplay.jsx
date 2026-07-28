import { useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

/**
 * Reusable QR code display for doctor queue links.
 *
 * Renders a centered QR code for `/queue/:doctorId` plus optional URL text.
 */
export default function QRCodeDisplay({ doctorId, baseUrl, showUrl = true }) {
  const url = useMemo(() => {
    const origin =
      baseUrl ||
      (typeof window !== 'undefined' && window.location
        ? window.location.origin
        : '');
    if (!origin || !doctorId) return '';
    return `${origin}/queue/${doctorId}`;
  }, [baseUrl, doctorId]);

  if (!doctorId) {
    return null;
  }

  return (
    <section
      className="mb-8 flex flex-col items-center justify-center text-center"
      aria-label="Doctor queue QR code"
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-1">
        Doctor Queue QR Code
      </h2>
      <p className="text-sm text-gray-600 mb-4">Scan to view live queue</p>

      <div
        className="inline-flex items-center justify-center p-4 bg-white rounded-xl shadow-sm"
        aria-hidden={url ? 'false' : 'true'}
      >
        {url && (
          <QRCodeCanvas
            value={url}
            size={192}
            includeMargin
            aria-label={`QR code linking to ${url}`}
          />
        )}
      </div>

      {showUrl && url && (
        <p className="mt-3 text-xs text-gray-500 break-all" aria-label="Queue URL">
          {url}
        </p>
      )}
    </section>
  );
}

