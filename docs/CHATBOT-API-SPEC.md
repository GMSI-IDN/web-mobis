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

#### Header Tambahan (Next.js -> n8n):
* `X-Timestamp`: Unix timestamp (millisecond) saat request dibuat.
* `X-Signature`: HMAC-SHA256 hex signature yang dihitung dari `${X-Timestamp}.${rawBody}` menggunakan secret key `MOBIS_ASSISTANT_SECRET`.
* `Authorization: <token>`: Dikirimkan otomatis oleh web jika pada pesan sebelumnya n8n menyertakan properti `token`. Digunakan oleh n8n untuk mengidentifikasi session ID memori percakapan.

---

### B. Format Output / Respon (n8n -> Customer)

Node terakhir di n8n (**Respond to Webhook**) **wajib** mengembalikan JSON dengan struktur berikut:

```json
{
  "answer": "Halo Pak Ahmad Fauzi! Untuk program sewa mobil mingguan MOBIS, syaratnya sangat mudah:\n\n1. KTP & KK Asli\n2. SIM A aktif\n3. Akun driver online aktif (Grab / Gojek / Maxim / Indrive)\n4. Membayar deposit sewa\n\nUntuk operasional tersedia di area Jabodetabek, Bandung, Surabaya, dan Bali. Ada tipe mobil tertentu yang sedang Bapak cari?",
  "token": "sess_ahmad_882910",
  "conversationEnded": false
}
```

#### Rincian Parameter Response:

| Parameter | Tipe Data | Wajib | Keterangan |
| :--- | :--- | :--- | :--- |
| `answer` | `string` | **Ya** | Teks jawaban AI yang langsung dicetak ke dalam bubble obrolan pengguna. Mendukung baris baru (`\n`). |
| `token` | `string` | Opsional | ID thread/session percakapan dari memory n8n. Jika disertakan, web akan menyimpannya dan mengirimkannya kembali pada percakapan lanjutan. |
| `conversationEnded` | `boolean` | Opsional | Jika `true`, web frontend akan otomatis menampilkan popup modal **Rating Bintang** setelah bubble chat bot selesai ditampilkan. |

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

#### Header Tambahan (Next.js -> n8n):
* `X-Timestamp`: Unix timestamp (millisecond) saat request rating dikirim.
* `X-Signature`: HMAC-SHA256 hex signature dari `${X-Timestamp}.${rawBody}`.
* `Authorization: <token>`: Disertakan jika sesi pengguna memiliki token.

### B. Format Output Rating (n8n -> Customer)

Cukup kembalikan status HTTP `200` dengan JSON sukses sederhana:

```json
{
  "success": true
}
```

---

## 3. Panduan Setup Node di n8n

### A. Konfigurasi Node Webhook:
1. **HTTP Method:** `POST`
2. **Path:** Sesuaikan dengan path webhook Anda (misal: `chatbox_lp_rentalmobis`)
3. **Response Mode:** `Using 'Respond to Webhook' Node`

### B. Cara Verifikasi HMAC-SHA256 di n8n (Opsional - Node "Code"):
Jika ingin memvalidasi integritas request dari Next.js di n8n:
```javascript
const crypto = require('crypto');
const secret = '80e94a2823db5b066f5de2f4c0af72c0d2fe5a75181cd2860d2fc8a0221e4dde';

const timestamp = $json.headers['x-timestamp'];
const signature = $json.headers['x-signature'];
const rawBody = JSON.stringify($json.body);

const expected = crypto.createHmac('sha256', secret)
  .update(`${timestamp}.${rawBody}`)
  .digest('hex');

if (signature !== expected) {
  throw new Error('Invalid HMAC Signature');
}
return $input.all();
```

### C. Akses Data Input di n8n:
- Teks Pesan: `{{ $json.body.query }}`
- Nama: `{{ $json.body.username }}`
- No. HP: `{{ $json.body.phoneNumber }}`
- Session Token: `{{ $json.headers.authorization }}`

### D. Node "Respond to Webhook":
- **Respond With:** `JSON`
- **Response Body:**
  ```json
  {
    "answer": "={{ $json.output }}",
    "token": "={{ $json.sessionId || $json.token }}",
    "conversationEnded": "={{ $json.isFinished || false }}"
  }
  ```

