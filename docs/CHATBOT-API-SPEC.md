# Spesifikasi API & Format JSON Chatbot MOBIS (Next.js <-> n8n)

Dokumen ini menjelaskan kontrak data JSON antara Frontend MOBIS, Backend Next.js Proxy (`/api/assistant`), dan Workflow n8n (Upstream AI).

---

## Arsitektur Alur Komunikasi

```
[ Customer (Browser) ]
       │
       │ HTTP POST /api/assistant
       ▼
[ Next.js Backend Proxy ]
  - Rate limit (max 20 req/menit/IP)
  - Sanitasi input (anti-XSS)
       │
       │ HTTP POST (Forward via MOBIS_ASSISTANT_API_BASE)
       ▼
[ n8n Webhook / AI Engine ]
       │
       │ Return JSON { "answer": "..." }
       ▼
[ Customer Bubble Chat ]
```

---

## 1. Chat Message Endpoint

* **Endpoint Next.js:** `POST /api/assistant`
* **Target n8n Webhook:** Nilai dari env `MOBIS_ASSISTANT_API_BASE`
* **Content-Type:** `application/json`

### A. Format Input (Customer -> n8n)

Payload JSON mentah yang diterima oleh node **Webhook** di n8n:

```json
{
  "query": "Halo, saya mau tanya syarat sewa mobil mingguan untuk driver online apa saja ya?",
  "username": "Ahmad Fauzi",
  "phoneNumber": "081234567890"
}
```

#### Rincian Parameter Request:

| Parameter | Tipe Data | Wajib | Keterangan |
| :--- | :--- | :--- | :--- |
| `query` | `string` | Ya | Pesan / pertanyaan yang diketik pengguna (maks. 2000 karakter). |
| `username` | `string` | Tidak | Nama pengguna yang diinput pada form pembuka chat. |
| `phoneNumber` | `string` | Tidak | Nomor telepon pengguna (angka murni tanpa spasi atau tanda hubung). |

#### Header Tambahan (Pesan ke-2 dan seterusnya):
* `Authorization: <token>`: Dikirimkan otomatis oleh web jika pada pesan sebelumnya n8n menyertakan properti `token`. Digunakan oleh n8n untuk mengidentifikasi session ID memori percakapan.

---

### B. Format Output / Respon (n8n -> Customer)

Node terakhir di n8n (**Respond to Webhook**) **wajib** mengembalikan JSON dengan struktur berikut:

```json
{
  "answer": "Halo Pak Ahmad Fauzi! Untuk program sewa mobil mingguan MOBIS, syaratnya sangat mudah:\n\n1. KTP & KK Asli\n2. SIM A aktif\n3. Akun driver online aktif (Grab / Gojek / Maxim / Indrive)\n4. Membayar deposit sewa\n\nUntuk operasional tersedia di area Jabodetabek, Bandung, Surabaya, dan Bali. Ada tipe mobil tertentu yang sedang Bapak cari?",
  "token": "sess_ahmad_882910"
}
```

#### Rincian Parameter Response:

| Parameter | Tipe Data | Wajib | Keterangan |
| :--- | :--- | :--- | :--- |
| `answer` | `string` | **Ya** | Teks jawaban AI yang langsung dicetak ke dalam bubble obrolan pengguna. Mendukung baris baru (`\n`). |
| `token` | `string` | Opsional | ID thread/session percakapan dari memory n8n. Jika disertakan, web akan menyimpannya dan mengirimkannya kembali pada percakapan lanjutan. |

---

## 2. Rating & Review Endpoint

* **Endpoint Next.js:** `POST /api/assistant/rating`
* **Target n8n Webhook:** Nilai dari `MOBIS_ASSISTANT_API_RATING` atau `${MOBIS_ASSISTANT_API_BASE}/rating`

### A. Format Input Rating (Customer -> n8n)

```json
{
  "rating": 5,
  "review": "Penjelasannya sangat membantu dan cepat tanggap, terima kasih!",
  "username": "Ahmad Fauzi",
  "phoneNumber": "081234567890"
}
```

#### Rincian Parameter Rating:

| Parameter | Tipe Data | Wajib | Keterangan |
| :--- | :--- | :--- | :--- |
| `rating` | `integer` | Ya | Skor penilaian bintang dari 1 sampai 5. |
| `review` | `string` | Tidak | Teks ulasan atau masukan dari pengguna (maks. 1000 karakter). |
| `username` | `string` | Tidak | Nama pengguna. |
| `phoneNumber` | `string` | Tidak | Nomor telepon pengguna. |

### B. Format Output Rating (n8n -> Customer)

Cukup kembalikan status HTTP `200` dengan JSON sukses sederhana:

```json
{
  "success": true
}
```

---

## 3. Panduan Setup Node di n8n

1. **Node Webhook**:
   - **HTTP Method:** `POST`
   - **Path:** Sesuaikan dengan path webhook Anda (misal: `chat-mobis`)
   - **Response Mode:** `Using 'Respond to Webhook' Node`

2. **Akses Data Input di n8n**:
   - Teks Pesan: `{{ $json.body.query }}`
   - Nama: `{{ $json.body.username }}`
   - No. HP: `{{ $json.body.phoneNumber }}`
   - Session Token: `{{ $json.headers.authorization }}`

3. **Node "Respond to Webhook"**:
   - **Respond With:** `JSON`
   - **Response Body:**
     ```json
     {
       "answer": "={{ $json.output }}",
       "token": "={{ $json.sessionId || $json.token }}"
     }
     ```
