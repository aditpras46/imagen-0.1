/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent } from "react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Download, 
  RefreshCcw, 
  Image as ImageIcon, 
  Loader2, 
  Info, 
  Upload, 
  ChevronRight, 
  ChevronLeft, 
  Trash2,
  ListOrdered,
  CheckCircle2
} from "lucide-react";

// Initialize Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function App() {
  const [promptInput, setPromptInput] = useState("");
  const [promptsQueue, setPromptsQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Simple CSV parsing: split by lines, then take the first column if comma exists
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      const parsedPrompts = lines.map(line => {
        const parts = line.split(",");
        return parts[0].replace(/^["']|["']$/g, "").trim(); // Remove quotes if any
      });
      
      if (parsedPrompts.length > 0) {
        setPromptsQueue(prev => [...prev, ...parsedPrompts]);
        setPromptInput("");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addPromptsFromText = () => {
    const lines = promptInput.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length > 0) {
      setPromptsQueue(prev => [...prev, ...lines]);
      setPromptInput("");
    }
  };

  const generateCartoon = async (index: number) => {
    const currentPrompt = promptsQueue[index];
    if (!currentPrompt) return;

    setIsGenerating(true);
    setError(null);

    try {
      const systemPrompt = `Create a high-quality New School cartoon illustration of: ${currentPrompt}. 
      STYLE REQUIREMENTS:
      - Urban graffiti-inspired character design.
      - BOLD, thick black outlines (sticker-like feel).
      - Vibrant, saturated cel-shaded colors.
      - NO soft gradients, use sharp cel-shading for depth.
      - Pure white background (#FFFFFF).
      - Streetwear and skater aesthetic.
      - Dynamic and energetic composition.
      - Clean vector-like finish.`;

      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ parts: [{ text: systemPrompt }] }],
      });

      let imageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setGeneratedImages(prev => ({ ...prev, [index]: imageUrl }));
      } else {
        throw new Error("Gagal menghasilkan gambar. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Error generating image:", err);
      setError("Terjadi kesalahan saat membuat gambar. Pastikan prompt Anda sesuai kebijakan konten.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (index: number) => {
    const imageUrl = generatedImages[index];
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `cartoon-${index + 1}-${Date.now()}.png`;
    link.click();
  };

  const generateNext = async () => {
    if (currentIndex < promptsQueue.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      // If the next image hasn't been generated yet, start generating it
      if (!generatedImages[nextIndex]) {
        await generateCartoon(nextIndex);
      }
    }
  };

  const goToNext = () => {
    if (currentIndex < promptsQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const clearQueue = () => {
    setPromptsQueue([]);
    setCurrentIndex(0);
    setGeneratedImages({});
    setError(null);
  };

  const currentPrompt = promptsQueue[currentIndex];
  const currentImage = generatedImages[currentIndex];

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Background Glows & Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[150px] rounded-full animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-500/10 blur-[150px] rounded-full animate-float" style={{ animationDelay: '-3s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-purple-500/5 blur-[120px] rounded-full"></div>
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100"></div>
      </div>

      {/* Header */}
      <header className="glass-panel sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <Sparkles size={32} />
            </div>
            <div>
              <h1 className="font-black text-3xl tracking-tighter text-glow">CartoonAI</h1>
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] opacity-80">New School Batch Gen</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span className="hover:text-indigo-400 transition-colors">Batch Process</span>
            <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
            <span className="hover:text-pink-400 transition-colors">Street Style</span>
            <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
            <span className="hover:text-purple-400 transition-colors">No Gradients</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 md:py-12 grid lg:grid-cols-12 gap-8 relative z-10">
        {/* Left Column: Queue Management (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-8 rounded-[3rem] space-y-8 neon-glow">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black flex items-center gap-4 tracking-tight">
                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                  <ListOrdered size={24} className="text-indigo-400" />
                </div>
                Antrean
              </h2>
              {promptsQueue.length > 0 && (
                <button 
                  onClick={clearQueue}
                  className="text-[10px] font-black text-slate-500 hover:text-red-400 flex items-center gap-1.5 uppercase tracking-widest transition-colors"
                >
                  <Trash2 size={14} />
                  Clear
                </button>
              )}
            </div>

            {/* Input Methods */}
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="relative group">
                  <textarea
                    placeholder="Masukkan prompt di sini (satu per baris)..."
                    className="w-full h-44 p-6 rounded-[2rem] bg-slate-950/40 border border-white/5 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none text-sm font-medium placeholder:text-slate-600 custom-scrollbar"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                  />
                  <div className="absolute bottom-5 right-6 text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-950/80 px-3 py-1 rounded-full border border-white/5">
                    {promptInput.split('\n').filter(l => l.trim()).length} Prompts
                  </div>
                </div>
                <button
                  onClick={addPromptsFromText}
                  disabled={!promptInput.trim()}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-extrabold text-sm disabled:bg-slate-800 disabled:text-slate-600 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                >
                  Tambah Prompt
                </button>
              </div>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-white/5 rounded-3xl text-slate-500 font-bold text-xs flex items-center justify-center gap-3 hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all uppercase tracking-widest"
                >
                  <Upload size={18} />
                  Upload CSV / TXT
                </button>
              </div>
            </div>

            {/* Queue List */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-3 custom-scrollbar">
              {promptsQueue.length === 0 ? (
                <div className="text-center py-20 text-slate-600 space-y-6">
                  <div className="w-20 h-20 bg-slate-800/30 rounded-[2rem] flex items-center justify-center mx-auto border border-white/5">
                    <ImageIcon size={40} className="opacity-20" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Antrean Kosong</p>
                </div>
              ) : (
                promptsQueue.map((p, idx) => (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-full p-5 rounded-2xl text-left text-sm transition-all border flex items-center justify-between gap-4 group relative overflow-hidden ${
                      currentIndex === idx
                        ? "bg-indigo-500/10 border-indigo-500/40 text-white font-bold shadow-lg shadow-indigo-500/10"
                        : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    {currentIndex === idx && (
                      <motion.div 
                        layoutId="active-pill"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"
                      />
                    )}
                    <span className="truncate flex-1 relative z-10">
                      <span className={`text-[10px] font-mono mr-3 ${currentIndex === idx ? 'text-indigo-400' : 'text-slate-600'}`}>
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                      {p}
                    </span>
                    {generatedImages[idx] ? (
                      <div className="w-7 h-7 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
                        <CheckCircle2 size={16} className="text-green-400" />
                      </div>
                    ) : (
                      <div className="w-2 h-2 bg-slate-700 rounded-full group-hover:bg-indigo-500/50 transition-colors"></div>
                    )}
                  </motion.button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Prompt & Generation (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {promptsQueue.length > 0 ? (
            <div className="space-y-6">
              {/* Active Prompt Info */}
              <div className="glass-card p-10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 neon-glow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="space-y-4 text-center md:text-left relative z-10">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-500/20">
                      Prompt {currentIndex + 1} / {promptsQueue.length}
                    </span>
                    {generatedImages[currentIndex] && (
                      <span className="px-4 py-1.5 bg-green-500/20 text-green-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-green-500/20">
                        Generated
                      </span>
                    )}
                  </div>
                  <h3 className="text-3xl font-black text-white leading-tight tracking-tight text-glow">"{currentPrompt}"</h3>
                </div>
                <div className="flex gap-4 relative z-10">
                  <button
                    onClick={goToPrev}
                    disabled={currentIndex === 0}
                    className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 disabled:opacity-10 disabled:cursor-not-allowed transition-all shadow-xl"
                  >
                    <ChevronLeft size={28} />
                  </button>
                  <button
                    onClick={goToNext}
                    disabled={currentIndex === promptsQueue.length - 1}
                    className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 disabled:opacity-10 disabled:cursor-not-allowed transition-all shadow-xl"
                  >
                    <ChevronRight size={28} />
                  </button>
                </div>
              </div>

              {/* Generation Area */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Result Preview */}
                <div className="aspect-square bg-white rounded-[4rem] border-[12px] border-slate-900 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
                  <AnimatePresence mode="wait">
                    {currentImage ? (
                      <motion.div
                        key={`img-${currentIndex}`}
                        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 1.2, rotate: 5 }}
                        transition={{ type: "spring", damping: 15, stiffness: 100 }}
                        className="w-full h-full p-12"
                      >
                        <img
                          src={currentImage}
                          alt="Generated Cartoon"
                          className="w-full h-full object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.2)]"
                          referrerPolicy="no-referrer"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-8 text-slate-200"
                      >
                        <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center shadow-inner border border-slate-100">
                          <ImageIcon size={64} className="text-slate-200" />
                        </div>
                        <div className="space-y-3 text-center">
                          <p className="font-black text-slate-400 uppercase tracking-[0.3em] text-[10px]">Ready to Create</p>
                          <p className="text-xs text-slate-400 font-bold max-w-[220px] leading-relaxed opacity-60">
                            Klik tombol di samping untuk memproses prompt ini
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isGenerating && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 z-20">
                      <div className="relative">
                        <div className="w-24 h-24 border-[6px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={40} />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="font-black text-indigo-950 uppercase tracking-[0.3em] text-base">Processing</p>
                        <p className="text-[11px] text-indigo-500 font-black animate-pulse uppercase tracking-widest">Menyusun Piksel New School...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-center space-y-10">
                  <div className="space-y-6">
                    <button
                      onClick={() => generateCartoon(currentIndex)}
                      disabled={isGenerating}
                      className={`w-full py-8 rounded-[2.5rem] font-black text-2xl flex items-center justify-center gap-5 transition-all shadow-2xl relative overflow-hidden group ${
                        isGenerating
                          ? "bg-slate-800 text-slate-600 cursor-not-allowed shadow-none"
                          : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-indigo-500/30"
                      }`}
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-20"></div>
                      {isGenerating ? (
                        <>
                          <Loader2 className="animate-spin" size={36} />
                          PROSES...
                        </>
                      ) : (
                        <>
                          <RefreshCcw size={36} className="group-hover:rotate-180 transition-transform duration-700" />
                          {currentImage ? "RE-GENERATE" : "GENERATE"}
                        </>
                      )}
                    </button>

                    {currentImage && !isGenerating && (
                      <div className="grid grid-cols-2 gap-5 w-full">
                        <button
                          onClick={() => downloadImage(currentIndex)}
                          className="py-6 bg-white/5 border border-white/10 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/10 hover:border-white/20 transition-all shadow-xl"
                        >
                          <Download size={24} className="text-indigo-400" />
                          Unduh
                        </button>
                        <button
                          onClick={generateNext}
                          disabled={currentIndex === promptsQueue.length - 1}
                          className="py-6 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-500/20 hover:border-indigo-500/50 disabled:opacity-10 disabled:cursor-not-allowed transition-all shadow-xl"
                        >
                          Lanjut
                          <ChevronRight size={24} />
                        </button>
                      </div>
                    )}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold flex gap-4"
                    >
                      <Info className="shrink-0" size={20} />
                      <p>{error}</p>
                    </motion.div>
                  )}

                  <div className="p-10 bg-white/[0.02] rounded-[3rem] border border-white/5 space-y-5 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50"></div>
                    <h4 className="font-black text-indigo-400 text-[10px] uppercase tracking-[0.3em] flex items-center gap-4">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                      Batch Logic
                    </h4>
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed opacity-80">
                      Sistem akan memproses satu per satu. Klik <span className="text-white font-black">Lanjut</span> untuk otomatis berpindah dan memproses prompt berikutnya. Hasil gambar dioptimalkan untuk gaya <span className="text-indigo-400 font-black italic tracking-wider">NEW SCHOOL CARTOON</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center glass-card rounded-[4rem] text-slate-600 space-y-10 p-16 text-center neon-glow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
              <div className="w-32 h-32 bg-indigo-500/10 rounded-[3rem] flex items-center justify-center text-indigo-400 rotate-6 shadow-2xl border border-indigo-500/20 animate-float">
                <ListOrdered size={64} />
              </div>
              <div className="space-y-4 max-w-sm relative z-10">
                <h3 className="text-4xl font-black text-white tracking-tighter text-glow">Mulai Batch Processing</h3>
                <p className="text-sm font-semibold text-slate-400 leading-relaxed opacity-70">
                  Tambahkan beberapa prompt melalui kotak teks atau unggah file CSV untuk memulai proses pembuatan gambar massal dengan gaya kartun urban.
                </p>
              </div>
              <button 
                onClick={() => setPromptInput("Karakter kambing skater\nRobot grafiti futuristik\nKucing dj di jalanan")}
                className="px-8 py-3 bg-white/5 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] hover:text-indigo-300 hover:bg-white/10 transition-all border border-white/5"
              >
                Gunakan Contoh Prompt
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-16 border-t border-white/5 mt-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
            <Sparkles size={16} />
          </div>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
            © 2026 CartoonAI Batch Generator • Powered by Gemini AI
          </p>
        </div>
      </footer>
    </div>
  );
}
