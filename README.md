# 📖 Hafizh Vocab — Flashcard Kosakata Al-Qur'an

Website flashcard interaktif untuk mempelajari kosakata bahasa Arab yang sering muncul dalam Al-Qur'an. Dibangun dengan HTML, CSS, dan JavaScript murni — tanpa framework.

## ✨ Fitur

- **Flashcard Interaktif** — Kartu dengan animasi 3D flip. Tap/klik untuk melihat arti.
- **Navigasi Kartu** — Tombol sebelumnya/berikutnya + keyboard (← →) + swipe di mobile.
- **Pencarian** — Cari berdasarkan kata Arab, transliterasi, atau arti.
- **Filter Jenis Kata** — Filter berdasarkan Isim (kata benda), Fi'il (kata kerja), atau Huruf (partikel).
- **Mode Kuis** — 25 soal pilihan ganda acak untuk menguji pemahaman.
- **Skor & Feedback** — Feedback visual benar/salah + skor akhir dengan pesan motivasi.
- **Kuesioner Kepuasan** — Link ke Google Form setelah kuis selesai.
- **Responsif** — Tampilan optimal di HP maupun laptop.

## 📁 Struktur File

```
hafizh_vocab/
├── index.html          — Halaman utama
├── style.css           — Styling dan animasi
├── app.js              — Logika aplikasi
├── kosakata.csv        — Data kosakata (sumber data)
├── AI_Abu_Ismail.png   — Logo
└── README.md           — Dokumentasi (file ini)
```

## 🚀 Cara Penggunaan

1. Clone atau download repository ini.
2. Buka `index.html` di browser, atau deploy ke GitHub Pages.
3. Untuk menambah kosakata, edit file `kosakata.csv` di spreadsheet lalu ekspor ulang sebagai CSV (UTF-8).

## 📊 Format Data CSV

File `kosakata.csv` memiliki format:
- **Baris 1–2**: Deskripsi template (diabaikan oleh aplikasi)
- **Baris 3**: Nama kolom
- **Baris 4+**: Data kosakata

| Kolom | Keterangan | Wajib |
|-------|-----------|-------|
| ID * | Nomor urut | Ya |
| Kata Arab * | Kata dalam huruf Arab | Ya |
| Transliterasi * | Cara baca Latin | Ya |
| Arti (ID) * | Arti dalam bahasa Indonesia | Ya |
| Arti (EN) | Arti dalam bahasa Inggris | Tidak |
| Jenis Kata * | Isim / Fi'il / Huruf | Ya |
| Frekuensi | Jumlah kemunculan dalam Al-Qur'an | Tidak |
| Contoh Ayat (Arab) | Potongan ayat dalam bahasa Arab | Tidak |
| Contoh Ayat (ID) | Terjemahan potongan ayat | Tidak |
| Nama Surat | Nama surat Al-Qur'an | Tidak |
| No. Ayat | Nomor ayat | Tidak |
| Status * | Status verifikasi data | Ya |

## 📋 Outline Kuesioner Google Form

Berikut pertanyaan yang direkomendasikan untuk kuesioner kepuasan pengguna (skala 1–5):

| No | Pertanyaan | Tipe Jawaban |
|----|-----------|-------------|
| 1 | Seberapa mudah Anda menggunakan website Hafizh Vocab? | Skala 1-5 |
| 2 | Seberapa menarik tampilan/desain website ini? | Skala 1-5 |
| 3 | Seberapa membantu fitur flashcard untuk menghafal kosakata? | Skala 1-5 |
| 4 | Seberapa membantu fitur kuis untuk menguji pemahaman Anda? | Skala 1-5 |
| 5 | Seberapa besar kemungkinan Anda merekomendasikan website ini kepada teman? | Skala 1-5 |
| 6 | Saran atau masukan untuk perbaikan website ini? | Teks panjang |

> **Catatan**: Ganti link placeholder `https://forms.gle/XXXXX` di `index.html` dengan link Google Form Anda yang sebenarnya.

## ⌨️ Shortcut Keyboard

| Tombol | Fungsi |
|--------|--------|
| ← | Kartu sebelumnya |
| → | Kartu berikutnya |
| Spasi | Balik kartu (flip) |

## 📄 Lisensi

Proyek MPKT-B © 2025
