import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { UserGuide } from './components/UserGuide';
import { AutoFillSection } from './components/AutoFillSection';
import { GeneralInfoSection } from './components/GeneralInfoSection';
import { PacketCard } from './components/PacketCard';
import { SummaryAndOutputOptions } from './components/SummaryAndOutputOptions';
import { OutputSection } from './components/OutputSection';
import { DocumentFormatModal } from './components/DocumentFormatModal';
import { Toast } from './components/Toast';
import {
  GeneralInfo,
  KelengkapanType,
  PacketData,
  RecommendationRow,
  SoalType,
  ExportDataFormat,
} from './types/assessment';
import {
  buildAutomaticAssessment,
  createDefaultPacket,
  generateAssessmentPrompt,
  parseNomorSoal,
  SAMPLE_PRESETS,
  SOAL_TYPES,
} from './utils/assessmentLogic';

export default function App() {
  const [generalInfo, setGeneralInfo] = useState<GeneralInfo>({
    mapel: '',
    kelas: '',
    tingkatan: 'SMP / Menengah Rendah',
  });

  const [packets, setPackets] = useState<PacketData[]>([createDefaultPacket(1)]);
  const [materiAutoText, setMateriAutoText] = useState<string>('');
  const [jumlahSoalAuto, setJumlahSoalAuto] = useState<number>(25);
  const [recommendationRows, setRecommendationRows] = useState<RecommendationRow[]>([]);
  const [kelengkapan, setKelengkapan] = useState<KelengkapanType[]>([
    'Kunci dan Skor Jawaban',
    'Kisi-Kisi',
    'Kartu Soal',
    'Materi Esensial',
  ]);

  const [promptOutput, setPromptOutput] = useState<string>('');
  const [aiOutput, setAiOutput] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [activeOutputTab, setActiveOutputTab] = useState<'prompt' | 'aiResult'>('prompt');
  const [showOutputSection, setShowOutputSection] = useState<boolean>(false);

  const [isFormatModalOpen, setIsFormatModalOpen] = useState<boolean>(false);
  const [textToFormat, setTextToFormat] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState<boolean>(false);

  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedAI, setCopiedAI] = useState<boolean>(false);

  const showToast = (msg: string, isError = false) => {
    setToastMessage(msg);
    setToastIsError(isError);
  };

  const handleOpenFormatModal = (customText?: string) => {
    const text = customText || aiOutput || promptOutput || '';
    setTextToFormat(text);
    setIsFormatModalOpen(true);
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Total questions count calculation
  const totalQuestions = useMemo(() => {
    let sum = 0;
    packets.forEach((packet) => {
      Object.values(packet.soalDetails).forEach((item) => {
        if (item.enabled && item.nomor) {
          sum += parseNomorSoal(item.nomor);
        }
      });
    });
    return sum;
  }, [packets]);

  // Breakdown of questions by type
  const questionBreakdown = useMemo(() => {
    const counts: Record<SoalType, number> = {
      'Pilihan Ganda': 0,
      'PG Kompleks': 0,
      'Menjodohkan': 0,
      'Benar-Salah': 0,
      'Uraian Pendek': 0,
      'Uraian': 0,
    };

    packets.forEach((packet) => {
      SOAL_TYPES.forEach((type) => {
        const item = packet.soalDetails[type];
        if (item?.enabled && item.nomor) {
          counts[type] += parseNomorSoal(item.nomor);
        }
      });
    });

    return counts;
  }, [packets]);

  // Add a new empty packet
  const handleAddPacket = () => {
    setPackets((prev) => [...prev, createDefaultPacket(prev.length + 1)]);
    showToast(`Paket soal baru nomor ${packets.length + 1} ditambahkan!`);
  };

  // Remove packet by id
  const handleRemovePacket = (id: string) => {
    if (packets.length <= 1) {
      showToast('Minimal harus ada 1 paket soal!', true);
      return;
    }
    setPackets((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      return filtered.map((p, idx) => ({ ...p, packetNumber: idx + 1 }));
    });
    showToast('Paket soal telah dihapus.');
  };

  // Update specific packet
  const handleUpdatePacket = (updated: PacketData) => {
    setPackets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Apply auto-fill from Bab/Subbab & total questions
  const handleApplyAutoFill = () => {
    if (!materiAutoText.trim()) {
      showToast('Mohon masukkan daftar Bab / TP terlebih dahulu!', true);
      return;
    }

    const { packets: newPackets, recommendationRows: rows } = buildAutomaticAssessment(
      materiAutoText,
      jumlahSoalAuto
    );

    if (newPackets.length === 0) {
      showToast('Gagal memproses teks materi. Periksa format penulisan materi.', true);
      return;
    }

    setPackets(newPackets);
    setRecommendationRows(rows);
    showToast(`Berhasil menerapkan ${newPackets.length} paket soal berurutan tanpa jeda!`);
  };

  // Load sample preset
  const handleLoadPreset = (presetIdx: number) => {
    const preset = SAMPLE_PRESETS[presetIdx];
    if (!preset) return;

    setGeneralInfo({ ...preset.info });
    setMateriAutoText(preset.materiText);
    setJumlahSoalAuto(preset.jumlahSoal);

    const { packets: newPackets, recommendationRows: rows } = buildAutomaticAssessment(
      preset.materiText,
      preset.jumlahSoal
    );
    setPackets(newPackets);
    setRecommendationRows(rows);
    showToast(`Contoh ${preset.name} berhasil dimuat!`);
  };

  // Reset to initial blank state
  const handleReset = () => {
    setGeneralInfo({
      mapel: '',
      kelas: '',
      tingkatan: 'SMP / Menengah Rendah',
    });
    setPackets([createDefaultPacket(1)]);
    setMateriAutoText('');
    setJumlahSoalAuto(25);
    setRecommendationRows([]);
    setPromptOutput('');
    setAiOutput('');
    setShowOutputSection(false);
    showToast('Formulir telah di-reset ke kondisi awal.');
  };

  // Toggle Kelengkapan Output checkbox
  const handleToggleKelengkapan = (item: KelengkapanType) => {
    setKelengkapan((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // Export JSON file
  const handleExportJSON = () => {
    const exportData: ExportDataFormat = {
      mapel: generalInfo.mapel,
      kelas: generalInfo.kelas,
      tingkatan: generalInfo.tingkatan,
      packets: packets.map((p) => ({
        materi: p.materi,
        tujuan: p.tujuan,
        stimulusMode: p.stimulusMode,
        useGambar: p.useGambar,
        gaya: p.gaya,
        jumlahParagraf: p.jumlahParagraf,
        soalDetails: Object.entries(p.soalDetails)
          .filter(([, val]) => val.enabled)
          .map(([type, val]) => ({
            jenis: type,
            nomor: val.nomor,
            level: val.level,
          })),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `data_soal_${generalInfo.mapel ? generalInfo.mapel.toLowerCase().replace(/\s+/g, '_') : 'asesmen'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Data draf soal berhasil diexport ke file JSON!');
  };

  // Import JSON file
  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.mapel !== undefined) {
          setGeneralInfo({
            mapel: data.mapel || '',
            kelas: data.kelas || '',
            tingkatan: data.tingkatan || 'SMP / Menengah Rendah',
          });
        }

        if (Array.isArray(data.packets) && data.packets.length > 0) {
          const loadedPackets: PacketData[] = data.packets.map((p: any, idx: number) => {
            const defaultPacket = createDefaultPacket(idx + 1);
            const packetDetails = { ...defaultPacket.soalDetails };

            if (Array.isArray(p.soalDetails)) {
              p.soalDetails.forEach((sd: any) => {
                const type = sd.jenis as SoalType;
                if (packetDetails[type]) {
                  packetDetails[type].enabled = true;
                  packetDetails[type].level = sd.level || 'Sedang';
                  packetDetails[type].nomor = sd.nomor || '';
                }
              });
            }

            return {
              id: `imported_packet_${idx + 1}_${Date.now()}`,
              packetNumber: idx + 1,
              materi: p.materi || '',
              tujuan: p.tujuan || '',
              stimulusMode: p.stimulusMode || 'dengan',
              useGambar: !!p.useGambar,
              gaya: p.gaya || 'Berwarna',
              jumlahParagraf: p.jumlahParagraf || '1',
              soalDetails: packetDetails,
            };
          });

          setPackets(loadedPackets);
          showToast('Data berhasil diimpor dari file JSON!');
        } else {
          showToast('File JSON tidak memiliki struktur paket soal yang valid.', true);
        }
      } catch (err) {
        showToast('Format file JSON tidak valid!', true);
      }
    };
    reader.readAsText(file);
  };

  // Generate Prompt text
  const handleGeneratePrompt = () => {
    const prompt = generateAssessmentPrompt(generalInfo, packets, totalQuestions, kelengkapan);
    setPromptOutput(prompt);
    setActiveOutputTab('prompt');
    setShowOutputSection(true);

    // Smooth scroll to output
    setTimeout(() => {
      document.getElementById('output-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    showToast('Prompt AI berhasil dibuat! Siap disalin ke AI.');
  };

  // Directly Generate Assessment Questions with Gemini AI via Server SSE
  const handleGenerateAI = async () => {
    const prompt = generateAssessmentPrompt(generalInfo, packets, totalQuestions, kelengkapan);
    setPromptOutput(prompt);
    setAiOutput('');
    setIsGeneratingAI(true);
    setActiveOutputTab('aiResult');
    setShowOutputSection(true);

    setTimeout(() => {
      document.getElementById('output-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const response = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream from server');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              setIsGeneratingAI(false);
              showToast('✨ Naskah soal berhasil disusun oleh Gemini AI!');
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulated += parsed.text;
                setAiOutput(accumulated);
              } else if (parsed.error) {
                showToast(`Error AI: ${parsed.error}`, true);
              }
            } catch (e) {
              // Ignore non-JSON ping lines
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error in handleGenerateAI:', error);
      showToast(`Gagal menghasilkan naskah dengan AI: ${error?.message || error}`, true);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Copy Prompt to clipboard
  const handleCopyPrompt = () => {
    if (!promptOutput) return;
    navigator.clipboard.writeText(promptOutput).then(() => {
      setCopiedPrompt(true);
      showToast('Teks Prompt AI berhasil disalin ke clipboard!');
      setTimeout(() => setCopiedPrompt(false), 2500);
    });
  };

  // Copy AI Generated Result to clipboard
  const handleCopyAIResult = () => {
    if (!aiOutput) return;
    navigator.clipboard.writeText(aiOutput).then(() => {
      setCopiedAI(true);
      showToast('Naskah soal tersalin! Silakan paste di MS Word ("Keep Source Formatting").');
      setTimeout(() => setCopiedAI(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 antialiased selection:bg-indigo-600 selection:text-white">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        {/* Header */}
        <Header
          onLoadPreset={handleLoadPreset}
          onReset={handleReset}
          onOpenFormatModal={() => handleOpenFormatModal()}
        />

        {/* User Guide */}
        <UserGuide />

        {/* Auto-Fill Feature Section */}
        <AutoFillSection
          materiText={materiAutoText}
          setMateriText={setMateriAutoText}
          jumlahSoal={jumlahSoalAuto}
          setJumlahSoal={setJumlahSoalAuto}
          onApplyAutoFill={handleApplyAutoFill}
          recommendationRows={recommendationRows}
        />

        {/* Main Assessment Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGeneratePrompt();
          }}
        >
          {/* 01 Informasi Umum */}
          <GeneralInfoSection
            info={generalInfo}
            setInfo={setGeneralInfo}
            onExport={handleExportJSON}
            onImport={handleImportJSON}
          />

          {/* Dynamic Packets Container */}
          <div className="space-y-6">
            {packets.map((packet, idx) => (
              <PacketCard
                key={packet.id}
                packet={packet}
                index={idx}
                totalPackets={packets.length}
                onUpdate={handleUpdatePacket}
                onRemove={handleRemovePacket}
              />
            ))}
          </div>

          {/* 02 Summary & 03 Output Accessories + Trigger Buttons */}
          <div className="mt-6">
            <SummaryAndOutputOptions
              totalQuestions={totalQuestions}
              questionBreakdown={questionBreakdown}
              onAddPacket={handleAddPacket}
              kelengkapan={kelengkapan}
              onToggleKelengkapan={handleToggleKelengkapan}
              onGeneratePrompt={handleGeneratePrompt}
              onGenerateAI={handleGenerateAI}
              isGeneratingAI={isGeneratingAI}
            />
          </div>
        </form>

        {/* Output Section */}
        {showOutputSection && (
          <OutputSection
            promptText={promptOutput}
            aiGeneratedText={aiOutput}
            isGeneratingAI={isGeneratingAI}
            activeTab={activeOutputTab}
            setActiveTab={setActiveOutputTab}
            onCopyPrompt={handleCopyPrompt}
            onCopyAIResult={handleCopyAIResult}
            copiedPrompt={copiedPrompt}
            copiedAIResult={copiedAI}
            onRegenerateAI={handleGenerateAI}
            onOpenFormatModal={handleOpenFormatModal}
          />
        )}

        {/* Footer */}
        <footer className="text-center mt-14 mb-8 text-slate-500 text-xs md:text-sm">
          <p>© Developed by Zainul Bashori | 082331490484</p>
          <p className="text-slate-600 text-[11px] mt-1">
            Standar Instrumen Asesmen Pembelajaran Kurikulum Merdeka
          </p>
        </footer>
      </div>

      {/* Document Format & Download Modal (Kop, Identitas, Spasi & F4 Word/PDF Export) */}
      <DocumentFormatModal
        isOpen={isFormatModalOpen}
        onClose={() => setIsFormatModalOpen(false)}
        initialRawText={textToFormat || aiOutput || promptOutput}
        defaultMapel={generalInfo.mapel}
        defaultKelas={generalInfo.kelas}
        packets={packets}
        onShowToast={showToast}
      />

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isError={toastIsError}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
