'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

export default function AccediPage() {
  const { signInWithEmail } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    setLoading(true);
    setError(null);
    const { error: err } = await signInWithEmail(email.trim(), name.trim());
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gray-50">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1">
            <span className="text-red-600 font-bold text-3xl">In</span>
            <span className="font-bold text-gray-900 text-3xl">Sicuri</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Mappa i pericoli per ciclisti</p>
        </div>

        {sent ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-4xl mb-3">&#9993;&#65039;</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Controlla la tua email</h2>
            <p className="text-sm text-gray-600 mb-4">
              Abbiamo inviato un link magico a <strong>{email}</strong>. Clicca il link per accedere.
            </p>
            <Button variant="ghost" onClick={() => setSent(false)} size="sm">
              Cambia email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Accedi</h2>
            <p className="text-sm text-gray-500">
              Inserisci nome e email. Riceverai un link magico per accedere, nessuna password.
            </p>

            <Input
              id="name"
              label="Nome e cognome"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mario Rossi"
              required
              autoFocus
            />

            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@esempio.it"
              required
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={loading || !name.trim()} className="w-full" size="lg">
              {loading ? 'Invio...' : 'Invia link magico'}
            </Button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition">
            &#8592; Torna alla mappa
          </Link>
        </div>
      </div>
    </div>
  );
}
