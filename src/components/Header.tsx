import React from 'react';
import { Sparkles, BookOpen, RotateCcw } from 'lucide-react';
import { SAMPLE_PRESETS } from '../utils/assessmentLogic';

interface HeaderProps {
  onLoadPreset: (presetIndex: number) => void;
  onReset: () => void;
  onOpenFormatModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLoadPreset, onReset, onOpenFormatModal }) => {
  return (
    <header className="mb-10 text-center relative">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        Standar Kurikulum Merdeka
      </div>
      <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-indigo-500 tracking-tight">
        Generator AI - Soal
      </h1>
      <p className="text-slate-400 font-medium mt-2 text-sm md:text-base">
        oleh <span className="text-slate-200 font-semibold">Zainul Bashori</span>
      </p>

      {/* Quick Template Presets Toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-slate-400 inline-flex items-center gap-1.5 mr-1 font-medium">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Contoh Cepat:
        </span>
        {SAMPLE_PRESETS.map((preset, idx) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => onLoadPreset(idx)}
            className="px-3 py-1.5 bg-slate-800/90 hover:bg-indigo-600/30 text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:border-indigo-500/50 transition-all cursor-pointer font-medium shadow-sm"
          >
            {preset.name}
          </button>
        ))}
        {onOpenFormatModal && (
          <button
            type="button"
            onClick={onOpenFormatModal}
            className="px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white rounded-lg border border-indigo-600/60 transition-all cursor-pointer font-semibold shadow-sm flex items-center gap-1"
          >
            <span>Format Word F4</span>
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="px-3 py-1.5 bg-slate-800/60 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-700/60 hover:border-rose-700/50 transition-all cursor-pointer font-medium inline-flex items-center gap-1"
          title="Reset ke format kosong"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>
    </header>
  );
};
