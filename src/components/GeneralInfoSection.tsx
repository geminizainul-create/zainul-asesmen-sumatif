import React, { useRef } from 'react';
import { Download, Upload, Info } from 'lucide-react';
import { GeneralInfo } from '../types/assessment';

interface GeneralInfoSectionProps {
  info: GeneralInfo;
  setInfo: React.Dispatch<React.SetStateAction<GeneralInfo>>;
  onExport: () => void;
  onImport: (file: File) => void;
}

export const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({
  info,
  setInfo,
  onExport,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-slate-800 p-5 md:p-6 rounded-2xl shadow-xl mb-6 border border-slate-700/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <h2 className="text-base md:text-lg font-semibold text-indigo-400 flex items-center gap-2">
          <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs font-mono font-bold">
            01
          </span>
          Informasi Umum
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExport}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-600 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Export Data
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-600 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            Import Data
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      <p className="text-amber-400 text-xs mb-4 flex items-center gap-1.5 italic">
        <Info className="w-3.5 h-3.5 shrink-0" />
        Gunakan Export untuk menyimpan draf ke file JSON, dan Import untuk memuat kembali file data yang telah disimpan.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div>
          <label className="block text-xs md:text-sm font-medium text-slate-300 mb-1.5">
            Mata Pelajaran
          </label>
          <input
            type="text"
            value={info.mapel}
            onChange={(e) => setInfo((prev) => ({ ...prev, mapel: e.target.value }))}
            placeholder="Contoh: IPA / Matematika / Bahasa Indonesia"
            className="w-full bg-slate-700/80 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-slate-300 mb-1.5">
            Kelas
          </label>
          <input
            type="text"
            value={info.kelas}
            onChange={(e) => setInfo((prev) => ({ ...prev, kelas: e.target.value }))}
            placeholder="Contoh: 7 / 8 / 10 / Fase D"
            className="w-full bg-slate-700/80 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-slate-300 mb-1.5">
            Jenjang / Tingkat Satuan Pendidikan
          </label>
          <select
            value={info.tingkatan}
            onChange={(e) => setInfo((prev) => ({ ...prev, tingkatan: e.target.value }))}
            className="w-full bg-slate-700/80 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-inner"
          >
            <option value="SD / Sekolah Rendah">SD / Sekolah Dasar (Fase A - C)</option>
            <option value="SMP / Menengah Rendah">SMP / Menengah Pertama (Fase D)</option>
            <option value="SMA / Menengah Atas">SMA / SMK / Menengah Atas (Fase E - F)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
