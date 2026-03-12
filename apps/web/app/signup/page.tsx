export default function SignUpPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Create your ProximityAuth account</h1>
      <form className="grid max-w-lg gap-3">
        <input className="rounded border border-slate-700 bg-slate-900 p-2" placeholder="Email" />
        <input
          className="rounded border border-slate-700 bg-slate-900 p-2"
          placeholder="Password"
          type="password"
        />
        <button className="rounded bg-sky-500 px-4 py-2 font-medium text-slate-950">Sign up</button>
      </form>
    </section>
  );
}
