import React, { useState } from 'react';
import { Zap, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { RecommendationRow } from '../types/assessment';

interface AutoFillSectionProps {
  materiText: string;
  setMateriText: (val: string) => void;
  jumlahSoal: number;
  setJumlahSoal: (val: number) => void;
  onApplyAutoFill: () => void;
  recommendationRows: RecommendationRow[];
}

export const AutoFillSection: React.FC<AutoFillSectionProps> = ({
  materiText,
  setMateriText,
  jumlahSoal,
  setJumlahSoal,
  onApplyAutoFill,
  recommendationRows,
}) => {
  const [showPreviewTable, setShowPreviewTable] = useState(false);

  const handleApply = () => {
    onApplyAutoFill();
    setShowPreviewTable(true);
  };

  return (
    <div className="bg-gradient-to-r from-indigo-950/70 via-slate-800 to-indigo-950/70 p-5 md:p-6 rounded-2xl shadow-xl mb-8 border border-indigo-500/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <h2 className="text-base md:text-lg font-bold text-indigo-300 flex items-center gap-2">
          <span className="bg-indigo-500 text-white text-[11px] px-2.5 py-0.5 rounded-full font-mono tracking-wider font-semibold">
            FITUR OTOMATIS
          </span>
          Pengisian Otomatis Paket Soal (Auto-Fill)
        </h2>
        <span className="text-xs text-slate-400">Sesuai Ketentuan Pemetaan 1–25 Dokumen</span>
      </div>

      <p className="text-xs text-slate-300 mb-4 leading-relaxed">
        Masukkan daftar Bab beserta Subbab / Tujuan Pembelajaran (TP) serta jumlah butir soal. Sistem akan{' '}
        <strong className="text-white">
          secara otomatis mendistribusikan materi, jenis soal baku (pemetaan 1–25), tingkat kesulitan, stimulus teks/gambar, dan menyusun semua paket soal
        </strong>{' '}
        secara berurutan tanpa jeda ke formulir di bawah.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Daftar Bab, Subbab, dan/atau Tujuan Pembelajaran (TP):
          </label>
          <textarea
            value={materiText}
            onChange={(e) => setMateriText(e.target.value)}
            rows={4}
            className="w-full bg-slate-900/90 border border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed transition-all"
            placeholder={`Contoh:
Bab 1: Pertumbuhan dan Perkembangan
- Subbab: Pubertas dan perubahan fisik
- TP: Menganalisis perbedaan perkembangan fisik remaja
Bab 2: Sistem Koordinasi
- TP: Menjelaskan fungsi bagian-bagian neuron dan otak`}
          />
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Jumlah Soal:</label>
            <input
              type="number"
              value={jumlahSoal}
              onChange={(e) => setJumlahSoal(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              min={1}
              max={50}
              className="w-full bg-slate-900/90 border border-slate-600 rounded-xl px-3 py-2 text-sm text-indigo-400 font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-center shadow-inner"
            />
            <p className="text-[10px] text-amber-400 mt-1 italic">
              Nomor 1–25 dipetakan baku sesuai standar kurikulum.
            </p>
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="mt-3 md:mt-0 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="h-4 w-4" />
            Terapkan Otomatis ke Paket
          </button>
        </div>
      </div>

      {recommendationRows.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700/80">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Pratinjau Tabel 7 Kolom Rekomendasi (Format Dokumen):
            </span>
            <button
              type="button"
              onClick={() => setShowPreviewTable(!showPreviewTable)}
              className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              {showPreviewTable ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" /> Tutup Pratinjau
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> Buka Pratinjau ({recommendationRows.length} baris)
                </>
              )}
            </button>
          </div>

          {showPreviewTable && (
            <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/95 text-xs shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800 text-slate-300 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5 border-b border-slate-700 font-semibold whitespace-nowrap">Paket</th>
                    <th className="p-2.5 border-b border-slate-700 font-semibold">Bab</th>
                    <th className="p-2.5 border-b border-slate-700 font-semibold">Subbab / TP</th>
                    <th className="p-2.5 border-b border-slate-700 font-semibold whitespace-nowrap">Jenis Soal</th>
                    <th className="p-2.5 border-b border-slate-700 font-semibold whitespace-nowrap">Tingkatan</th>
                    <th className="p-2.5 border-b border-slate-700 font-semibold whitespace-nowrap">Nomor Soal</th>
                    <th className="p-2.5 border-b border-slate-700 font-semibold">Stimulus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 text-[11px]">
                  {recommendationRows.map((row, idx) => (
                    <tr key={`${row.packetNumber}_${idx}`} className="hover:bg-slate-800/60 transition-colors">
                      <td className="p-2.5 border-b border-slate-800 text-indigo-400 font-semibold whitespace-nowrap">
                        Paket {String(row.packetNumber).padStart(2, '0')}
                      </td>
                      <td className="p-2.5 border-b border-slate-800 font-medium text-slate-200">{row.bab}</td>
                      <td className="p-2.5 border-b border-slate-800 text-slate-400">{row.sub}</td>
                      <td className="p-2.5 border-b border-slate-800 text-indigo-300 font-medium whitespace-nowrap">
                        {row.type}
                      </td>
                      <td className="p-2.5 border-b border-slate-800 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            row.level === 'Mudah'
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                              : row.level === 'Sedang'
                              ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                              : 'bg-rose-900/60 text-rose-300 border border-rose-700/50'
                          }`}
                        >
                          {row.level}
                        </span>
                      </td>
                      <td className="p-2.5 border-b border-slate-800 font-bold text-white font-mono whitespace-nowrap">
                        {row.numbers}
                      </td>
                      <td className="p-2.5 border-b border-slate-800 text-slate-400 leading-snug">
                        {row.stimulusDesc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
