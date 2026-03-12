import Link from 'next/link';

const links = [
  ['/', 'Landing'],
  ['/signup', 'Sign Up'],
  ['/login', 'Login'],
  ['/dashboard', 'Dashboard'],
  ['/download', 'Download']
] as const;

export function Nav() {
  return (
    <nav className="mx-auto flex w-full max-w-5xl flex-wrap gap-4 border-b border-slate-800 py-4 text-sm">
      {links.map(([href, label]) => (
        <Link key={href} href={href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
