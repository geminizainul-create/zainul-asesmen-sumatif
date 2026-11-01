import React from 'react';
import { Plus, CheckSquare, Sparkles, Send, Loader2, Info } from 'lucide-react';
import { KelengkapanType, SoalType } from '../types/assessment';

interface SummaryAndOutputOptionsProps {
  totalQuestions: number;
  questionBreakdown: Record<SoalType, number>;
  onAddPacket: () => void;
  kelengkapan: KelengkapanType[];
  onToggleKelengkapan: (item: KelengkapanType) => void;
  onGeneratePrompt: () => void;
  onGenerateAI: () => void;
  isGeneratingAI: boolean;
}

export const SummaryAndOutputOptions: React.FC<SummaryAndOutputOptionsProps> = ({
  totalQuestions,
  questionBreakdown,
  onAddPacket,
  kelengkapan,
  onToggleKelengkapan,
  onGeneratePrompt,
  onGenerateAI,
  isGeneratingAI,
}) => {
  const KELENGKAPAN_ITEMS: KelengkapanType[] = [
    'Materi Esensial',
    'Kisi-Kisi',
    'Kunci dan Skor Jawaban',
    'Kartu Soal',
    'Telaah Soal',
  ];

  return (
    <div className="space-y-6">
      {/* Add Packet Button */}
      <div>
        <button
          type="button"
          onClick={onAddPacket}
          className="w-full py-3.5 border-2 border-dashed border-slate-600 hover:border-indigo-500 rounded-2xl text-slate-300 hover:text-indigo-400 transition-all flex items-center justify-center gap-2 font-medium cursor-pointer bg-slate-800/40 hover:bg-indigo-950/20 shadow-sm"
        >
          <Plus className="w-5 h-5 text-indigo-400" />
          Tambah Paket Soal Baru
        </button>
        <p className="text-amber-400 text-[11px] text-center mt-2 italic flex items-center justify-center gap-1">
          <Info className="w-3 h-3 shrink-0" />
          Fungsi: Klik untuk menambah bagian baru jika ingin memisahkan materi, bab soal, atau stimulus (bacaan/gambar) yang berbeda.
        </p>
      </div>

      {/* 02 Ringkasan Soal */}
      <div className="bg-slate-800 p-5 md:p-6 rounded-2xl shadow-xl border border-slate-700/80">
        <h2 className="text-base md:text-lg font-semibold mb-4 text-indigo-400 flex items-center gap-2">
          <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs font-mono font-bold">
            02
          </span>
          Ringkasan Soal
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
          <div className="flex items-center gap-4">
            <label className="text-xs md:text-sm font-medium text-slate-200">
              Total Keseluruhan Soal:
            </label>
            <input
              type="text"
              value={`${totalQuestions} Butir`}
              readOnly
              className="w-28 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-center text-indigo-400 font-bold outline-none cursor-default shadow-inner text-sm font-mono"
            />
          </div>
          <span className="text-xs text-slate-400">
            Terhitung otomatis dari rincian nomor soal yang Anda aktifkan
          </span>
        </div>

        {/* Breakdown by Type */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 text-xs">
          {(Object.entries(questionBreakdown) as [SoalType, number][]).map(([type, count]) => (
            <div
              key={type}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                count > 0
                  ? 'bg-indigo-950/40 border-indigo-500/40 text-slate-200'
                  : 'bg-slate-900/40 border-slate-700/40 text-slate-500'
              }`}
            >
              <div className="font-medium truncate text-[11px]" title={type}>
                {type}
              </div>
              <div className="text-base font-bold text-indigo-300 font-mono mt-0.5">
                {count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 03 Kelengkapan Output */}
      <div className="bg-slate-800 p-5 md:p-6 rounded-2xl shadow-xl border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h2 className="text-base md:text-lg font-semibold text-indigo-400 flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs font-mono font-bold">
              03
            </span>
            Kelengkapan Output Dokumen
          </h2>

          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              kelengkapan.length >= 4 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50' 
                : 'bg-amber-950/80 text-amber-300 border-amber-600/50'
            }`}>
              {kelengkapan.length} Dokumen Aktif {kelengkapan.length >= 4 ? '(Lengkap 100%)' : ''}
            </span>

            <button
              type="button"
              onClick={() => {
                KELENGKAPAN_ITEMS.forEach((it) => {
                  if (!kelengkapan.includes(it)) onToggleKelengkapan(it);
                });
              }}
              className="text-[11px] px-2.5 py-1 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 rounded-lg border border-indigo-700/60 transition-colors cursor-pointer"
              title="Centang semua kelengkapan agar tidak ada dokumen yang kosong"
            >
              ✓ Centang Semua
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-3 leading-relaxed">
          Semua dokumen pelengkap di bawah ini <strong>tercentang otomatis</strong> agar Kunci Jawaban &amp; Rubrik, Kisi-Kisi Soal, Kartu Soal Resmi, dan Materi Esensial <strong>tidak kosong</strong> saat dibuat dan diunduh.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 md:gap-3">
          {KELENGKAPAN_ITEMS.map((item) => {
            const isChecked = kelengkapan.includes(item);
            return (
              <div
                key={item}
                onClick={() => onToggleKelengkapan(item)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                  isChecked
                    ? 'bg-indigo-950/50 border-indigo-500/60 shadow-sm'
                    : 'bg-slate-700/40 border-slate-600/60 hover:bg-slate-700/60'
                }`}
              >
                <input
                  type="checkbox"
                  id={`kelengkapan-${item}`}
                  checked={isChecked}
                  onChange={() => {}} // handled by parent onClick
                  className="h-4.5 w-4.5 rounded text-indigo-600 bg-slate-700 border-slate-500 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor={`kelengkapan-${item}`}
                  className="text-xs md:text-sm font-medium text-slate-200 cursor-pointer"
                >
                  {item === 'Kunci dan Skor Jawaban' ? 'Kunci & Skor' : item}
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-4 flex flex-col md:flex-row items-center justify-center gap-4">
        {/* Generate Prompt AI button (original workflow) */}
        <button
          type="button"
          onClick={onGeneratePrompt}
          className="w-full md:w-auto min-w-[240px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <Send className="w-4 h-4" />
          Generate Prompt AI
        </button>

        {/* Direct Gemini AI generator button (full-stack superpower) */}
        <button
          type="button"
          onClick={onGenerateAI}
          disabled={isGeneratingAI}
          className="w-full md:w-auto min-w-[280px] bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGeneratingAI ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyusun Soal dengan Gemini AI...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-emerald-200" />
              ✨ Buat Soal Langsung (Gemini AI)
            </>
          )}
        </button>
      </div>

      <p className="text-amber-400 text-[11px] text-center italic flex items-center justify-center gap-1">
        <Info className="w-3 h-3 shrink-0" />
        Pilih <strong>Generate Prompt AI</strong> untuk menyalin teks instruksi ke ChatGPT/Gemini web, atau <strong>Buat Soal Langsung</strong> untuk menghasilkan naskah asesmen instan di aplikasi.
      </p>
    </div>
  );
};
