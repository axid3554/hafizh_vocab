# 📖 Hafizh Vocab — Flashcard Kosakata Al-Qur'an

Website *flashcard* interaktif untuk mempelajari kosakata bahasa Arab yang sering muncul dalam Al-Qur'an. Aplikasi ini adalah proyek akhir semester MPKT-B (Kelompok 3 Ikhwan). Dibangun secara murni (Vanilla) menggunakan HTML, CSS, dan JavaScript tanpa *framework*.

## ✨ Fitur Utama

- **Flashcard 3D Interaktif** — Kartu bolak-balik dengan animasi 3D *flip*. Teks Arab di sisi depan, dan arti beserta transliterasi, jenis kata, contoh ayat, dan keterangan di sisi belakang.
- **Responsif Sempurna** — Desain UI dioptimalkan untuk berbagai layar (Desktop, Laptop, Tablet, Mobile) agar kartu selalu muat dalam 1 layar tanpa terpotong.
- **Pencarian Cepat** — Cari berdasarkan kata Arab, transliterasi, atau arti (tersedia *real-time*).
- **Filter Berdasarkan Jenis Kata** — Filter khusus untuk Isim (Kata Benda), Fi'il (Kata Kerja), atau Huruf (Partikel).
- **Sistem Kuis Acak** — Mode pengujian interaktif berupa pilihan ganda (25 soal) dengan *feedback* instan dan sistem persentase kelulusan.
- **Kuesioner Terintegrasi** — Form evaluasi akademis berbasis Google Forms yang tertanam langsung (*embedded iframe*) ke dalam aplikasi.
- **Navigasi Nyaman** — Navigasi dapat dilakukan dengan menekan tombol, menggunakan *keyboard* (panah ← → dan spasi), hingga melakukan klik pada ikon panah bawah (*scroll hint*).

## 📁 Struktur File & Direktori

```text
hafizh_vocab/
├── index.html           — Halaman utama (Struktur kerangka UI)
├── style.css            — Gaya tampilan, layout responsif & animasi
├── app.js               — Logika aplikasi (Navigasi, Kuis, JSON Loader)
├── kosakata.csv         — Master data kosakata (format Excel/CSV)
├── kosakata.json        — Data kosakata siap pakai (dihasilkan oleh convert.py)
├── convert.py           — Script Python untuk konversi CSV ke JSON
├── logo.png             — Logo Hafizh Vocab
├── logo_tsl.png         — Logo instansi (TSL)
├── logo_stpii.png       — Logo instansi (STPII)
└── README.md            — Dokumentasi proyek ini
```

## 🚀 Panduan Penggunaan & Update Data

Aplikasi web ini menggunakan file `kosakata.json` sebagai sumber data utamanya agar pemuatan lebih cepat. Jika Anda ingin menambah atau mengedit kosakata, ikuti langkah berikut:

1. **Edit File CSV:**
   Buka file `kosakata.csv` menggunakan Excel/Spreadsheet. Tambahkan atau edit kata-katanya, lalu simpan (pastikan menggunakan format `CSV UTF-8`).
2. **Jalankan Script Konversi:**
   Buka terminal/CMD di dalam folder proyek, lalu jalankan script Python ini:
   ```bash
   python convert.py
   ```
   Atau jika di sistem operasi tertentu:
   ```bash
   python3 convert.py
   ```
   *Script* tersebut otomatis membaca perubahan pada `.csv` dan menimpa/memperbarui file `kosakata.json` agar bisa langsung dibaca oleh aplikasi.
3. **Buka Aplikasi:**
   Buka file `index.html` menggunakan *browser* modern (Chrome, Edge, Firefox, Safari) atau deploy ke hosting statis seperti GitHub Pages.

## ⌨️ Shortcut Keyboard

| Tombol Keyboard | Fungsi / Aksi |
|-----------------|---------------|
| `Panah Kiri (←)`| Berpindah ke kartu **Sebelumnya** |
| `Panah Kanan (→)`| Berpindah ke kartu **Berikutnya** |
| `Spasi (Space)` | Membalikkan kartu (Flip) depan-belakang |

## 🎓 Tim Pengembang

Aplikasi ini dibuat sebagai bagian dari tugas MPKT-B Kelompok 3 (Ikhwan) dengan latar belakang membantu mahasiswa Muslim untuk tidak sekadar membaca ritus Al-Qur'an, namun memahami makna setiap lafalnya. 

Didukung secara teknis dan konseptual untuk memberikan solusi belajar digital (metode *flashcard*) yang lebih cocok, responsif, dan praktis untuk kebiasaan mahasiswa saat ini.

---
© 2026 Hafizh Vocab — Proyek MPKT-B Kel. 3 Ikhwan
