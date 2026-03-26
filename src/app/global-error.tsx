'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Critical error</h2>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>{error.message || 'Application error.'}</p>
            <button onClick={reset} style={{ padding: '0.5rem 1.5rem', cursor: 'pointer' }}>Reload</button>
          </div>
        </div>
      </body>
    </html>
  );
}
