// --- Fungsi Pembantu (Helper Functions) ---
// Kode ini berjalan di server (Node.js), bukan di browser.

/**
 * Mengonversi string Base64 ke ArrayBuffer.
 * Di Node.js, kita menggunakan Buffer bawaan.
 */
function base64ToArrayBuffer(base64) {
    const binaryString = Buffer.from(base64, 'base64').toString('binary');
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Mengonversi data PCM mentah (Int16Array) ke format file WAV (Buffer Node.js).
 * Ini diperlukan karena API Google mengembalikan audio PCM mentah.
 */
function pcmToWav(pcmData, sampleRate) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmData.length * (bitsPerSample / 8);
    const fileSize = 36 + dataSize; // 36 byte untuk header non-data

    // Menggunakan Buffer Node.js untuk efisiensi di sisi server
    const buffer = Buffer.alloc(fileSize + 8);

    // Header RIFF
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(fileSize, 4); // Ukuran file
    buffer.write("WAVE", 8);

    // Chunk 'fmt '
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16); // Ukuran sub-chunk fmt
    buffer.writeUInt16LE(1, 20); // Format audio (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);

    // Chunk 'data'
    buffer.write("data", 36);
    buffer.writeUInt32LE(dataSize, 40); // Ukuran data audio

    // Menulis data PCM aktual
    for (let i = 0; i < pcmData.length; i++) {
        buffer.writeInt16LE(pcmData[i], 44 + i * 2);
    }

    return buffer; // Mengembalikan Buffer Node.js
}

/**
 * Fungsi Fetch dengan logic retry (exponential backoff) untuk menangani rate limit.
 */
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status !== 429) { // Bukan error rate limit
                return response;
            }
            // Error rate limit, tunggu dan coba lagi
            console.warn(`Rate limited (429). Retrying in ${delay}ms...`);
        } catch (error) {
            // Error jaringan, coba lagi
            console.warn(`Fetch failed. Retrying in ${delay}ms...`, error);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Gandakan waktu tunggu
    }
    // Gagal setelah semua percobaan
    throw new Error("Gagal mengambil data dari Google API setelah beberapa kali percobaan.");
}


// --- Handler API Utama ---
// Ini adalah endpoint backend Anda: /api/generate-speech

export default async function handler(req, res) {
    // 1. Keamanan: Hanya izinkan metode POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    try {
        // 2. Ambil data dari body request frontend
        const { text, voice, style, pitch } = req.body;

        if (!text) {
            return res.status(400).json({ message: "Parameter 'text' diperlukan." });
        }

        // 3. Keamanan: Ambil API Key dari Environment Variables
        // Kunci ini HANYA ada di server Vercel, tidak pernah terekspos ke browser.
        const apiKey = process.env.GOOGLE_API_KEY; 
        
        if (!apiKey) {
             console.error("GOOGLE_API_KEY tidak diatur di environment server.");
             // Kirim pesan error umum ke pengguna
             return res.status(500).json({ message: "Konfigurasi server error." });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
        
        // 4. Membangun prompt untuk AI
        let prompt = text;
        const pitchNum = parseInt(pitch, 10) || 0;
        
        let pitchStyle = '';
        if (pitchNum > 3) {
            pitchStyle = 'dengan nada tinggi';
        } else if (pitchNum < -3) {
            pitchStyle = 'dengan nada rendah';
        }

        let finalStyle = style || '';
        if (pitchStyle) {
            finalStyle = finalStyle ? `${pitchStyle}, ${style}` : pitchStyle;
        }

        // Terapkan gaya ke prompt jika ada
        if (finalStyle) {
            prompt = `Katakan dengan gaya ${finalStyle}: ${text}`;
        }

        // 5. Siapkan payload untuk Google AI API
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice || "Achernar" } // Default ke 'Achernar' jika tidak ada
                    }
                }
            },
            model: "gemini-2.5-flash-preview-tts"
        };

        // 6. Panggil Google AI API dengan aman dari backend
        const response = await fetchWithRetry(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            // Jika Google API mengembalikan error
            const errorData = await response.json();
            console.error("Google API Error:", errorData.error);
            throw new Error(errorData.error?.message || 'Gagal menghasilkan audio dari Google.');
        }

        // 7. Proses respons yang berhasil
        const result = await response.json();
        const part = result?.candidates?.[0]?.content?.parts?.[0];
        const audioDataB64 = part?.inlineData?.data; // Data audio dalam Base64
        const mimeType = part?.inlineData?.mimeType;

        if (audioDataB64 && mimeType && mimeType.startsWith("audio/")) {
            // Dapatkan sample rate dari mimeType (misal: "audio/L16;rate=24000")
            const sampleRateMatch = mimeType.match(/rate=(\d+)/);
            const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 24000; // Default 24kHz
            
            // 8. Konversi Audio ke WAV
            const pcmData = base64ToArrayBuffer(audioDataB64);
            const pcm16 = new Int16Array(pcmData);
            const wavBuffer = pcmToWav(pcm16, sampleRate); // Ini adalah Buffer Node.js
            
            // 9. Kirim file audio WAV kembali ke frontend
            res.setHeader('Content-Type', 'audio/wav');
            res.setHeader('Content-Length', wavBuffer.length);
            return res.status(200).send(wavBuffer); // Kirim buffer biner

        } else {
            // Jika respons Google tidak mengandung data audio
            throw new Error('Respons API Google tidak valid atau tidak mengandung data audio.');
        }

    } catch (error) {
        // Tangani semua error yang mungkin terjadi
        console.error('Internal Server Error:', error.message);
        return res.status(500).json({ message: error.message || "Terjadi kesalahan internal." });
    }
}

