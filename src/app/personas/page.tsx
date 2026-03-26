import { getPersonas } from '@/lib/data';

export default function PersonasPage() {
  const personas = getPersonas();
  const accounts = [...new Set(personas.map((p) => p.account))].sort();

  return (
    <>
      <h1 className="text-2xl font-bold">Personas ({personas.length})</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        75 named personas across 15 accounts. P1 = primary decision-maker or exec sponsor. P2 = operator/influencer.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted-foreground)]">
              <th className="pb-2 pr-3">ID</th>
              <th className="pb-2 pr-3">Account</th>
              <th className="pb-2 pr-3">Name</th>
              <th className="pb-2 pr-3">Title</th>
              <th className="pb-2 pr-3">Priority</th>
              <th className="pb-2 pr-3">Lane</th>
              <th className="pb-2 pr-3">Role</th>
              <th className="pb-2 pr-3">Seniority</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2">Next Step</th>
            </tr>
          </thead>
          <tbody>
            {personas.map((p) => (
              <tr key={p.persona_id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                <td className="py-2 pr-3 font-mono text-xs">{p.persona_id}</td>
                <td className="py-2 pr-3">{p.account}</td>
                <td className="py-2 pr-3 font-medium">
                  {p.linkedin_url ? (
                    <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">{p.name}</a>
                  ) : p.name}
                </td>
                <td className="py-2 pr-3 text-xs max-w-48 truncate">{p.title}</td>
                <td className="py-2 pr-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${p.priority === 'P1' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                    {p.priority}
                  </span>
                </td>
                <td className="py-2 pr-3 text-xs">{p.persona_lane}</td>
                <td className="py-2 pr-3 text-xs">{p.role_in_deal}</td>
                <td className="py-2 pr-3 text-xs">{p.seniority}</td>
                <td className="py-2 pr-3 text-xs">{p.persona_status}</td>
                <td className="py-2 text-xs max-w-48 truncate">{p.next_step}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
