'use client';

import { useState } from 'react';
import type { DangerCategory, NearbySpot } from '@/types';
import { CategoryGrid } from './CategoryGrid';
import { SeveritySlider } from './SeveritySlider';
import { PhotoUpload } from './PhotoUpload';
import { Button } from '@/components/ui/Button';
import { useCreateReport } from '@/hooks/useCreateReport';
import { useToast } from '@/components/ui/Toast';

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
  const { createSpotWithReport, addReportToSpot, loading } = useCreateReport();
  const { toast } = useToast();

  const isNewSpot = !nearbySpot;

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
      onSuccess();
    } else {
      toast('Errore nell\'invio', 'error');
    }
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
