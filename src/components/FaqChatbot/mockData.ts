import type { FaqItem } from './types'

export const INITIAL_FAQS: FaqItem[] = [
  // =========================================================================
  // 1. STAGING - DM (n8n_vectors_mobis_dm_stg) - DEFAULT VIEW
  // =========================================================================
  {
    id: 'faq-stg-dm-1',
    question: 'GMS / GMSI, apa itu GMS? Apa itu GMSI?',
    answer:
      'GMS (Go-Mobility Solution) / PT Global Mobility Solution Indonesia (GMSI) adalah penyedia solusi mobilitas terpercaya yang mengelola rental kendaraan perorangan, korporasi, serta kemitraan taksi online MOBIS.',
    environment: 'staging',
    channel: 'dm',
    category: 'umum',
    status: 'active',
    order: 1,
    updatedAt: '2026-10-14T11:00:00Z',
  },
  {
    id: 'faq-stg-dm-2',
    question: 'MOBIS apa itu MOBIS? MOBIS itu apa?',
    answer:
      'MOBIS adalah platform rental mobil resmi dari GMSI yang menyediakan sewa lepas kunci, sewa dengan supir, serta program kepemilikan mobil (rent-to-own) untuk pengemudi profesional.',
    environment: 'staging',
    channel: 'dm',
    category: 'umum',
    status: 'active',
    order: 2,
    updatedAt: '2026-10-14T10:45:00Z',
  },
  {
    id: 'faq-stg-dm-3',
    question: 'Mobil bisa untuk Gojek / Grab / taksi online?',
    answer:
      'Bisa! Kami menyediakan armada khusus mitra taksi online (Gojek, Grab) dengan tarif harian atau mingguan yang kompetitif, sudah termasuk perawatan berkala dan asuransi proteksi.',
    environment: 'staging',
    channel: 'dm',
    category: 'tarif-promo',
    status: 'active',
    order: 3,
    updatedAt: '2026-10-14T10:30:00Z',
  },
  {
    id: 'faq-stg-dm-4',
    question: 'Wilayah operasional area MOBIS melayani mana saja?',
    answer:
      'Area operasional MOBIS melayani seluruh kawasan Jabodetabek (Jakarta, Bogor, Depok, Tangerang, Bekasi) termasuk antar-jemput bandara Soekarno-Hatta (CGK) dan Halim Perdanakusuma (HLP).',
    environment: 'staging',
    channel: 'dm',
    category: 'area-jadwal',
    status: 'active',
    order: 4,
    updatedAt: '2026-10-14T09:15:00Z',
  },
  {
    id: 'faq-stg-dm-5',
    question: 'Asuransi: apakah ada asuransi? Mobil diasuransikan?',
    answer:
      'Semua armada kendaraan MOBIS terlindungi oleh asuransi komprehensif (All Risk) standar operasional sehingga perjalanan Anda selalu tenang dan aman.',
    environment: 'staging',
    channel: 'dm',
    category: 'persyaratan',
    status: 'active',
    order: 5,
    updatedAt: '2026-10-14T09:00:00Z',
  },
  {
    id: 'faq-stg-dm-6',
    question: 'Berapa biaya pembuatan akun & biaya pendaftaran?',
    answer:
      'Pendaftaran akun di MOBIS 100% gratis tanpa biaya awal. Anda cukup mengisi formulir dan mengunggah dokumen KTP dan SIM A aktif untuk verifikasi.',
    environment: 'staging',
    channel: 'dm',
    category: 'persyaratan',
    status: 'active',
    order: 6,
    updatedAt: '2026-10-14T08:30:00Z',
  },
  {
    id: 'faq-stg-dm-7',
    question: 'Bagaimana cara daftar program kepemilikan mobil MOBIS?',
    answer:
      'Cara daftar: Siapkan e-KTP, SIM A, Kartu Keluarga, dan bukti tempat tinggal. Isi formulir pendaftaran via aplikasi/web atau kunjungi langsung pool operasional MOBIS terdekat.',
    environment: 'staging',
    channel: 'dm',
    category: 'lepas-kunci',
    status: 'active',
    order: 7,
    updatedAt: '2026-10-14T08:00:00Z',
  },

  // =========================================================================
  // 2. STAGING - COMMENT (n8n_vectors_mobis_comments_stg)
  // =========================================================================
  {
    id: 'faq-stg-comm-1',
    question: 'Halo kak, untuk sewa Avanza per hari biayanya berapa ya?',
    answer:
      'Halo kak! Untuk All New Avanza tarif sewa harian mulai dari Rp 350.000/hari ya. Mau kami bantu cek ketersediaan unitnya? Silakan DM kami tanggal penggunaannya ya kak! 😊',
    environment: 'staging',
    channel: 'comment',
    category: 'tarif-promo',
    status: 'active',
    order: 1,
    updatedAt: '2026-10-14T11:20:00Z',
  },
  {
    id: 'faq-stg-comm-2',
    question: 'Bisa lepas kunci ke luar kota gak min?',
    answer:
      'Bisa banget kak! Untuk luar kota batas penggunaan maksimal 300 km/hari ya. Silakan kirim pesan via DM untuk konsultasi rute & booking armada terbaik kami ya.',
    environment: 'staging',
    channel: 'comment',
    category: 'lepas-kunci',
    status: 'active',
    order: 2,
    updatedAt: '2026-10-14T11:10:00Z',
  },
  {
    id: 'faq-stg-comm-3',
    question: 'Syaratnya apa aja min buat rental perorangan?',
    answer:
      'Halo kak, syaratnya mudah kok: e-KTP asli, SIM A aktif, dan kartu identitas kerja atau PBB/rekening listrik. Yuk cek detailnya via DM kami ya kak!',
    environment: 'staging',
    channel: 'comment',
    category: 'persyaratan',
    status: 'active',
    order: 3,
    updatedAt: '2026-10-14T10:50:00Z',
  },

  // =========================================================================
  // 3. PRODUCTION - DM (n8n_vectors_mobis_dm)
  // =========================================================================
  {
    id: 'faq-prod-dm-1',
    question: 'Berapa tarif sewa mobil lepas kunci harian untuk Avanza dan Innova?',
    answer:
      'Tarif sewa lepas kunci untuk All New Avanza mulai dari Rp 350.000/hari, sedangkan untuk Innova Reborn mulai dari Rp 550.000/hari (24 jam). Harga sudah termasuk asuransi standar dan belum termasuk bensin serta e-toll.',
    environment: 'production',
    channel: 'dm',
    category: 'tarif-promo',
    status: 'active',
    order: 1,
    updatedAt: '2026-10-12T14:30:00Z',
  },
  {
    id: 'faq-prod-dm-2',
    question: 'Apa saja syarat dokumen untuk sewa mobil lepas kunci bagi perorangan?',
    answer:
      'Syarat wajib: e-KTP asli penyewa, SIM A aktif, bukti kepemilikan tempat tinggal (PBB/rekening listrik) atau ID card karyawan, serta akun media sosial aktif. Verifikasi dokumen dilakukan secara online sebelum pengambilan unit.',
    environment: 'production',
    channel: 'dm',
    category: 'persyaratan',
    status: 'active',
    order: 2,
    updatedAt: '2026-10-13T09:15:00Z',
  },
  {
    id: 'faq-prod-dm-3',
    question: 'Apakah rental MOBIS menyediakan layanan sewa mobil dengan supir (driver)?',
    answer:
      'Ya, kami menyediakan paket sewa mobil include driver profesional untuk durasi 12 jam atau full day (18 jam). Layanan mencakup perjalanan dalam kota maupun luar kota dengan driver yang hafal rute dan ramah.',
    environment: 'production',
    channel: 'dm',
    category: 'driver',
    status: 'active',
    order: 3,
    updatedAt: '2026-10-11T16:45:00Z',
  },
  {
    id: 'faq-prod-dm-4',
    question: 'Bagaimana cara melakukan booking dan pembayaran di MOBIS?',
    answer:
      'Booking dapat dilakukan melalui website resmi MOBIS, WhatsApp resmi, atau chatbox ini. Pembayaran dapat melalui transfer Bank (BCA, Mandiri, BRI) serta QRIS. Uang muka (DP) minimal 30% untuk mengunci jadwal armada.',
    environment: 'production',
    channel: 'dm',
    category: 'umum',
    status: 'active',
    order: 4,
    updatedAt: '2026-10-10T11:20:00Z',
  },
  {
    id: 'faq-prod-dm-5',
    question: 'Bagaimana kebijakan pembatalan (cancellation) dan pengembalian dana (refund)?',
    answer:
      'Pembatalan H-3 sebelum jadwal sewa mendapatkan refund DP 100%. Pembatalan H-1 dikenakan biaya administrasi 50% dari nilai DP. Pembatalan pada hari H uang muka tidak dapat dikembalikan namun dapat di-reschedule 1 kali.',
    environment: 'production',
    channel: 'dm',
    category: 'umum',
    status: 'active',
    order: 5,
    updatedAt: '2026-10-08T17:10:00Z',
  },

  // =========================================================================
  // 4. PRODUCTION - COMMENT (n8n_vectors_mobis_comments)
  // =========================================================================
  {
    id: 'faq-prod-comm-1',
    question: 'Lokasi pool rental MOBIS di mana ya kak?',
    answer:
      'Halo kak! Pool utama kami berlokasi strategis di Jakarta Selatan dan Tangerang. Untuk detail maps dan penjemputan unit, yuk DM kami ya kak!',
    environment: 'production',
    channel: 'comment',
    category: 'area-jadwal',
    status: 'active',
    order: 1,
    updatedAt: '2026-10-13T15:00:00Z',
  },
  {
    id: 'faq-prod-comm-2',
    question: 'Bisa booking dadakan hari ini gak min?',
    answer:
      'Halo kak! Bisa banget selama ketersediaan unit masih ada. Supaya responnya lebih cepat, yuk langsung hubungi tim kami via DM sekarang ya kak!',
    environment: 'production',
    channel: 'comment',
    category: 'umum',
    status: 'active',
    order: 2,
    updatedAt: '2026-10-13T14:20:00Z',
  },
]
