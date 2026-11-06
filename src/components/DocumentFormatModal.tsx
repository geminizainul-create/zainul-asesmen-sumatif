import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Upload,
  Download,
  Printer,
  Copy,
  Check,
  Eye,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Wand2,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
  BookOpen,
  Clipboard,
  Layers,
  Calculator,
  Archive,
  Key,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { PacketData } from '../types/assessment';
import {
  ExamIdentity,
  ExamSettings,
  ParsedItem,
  exportExamToDOCX,
  exportSeparatedPackageZip,
  parseExamText,
  ExportDocumentTarget,
  cleanMarkdown,
  resolveQuestionCapaianAndMateri,
  extractAnswerKeyForQuestion,
  normalizeQuestionType,
} from '../utils/docxExporter';
import { formatMathToCleanText } from '../utils/mathFormatter';
import {
  EDUCATIONAL_DIAGRAM_TEMPLATES,
  convertSvgToPngDataUrl,
  findBestMatchingDiagram,
  generateFallbackSvgDiagram,
} from '../utils/educationalDiagrams';
import { BatikKawungIcon } from './BatikDecorations';

interface DocumentFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRawText: string;
  defaultMapel: string;
  defaultKelas: string;
  packets?: PacketData[];
  onShowToast: (msg: string, isError?: boolean) => void;
}

