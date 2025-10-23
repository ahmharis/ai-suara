import { useState } from 'react';

// Daftar suara yang sama seperti sebelumnya, diurutkan
const voices = [
    { name: "Achernar (Lembut) - Wanita", value: "Achernar" },
    { name: "Achird (Ramah) - Wanita", value: "Achird" },
    { name: "Algenib (Serak) - Pria", value: "Algenib" },
    { name: "Algieba (Halus) - Wanita", value: "Algieba" },
    { name: "Alnilam (Tegas) - Pria", value: "Alnilam" },
    { name: "Aoede (Ringan) - Wanita", value: "Aoede" },
    { name: "Autonoe (Cerah) - Wanita", value: "Autonoe" },
    { name: "Callirrhoe (Santai) - Wanita", value: "Callirrhoe" },
    { name: "Charon (Informatif) - Pria", value: "Charon" },
    { name: "Despina (Halus) - Wanita", value: "Despina" },
    { name: "Enceladus (Berbisik) - Pria", value: "Enceladus" },
    { name: "Erinome (Jelas) - Wanita", value: "Erinome" },
    { name: "Fenrir (Bersemangat) - Pria", value: "Fenrir" },
    { name: "Gacrux (Dewasa) - Pria", value: "Gacrux" },
    { name: "Iapetus (Jelas) - Pria", value: "Iapetus" },
    { name: "Kore (Tegas) - Wanita", value: "Kore" },
    { name: "Laomedeia (Ceria) - Wanita", value: "Laomedeia" },
    { name: "Leda (Muda) - Wanita", value: "Leda" },
    { name: "Orus (Tegas) - Pria", value: "Orus" },
    { name: "Puck (Ceria) - Pria", value: "Puck" },
    { name: "Pulcherrima (Terus Terang) - Wanita", value: "Pulcherrima" },
    { name: "Rasalgethi (Informatif) - Pria", value: "Rasalgethi" },
    { name: "Sadachbia (Lincah) - Wanita", value: "Sadachbia" },
    { name: "Sadaltager (Berpengetahuan) - Pria", value: "Sadaltager" },
    { name: "Schedar (Merata) - Wanita", value: "Schedar" },
    { name: "Sulafat (Hangat) - Wanita", value: "Sulafat" },
    { name: "Umbriel (Santai) - Pria", value: "Umbriel" },
    { name: "Vindemiatrix (Lembut) - Wanita", value: "Vindemiatrix" },
    { name: "Zephyr (Cerah) - Wanita", value: "Zephyr" },
    { name: "Zubenelgenubi (Santai) - Pria", value: "Zubenelgenubi" }
].sort((a, b) => a.name.localeCompare(b.name));

// Komponen Loading Spinner
function Loader() {
    return (
        <div className="ml-3 border-4 border-f3f3f3 rounded-full border-t-4 border-t-indigo-600 w-5 h-5 animate-spin"></div>
    );
}

