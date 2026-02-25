# Contributing a InSicuri

Grazie per il tuo interesse nel contribuire! InSicuri è un progetto open source civic tech.

## Come contribuire

1. **Fork** il repository
2. Crea un **branch** per la tua feature (`git checkout -b feature/nome-feature`)
3. **Commit** le modifiche (`git commit -m 'Aggiungi feature X'`)
4. **Push** al branch (`git push origin feature/nome-feature`)
5. Apri una **Pull Request**

## Ambiente di sviluppo

```bash
npm install --legacy-peer-deps
cp .env.local.example .env.local
npm run dev
```

## Linee guida

- Scrivi codice TypeScript tipizzato
- Usa Tailwind per lo styling
- Mobile-first: testa sempre su viewport 375px
- Mantieni i componenti piccoli e focalizzati
- Scrivi commit messages chiari in italiano o inglese

## Segnalare bug

Apri una issue descrivendo:
- Cosa ti aspettavi
- Cosa è successo
- Come riprodurre il problema
- Screenshot se possibile

## Licenza

Contribuendo a InSicuri, accetti che il tuo contributo sia rilasciato sotto licenza AGPL-3.0.
