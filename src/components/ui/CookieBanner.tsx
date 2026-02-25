'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'insicuri_cookie_ok';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[2000] p-4 animate-slide-up">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-sm text-gray-700 flex-1">
          Questo sito non usa cookie di tracciamento o profilazione. Utilizziamo solo cookie tecnici necessari per il login.
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 active:bg-gray-700 transition"
        >
          Ho capito
        </button>
      </div>
    </div>
  );
}
