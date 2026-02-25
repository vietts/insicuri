'use client';

import { useState, useRef, useEffect } from 'react';
import type { DangerCategory, NearbySpot } from '@/types';
import { CategoryGrid } from './CategoryGrid';
import { SeveritySlider } from './SeveritySlider';
import { PhotoUpload } from './PhotoUpload';
import { Button } from '@/components/ui/Button';
import { useCreateReport } from '@/hooks/useCreateReport';
import { useToast } from '@/components/ui/Toast';
import { CATEGORIES } from '@/lib/constants';
import { generateShareCard } from '@/lib/share-card';

interface ReportFormProps {
  lat: number;
  lng: number;
  nearbySpot?: NearbySpot | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReportForm({ lat, lng, nearbySpot, onSuccess, onCancel }: ReportFormProps) {
  const [category, setCategory] = useState<DangerCategory | null>(null);
  const [severity, setSeverity] = useState(3);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [shareBlob, setShareBlob] = useState<Blob | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [generatingCard, setGeneratingCard] = useState(false);
  const { createSpotWithReport, addReportToSpot, loading } = useCreateReport();
  const { toast } = useToast();
  const prevShareUrl = useRef<string | null>(null);

  const isNewSpot = !nearbySpot;

  // Revoke old object URL on change
  useEffect(() => {
    return () => {
      if (prevShareUrl.current) URL.revokeObjectURL(prevShareUrl.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) {
      toast('Seleziona un tipo di pericolo', 'error');
      return;
    }
    if (isNewSpot && !title.trim()) {
      toast('Inserisci un titolo per lo spot', 'error');
      return;
    }

    let success: boolean;

    if (nearbySpot) {
      success = await addReportToSpot({
        spot_id: nearbySpot.id,
        category,
        severity,
        description: description || undefined,
        photo_url: photoUrl || undefined,
      });
    } else {
      const spotId = await createSpotWithReport({
        lat,
        lng,
        title: title.trim(),
        category,
        severity,
        description: description || undefined,
        photo_url: photoUrl || undefined,
      });
      success = !!spotId;
    }

    if (success) {
      toast('Segnalazione inviata!', 'success');
      // Generate share card
      const spotTitle = nearbySpot ? nearbySpot.title : title.trim();
      const catLabel = category ? CATEGORIES[category].label : '';
      setGeneratingCard(true);
      try {
        const blob = await generateShareCard({
          title: spotTitle,
          category: catLabel,
          lat,
          lng,
        });
        const url = URL.createObjectURL(blob);
        if (prevShareUrl.current) URL.revokeObjectURL(prevShareUrl.current);
        prevShareUrl.current = url;
        setShareBlob(blob);
        setShareUrl(url);
      } catch {
        // If card generation fails, just close
        onSuccess();
      } finally {
        setGeneratingCard(false);
      }
    } else {
      toast('Errore nell\'invio', 'error');
    }
  }

  async function handleShare() {
    if (!shareBlob) return;
    const file = new File([shareBlob], 'insicuri-segnalazione.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'InSicuri - Segnalazione pericolo',
          text: 'Ho segnalato un pericolo per ciclisti su InSicuri!',
        });
      } catch {
        // User cancelled
      }
    } else {
      handleDownload();
    }
  }

  function handleDownload() {
    if (!shareUrl) return;
    const a = document.createElement('a');
    a.href = shareUrl;
    a.download = 'insicuri-segnalazione.png';
    a.click();
  }

  // --- Share card view ---
  if (shareUrl) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 text-center">
          Condividi la tua segnalazione nelle storie!
        </p>
        <img
          src={shareUrl}
          alt="Share card"
          className="w-full rounded-xl shadow-md"
        />
        <div className="flex gap-2">
          <button
            onClick={onSuccess}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
          >
            Chiudi
          </button>
          <button
            onClick={handleShare}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Condividi
          </button>
        </div>
      </div>
    );
  }

  // --- Loading card generation ---
  if (generatingCard) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Creo la grafica...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {nearbySpot ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-sm text-blue-800">
            Aggiungi segnalazione a <strong>{nearbySpot.title}</strong>
            <span className="text-blue-600 ml-1">({Math.round(nearbySpot.distance)}m)</span>
          </p>
        </div>
      ) : (
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titolo dello spot
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es: Buca pericolosa all'incrocio"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            maxLength={100}
          />
        </div>
      )}

      <CategoryGrid selected={category} onSelect={setCategory} />

      <SeveritySlider value={severity} onChange={setSeverity} />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descrizione <span className="text-gray-400 font-normal">(opzionale)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrivi la situazione..."
          maxLength={500}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{description.length}/500</p>
      </div>

      <PhotoUpload onUpload={setPhotoUrl} />

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Annulla
        </Button>
        <Button type="submit" disabled={loading || !category} className="flex-1">
          {loading ? 'Invio...' : 'Invia segnalazione'}
        </Button>
      </div>
    </form>
  );
}