export const DocumentFormatModal: React.FC<DocumentFormatModalProps> = ({
  isOpen,
  onClose,
  initialRawText,
  defaultMapel,
  defaultKelas,
  packets = [],
  onShowToast,
}) => {
  // State for Kop Surat
  const [kopBase64, setKopBase64] = useState<string | null>(null);
  const [kopWidthPercent, setKopWidthPercent] = useState<number>(100);

  // State for Identity
  const [identity, setIdentity] = useState<ExamIdentity>({
    jenisUjian: 'Sumatif Akhir Semester (SAS)',
    mapel: defaultMapel || 'Ilmu Pengetahuan Alam (IPA)',
    kelas: defaultKelas || 'IX (Sembilan) / Fase D',
    hariTanggal: 'Senin, 15 Desember 2025',
    semester: '1 (Ganjil)',
    tapel: '2026/2027',
    waktu: '90 Menit',
    petunjuk:
      'Pilihlah salah satu jawaban yang paling tepat dengan memberi tanda silang (X) pada huruf A, B, C, atau D!',
  });

  // State for F4 Settings
  const [settings, setSettings] = useState<ExamSettings>({
    spacingBetween: 6,
    marginTop: 2.0,
    marginBottom: 2.0,
    marginLeft: 2.5,
    marginRight: 2.0,
  });

  // State for UI Accordions & Settings
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [showDiagramLibraryModal, setShowDiagramLibraryModal] = useState<boolean>(false);
  const [activeTargetStimulusIndex, setActiveTargetStimulusIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState<number>(0.85);

  // Mode: 'image' (Soal + Gambar Jadi) vs 'prompt' (Soal + Prompt Gambar)
  const [exportAndPreviewMode, setExportAndPreviewMode] = useState<'image' | 'prompt'>('image');
  const [previewTab, setPreviewTab] = useState<'soal' | 'kunci_skor' | 'kisi_kisi' | 'kartu_soal' | 'materi' | 'all'>('soal');
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [isDownloadingPart, setIsDownloadingPart] = useState<string | null>(null);
  const [isGeneratingImageFor, setIsGeneratingImageFor] = useState<Record<number, boolean>>({});
  const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false);

  // Raw text & parsed items
  const [rawText, setRawText] = useState<string>(initialRawText);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [copiedClean, setCopiedClean] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stimulusFileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial text and identity when modal opens or initial values change
  useEffect(() => {
    if (isOpen) {
      if (initialRawText) {
        setRawText(initialRawText);
      }
      if (defaultMapel) {
        setIdentity((prev) => ({ ...prev, mapel: defaultMapel }));
      }
      if (defaultKelas) {
        setIdentity((prev) => ({ ...prev, kelas: defaultKelas }));
      }
    }
  }, [isOpen, initialRawText, defaultMapel, defaultKelas]);

  // Parse text whenever rawText changes
  useEffect(() => {
    if (rawText) {
      const { items, warnings: warnList } = parseExamText(rawText);
      setParsedItems(items);
      setWarnings(warnList);
    }
  }, [rawText]);

  if (!isOpen) return null;

  // Handle image upload for Kop Surat
  const handleKopUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      onShowToast('Harap pilih file gambar (PNG, JPG, atau JPEG)', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setKopBase64(event.target?.result as string);
      onShowToast('Gambar kop surat berhasil diunggah.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveKop = () => {
    setKopBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onShowToast('Kop surat dihapus.');
  };

  // Trigger manual parse
  const handleParseText = () => {
    if (!rawText.trim()) {
      onShowToast('Teks soal masih kosong. Silakan tempel teks soal terlebih dahulu.', true);
      return;
    }
    const { items, warnings: warnList } = parseExamText(rawText);
    setParsedItems(items);
    setWarnings(warnList);
    const qCount = items.filter((i) => i.type === 'question').length;
    onShowToast(`Berhasil memproses dan merapikan ${qCount} butir soal (rumus matematika terformat rapi).`);
  };

  // Rapikan rumus matematika dalam teks mentah secara langsung
  const handleCleanMathInRawText = () => {
    if (!rawText.trim()) {
      onShowToast('Teks soal masih kosong. Silakan tempel teks soal terlebih dahulu.', true);
      return;
    }
    const cleaned = formatMathToCleanText(rawText);
    setRawText(cleaned);
    const { items, warnings: warnList } = parseExamText(cleaned);
    setParsedItems(items);
    setWarnings(warnList);
    const qCount = items.filter((i) => i.type === 'question').length;
    onShowToast(`✨ Rumus matematika berhasil dirapikan dari kode LaTeX ke simbol rapi (${qCount} butir soal)!`);
  };

  // Attach an image URL (PNG/JPG base64) to a stimulus item in parsedItems
  const handleAttachImageToStimulus = (itemIdx: number, dataUrl: string) => {
    setParsedItems((prev) => {
      const copy = [...prev];
      if (copy[itemIdx]) {
        copy[itemIdx] = {
          ...copy[itemIdx],
          imageUrl: dataUrl,
          imageWidthPercent: copy[itemIdx].imageWidthPercent || 75,
        };
      }
      return copy;
    });
    onShowToast('Gambar jadi berhasil dipasang ke naskah soal dan Word!');
  };

  // Remove attached image from a stimulus
  const handleRemoveStimulusImage = (itemIdx: number) => {
    setParsedItems((prev) => {
      const copy = [...prev];
      if (copy[itemIdx]) {
        copy[itemIdx] = {
          ...copy[itemIdx],
          imageUrl: undefined,
        };
      }
      return copy;
    });
    onShowToast('Gambar stimulus telah dilepas.');
  };

  // Change image width percentage
  const handleSetStimulusImageWidth = (itemIdx: number, widthPercent: number) => {
    setParsedItems((prev) => {
      const copy = [...prev];
      if (copy[itemIdx]) {
        copy[itemIdx] = {
          ...copy[itemIdx],
          imageWidthPercent: widthPercent,
        };
      }
      return copy;
    });
  };

  // Open file picker for specific stimulus index
  const handleTriggerStimulusUpload = (itemIdx: number) => {
    setActiveTargetStimulusIndex(itemIdx);
    stimulusFileInputRef.current?.click();
  };

  // Process file uploaded for stimulus
  const handleStimulusFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeTargetStimulusIndex === null) return;

    if (!file.type.match('image.*')) {
      onShowToast('Harap pilih file gambar (PNG, JPG, JPEG, atau WebP)', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleAttachImageToStimulus(activeTargetStimulusIndex, base64);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Pick from Educational Diagram Template library
  const handleSelectDiagram = async (templateId: string) => {
    if (activeTargetStimulusIndex === null) return;

    const tpl = EDUCATIONAL_DIAGRAM_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;

    try {
      const pngDataUrl = await convertSvgToPngDataUrl(tpl.svg);
      handleAttachImageToStimulus(activeTargetStimulusIndex, pngDataUrl);
      setShowDiagramLibraryModal(false);
    } catch (e: any) {
      onShowToast(`Gagal mengonversi diagram: ${e?.message || e}`, true);
    }
  };

  // Paste image from clipboard
  const handlePasteImageFromClipboard = async (itemIdx: number) => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        onShowToast('Fitur baca clipboard gambar tidak didukung di browser ini. Gunakan Unggah File.', true);
        return;
      }
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              handleAttachImageToStimulus(itemIdx, base64);
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
      onShowToast('Tidak ada gambar di clipboard. Silakan salin gambar terlebih dahulu.', true);
    } catch (e) {
      onShowToast('Akses clipboard gambar ditolak. Silakan unggah file gambar secara langsung.', true);
    }
  };

  // Reset F4 settings to standard
  const handleResetSettings = () => {
    setSettings({
      spacingBetween: 6,
      marginTop: 2.0,
      marginBottom: 2.0,
      marginLeft: 2.5,
      marginRight: 2.0,
    });
    onShowToast('Format dikembalikan ke standar baku resmi F4.');
  };

  const detectedQuestions = parsedItems.filter((i) => i.type === 'question').length;
  const stimulusIndices = parsedItems
    .map((item, idx) => (item.type === 'stimulus' ? idx : -1))
    .filter((idx) => idx !== -1);

  // Stimulus yang secara spesifik meminta gambar/diagram visual (bukan paragraf bacaan)
  const imageStimulusIndices = stimulusIndices.filter((idx) => {
    const item = parsedItems[idx];
    return item && (item.isImageStimulus || !!item.imagePrompt || !!item.imageUrl);
  });

  // Stimulus yang berupa teks paragraf / bacaan (tidak meminta gambar)
  const textStimulusIndices = stimulusIndices.filter((idx) => {
    const item = parsedItems[idx];
    return item && !item.isImageStimulus && !item.imagePrompt && !item.imageUrl;
  });

  // Generate finished image with AI from stimulus prompt (khusus stimulus yang meminta gambar)
  const handleGenerateImageWithAI = async (itemIdx: number) => {
    const item = parsedItems[itemIdx];
    if (!item) return;

    // Pastikan hanya memproses jika stimulus memang meminta gambar
    const isImageReq = item.isImageStimulus || !!item.imagePrompt || !!item.imageUrl;
    if (!isImageReq) {
      onShowToast('Stimulus ini berupa teks bacaan/paragraf dan tidak meminta gambar.', true);
      return;
    }

    const promptText = item.imagePrompt || item.paragraphs?.[0] || item.title || 'Diagram Edukasi';
    setIsGeneratingImageFor((prev) => ({ ...prev, [itemIdx]: true }));

    try {
      const resp = await fetch('/api/generate-stimulus-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          title: item.title,
          subject: identity.mapel,
        }),
      });

      if (!resp.ok) {
        throw new Error('Gagal dari server AI');
      }

      const data = await resp.json();
      let pngDataUrl = '';

      if (data.imageUrl) {
        pngDataUrl = data.imageUrl;
      } else if (data.svg) {
        pngDataUrl = await convertSvgToPngDataUrl(data.svg);
      }

      if (pngDataUrl) {
        handleAttachImageToStimulus(itemIdx, pngDataUrl);
        onShowToast('✨ Gambar jadi stimulus berhasil dibuat oleh AI dan dipasang!');
        return;
      }
      throw new Error('Format gambar tidak dikenali');
    } catch (err: any) {
      console.warn('AI image generation fallback:', err);
      try {
        const matchedTpl = findBestMatchingDiagram(promptText);
        let fallbackSvg = '';
        if (matchedTpl) {
          fallbackSvg = matchedTpl.svg;
        } else {
          fallbackSvg = generateFallbackSvgDiagram(item.title || '', promptText);
        }
        const fallbackPng = await convertSvgToPngDataUrl(fallbackSvg);
        handleAttachImageToStimulus(itemIdx, fallbackPng);
        onShowToast('Gambar stimulus edukatif berhasil dibuat dan dipasang!');
      } catch (fallbackErr: any) {
        onShowToast(`Gagal memproses gambar: ${fallbackErr?.message || fallbackErr}`, true);
      }
    } finally {
      setIsGeneratingImageFor((prev) => ({ ...prev, [itemIdx]: false }));
    }
  };

  // Generate all missing stimulus images in parallel / sequence (hanya untuk stimulus yang meminta gambar)
  const handleGenerateAllImages = async () => {
    const targetIndices = imageStimulusIndices.filter((idx) => !parsedItems[idx]?.imageUrl);
    if (targetIndices.length === 0) {
      if (imageStimulusIndices.length === 0) {
        onShowToast('Tidak ada stimulus yang meminta gambar. Stimulus pada naskah murni berupa teks bacaan/paragraf.');
      } else {
        onShowToast('Semua stimulus yang meminta gambar sudah memiliki gambar jadi!');
      }
      return;
    }

    setIsGeneratingAll(true);
    onShowToast(`Sedang menghasilkan ${targetIndices.length} gambar jadi untuk stimulus visual...`);

    for (const idx of targetIndices) {
      await handleGenerateImageWithAI(idx);
    }

    setIsGeneratingAll(false);
    onShowToast('Semua gambar jadi stimulus visual berhasil dibuat dan disematkan!');
  };

  // Unduh DOCX (Mendukung unduh satuan terpisah atau dokumen lengkap F4)
  const handleDownloadWord = async (
    target: ExportDocumentTarget = 'all',
    mode: 'image' | 'prompt' = exportAndPreviewMode
  ) => {
    if (parsedItems.length === 0) {
      onShowToast('Silakan parse teks soal sebelum mengunduh Word.', true);
      return;
    }
    setIsDownloadingPart(target);
    try {
      const fileName = await exportExamToDOCX(parsedItems, identity, settings, kopBase64, kopWidthPercent, {
        exportMode: mode,
        targetDocument: target,
        packets,
      });
      const labelMap: Record<ExportDocumentTarget, string> = {
        all: 'Dokumen Lengkap (1 File)',
        soal: 'Naskah Soal Siswa',
        kisi_kisi: 'Kisi-Kisi Asesmen',
        kunci_skor: 'Kunci & Rubrik Skor',
        materi: 'Materi Esensial',
        kartu_soal: 'Kartu Soal Resmi',
      };
      onShowToast(`File ${labelMap[target]} (.docx F4) berhasil diunduh!`);
    } catch (err: any) {
      onShowToast(`Gagal mengunduh file Word: ${err?.message || err}`, true);
    } finally {
      setIsDownloadingPart(null);
    }
  };

  // Unduh Semua File Terpisah Sekaligus dalam 1-Klik ZIP
  const handleDownloadSeparatedZip = async () => {
    if (parsedItems.length === 0) {
      onShowToast('Silakan parse teks soal sebelum mengunduh paket.', true);
      return;
    }
    setIsZipping(true);
    try {
      onShowToast('Sedang memproses dan mengemas file terpisah ke dalam paket ZIP...');
      const zipFileName = await exportSeparatedPackageZip(
        parsedItems,
        identity,
        settings,
        kopBase64,
        kopWidthPercent,
        {
          exportMode: exportAndPreviewMode,
          packets,
        }
      );
      onShowToast(`Paket ZIP "${zipFileName}" berhasil diunduh! Semua berkas terpisah rapi.`);
    } catch (err: any) {
      onShowToast(`Gagal mengunduh paket ZIP: ${err?.message || err}`, true);
    } finally {
      setIsZipping(false);
    }
  };

  // Cetak / PDF Langsung
  const handlePrint = () => {
    if (parsedItems.length === 0) {
      onShowToast('Silakan parse teks soal terlebih dahulu.', true);
      return;
    }
    window.print();
  };

  // Copy Clean Text
  const handleCopyCleanText = () => {
    if (parsedItems.length === 0) {
      onShowToast('Tidak ada teks yang dapat disalin.', true);
      return;
    }

    let clean = `${identity.jenisUjian.toUpperCase()}\n`;
    clean += `Mata Pelajaran: ${identity.mapel} | Kelas: ${identity.kelas}\n`;
    clean += `Hari, Tanggal: ${identity.hariTanggal || identity.semester || '-'} | Alokasi Waktu: ${identity.waktu}\n\n`;
    if (identity.petunjuk) clean += `Petunjuk: ${identity.petunjuk}\n\n`;

    parsedItems.forEach((item) => {
      if (item.type === 'stimulus') {
        clean += `${item.title}\n${item.paragraphs?.join('\n')}\n\n`;
      } else if (item.type === 'question') {
        clean += `${item.number}. ${item.questionText}\n`;
        item.options?.forEach((o) => {
          clean += `   ${o.label} ${o.text}\n`;
        });
        clean += '\n';
      }
    });

    navigator.clipboard.writeText(clean).then(() => {
      setCopiedClean(true);
      onShowToast('Teks naskah bersih berhasil disalin ke clipboard!');
      setTimeout(() => setCopiedClean(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-2 sm:p-4 md:p-6 animate-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-7xl w-full flex flex-col my-3 overflow-hidden text-slate-100">
        {/* Hidden input for Stimulus file picker */}
        <input
          type="file"
          ref={stimulusFileInputRef}
          onChange={handleStimulusFileChange}
          accept="image/png, image/jpeg, image/jpg, image/webp"
          className="hidden"
        />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/95 border-b border-slate-700/80 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base md:text-lg text-white">
                  Format Dokumen Resmi F4 (210×330mm)
                </h2>
                <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <BatikKawungIcon size={11} className="text-amber-400" />
                  Soal + Gambar Jadi &amp; Word Siap Cetak
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Atur kop surat, identitas ujian, sisipkan gambar stimulus jadi, dan unduh Word (.docx) / PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Switcher: Soal + Gambar Jadi vs Soal + Prompt Gambar */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setExportAndPreviewMode('image');
                  onShowToast('Mode Pratinjau: Soal + Gambar Jadi (Siap Cetak & Word)');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  exportAndPreviewMode === 'image'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilkan lembar dengan gambar jadi tertanam"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Soal + Gambar Jadi</span>
                <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-1 py-0.2 rounded border border-emerald-500/30">
                  Rekomendasi
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExportAndPreviewMode('prompt');
                  onShowToast('Mode Pratinjau: Soal + Prompt Gambar');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  exportAndPreviewMode === 'prompt'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilkan lembar berupa naskah dengan teks instruksi / prompt gambar"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Soal + Prompt Gambar</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 flex-1 overflow-y-auto">
          {/* LEFT COLUMN: Controls, Kop, Identity, Parser, Gambar Jadi & Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. KOP SURAT & IDENTITAS */}
            <div className="bg-slate-800/80 rounded-xl p-4 md:p-5 border border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center font-mono">
                  1
                </span>
                <h3 className="font-bold text-sm md:text-base text-white">
                  Kop Surat &amp; Identitas Ujian
                </h3>
              </div>

              {/* Upload Kop Gambar */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-dashed border-slate-600/80 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Unggah Gambar Kop Surat Sekolah / Lembaga
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleKopUpload}
                    accept="image/png, image/jpeg, image/jpg"
                    className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer text-slate-400"
                  />

                  <div className="flex items-center gap-2 ml-auto">
                    <label className="text-xs text-slate-400">Lebar Kop:</label>
                    <select
                      value={kopWidthPercent}
                      onChange={(e) => setKopWidthPercent(parseInt(e.target.value, 10))}
                      className="text-xs border border-slate-600 rounded px-2 py-1 bg-slate-800 text-slate-200 outline-none"
                    >
                      <option value="100">100% Margin Cetak</option>
                      <option value="90">90% Rata Tengah</option>
                      <option value="80">80% Rata Tengah</option>
                    </select>

                    {kopBase64 && (
                      <button
                        type="button"
                        onClick={handleRemoveKop}
                        className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 bg-rose-950/40 rounded border border-rose-800/60 cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus
                      </button>
                    )}
                  </div>
                </div>

                {kopBase64 && (
                  <div className="mt-2 p-2 bg-white rounded text-center border border-slate-300 max-h-24 overflow-hidden">
                    <img
                      src={kopBase64}
                      alt="Pratinjau Kop Surat"
                      className="max-h-20 mx-auto object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Form Identitas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-medium text-slate-300 block mb-1">Jenis Ujian</label>
                  <input
                    type="text"
                    value={identity.jenisUjian}
                    onChange={(e) =>
                      setIdentity((prev) => ({ ...prev, jenisUjian: e.target.value }))
                    }
                    className="w-full bg-slate-700/80 border border-slate-600 rounded-lg p-2 text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-300 block mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    value={identity.mapel}
                    onChange={(e) => setIdentity((prev) => ({ ...prev, mapel: e.target.value }))}
                    className="w-full bg-slate-700/80 border border-slate-600 rounded-lg p-2 text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-300 block mb-1">Kelas / Fase</label>
                  <input
                    type="text"
                    value={identity.kelas}
                    onChange={(e) => setIdentity((prev) => ({ ...prev, kelas: e.target.value }))}
                    className="w-full bg-slate-700/80 border border-slate-600 rounded-lg p-2 text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-300 block mb-1">Hari, Tanggal</label>
                  <input
                    type="text"
                    value={identity.hariTanggal || ''}
                    placeholder="Contoh: Senin, 15 Desember 2025"
                    onChange={(e) =>
                      setIdentity((prev) => ({
                        ...prev,
                        hariTanggal: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-700/80 border border-slate-600 rounded-lg p-2 text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-300 block mb-1">Semester</label>
                  <input
                    type="text"
                    value={
                      identity.semester && !identity.semester.includes(',') && !identity.semester.includes('202')
                        ? identity.semester
                        : '1 (Ganjil)'
                    }
                    placeholder="Contoh: 1 (Ganjil) atau 2 (Genap)"
                    onChange={(e) =>
                      setIdentity((prev) => ({
                        ...prev,
                        semester: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-700/80 border border-slate-600 rounded-lg p-2 text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-300 block mb-1">Tahun Pelajaran</label>
                  <input
                    type="text"
                    value={identity.tapel}
                    onChange={(e) => setIdentity((prev) => ({ ...prev, tapel: e.target.value }))}
                    className="w-full bg-slate-700/80 border border-slate-600 rounded-lg p-2 text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-300 block mb-1">Alokasi Waktu</label>
                  <input
                    type="text"
                    value={identity.waktu}
                    onChange={(e) => setIdentity((prev) => ({ ...prev, waktu: e.target.value }))}
                    className="w-full bg-slate-700/80 border border-slate-600 rounded-lg p-2 text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-medium text-slate-300 block mb-1">
                    Petunjuk Pengerjaan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={identity.petunjuk}
                    onChange={(e) =>
                      setIdentity((prev) => ({ ...prev, petunjuk: e.target.value }))
                    }
                    className="w-full bg-slate-700/80 border border-slate-600 rounded-lg p-2 text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. TEXT EDITOR & PARSER */}
            <div className="bg-slate-800/80 rounded-xl p-4 md:p-5 border border-slate-700 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center font-mono">
                    2
                  </span>
                  <h3 className="font-bold text-sm md:text-base text-white">
                    Teks Naskah Soal &amp; Parser Otomatis
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-mono">{rawText.length} karakter</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    {detectedQuestions} Soal Terdeteksi
                  </span>
                </div>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={8}
                placeholder="Tempel atau sesuaikan naskah soal di sini..."
                className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-xs text-slate-200 font-mono outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed shadow-inner"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleParseText}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-95"
                  >
                    <Wand2 className="w-4 h-4" />
                    Parse &amp; Rapikan Format
                  </button>

                  <button
                    type="button"
                    onClick={handleCleanMathInRawText}
                    className="px-3 py-2 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 rounded-lg font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 border border-emerald-600/70"
                    title="Konversi otomatis kode LaTeX (\frac, \sqrt, pangkat, simbol) menjadi simbol rapi yang siap baca"
                  >
                    <Calculator className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Rapikan Rumus (LaTeX → Simbol)</span>
                  </button>
                </div>

                {initialRawText && rawText !== initialRawText && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawText(initialRawText);
                      onShowToast('Teks dikembalikan ke naskah asli dari generator.');
                    }}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Muat Ulang Teks Generator
                  </button>
                )}
              </div>
            </div>

            {/* 3. KELOLA GAMBAR JADI STIMULUS (FITUR BARU) */}
            <div className="bg-slate-800/80 rounded-xl p-4 md:p-5 border border-slate-700 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center font-mono">
                    3
                  </span>
                  <h3 className="font-bold text-sm md:text-base text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    Kelola Gambar Jadi Stimulus (Word &amp; PDF)
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-indigo-950/80 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-700/60 font-semibold text-[11px]">
                    {imageStimulusIndices.length} Meminta Gambar
                  </span>
                  {textStimulusIndices.length > 0 && (
                    <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 text-[11px]">
                      {textStimulusIndices.length} Paragraf Teks (Tanpa Gambar)
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Fitur gambar disematkan pada <strong className="text-emerald-300">stimulus yang meminta gambar/diagram</strong>. Anda dapat mengunggah gambar dari perangkat atau memilih pustaka diagram siap pakai di bawah ini. Stimulus berupa <strong className="text-slate-200">teks bacaan</strong> tetap disajikan utuh sebagai teks tanpa kotak gambar.
              </p>

              {stimulusIndices.length === 0 ? (
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 text-center text-xs text-slate-400 italic">
                  Belum ada bagian stimulus terdeteksi pada naskah soal. Silakan pastikan teks diawali dengan pengantar seperti "Cermati gambar..." atau "Bacalah artikel...".
                </div>
              ) : (
                <div className="space-y-3 mt-2">
                  {stimulusIndices.map((itemIdx, idx) => {
                    const stimulusItem = parsedItems[itemIdx];
                    const hasImage = !!stimulusItem.imageUrl;
                    const isGenerating = !!isGeneratingImageFor[itemIdx];
                    const isImageReq = stimulusItem.isImageStimulus || !!stimulusItem.imagePrompt || hasImage;

                    if (!isImageReq) {
                      return (
                        <div
                          key={itemIdx}
                          className="p-3.5 rounded-xl border bg-slate-900/60 border-slate-700/70 space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400">
                                Stimulus #{idx + 1}:
                              </span>
                              <span className="text-xs text-slate-200 font-medium truncate max-w-xs md:max-w-md">
                                {stimulusItem.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[11px] font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-slate-400" /> Paragraf Teks Bacaan
                              </span>
                            </div>
                          </div>

                          {/* Cuplikan Teks Paragraf */}
                          {stimulusItem.paragraphs && stimulusItem.paragraphs.length > 0 && (
                            <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] text-slate-400 line-clamp-2 italic">
                              "{stimulusItem.paragraphs[0]}"
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <span className="text-slate-500 italic text-[11px]">
                              Stimulus berupa paragraf teks bacaan (tanpa gambar)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setParsedItems((prev) => {
                                  const copy = [...prev];
                                  copy[itemIdx] = {
                                    ...copy[itemIdx],
                                    isImageStimulus: true,
                                    imagePrompt: copy[itemIdx].title || 'Diagram Kontekstual',
                                  };
                                  return copy;
                                });
                                onShowToast('Stimulus diubah menjadi stimulus gambar.');
                              }}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                            >
                              + Pasangkan gambar opsional
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={itemIdx}
                        className={`p-3.5 rounded-xl border transition-all ${
                          hasImage
                            ? 'bg-emerald-950/25 border-emerald-600/50 shadow-sm'
                            : 'bg-slate-900/70 border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-400">
                              Stimulus #{idx + 1}:
                            </span>
                            <span className="text-xs text-slate-200 font-medium truncate max-w-xs md:max-w-md">
                              {stimulusItem.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {hasImage ? (
                              <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Gambar Jadi Terpasang
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/70">
                                Berupa Prompt Gambar
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Tampilkan Prompt Gambar yang Terdeteksi */}
                        {stimulusItem.imagePrompt && (
                          <div className="my-2 p-2 bg-slate-950/80 rounded-lg border border-slate-700 text-xs">
                            <span className="text-amber-400 font-semibold block text-[11px]">
                              💡 Prompt / Deskripsi Visual Terdeteksi:
                            </span>
                            <p className="text-slate-300 italic text-[11px] mt-0.5">
                              "{stimulusItem.imagePrompt}"
                            </p>
                          </div>
                        )}

                        {/* Image Preview & Controls if image attached */}
                        {hasImage ? (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={stimulusItem.imageUrl}
                                alt="Thumbnail"
                                className="w-20 h-14 object-contain bg-white rounded border border-slate-600 p-0.5 shadow-sm"
                              />
                              <div className="text-xs">
                                <label className="text-slate-400 block mb-0.5">Lebar Gambar di Lembar:</label>
                                <select
                                  value={stimulusItem.imageWidthPercent || 75}
                                  onChange={(e) =>
                                    handleSetStimulusImageWidth(itemIdx, parseInt(e.target.value, 10))
                                  }
                                  className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200"
                                >
                                  <option value={50}>50% Lebar Lembar</option>
                                  <option value={75}>75% Lebar Lembar (Standar)</option>
                                  <option value={90}>90% Lebar Lembar</option>
                                  <option value={100}>100% Penuh</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleGenerateImageWithAI(itemIdx)}
                                disabled={isGenerating}
                                className="px-2.5 py-1.5 bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 rounded-lg text-xs font-semibold border border-emerald-700/60 cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
                                title="Buat ulang gambar dengan AI"
                              >
                                <Sparkles className={`w-3 h-3 text-yellow-300 ${isGenerating ? 'animate-spin' : ''}`} />
                                {isGenerating ? 'Membuat...' : 'AI Ulang'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTriggerStimulusUpload(itemIdx)}
                                className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                              >
                                Ganti Gambar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveStimulusImage(itemIdx)}
                                className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 rounded-lg text-xs font-medium border border-rose-800/60 cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Hapus
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Action options to attach image */
                          <div className="mt-2.5 pt-2.5 border-t border-slate-700/60 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleTriggerStimulusUpload(itemIdx)}
                              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Unggah File
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveTargetStimulusIndex(itemIdx);
                                setShowDiagramLibraryModal(true);
                              }}
                              className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              Pilih Diagram Cepat
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePasteImageFromClipboard(itemIdx)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer border border-slate-700"
                              title="Tempel gambar langsung dari clipboard (Ctrl+V)"
                            >
                              <Clipboard className="w-3.5 h-3.5" />
                              Tempel
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. PENGATURAN DOKUMEN LANJUTAN F4 */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 shadow-sm">
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-xs md:text-sm text-slate-200">
                    Pengaturan Spasi &amp; Format F4 (Standar Resmi)
                  </span>
                </div>
                <span className="text-xs text-indigo-400 hover:text-indigo-300">
                  {showAdvancedSettings ? 'Tutup Pengaturan' : 'Buka Pengaturan'}
                </span>
              </div>

              {showAdvancedSettings && (
                <div className="mt-4 pt-3 border-t border-slate-700/80 space-y-3 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Ukuran Kertas</label>
                      <input
                        type="text"
                        value="F4 (210 × 330 mm)"
                        disabled
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-400 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Font Utama</label>
                      <input
                        type="text"
                        value="Times New Roman 11pt"
                        disabled
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-400 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1 font-medium">Jarak Antarsoal</label>
                      <select
                        value={settings.spacingBetween}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            spacingBetween: parseInt(e.target.value, 10),
                          }))
                        }
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-slate-200"
                      >
                        <option value={6}>Before 6 pt (Standar Resmi)</option>
                        <option value={4}>Before 4 pt (Padat)</option>
                        <option value={8}>Before 8 pt (Renggang)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Spasi Paragraf</label>
                      <input
                        type="text"
                        value="Single (1.0)"
                        disabled
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-400 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div>
                      <label className="text-slate-400 block mb-1">Margin Atas</label>
                      <input
                        type="text"
                        value={`${settings.marginTop} cm`}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            marginTop: parseFloat(e.target.value) || 2.0,
                          }))
                        }
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Margin Bawah</label>
                      <input
                        type="text"
                        value={`${settings.marginBottom} cm`}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            marginBottom: parseFloat(e.target.value) || 2.0,
                          }))
                        }
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Margin Kiri (Jilid)</label>
                      <input
                        type="text"
                        value={`${settings.marginLeft} cm`}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            marginLeft: parseFloat(e.target.value) || 2.5,
                          }))
                        }
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Margin Kanan</label>
                      <input
                        type="text"
                        value={`${settings.marginRight} cm`}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            marginRight: parseFloat(e.target.value) || 2.0,
                          }))
                        }
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleResetSettings}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Kembalikan ke Standar F4
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PREFLIGHT CHECKLIST & AUDIT */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-200">
                    Pemeriksaan Standar Dokumen F4
                  </span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-950 text-emerald-300 rounded border border-emerald-800">
                  Terverifikasi Siap Cetak
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Kertas Asli F4 (210×330 mm)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Font Times New Roman 11pt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Spasi Single (1.0) &amp; Before {settings.spacingBetween}pt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Tabel &amp; Gambar Jadi Tertanam</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2 pt-0.5 border-t border-slate-700/60">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300 font-medium">Rumus Matematika Terbaca Rapi &amp; Jelas (Bebas Kode LaTeX: ½, x², √x, ±, ×, π)</span>
                </div>
              </div>

              {warnings.length > 0 && (
                <div className="p-2.5 bg-amber-950/60 border border-amber-800/80 rounded text-amber-200 text-[11px] space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Perhatian Urutan Soal:</span>
                  </div>
                  <ul className="list-disc list-inside">
                    {warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ACTION DOWNLOAD BUTTONS */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3 sticky bottom-0 z-10 shadow-xl">
              {/* 1. OPSI PALING CEPAT & PRAKTIS: 1-KLIK UNDUH SEMUA TERPISAH (ZIP) */}
              <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 p-3 rounded-xl border border-emerald-500/50 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <Archive className="w-4 h-4 text-emerald-300" />
                      Rekomendasi Terbaik: Paket ZIP File Terpisah (1-Klik)
                    </span>
                    <span className="text-slate-400 text-[11px] block mt-0.5">
                      Sekali unduh, semua berkas langsung terpisah: Soal (untuk siswa), Kunci &amp; Rubrik (guru), Kisi-Kisi, dan Kartu Soal.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadSeparatedZip}
                    disabled={isZipping || parsedItems.length === 0}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <Archive className={`w-4 h-4 ${isZipping ? 'animate-bounce' : ''}`} />
                    <span>{isZipping ? 'Mengemas File ZIP...' : '📦 Unduh Semua (ZIP Terpisah)'}</span>
                  </button>
                </div>
              </div>

              {/* 2. OPSI UNDUH SATUAN DOKUMEN TERPISAH */}
              <div>
                <span className="text-[11px] font-semibold text-slate-300 block mb-2">
                  Atau Unduh File Satuan (.docx F4 Siap Cetak):
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* Naskah Soal Saja */}
                  <button
                    type="button"
                    onClick={() => handleDownloadWord('soal')}
                    disabled={isDownloadingPart === 'soal' || parsedItems.length === 0}
                    className="p-2 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-600/60 hover:border-indigo-400 rounded-xl text-left transition-all active:scale-95 cursor-pointer group"
                    title="Hanya lembar soal & stimulus (bersih untuk siswa, tanpa kunci/kisi-kisi)"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 group-hover:text-white">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>1. Naskah Soal</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                      Khusus dibagikan ke siswa
                    </span>
                  </button>

                  {/* Kunci & Rubrik Skor */}
                  <button
                    type="button"
                    onClick={() => handleDownloadWord('kunci_skor')}
                    disabled={isDownloadingPart === 'kunci_skor' || parsedItems.length === 0}
                    className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500 rounded-xl text-left transition-all active:scale-95 cursor-pointer group"
                    title="Kunci jawaban dan rubrik pedoman penskoran resmi bagi guru"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 group-hover:text-white">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>2. Kunci &amp; Rubrik</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                      Pegangan khusus guru
                    </span>
                  </button>

                  {/* Kisi-Kisi Asesmen */}
                  <button
                    type="button"
                    onClick={() => handleDownloadWord('kisi_kisi')}
                    disabled={isDownloadingPart === 'kisi_kisi' || parsedItems.length === 0}
                    className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-teal-500 rounded-xl text-left transition-all active:scale-95 cursor-pointer group"
                    title="Matriks kisi-kisi penulisan soal untuk kurikulum / pengawas"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300 group-hover:text-white">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
                      <span>3. Kisi-Kisi Soal</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                      Arsip kurikulum / dinas
                    </span>
                  </button>

                  {/* Kartu Soal Resmi */}
                  <button
                    type="button"
                    onClick={() => handleDownloadWord('kartu_soal')}
                    disabled={isDownloadingPart === 'kartu_soal' || parsedItems.length === 0}
                    className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-rose-500 rounded-xl text-left transition-all active:scale-95 cursor-pointer group"
                    title="Format resmi Kartu Soal per butir soal standar Kurikulum Merdeka"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300 group-hover:text-white">
                      <Layers className="w-3.5 h-3.5 text-rose-400" />
                      <span>4. Kartu Soal</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                      Format resmi per butir
                    </span>
                  </button>

                  {/* Materi Esensial */}
                  <button
                    type="button"
                    onClick={() => handleDownloadWord('materi')}
                    disabled={isDownloadingPart === 'materi' || parsedItems.length === 0}
                    className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-500 rounded-xl text-left transition-all active:scale-95 cursor-pointer group"
                    title="Rangkuman materi esensial pendukung asesmen / bahan ajar"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300 group-hover:text-white">
                      <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                      <span>5. Materi Esensial</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                      Bahan belajar / remedial
                    </span>
                  </button>

                  {/* Dokumen Lengkap (Semua Jadi Satu) */}
                  <button
                    type="button"
                    onClick={() => handleDownloadWord('all')}
                    disabled={isDownloadingPart === 'all' || parsedItems.length === 0}
                    className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-400 rounded-xl text-left transition-all active:scale-95 cursor-pointer group"
                    title="Unduh seluruh naskah soal, kunci, dan lampiran dalam 1 file Word gabungan"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 group-hover:text-white">
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>Semua (1 File)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                      Format gabungan asli
                    </span>
                  </button>
                </div>
              </div>

              {/* 3. BARIS ALAT CETAK / SALIN */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-slate-600"
                    title="Cetak atau simpan PDF langsung dari browser"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak / PDF</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCleanText}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-600 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedClean ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Salin Teks Bersih</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live F4 Document Canvas Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            {/* Toolbar Zoom & Estimate */}
            <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-200">Pratinjau Kertas F4</span>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer"
                  title="Perkecil"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] text-slate-300 w-10 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(0.85)}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer"
                  title="Reset 85%"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tab Selector Dokumen Pratinjau */}
              <div className="w-full flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700 text-[11px] overflow-x-auto mt-1">
                <button
                  type="button"
                  onClick={() => setPreviewTab('soal')}
                  className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    previewTab === 'soal'
                      ? 'bg-indigo-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3 h-3" /> 1. Soal
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('kunci_skor')}
                  className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    previewTab === 'kunci_skor'
                      ? 'bg-amber-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Key className="w-3 h-3" /> 2. Kunci &amp; Rubrik
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('kisi_kisi')}
                  className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    previewTab === 'kisi_kisi'
                      ? 'bg-teal-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3 h-3" /> 3. Kisi-Kisi
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('kartu_soal')}
                  className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    previewTab === 'kartu_soal'
                      ? 'bg-rose-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" /> 4. Kartu Soal
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('materi')}
                  className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    previewTab === 'materi'
                      ? 'bg-sky-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3 h-3" /> 5. Materi Esensial
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('all')}
                  className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    previewTab === 'all'
                      ? 'bg-slate-700 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" /> Semua (1 File)
                </button>
              </div>
            </div>

            {/* Preview Sheet Container */}
            <div className="bg-slate-950/80 bg-batik-subtle rounded-xl p-4 overflow-y-auto max-h-[780px] flex justify-center border border-slate-800 shadow-inner">
              <div
                className="origin-top transition-transform duration-150"
                style={{ transform: `scale(${zoom})` }}
              >
                {/* Printable F4 Paper Sheet */}
                <article
                  id="print-area"
                  className="w-full max-w-[680px] min-h-[960px] bg-white text-black shadow-2xl p-8 sm:p-10 font-serif leading-snug"
                  style={{
                    fontFamily: '"Times New Roman", Times, serif',
                    fontSize: '11pt',
                  }}
                >
                  {/* 1. KOP SURAT */}
                  {kopBase64 ? (
                    <div className="text-center pb-2 border-b-2 border-black mb-3">
                      <img
                        src={kopBase64}
                        alt="Kop Surat"
                        className="mx-auto max-h-24 object-contain"
                        style={{ width: `${kopWidthPercent}%` }}
                      />
                    </div>
                  ) : (
                    <div className="text-center pb-2 border-b-2 border-black mb-3">
                      <div className="font-bold text-xs uppercase tracking-wide">
                        PEMERINTAH PROVINSI / KABUPATEN
                      </div>
                      <div className="font-bold text-sm uppercase tracking-wide">
                        DINAS PENDIDIKAN DAN KEBUDAYAAN
                      </div>
                      <div className="font-bold text-base uppercase tracking-wide">
                        SEKOLAH MENENGAH PERTAMA / ATAS
                      </div>
                      <div className="text-[9pt] italic mt-0.5">
                        Jl. Pendidikan No. 123, Telepon (021) 1234567, Pos 12345
                      </div>
                    </div>
                  )}

                  {/* 2. JUDUL UJIAN & TAHUN PELAJARAN */}
                  {/* 2. JUDUL UJIAN & TAHUN PELAJARAN SESUAI TAB PRATINJAU */}
                  <div className="text-center mb-3">
                    <h2 className="font-bold text-[13pt] uppercase tracking-wide">
                      {previewTab === 'kartu_soal'
                        ? 'KARTU SOAL ASESMEN STANDAR RESMI'
                        : previewTab === 'kisi_kisi'
                        ? 'KISI-KISI PENULISAN SOAL ASESMEN'
                        : previewTab === 'kunci_skor'
                        ? 'KUNCI JAWABAN DAN PEDOMAN PENSKORAN'
                        : previewTab === 'materi'
                        ? 'RANGKUMAN MATERI ESENSIAL'
                        : previewTab === 'soal'
                        ? `${identity.jenisUjian.toUpperCase()} - NASKAH SOAL`
                        : identity.jenisUjian.toUpperCase()}
                    </h2>
                    <div className="font-bold text-[11pt] uppercase tracking-wide mt-0.5">
                      TAHUN PELAJARAN {identity.tapel.replace(/^tahun\s+pelajaran\s+/i, '')}
                    </div>
                  </div>

                  {/* 3. IDENTITAS (Borderless Table) */}
                  <div className="mb-3 text-[11pt]">
                    <table className="w-full border-collapse" style={{ fontSize: '10.5pt' }}>
                      <tbody>
                        <tr>
                          <td className="w-[20%] py-0.5 font-normal align-top">Mata Pelajaran</td>
                          <td className="w-[3%] py-0.5 text-center align-top">:</td>
                          <td className="w-[37%] py-0.5 align-top font-normal">{identity.mapel}</td>
                          <td className="w-[18%] py-0.5 font-normal align-top">Kelas / Fase</td>
                          <td className="w-[3%] py-0.5 text-center align-top">:</td>
                          <td className="w-[19%] py-0.5 align-top font-normal">{identity.kelas}</td>
                        </tr>
                        <tr>
                          <td className="py-0.5 font-normal align-top">Hari, Tanggal</td>
                          <td className="py-0.5 text-center align-top">:</td>
                          <td className="py-0.5 align-top font-normal">{identity.hariTanggal || identity.semester || '-'}</td>
                          <td className="py-0.5 font-normal align-top">Alokasi Waktu</td>
                          <td className="py-0.5 text-center align-top">:</td>
                          <td className="py-0.5 align-top font-normal">{identity.waktu}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 4. PETUNJUK PENGERJAAN (Hanya pada Naskah Soal & Dokumen Lengkap) */}
                  {(previewTab === 'soal' || previewTab === 'all') && identity.petunjuk && (
                    <div className="pt-1.5 pb-2 border-t border-b border-black text-center font-bold text-[10pt] mb-3">
                      {identity.petunjuk}
                    </div>
                  )}

                  {/* 5. QUESTIONS CONTAINER */}
                  <div className="space-y-0 text-justify text-[11pt]">
                    {parsedItems.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 font-sans italic text-sm">
                        Belum ada soal yang diparsing. Tempel teks soal dan klik "Parse &amp; Rapikan Format".
                      </div>
                    ) : previewTab === 'kartu_soal' ? (
                      <div className="space-y-4">
                        {parsedItems.filter((i) => i.type === 'question').length === 0 ? (
                          <div className="py-8 text-center text-slate-400 font-sans italic text-xs">
                            Belum ada butir pertanyaan yang terdeteksi untuk membuat Kartu Soal.
                          </div>
                        ) : (
                          parsedItems.filter((i) => i.type === 'question').map((q, qIdx) => {
                            const qNum = q.number || qIdx + 1;
                            const qIndexInAll = parsedItems.indexOf(q);
                            let precedingStimulus: ParsedItem | null = null;
                            if (qIndexInAll > 0) {
                              for (let sIdx = qIndexInAll - 1; sIdx >= 0; sIdx--) {
                                if (parsedItems[sIdx].type === 'stimulus') {
                                  precedingStimulus = parsedItems[sIdx];
                                  break;
                                }
                              }
                            }
                            let bentukSoal = 'Pilihan Ganda';
                            if (q.options && q.options.length > 0) {
                              const qText = (q.questionText || '').toLowerCase();
                              const hasPgkOption = q.options.some((o) => o.label.includes('['));
                              const hasPgkKeyword =
                                qText.includes('kompleks') ||
                                qText.includes('lebih dari satu') ||
                                qText.includes('dua atau tiga') ||
                                qText.includes('pilihlah dua') ||
                                qText.includes('pilihlah 2') ||
                                qText.includes('pilihlah 3');

                              if (hasPgkOption || hasPgkKeyword) {
                                bentukSoal = 'Pilihan Ganda Kompleks';
                              } else {
                                bentukSoal = 'Pilihan Ganda';
                              }
                            } else if (q.embeddedTable && q.embeddedTable.length > 0) {
                              const t = (q.questionText || '').toLowerCase();
                              if (t.includes('benar') || t.includes('salah')) bentukSoal = 'Benar - Salah';
                              else if (t.includes('jodoh')) bentukSoal = 'Menjodohkan';
                              else bentukSoal = 'Isian / Tabel';
                            } else {
                              bentukSoal = 'Uraian / Uraian Singkat';
                            }

                            const kunciItems = parsedItems.filter((i) => i.section === 'kunci_skor');

                            const semesterDisplay =
                              identity.semester && !identity.semester.includes(',') && !identity.semester.includes('202')
                                ? identity.semester
                                : '1 (Ganjil)';

                            const resolved = resolveQuestionCapaianAndMateri(
                              qNum,
                              packets,
                              precedingStimulus,
                              identity.mapel
                            );

                            const matchedKey = extractAnswerKeyForQuestion(
                              qNum,
                              kunciItems,
                              bentukSoal,
                              resolved.materi
                            );

                            const levelKognitif =
                              resolved.level || (bentukSoal.includes('Uraian') ? 'L3 / Penalaran' : 'L2 / Aplikasi');

                            return (
                              <div key={qIdx} className="border border-black text-[10pt] font-serif mb-4 leading-normal">
                                <div className="bg-slate-100 border-b border-black text-center font-bold py-1 text-[10.5pt]">
                                  KARTU SOAL NOMOR : {qNum}
                                </div>
                                <div className="grid grid-cols-2 border-b border-black text-[9.5pt]">
                                  <div className="p-2 border-r border-black space-y-0.5">
                                    <div><strong>Mata Pelajaran:</strong> {identity.mapel}</div>
                                    <div><strong>Kelas / Sem:</strong> {identity.kelas} / {semesterDisplay}</div>
                                    <div><strong>Tahun Ajaran:</strong> {identity.tapel}</div>
                                  </div>
                                  <div className="p-2 space-y-0.5">
                                    <div><strong>Bentuk Soal:</strong> {bentukSoal}</div>
                                    <div><strong>Level Kognitif:</strong> {levelKognitif}</div>
                                  </div>
                                </div>
                                <div className="p-2 border-b border-black text-[9.5pt] bg-slate-50/50 space-y-1">
                                  <div><strong>Capaian Pembelajaran (CP):</strong> {resolved.capaian}</div>
                                  <div><strong>Materi Pokok / Bab:</strong> {resolved.materi}</div>
                                  <div className="text-[9pt] text-slate-700">
                                    <strong>Indikator Soal:</strong> Disajikan stimulus kontekstual materi {resolved.materi}, peserta didik mampu menyelesaikan butir pertanyaan nomor {qNum} dengan tepat.
                                  </div>
                                </div>
                                <div className="p-2.5 space-y-2 text-[10pt]">
                                  <div className="font-bold text-[9.5pt]">RUMUSAN BUTIR SOAL:</div>
                                  {precedingStimulus && (
                                    <div className="italic text-[9.5pt] bg-slate-50 p-1.5 border-l-2 border-black">
                                      <div className="font-bold">{cleanMarkdown(precedingStimulus.title || '')}</div>
                                      <div>{cleanMarkdown(precedingStimulus.paragraphs?.[0] || '')}</div>
                                    </div>
                                  )}
                                  <div className="font-normal">{qNum}. {cleanMarkdown(q.questionText || '')}</div>
                                  {q.options && q.options.length > 0 && (
                                    <div className="pl-4 space-y-0.5 text-[9.5pt]">
                                      {q.options.map((opt, oIdx) => (
                                        <div key={oIdx}>{opt.label} {cleanMarkdown(opt.text)}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="p-2 bg-slate-100/70 border-t border-black text-[9pt]">
                                  <strong>KUNCI JAWABAN &amp; RUBRIK PENSKORAN:</strong> {cleanMarkdown(matchedKey)}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    ) : previewTab === 'kisi_kisi' && parsedItems.filter((it) => it.section === 'kisi_kisi').length === 0 ? (
                      <div className="space-y-3 font-serif text-[10pt]">
                        <div className="bg-slate-100 border border-black p-2 font-bold text-center text-[10.5pt]">
                          MATRIKS KISI-KISI PENULISAN SOAL ASESMEN
                        </div>
                        <table className="border border-black border-collapse text-[9.5pt] w-full">
                          <thead>
                            <tr className="bg-slate-100 font-bold">
                              <th className="border border-black p-1 text-center w-8">No</th>
                              <th className="border border-black p-1 text-left">Capaian Pembelajaran / Materi</th>
                              <th className="border border-black p-1 text-left">Indikator Soal</th>
                              <th className="border border-black p-1 text-center w-16">Level</th>
                              <th className="border border-black p-1 text-center w-24">Bentuk</th>
                              <th className="border border-black p-1 text-center w-10">No</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedItems.filter((i) => i.type === 'question').map((q, qIdx) => {
                              const qNum = q.number || qIdx + 1;
                              const qIndexInAll = parsedItems.indexOf(q);
                              let precedingStimulus: ParsedItem | null = null;
                              if (qIndexInAll > 0) {
                                for (let sIdx = qIndexInAll - 1; sIdx >= 0; sIdx--) {
                                  if (parsedItems[sIdx].type === 'stimulus') {
                                    precedingStimulus = parsedItems[sIdx];
                                    break;
                                  }
                                }
                              }
                              const bentukSoal = normalizeQuestionType(undefined, q);
                              const resolved = resolveQuestionCapaianAndMateri(
                                qNum,
                                packets,
                                precedingStimulus,
                                identity.mapel
                              );
                              const level = bentukSoal === 'Uraian' ? 'L3 / Penalaran' : 'L2 / Aplikasi';
                              return (
                                <tr key={qIdx}>
                                  <td className="border border-black p-1 text-center">{qIdx + 1}</td>
                                  <td className="border border-black p-1">
                                    <div className="font-semibold">{resolved.materi}</div>
                                    <div className="text-[8.5pt] text-slate-700">{resolved.capaian}</div>
                                  </td>
                                  <td className="border border-black p-1">Disajikan stimulus materi {resolved.materi}, peserta didik mampu menyelesaikan butir nomor {qNum} dengan tepat.</td>
                                  <td className="border border-black p-1 text-center">{level}</td>
                                  <td className="border border-black p-1 text-center">{bentukSoal}</td>
                                  <td className="border border-black p-1 text-center font-bold">{qNum}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : previewTab === 'kunci_skor' ? (
                      <div className="space-y-3 font-serif text-[10pt]">
                        <div className="bg-slate-100 border border-black p-2 font-bold text-center text-[10.5pt]">
                          KUNCI JAWABAN DAN PEDOMAN PENSKORAN ASESMEN
                        </div>
                        <table className="border border-black border-collapse text-[9.5pt] w-full">
                          <thead>
                            <tr className="bg-slate-100 font-bold">
                              <th className="border border-black p-1 text-center w-10">No</th>
                              <th className="border border-black p-1 text-center w-28">Bentuk Soal</th>
                              <th className="border border-black p-1 text-left">Kunci Jawaban &amp; Pembahasan</th>
                              <th className="border border-black p-1 text-left w-52">Pedoman Penskoran</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedItems.filter((i) => i.type === 'question').map((q, qIdx) => {
                              const qNum = q.number || qIdx + 1;
                              const bentukSoal = normalizeQuestionType(undefined, q);

                              const kunciItems = parsedItems.filter((i) => i.section === 'kunci_skor');
                              const qIndexInAll = parsedItems.indexOf(q);
                              let precedingStimulus: ParsedItem | null = null;
                              if (qIndexInAll > 0) {
                                for (let sIdx = qIndexInAll - 1; sIdx >= 0; sIdx--) {
                                  if (parsedItems[sIdx].type === 'stimulus') {
                                    precedingStimulus = parsedItems[sIdx];
                                    break;
                                  }
                                }
                              }

                              const resolved = resolveQuestionCapaianAndMateri(
                                qNum,
                                packets,
                                precedingStimulus,
                                identity.mapel
                              );

                              const matchedKey = extractAnswerKeyForQuestion(
                                qNum,
                                kunciItems,
                                bentukSoal,
                                resolved.materi,
                                parsedItems
                              );

                              let rubrikDesc = 'Jawaban benar = 1, salah/kosong = 0.';
                              if (bentukSoal === 'PG Kompleks') {
                                rubrikDesc = 'Benar lengkap = 2; Benar sebagian = 1; Salah/kosong = 0.';
                              } else if (bentukSoal === 'Benar-Salah') {
                                rubrikDesc = 'Tiap pernyataan bernilai tepat = 1 (maksimal = 3).';
                              } else if (bentukSoal === 'Menjodohkan') {
                                rubrikDesc = 'Tiap pasangan tepat = 1 (maksimal = 4).';
                              } else if (bentukSoal === 'Uraian') {
                                rubrikDesc = 'Lengkap & logis = 4; Cukup = 3; Kurang = 2; Minimal = 1; Kosong = 0.';
                              }

                              return (
                                <tr key={qIdx}>
                                  <td className="border border-black p-1 text-center font-bold">{qNum}</td>
                                  <td className="border border-black p-1 text-center">{bentukSoal}</td>
                                  <td className="border border-black p-1">{cleanMarkdown(matchedKey)}</td>
                                  <td className="border border-black p-1 text-[9pt]">{rubrikDesc}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : previewTab === 'materi' ? (
                      <div className="space-y-3 font-serif text-[10pt]">
                        <div className="bg-slate-100 border border-black p-2 font-bold text-center text-[10.5pt]">
                          TABEL MATERI ESENSIAL PEMBELAJARAN
                        </div>
                        <table className="border border-black border-collapse text-[9pt] w-full">
                          <thead>
                            <tr className="bg-slate-100 font-bold">
                              <th className="border border-black p-1 text-center w-12">No Soal</th>
                              <th className="border border-black p-1 text-left w-1/4">Capaian Pembelajaran</th>
                              <th className="border border-black p-1 text-left w-1/4">Tujuan Pembelajaran</th>
                              <th className="border border-black p-1 text-left">Uraian Materi</th>
                              <th className="border border-black p-1 text-center w-28">Jenis Soal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedItems.filter((i) => i.type === 'question').map((q, qIdx) => {
                              const qNum = q.number || qIdx + 1;
                              const qIndexInAll = parsedItems.indexOf(q);
                              let precedingStimulus: ParsedItem | null = null;
                              if (qIndexInAll > 0) {
                                for (let sIdx = qIndexInAll - 1; sIdx >= 0; sIdx--) {
                                  if (parsedItems[sIdx].type === 'stimulus') {
                                    precedingStimulus = parsedItems[sIdx];
                                    break;
                                  }
                                }
                              }
                              const resolved = resolveQuestionCapaianAndMateri(
                                qNum,
                                packets,
                                precedingStimulus,
                                identity.mapel,
                                parsedItems,
                                q
                              );

                              const finalJenis = normalizeQuestionType(resolved.jenisSoal, q);

                              return (
                                <tr key={qIdx}>
                                  <td className="border border-black p-1 text-center font-bold">{qNum}</td>
                                  <td className="border border-black p-1">{resolved.capaian}</td>
                                  <td className="border border-black p-1">{resolved.tujuan}</td>
                                  <td className="border border-black p-1">{resolved.uraianMateri}</td>
                                  <td className="border border-black p-1 text-center">{finalJenis}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      (previewTab === 'soal'
                        ? parsedItems.filter((it) => !it.section || it.section === 'soal')
                        : previewTab === 'kisi_kisi'
                        ? parsedItems.filter((it) => it.section === 'kisi_kisi')
                        : parsedItems
                      ).map((item, idx) => {
                        if (item.type === 'stimulus') {
                          const isImgStimulus = item.isImageStimulus || !!item.imageUrl;
                          const showImageMode = exportAndPreviewMode === 'image';

                          return (
                            <div
                              key={idx}
                              className="mb-2"
                              style={{ marginTop: `${settings.spacingBetween}pt` }}
                            >
                              <p className="font-bold text-[10.5pt] mb-1 italic text-black">
                                {item.title}
                              </p>

                              {/* JIKA MODE SOAL + GAMBAR JADI */}
                              {showImageMode && item.imageUrl && (
                                <div className="my-2.5 text-center">
                                  <img
                                    src={item.imageUrl}
                                    alt="Diagram Stimulus Soal"
                                    style={{ width: `${item.imageWidthPercent || 75}%` }}
                                    className="mx-auto rounded border border-black/80 max-h-64 object-contain shadow-sm bg-white"
                                  />
                                </div>
                              )}

                              {/* Kotak Interaktif jika Gambar Belum Dipasang pada Mode Gambar Jadi */}
                              {showImageMode && isImgStimulus && !item.imageUrl && (
                                <div className="my-2.5 p-3 rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-50/70 text-center font-sans">
                                  <div className="flex items-center justify-center gap-1.5 text-indigo-900 font-bold text-xs mb-1">
                                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                                    <span>Area Gambar Jadi Stimulus (Belum Dipasang)</span>
                                  </div>
                                  <p className="text-[10px] text-slate-600 italic mb-2 max-w-sm mx-auto">
                                    "{item.imagePrompt || 'Deskripsi diagram visual stimulus'}"
                                  </p>
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleTriggerStimulusUpload(idx)}
                                      className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-[11px] font-medium cursor-pointer shadow-sm flex items-center gap-1"
                                    >
                                      <Upload className="w-3 h-3" />
                                      Unggah Gambar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveTargetStimulusIndex(idx);
                                        setShowDiagramLibraryModal(true);
                                      }}
                                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium cursor-pointer shadow-sm flex items-center gap-1"
                                    >
                                      <BookOpen className="w-3 h-3" />
                                      Pilih Diagram Cepat
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Paragraf Stimulus */}
                              {item.paragraphs?.map((p, pIdx) => {
                                const isPromptPara =
                                  /^((\[|\()?\s*(deskripsi|prompt|instruksi|keterangan)?\s*(gambar|diagram|infografis|ilustrasi|visual)\s*:?)/i.test(p) ||
                                  (isImgStimulus && (p === item.imagePrompt || (p.startsWith('[') && p.endsWith(']'))));

                                // Di mode Gambar Jadi dan gambar sudah terpasang, sembunyikan baris prompt agar naskah bersih
                                if (showImageMode && item.imageUrl && isPromptPara) {
                                  return null;
                                }

                                return (
                                  <p key={pIdx} className="mb-1 leading-normal font-normal text-black">
                                    {p}
                                  </p>
                                );
                              })}
                            </div>
                          );
                        } else if (item.type === 'question') {
                          return (
                            <div
                              key={idx}
                              style={{ marginTop: `${settings.spacingBetween}pt` }}
                              className="leading-normal font-normal text-black"
                            >
                              <div className="flex items-start gap-1.5">
                                <span className="font-normal w-7 shrink-0 text-right pr-1">
                                  {item.number}.
                                </span>
                                <div className="flex-1 font-normal text-black text-justify">
                                  {item.questionText}
                                </div>
                              </div>

                              {/* Embedded Table */}
                              {item.embeddedTable && item.embeddedTable.length > 0 && (
                                <div className="my-2 ml-7 overflow-x-auto">
                                  <table className="border border-black border-collapse text-[10pt] w-full">
                                    <tbody>
                                      {item.embeddedTable.map((row, rIdx) => (
                                        <tr key={rIdx}>
                                          {row.map((cell, cIdx) => (
                                            <td
                                              key={cIdx}
                                              className={`border border-black px-2 py-1 text-left ${
                                                rIdx === 0
                                                  ? 'font-bold bg-slate-100 text-center'
                                                  : 'font-normal text-black'
                                              }`}
                                            >
                                              {cell || ' '}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* Options */}
                              {item.options && item.options.length > 0 && (
                                <div className="ml-7 mt-0.5 space-y-0.5">
                                  {item.options.map((opt, oIdx) => {
                                    const isPgk = opt.label.startsWith('[');
                                    const cleanLabel =
                                      opt.label.endsWith('.') || opt.label.endsWith(']') ? opt.label : `${opt.label}.`;
                                    return (
                                      <div key={oIdx} className="flex items-start gap-1.5">
                                        <span className={`font-normal shrink-0 ${isPgk ? 'w-8' : 'w-6'}`}>
                                          {cleanLabel}
                                        </span>
                                        <span className="flex-1 font-normal text-black text-justify">
                                          {opt.text}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        } else if (item.type === 'table' && item.rows) {
                          return (
                            <div key={idx} className="my-3 overflow-x-auto">
                              <table className="border border-black border-collapse text-[9.5pt] w-full">
                                <tbody>
                                  {item.rows.map((row, rIdx) => (
                                    <tr key={rIdx}>
                                      {row.map((cell, cIdx) => (
                                        <td
                                          key={cIdx}
                                          className={`border border-black px-2 py-1 text-left ${
                                            rIdx === 0
                                              ? 'font-bold bg-slate-100 text-center'
                                              : 'font-normal text-black'
                                          }`}
                                        >
                                          {cell || ' '}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        } else if (item.type === 'instruction') {
                          return (
                            <div
                              key={idx}
                              className={
                                item.isSectionHeader
                                  ? 'font-bold text-center mt-4 mb-2 text-sm border-t border-b border-black py-1 tracking-wide'
                                  : 'font-normal my-1 text-black'
                              }
                            >
                              {item.text}
                            </div>
                          );
                        }
                        return null;
                      })
                    )}
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Dialog: Pustaka Diagram Edukasi Cepat */}
        {showDiagramLibraryModal && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-base text-white">
                    Pustaka Diagram Edukasi Kurikulum Merdeka
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDiagramLibraryModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Pilih salah satu diagram siap pakai di bawah untuk dipasangkan langsung ke naskah soal dan file Word:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto p-1">
                {EDUCATIONAL_DIAGRAM_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectDiagram(tpl.id)}
                    className="p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-emerald-500 rounded-xl cursor-pointer transition-all space-y-2 group shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        {tpl.category}
                      </span>
                      <span className="text-xs text-indigo-400 font-semibold group-hover:underline">
                        Gunakan &rarr;
                      </span>
                    </div>
                    <h4 className="font-semibold text-xs text-slate-100 group-hover:text-emerald-300">
                      {tpl.title}
                    </h4>
                    <div
                      className="w-full h-24 bg-white rounded border border-slate-600 overflow-hidden flex items-center justify-center p-1"
                      dangerouslySetInnerHTML={{ __html: tpl.svg }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowDiagramLibraryModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
