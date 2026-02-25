'use client';

import { useRef, useState } from 'react';
import { uploadReportPhoto } from '@/lib/storage';

interface PhotoUploadProps {
  onUpload: (url: string) => void;
}

export function PhotoUpload({ onUpload }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const url = await uploadReportPhoto(file);
      onUpload(url);
    } catch {
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Foto <span className="text-gray-400 font-normal">(opzionale)</span>
      </label>
      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                onUpload('');
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center text-sm"
            >
              X
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-20 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-gray-400 hover:text-gray-500 transition flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Scatta o carica foto
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
