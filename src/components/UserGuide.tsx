import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, FileText, Sparkles, CheckCircle2 } from 'lucide-react';

export const UserGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-slate-800/90 p-5 md:p-6 rounded-2xl shadow-xl mb-8 border-2 border-indigo-500/80 transition-all">
      <div 
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-white">Panduan Penggunaan</h2>
            <p className="text-xs text-slate-400">Langkah mudah menyusun instrumen asesmen dan prompt AI berkualitas</p>
          </div>
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          aria-label={isOpen ? 'Tutup panduan' : 'Buka panduan'}
        >
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-700/80">
          <ol className="text-slate-300 text-xs md:text-sm list-decimal ml-5 space-y-2 leading-relaxed">
            <li>
              Isi Informasi Umum atau gunakan modul <strong className="text-indigo-300">Pengisian Otomatis (Auto-Fill)</strong> di bawah jika ingin memetakan bab &amp; Tujuan Pembelajaran (TP) secara instan berurutan tanpa jeda.
            </li>
            <li>
              <strong>Pilihan Stimulus:</strong> Pilih <em className="text-indigo-200">Dengan Stimulus</em> (atur jumlah paragraf atau centang opsi gambar berwarna / hitam-putih) atau pilih <em className="text-indigo-200">Tanpa Stimulus</em> jika ingin soal langsung tanpa bacaan/gambar.
            </li>
            <li>
              Pilih jenis soal &amp; isi nomor soal dengan format dipisah koma atau tanda hubung (contoh: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 font-mono">1, 2, 3</code> atau rentang <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 font-mono">1-5</code>).
            </li>
            <li>
              Klik <strong className="text-indigo-300">Generate Prompt AI</strong> untuk menyalin instruksi baku ke Gemini/ChatGPT, atau klik <strong className="text-emerald-400">✨ Generate Soal Langsung (Gemini AI)</strong> untuk membuat naskah soal instan di dalam aplikasi ini.
            </li>
            <li>
              Hasil soal siap disalin ke Microsoft Word dengan opsi <em className="text-amber-300">"Keep Source Formatting"</em> agar format garis tabel Benar-Salah dan Menjodohkan tetap rapi bergaris.
            </li>
          </ol>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <span className="text-slate-300">
                <strong>PG Kompleks:</strong> Wajib memakai kurung siku <code className="text-indigo-300 font-mono">[A], [B], [C], [D]</code>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <span className="text-slate-300">
                <strong>Menjodohkan:</strong> 4 pernyataan vs 5 pilihan jawaban (+1 pengecoh)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <span className="text-slate-300">
                <strong>Benar-Salah:</strong> Tabel 3 pernyataan kognitif
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
