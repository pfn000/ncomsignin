import { ShieldCheck, Smartphone, Wifi } from 'lucide-react';

const features = [
  {
    title: 'Secure proximity login',
    icon: ShieldCheck,
    description: 'Unlock desktop sessions only when your authenticated phone is physically nearby.'
  },
  {
    title: 'mDNS discovery',
    icon: Wifi,
    description: 'Desktop daemon and mobile app pair over bonjour-service and react-native-zeroconf.'
  },
  {
    title: 'Physical fallback auth',
    icon: Smartphone,
    description: 'Older phones can use synchronized haptics and ultrasonic signaling for verification.'
  }
];

export default function LandingPage() {
  return (
    <section className="space-y-8">
      <h1 className="text-4xl font-semibold">ProximityAuth</h1>
      <p className="max-w-2xl text-slate-300">
        Authenticate from your phone to your desktop with adaptive capabilities for UWB, mDNS, and
        physical fallback validation.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {features.map(({ title, description, icon: Icon }) => (
          <article key={title} className="rounded-lg border border-slate-800 p-4">
            <Icon className="mb-3 h-5 w-5 text-sky-300" />
            <h2 className="font-medium">{title}</h2>
            <p className="text-sm text-slate-300">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
