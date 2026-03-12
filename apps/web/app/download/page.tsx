'use client';

import { QRCodeSVG } from 'qrcode.react';

const mobileInstallUrl = 'https://example.com/proximityauth-mobile';

export default function DownloadPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Download mobile app</h1>
      <p className="max-w-xl text-slate-300">
        Scan this QR code from your phone to install the latest ProximityAuth mobile client.
      </p>
      <div className="inline-flex rounded-lg bg-white p-4">
        <QRCodeSVG value={mobileInstallUrl} />
      </div>
      <p className="break-all text-sm text-slate-400">{mobileInstallUrl}</p>
    </section>
  );
}