// Komponen utama halaman
export default function Home() {
    // State untuk menyimpan semua input pengguna
    const [text, setText] = useState("");
    const [voice, setVoice] = useState("Achernar");
    const [style, setStyle] = useState("");
    const [volume, setVolume] = useState(100);
    const [pitch, setPitch] = useState(0);
    const [speed, setSpeed] = useState(1.0);
    
    // State untuk UI
    const [charCount, setCharCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [audioUrl, setAudioUrl] = useState(null);

    // Handler untuk input teks
    const handleTextChange = (e) => {
        setText(e.target.value);
        setCharCount(e.target.value.length);
    };

    // Handler untuk submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text) {
            setErrorMessage("Silakan masukkan teks terlebih dahulu.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");
        setAudioUrl(null); // Hapus audio sebelumnya

        try {
            // Memanggil API backend kita, BUKAN Google API secara langsung
            const response = await fetch('/api/generate-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    voice,
                    style,
                    pitch,
                    // Volume dan Speed akan di-handle di frontend
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal menghasilkan audio.');
            }

            // Menerima audio sebagai 'blob' (binary data)
            const audioBlob = await response.blob();
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url); // Set URL audio untuk diputar

        } catch (error) {
            console.error('Error:', error);
            setErrorMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-100 flex items-center justify-center min-h-screen p-4 font-inter">
            <div className="w-full max-w-3xl">
                <header className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-800">AI Teks Berbicara</h1>
                    <p className="text-slate-600 mt-2 text-lg">Saatnya ubah teks menjadi suara alami dengan AI 💬</p>
                </header>

                <main className="bg-white rounded-2xl shadow-xl p-6 md:p-10">
                    <div className="border-b border-slate-200 pb-6">
                        <h2 className="text-2xl font-semibold text-slate-900">Generate Audio</h2>
                        <p className="text-slate-500 mt-1">by @handialbanjary</p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                        {/* Area Teks */}
                        <div>
                            <label htmlFor="text-input" className="block text-sm font-medium text-slate-700 mb-1">Teks untuk diucapkan</label>
                            <div className="relative">
                                <textarea 
                                    id="text-input" 
                                    rows="5" 
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150" 
                                    placeholder="Tuliskan atau tempelkan teks di sini..."
                                    value={text}
                                    onChange={handleTextChange}
                                ></textarea>
                                <div id="char-count" className="absolute bottom-3 right-3 text-xs text-slate-400">{charCount} karakter</div>
                            </div>
                        </div>

                        {/* Pilihan Suara & Gaya */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="voice-select" className="block text-sm font-medium text-slate-700 mb-1">Pilih Suara</label>
                                <select 
                                    id="voice-select" 
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 bg-white"
                                    value={voice}
                                    onChange={(e) => setVoice(e.target.value)}
                                >
                                    {voices.map(v => (
                                        <option key={v.value} value={v.value}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="style-input" className="block text-sm font-medium text-slate-700 mb-1">Gaya Bicara</label>
                                <input 
                                    type="text" 
                                    id="style-input" 
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150" 
                                    placeholder="Contoh: Bersemangat, Tenang, Ceria"
                                    value={style}
                                    onChange={(e) => setStyle(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Sliders */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                            <div>
                                <label htmlFor="volume-slider" className="block text-sm font-medium text-slate-700 mb-2">Volume: <span id="volume-value">{volume}</span></label>
                                <input 
                                    id="volume-slider" 
                                    type="range" min="0" max="100" 
                                    value={volume}
                                    onChange={(e) => setVolume(e.target.value)}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div>
                                <label htmlFor="pitch-slider" className="block text-sm font-medium text-slate-700 mb-2">Nada (Pitch): <span id="pitch-value">{pitch}</span></label>
                                <input 
                                    id="pitch-slider" 
                                    type="range" min="-10" max="10" step="1"
                                    value={pitch}
                                    onChange={(e) => setPitch(e.target.value)}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div>
                                <label htmlFor="speed-slider" className="block text-sm font-medium text-slate-700 mb-2">Kecepatan: <span id="speed-value">{speed}</span>x</label>
                                <input 
                                    id="speed-slider" 
                                    type="range" min="0.5" max="2" step="0.1"
                                    value={speed}
                                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Tombol Submit */}
                        <div className="pt-4">
                            <button type="submit" id="generate-btn" disabled={isLoading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 ease-in-out flex items-center justify-center text-lg disabled:opacity-75 disabled:cursor-not-allowed">
                                <span id="btn-text">{isLoading ? "Menghasilkan..." : "Ucapkan Teks"}</span>
                                {isLoading && <Loader />}
                            </button>
                        </div>
                    </form>

                    {/* Output Audio */}
                    {audioUrl && (
                        <div id="audio-output" className="mt-8">
                             <h3 className="text-lg font-semibold text-slate-800 mb-2">Hasil Audio</h3>
                             <audio 
                                id="audio-player" 
                                controls 
                                autoPlay
                                src={audioUrl}
                                controlsList="nodownload"
                                className="w-full"
                                // Terapkan volume dan kecepatan saat audio dimuat
                                onLoadedMetadata={(e) => {
                                    e.target.volume = volume / 100;
                                    e.target.playbackRate = speed;
                                }}
                             ></audio>
                        </div>
                    )}
                    
                    {/* Pesan Error */}
                    {errorMessage && (
                        <div id="error-message" className="mt-4 text-red-600 bg-red-100 p-3 rounded-lg">
                            {errorMessage}
                        </div>
                    )}

                </main>
            </div>
            
            {/* Style global untuk font Inter dan slider thumb */}
            <style jsx global>{`
                /* Impor font di file _app.js atau global.css, tapi ini juga berfungsi */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                }
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    background: #4f46e5;
                    cursor: pointer;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 0 5px rgba(0,0,0,0.2);
                    margin-top: -8px; /* Menyesuaikan posisi thumb */
                }
                input[type=range]::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    background: #4f46e5;
                    cursor: pointer;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 0 5px rgba(0,0,0,0.2);
                }
            `}</style>
        </div>
    );
}

