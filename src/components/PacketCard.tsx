import React from 'react';
import { Trash2, Image, AlignLeft, Info } from 'lucide-react';
import { GayaGambar, LevelType, PacketData, SoalType, StimulusMode } from '../types/assessment';
import { SOAL_TYPES, SOAL_DESCRIPTIONS } from '../utils/assessmentLogic';

interface PacketCardProps {
  packet: PacketData;
  index: number;
  totalPackets: number;
  onUpdate: (updated: PacketData) => void;
  onRemove: (id: string) => void;
}

export const PacketCard: React.FC<PacketCardProps> = ({
  packet,
  index,
  totalPackets,
  onUpdate,
  onRemove,
}) => {
  const packetNumberStr = String(index + 1).padStart(2, '0');

  const handleFieldChange = <K extends keyof PacketData>(key: K, value: PacketData[K]) => {
    onUpdate({ ...packet, [key]: value });
  };

  const handleSoalToggle = (type: SoalType, checked: boolean) => {
    const updatedDetails = {
      ...packet.soalDetails,
      [type]: {
        ...packet.soalDetails[type],
        enabled: checked,
      },
    };
    onUpdate({ ...packet, soalDetails: updatedDetails });
  };

  const handleSoalLevelChange = (type: SoalType, level: LevelType) => {
    const updatedDetails = {
      ...packet.soalDetails,
      [type]: {
        ...packet.soalDetails[type],
        level,
      },
    };
    onUpdate({ ...packet, soalDetails: updatedDetails });
  };

  const handleSoalNomorChange = (type: SoalType, nomor: string) => {
    const updatedDetails = {
      ...packet.soalDetails,
      [type]: {
        ...packet.soalDetails[type],
        nomor,
      },
    };
    onUpdate({ ...packet, soalDetails: updatedDetails });
  };

  return (
    <div className="bg-slate-800 p-5 md:p-6 rounded-2xl shadow-xl border border-slate-700/80 border-l-4 border-l-indigo-500 relative transition-all">
      {/* Remove Button */}
      {totalPackets > 1 && (
        <button
          type="button"
          onClick={() => onRemove(packet.id)}
          className="absolute top-4 right-4 text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
          title="Hapus Paket Soal Ini"
          aria-label="Hapus paket"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <h2 className="text-base md:text-lg font-semibold mb-4 text-indigo-400 flex items-center gap-2">
        <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs font-mono font-bold">
          {packetNumberStr}
        </span>
        Rincian Paket Soal
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column: Materi, Sub Materi, Stimulus */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-slate-300 mb-1.5">
              Materi Pokok / Bab
            </label>
            <input
              type="text"
              value={packet.materi}
              onChange={(e) => handleFieldChange('materi', e.target.value)}
              placeholder="Contoh: Ekosistem dan Rantai Makanan"
              className="w-full bg-slate-700/80 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-slate-300 mb-1.5">
              Sub Materi / Tujuan Pembelajaran (TP)
            </label>
            <textarea
              rows={3}
              value={packet.tujuan}
              onChange={(e) => handleFieldChange('tujuan', e.target.value)}
              placeholder="Contoh: Siswa dapat menganalisis interaksi antar komponen biotik dan abiotik dalam ekosistem..."
              className="w-full bg-slate-700/80 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none shadow-inner"
            />
          </div>

          <div className="pt-3 border-t border-slate-700/80">
            <label className="block text-xs md:text-sm font-medium text-slate-300 mb-1.5">
              Opsi Stimulus
            </label>
            <select
              value={packet.stimulusMode}
              onChange={(e) => handleFieldChange('stimulusMode', e.target.value as StimulusMode)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-200 mb-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-inner"
            >
              <option value="dengan">Dengan Stimulus (Teks Paragraf / Gambar)</option>
              <option value="tanpa">Tanpa Stimulus (Soal Langsung)</option>
            </select>

            {packet.stimulusMode === 'dengan' && (
              <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id={`stimulus-img-${packet.id}`}
                    checked={packet.useGambar}
                    onChange={(e) => handleFieldChange('useGambar', e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 bg-slate-700 border-slate-500 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <label
                    htmlFor={`stimulus-img-${packet.id}`}
                    className="text-xs md:text-sm font-medium text-slate-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <Image className="w-4 h-4 text-indigo-400" />
                    Sertakan Stimulus Gambar
                  </label>
                </div>

                <p className="text-amber-400 text-[11px] leading-relaxed italic">
                  Alur: Centang kotak ini jika Anda ingin soal berbasis gambar. Teks Paragraf di bawah akan diabaikan.
                </p>

                {packet.useGambar ? (
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-medium">
                      Gaya &amp; Format Gambar:
                    </label>
                    <select
                      value={packet.gaya}
                      onChange={(e) => handleFieldChange('gaya', e.target.value as GayaGambar)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="Berwarna">Gambar Berwarna (Visual Tajam)</option>
                      <option value="Hitam Putih">Hitam Putih / Line Art (Mudah Difotokopi)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-medium flex items-center gap-1">
                      <AlignLeft className="w-3.5 h-3.5 text-indigo-400" />
                      Jumlah Paragraf Teks Bacaan:
                    </label>
                    <select
                      value={packet.jumlahParagraf}
                      onChange={(e) => handleFieldChange('jumlahParagraf', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="1">1 Paragraf Teks</option>
                      <option value="2">2 Paragraf Teks</option>
                      <option value="3">3 Paragraf Teks</option>
                      <option value="4">4 Paragraf Teks</option>
                      <option value="5">5 Paragraf Teks</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Question Types, Levels & Numbers */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs md:text-sm font-medium text-slate-300">
              Jenis Soal, Tingkat, &amp; Nomor
            </label>
          </div>
          <p className="text-amber-400 text-[11px] mb-3 italic flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            Format nomor: <span className="font-mono text-amber-300">1, 2, 3</span> atau rentang{' '}
            <span className="font-mono text-amber-300">1-5</span>.
          </p>

          <div className="space-y-2.5 bg-slate-700/30 p-3.5 rounded-xl border border-slate-700/70">
            {SOAL_TYPES.map((type) => {
              const item = packet.soalDetails[type];
              const isEnabled = item?.enabled || false;
              const level = item?.level || 'Sedang';
              const nomor = item?.nomor || '';

              return (
                <div
                  key={type}
                  className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-lg transition-colors ${
                    isEnabled ? 'bg-slate-700/60 border border-indigo-500/30' : 'bg-transparent border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:w-36 shrink-0">
                    <input
                      type="checkbox"
                      id={`check-${packet.id}-${type}`}
                      checked={isEnabled}
                      onChange={(e) => handleSoalToggle(type, e.target.checked)}
                      className="h-4 w-4 rounded text-indigo-600 bg-slate-700 border-slate-500 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label
                      htmlFor={`check-${packet.id}-${type}`}
                      className="text-xs font-medium text-slate-200 cursor-pointer truncate"
                      title={SOAL_DESCRIPTIONS[type]}
                    >
                      {type}
                    </label>
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <select
                      value={level}
                      disabled={!isEnabled}
                      onChange={(e) => handleSoalLevelChange(type, e.target.value as LevelType)}
                      className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-[11px] outline-none disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Mudah">Mudah</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Sulit">Sulit</option>
                    </select>

                    <input
                      type="text"
                      disabled={!isEnabled}
                      value={nomor}
                      onChange={(e) => handleSoalNomorChange(type, e.target.value)}
                      placeholder={type === 'Uraian Pendek' ? 'No. (max 2 kata)' : 'No. (contoh: 1, 2)'}
                      className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded px-2.5 py-1 text-xs outline-none disabled:opacity-30 disabled:cursor-not-allowed focus:ring-1 focus:ring-indigo-500 font-mono shadow-inner"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
