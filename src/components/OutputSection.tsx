import React from 'react';
import { Copy, Check, Sparkles, FileText, Download, Printer, RefreshCw, SlidersHorizontal } from 'lucide-react';

interface OutputSectionProps {
  promptText: string;
  aiGeneratedText: string;
  isGeneratingAI: boolean;
  activeTab: 'prompt' | 'aiResult';
  setActiveTab: (tab: 'prompt' | 'aiResult') => void;
  onCopyPrompt: () => void;
  onCopyAIResult: () => void;
  copiedPrompt: boolean;
  copiedAIResult: boolean;
  onRegenerateAI?: () => void;
  onOpenFormatModal: (customText?: string) => void;
}

export const OutputSection: React.FC<OutputSectionProps> = ({
  promptText,
  aiGeneratedText,
  isGeneratingAI,
  activeTab,
  setActiveTab,
  onCopyPrompt,
  onCopyAIResult,
  copiedPrompt,
  copiedAIResult,
  onRegenerateAI,
  onOpenFormatModal,
}) => {
  return (
    <div
      id="output-section"
      className="mt-10 bg-slate-800 rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden transition-all"
    >
      {/* Tab Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 bg-slate-700/50 border-b border-slate-600/80 gap-3">
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('prompt')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'prompt'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Prompt AI Terhasil
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('aiResult')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'aiResult'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            Hasil Soal Langsung (Gemini AI)
            {aiGeneratedText && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Action Controls for Current Tab */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Button to open Kop, Identity, Spacing & F4 Word/PDF export modal */}
          <button
            type="button"
            onClick={() => onOpenFormatModal(activeTab === 'aiResult' && aiGeneratedText ? aiGeneratedText : promptText)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2 px-4 rounded-xl transition-all shadow-md active:scale-95 text-xs md:text-sm flex items-center gap-1.5 cursor-pointer"
            title="Atur Kop Surat, Identitas, Spasi, dan Download Dokumen Resmi F4"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-200" />
            <span>Format Dokumen F4 (Word/PDF)</span>
          </button>

          {activeTab === 'prompt' ? (
            <button
              type="button"
              onClick={onCopyPrompt}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl transition-all shadow-md active:scale-95 text-xs md:text-sm flex items-center gap-1.5 cursor-pointer"
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Berhasil Disalin! ✓
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Salin Teks Prompt
                </>
              )}
            </button>
          ) : (
            <>
              {aiGeneratedText && (
                <>
                  <button
                    type="button"
                    onClick={onCopyAIResult}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3.5 rounded-xl transition-all shadow-md active:scale-95 text-xs md:text-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedAIResult ? (
                      <>
                        <Check className="w-4 h-4" />
                        Tersalin untuk Word! ✓
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Salin Naskah
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenFormatModal(aiGeneratedText)}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 px-3 rounded-xl transition-all text-xs flex items-center gap-1 cursor-pointer border border-slate-600"
                    title="Atur format & unduh file Word (.docx F4)"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Unduh Word</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenFormatModal(aiGeneratedText)}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 px-3 rounded-xl transition-all text-xs flex items-center gap-1 cursor-pointer border border-slate-600"
                    title="Atur kop & cetak sebagai PDF langsung"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Cetak/PDF</span>
                  </button>
                </>
              )}

              {onRegenerateAI && !isGeneratingAI && aiGeneratedText && (
                <button
                  type="button"
                  onClick={onRegenerateAI}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white p-2 rounded-xl transition-all border border-slate-600 cursor-pointer"
                  title="Generate Ulang dengan AI"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="p-5 md:p-6">
        {activeTab === 'prompt' ? (
          <div>
            <div className="text-slate-300 whitespace-pre-wrap break-words text-xs md:text-sm leading-relaxed font-mono bg-slate-900/90 p-5 md:p-6 rounded-2xl border border-slate-700/80 overflow-x-auto select-all max-h-[600px] overflow-y-auto">
              {promptText}
            </div>
            <p className="text-amber-400 text-xs mt-4 italic">
              Petunjuk: Setelah menyalin prompt, tempel ke AI (Gemini / ChatGPT). Anda juga dapat langsung mengklik tombol <strong className="text-white">"Format Dokumen F4 (Word/PDF)"</strong> di atas untuk mengatur kop surat, identitas ujian, dan spasi sebelum mengunduh.
            </p>
          </div>
        ) : (
          <div>
            {isGeneratingAI && !aiGeneratedText && (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-300">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-base font-semibold text-white">Menghubungi Gemini AI...</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Sedang menyusun butir soal asesmen, stimulus kontekstual, opsi pilihan ganda kompleks [A][B][C][D], tabel benar-salah, menjodohkan, kunci jawaban &amp; kisi-kisi Kurikulum Merdeka.
                </p>
              </div>
            )}

            {!isGeneratingAI && !aiGeneratedText && (
              <div className="text-center py-12 text-slate-400">
                <Sparkles className="w-10 h-10 text-indigo-400/50 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-300">Belum ada naskah soal yang dibuat langsung.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Klik tombol <strong className="text-emerald-400">"✨ Buat Soal Langsung (Gemini AI)"</strong> di atas untuk memproses soal secara otomatis menggunakan server Gemini AI.
                </p>
              </div>
            )}

            {aiGeneratedText && (
              <div>
                <div className="text-slate-200 whitespace-pre-wrap break-words text-xs md:text-sm leading-relaxed font-sans bg-slate-900/90 p-5 md:p-6 rounded-2xl border border-slate-700/80 overflow-x-auto select-text max-h-[650px] overflow-y-auto">
                  {aiGeneratedText}
                </div>
                {isGeneratingAI && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Sedang menulis butir soal berikutnya secara langsung...
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-700/80 text-xs">
                  <p className="text-amber-400 italic">
                    Tips: Klik tombol <strong className="text-white">"Format Dokumen F4"</strong> untuk menyematkan kop sekolah, menghasilkan gambar jadi stimulus otomatis (AI), dan mengunduh file .docx resmi (tersedia opsi <span className="text-emerald-300 font-semibold">Soal + Gambar Jadi</span> &amp; <span className="text-indigo-300 font-semibold">Soal + Prompt Gambar</span>).
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenFormatModal(aiGeneratedText)}
                    className="text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer shrink-0"
                  >
                    Atur Kop, Gambar &amp; Unduh (.docx / PDF) &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
