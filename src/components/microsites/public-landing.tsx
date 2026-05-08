export function PublicLanding() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-cyan-400">Yard</span>
            <span>Flow</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">The First Yard Network System</p>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">
            Your personalized field brief is ready.
          </h2>
          <p className="text-slate-400 leading-relaxed">
            If you received a link from Casey Larkin at FreightRoll, click it to view your custom network analysis and ROI preview.
          </p>
          <p className="text-sm text-slate-500">
            Questions? Reach out to{' '}
            <a href="mailto:casey@freightroll.com" className="text-cyan-400 hover:underline">
              casey@freightroll.com
            </a>
          </p>
        </div>
      </main>
      <footer className="border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center text-xs text-slate-500">
          <p>YardFlow by FreightRoll</p>
        </div>
      </footer>
    </div>
  );
}
