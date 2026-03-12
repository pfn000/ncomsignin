const devices = [
  { name: 'Dev Laptop', mode: 'mDNS + UWB ready', status: 'Active' },
  { name: 'Office Workstation', mode: 'Tap-to-screen fallback enabled', status: 'Pending pairing' }
];

const fallbackSteps = [
  'Open ProximityAuth mobile app and choose Tap Phone To Screen.',
  'Place phone directly against the computer display to ensure near-field contact.',
  'Phone emits compressed haptic bursts and mixed ultrasonic bands (18-20 kHz).',
  'Desktop microphone validates haptic timing, ultrasonic token, and contact impulse profile.'
];

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-slate-300">Manage trusted devices and desktop daemon enrollment state.</p>
      </div>

      <ul className="space-y-3">
        {devices.map((device) => (
          <li key={device.name} className="rounded border border-slate-800 p-3">
            <h2 className="font-medium">{device.name}</h2>
            <p className="text-sm text-slate-300">{device.mode}</p>
            <p className="text-xs text-slate-400">{device.status}</p>
          </li>
        ))}
      </ul>

      <article className="rounded-lg border border-slate-800 p-4">
        <h2 className="mb-2 text-lg font-medium">Older Android fallback flow</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-300">
          {fallbackSteps.map((step) => (
            <li key={step} className="break-words">
              {step}
            </li>
          ))}
        </ol>
      </article>
    </section>
  );
}
