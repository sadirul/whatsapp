import { useState } from 'react';

export default function QRCodeBox({ qr, loading, onInitialize }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (qr && qr.startsWith('data:')) {
      fetch(qr)
        .then((res) => res.blob())
        .then((blob) => {
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-6">Scan to Connect</h3>
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">Generating QR Code...</p>
            <p className="mt-1 text-sm text-gray-400">This may take a few seconds</p>
          </div>
        ) : qr ? (
          <div className="flex flex-col items-center">
            <div className="relative p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-300 rounded-full"></div>
              <div className="bg-white p-4 rounded-lg mt-4">
                <img
                  id="qr-code"
                  src={qr}
                  alt="WhatsApp QR Code"
                  width={240}
                  height={240}
                  className="block"
                />
              </div>
            </div>
            <p className="mt-6 text-gray-600 text-center text-sm max-w-xs">
              Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
            </p>
            <p className="mt-2 text-gray-400 text-xs text-center">
              QR refreshes automatically until connected
            </p>
            <button
              onClick={handleCopy}
              className="mt-6 flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-medium"
            >
              {copied ? (
                <>
                  <span className="text-emerald-400">✓</span> Copied!
                </>
              ) : (
                <>
                  <span>📋</span> Copy QR Code
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-emerald-100 flex items-center justify-center text-3xl">
              📱
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Ready to Connect</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Click the button below to generate a QR code. Then scan it with your phone to link WhatsApp.
            </p>
            <button
              onClick={onInitialize}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              <span>▶</span> Initialize WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
