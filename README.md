# Cinematic AI — AI Video Generator

Frontend **frontend-ready** untuk generate video sinematik dari prompt teks. Tulis adegan → Generate → Preview → Download.

> Status: UI rapih, logic dummy video siap. Tinggal sambung API real (Replicate / Runway / HuggingFace).

## Fitur
- Prompt box dengan validasi, char count, `Ctrl+Enter` shortcut
- Loading state + `aria-busy` + toast feedback
- Dummy video preview (`BigBuckBunny.mp4`) + tombol **DOWNLOAD VIDEO** / **BUAT LAGI**
- Responsive + accessible (a11y), tema dark cinematic

## Struktur
```
projek cinimatikAi/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Jalankan Lokal
```bash
# opsi 1: double-click index.html
# opsi 2: serve
npx serve .
# atau
python -m http.server 8000
```

## Sambung API Real
Ganti blok di `script.js:163`:
```js
// const { jobId } = await api.generateVideo(prompt)
// const videoUrl = await api.pollUntilDone(jobId)
await new Promise(r => setTimeout(r,1500));
showVideoResult(DUMMY_VIDEO_URL);
```
menjadi fetch ke backend kamu dan panggil `showVideoResult(videoUrl)`.

## Deploy
- GitHub Pages / Vercel / Netlify — cukup push, tidak perlu build.
- Repo: `https://github.com/gilank-tech/vidio-convet-ai`

## Lisensi
MIT
