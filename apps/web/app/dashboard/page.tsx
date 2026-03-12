const devices = [
  { name: 'Dev Laptop', mode: 'mDNS + UWB ready', status: 'Active' },
  { name: 'Office Workstation', mode: 'Physical fallback enabled', status: 'Pending pairing' }
];

export default function DashboardPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-slate-300">Manage trusted devices and desktop daemon enrollment state.</p>
      <ul className="space-y-3">
        {devices.map((device) => (
          <li key={device.name} className="rounded border border-slate-800 p-3">
            <h2 className="font-medium">{device.name}</h2>
            <p className="text-sm text-slate-300">{device.mode}</p>
            <p className="text-xs text-slate-400">{device.status}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
