import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  Tab,
  TabStopType,
} from 'docx';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { formatMathToCleanText } from './mathFormatter';
import { PacketData } from '../types/assessment';
import { extractAndSortQuestionNumbers } from './assessmentLogic';

export interface ExamIdentity {
  jenisUjian: string;
  mapel: string;
  kelas: string;
  semester?: string;
  hariTanggal?: string;
  tapel: string;
  waktu: string;
  petunjuk: string;
}

export interface ExamSettings {
  spacingBetween: number; // pt (e.g. 6)
  marginTop: number; // cm (e.g. 2.0)
  marginBottom: number; // cm (e.g. 2.0)
  marginLeft: number; // cm (e.g. 2.5)
  marginRight: number; // cm (e.g. 2.0)
}

export type DocSectionCategory =
  | 'soal'
  | 'kisi_kisi'
  | 'kunci_skor'
  | 'materi'
  | 'kartu_soal'
  | 'telaah'
  | 'appendix_other';

export type ExportDocumentTarget =
  | 'all'
  | 'soal'
  | 'kisi_kisi'
  | 'kunci_skor'
  | 'materi'
  | 'kartu_soal';

export interface ParsedItem {
  type: 'stimulus' | 'question' | 'table' | 'instruction';
  title?: string;
  paragraphs?: string[];
  number?: number;
  questionText?: string;
  options?: Array<{ label: string; text: string }>;
  isEssay?: boolean;
  embeddedTable?: string[][];
  rows?: string[][];
  text?: string;
  isSectionHeader?: boolean;
  imageUrl?: string;
  imageWidthPercent?: number;
  imagePrompt?: string;
  isImageStimulus?: boolean;
  section?: DocSectionCategory;
}

export interface DocxExportOptions {
  exportMode?: 'image' | 'prompt' | 'both';
  targetDocument?: ExportDocumentTarget;
  packets?: PacketData[];
}

export function cleanMarkdown(text: string): string {
  if (!text) return '';
  const withoutMarkdown = text
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^[#]{1,6}\s*/, '')
    .trim();
  // Format LaTeX codes, fractions, powers, roots, and math symbols neatly
  return formatMathToCleanText(withoutMarkdown);
}

/**
 * Ultra-robust parser tailored specifically for Kurikulum Merdeka AI outputs:
 * - Stimulus bacaan/gambar kontekstual dengan paragraf utuh
 * - Pilihan Ganda biasa (A., B., C., D., E.)
 * - PG Kompleks dengan kurung siku [A], [B], [C], [D]
 * - Tabel Benar-Salah (3 baris kognitif)
 * - Tabel Menjodohkan (4 vs 5 + pengecoh)
 * - Uraian dan Uraian Pendek
 * - Memisahkan section KELENGKAPAN TAMBAHAN / KUNCI JAWABAN / KISI-KISI agar tidak disalahartikan sebagai butir soal
 */
export function parseExamText(rawText: string): {
  items: ParsedItem[];
  warnings: string[];
} {
  if (!rawText || !rawText.trim()) {
    return { items: [], warnings: [] };
  }

  // Pre-process inline options separated on a single line if present
  let normalized = rawText.replace(/\r\n/g, '\n');

  // Split multiple choices on single line e.g. "A. x B. y" -> "A. x\nB. y"
  normalized = normalized.replace(/(\b[A-Ea-e][\.\)][^\n]*?)(?=\s+[B-Eb-e][\.\)]\s+)/g, '$1\n');
  // Split multiple PG Kompleks on single line e.g. "[A] x [B] y" -> "[A] x\n[B] y"
  normalized = normalized.replace(/(\[[A-Ea-e]\][^\n]*?)(?=\s+\[[B-Eb-e]\]\s*)/g, '$1\n');

  const lines = normalized.split('\n');
  const items: ParsedItem[] = [];
  const warnings: string[] = [];

  let currentStimulus: ParsedItem | null = null;
  let currentQuestion: ParsedItem | null = null;
  let currentSection: 'EXAM' | 'APPENDIX' = 'EXAM';
  let currentSubSection: DocSectionCategory = 'soal';
  let inTable = false;
  let tableRows: string[][] = [];
  let pendingBlankLine = false;
  const detectedNumbers: number[] = [];

  const flushTable = () => {
    if (!inTable || tableRows.length === 0) return;
    if (currentSection === 'EXAM' && currentQuestion && !currentQuestion.embeddedTable) {
      currentQuestion.embeddedTable = [...tableRows];
    } else {
      items.push({ type: 'table', rows: [...tableRows], section: currentSubSection });
    }
    tableRows = [];
    inTable = false;
  };

  const flushQuestion = () => {
    if (currentQuestion) {
      if (currentQuestion.questionText) {
        currentQuestion.questionText = cleanMarkdown(currentQuestion.questionText);
      }
      if (currentQuestion.options && currentQuestion.options.length > 0) {
        currentQuestion.options = currentQuestion.options.map((opt) => ({
          label: opt.label,
          text: cleanMarkdown(opt.text),
        }));
      }
      currentQuestion.section = 'soal';
      items.push(currentQuestion);
      currentQuestion = null;
    }
  };

  const flushStimulus = () => {
    if (currentStimulus) {
      if (currentStimulus.title) {
        currentStimulus.title = cleanMarkdown(currentStimulus.title);
      }
      if (currentStimulus.paragraphs && currentStimulus.paragraphs.length > 0) {
        currentStimulus.paragraphs = currentStimulus.paragraphs.map((p) => cleanMarkdown(p));
      }
      if (currentStimulus.imagePrompt) {
        currentStimulus.imagePrompt = cleanMarkdown(currentStimulus.imagePrompt);
      }
      currentStimulus.section = 'soal';
      items.push(currentStimulus);
      currentStimulus = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Blank line indicates natural paragraph break or section gap
    if (!trimmed) {
      pendingBlankLine = true;
      if (inTable) flushTable();
      continue;
    }

    // Ignore standalone horizontal rule lines (e.g. ---, ***, ===)
    if (/^[-*=_]{3,}$/.test(trimmed)) {
      if (inTable) flushTable();
      continue;
    }

    // Markdown Table Row check
    const isTableRow = trimmed.startsWith('|') && trimmed.endsWith('|');
    if (isTableRow) {
      // Skip markdown alignment row e.g. |---|:---|
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue;

      const cells = trimmed
        .split('|')
        .slice(1, -1)
        .map((c) => cleanMarkdown(c.trim()));

      if (!inTable) {
        inTable = true;
        tableRows = [cells];
      } else {
        tableRows.push(cells);
      }
      pendingBlankLine = false;
      continue;
    } else if (inTable) {
      flushTable();
    }

    const line = cleanMarkdown(trimmed);

    const isKisiKisi = /kisi[- ]?kisi|matriks\s+kisi/i.test(line);
    const isKartuSoal = /kartu\s+soal/i.test(line);
    const isKunci = /kunci|pedoman\s+penskoran|rubrik|pembahasan|skor\s+jawaban/i.test(line);
    const isMateri = /materi\s+esensial|rangkuman|ringkasan\s+materi|konsep\s+inti/i.test(line);
    const isTelaah = /telaah\s+soal/i.test(line);

    // Check if this line marks the start of the Appendix / Answer Key / Kisi-Kisi section
    const isAppendixHeader =
      /^(\d+[\.\)]\s*|[A-Za-z][\.\)]\s*|I+V?X?[\.\)]\s*|lampiran\s*\d*[:\s\-]*|bagian\s*\d*[:\s\-]*|kelengkapan\s+tambahan[:\s\-]*)*\s*(kunci|pedoman\s+penskoran|rubrik|kisi[- ]?kisi|materi\s+esensial|rangkuman|ringkasan\s+materi|kartu\s+soal|telaah\s+soal|kelengkapan\s+tambahan)/i.test(
        line
      ) ||
      /^---\s*(kelengkapan|kunci|kisi|materi|telaah|kartu|lampiran)/i.test(trimmed) ||
      /^#{1,6}\s*(kunci|kisi|materi|telaah|kelengkapan|kartu|lampiran|\d+[\.\)]\s*kunci|\d+[\.\)]\s*kisi)/i.test(trimmed);

    if (isAppendixHeader) {
      flushTable();
      flushQuestion();
      flushStimulus();
      currentSection = 'APPENDIX';
      if (isKisiKisi) currentSubSection = 'kisi_kisi';
      else if (isKartuSoal) currentSubSection = 'kartu_soal';
      else if (isKunci) currentSubSection = 'kunci_skor';
      else if (isMateri) currentSubSection = 'materi';
      else if (isTelaah) currentSubSection = 'telaah';
      else currentSubSection = 'appendix_other';

      items.push({
        type: 'instruction',
        text: line.toUpperCase(),
        isSectionHeader: true,
        section: currentSubSection,
      });
      pendingBlankLine = false;
      continue;
    }

    // When inside the Appendix section (Kunci Jawaban, Kisi-Kisi, etc.)
    if (currentSection === 'APPENDIX') {
      const isSubHeader =
        /^(kunci|pedoman\s+penskoran|kisi[- ]?kisi|rubrik|materi\s+esensial|rangkuman|telaah\s+soal|kartu\s+soal)/i.test(
          line
        ) || /^---/.test(trimmed) || /^#{1,6}\s*/.test(trimmed);

      if (isKisiKisi) currentSubSection = 'kisi_kisi';
      else if (isKartuSoal) currentSubSection = 'kartu_soal';
      else if (isKunci) currentSubSection = 'kunci_skor';
      else if (isMateri) currentSubSection = 'materi';
      else if (isTelaah) currentSubSection = 'telaah';

      // Gabungkan kunci jawaban jika opsi PG Kompleks (misal B atau [B]) terpecah ke baris berikutnya
      if (currentSubSection === 'kunci_skor' && !isSubHeader && items.length > 0) {
        const lastItem = items[items.length - 1];
        const isNewNumber = /^(\d+[\.\)]|nomor\s*\d+|no\s*\d+)/i.test(trimmed);
        const isOptContinuation =
          !isNewNumber &&
          /^(?:[-*•]\s*)?(\[?[A-Ea-e]\]?[\.\):]?|\b(?:dan|atau)\s+\[?[A-Ea-e]\]?)/i.test(trimmed);

        if (
          lastItem.section === 'kunci_skor' &&
          lastItem.type === 'instruction' &&
          !lastItem.isSectionHeader &&
          isOptContinuation &&
          lastItem.text
        ) {
          const lastText = lastItem.text.trim();
          if (/(?:\[?[A-Ea-e]\]?|kunci\s*:?\s*\[?[A-Ea-e]\]?)$/i.test(lastText)) {
            lastItem.text = `${lastText} dan ${cleanMarkdown(line)}`;
          } else {
            lastItem.text = `${lastText}, ${cleanMarkdown(line)}`;
          }
          pendingBlankLine = false;
          continue;
        }
      }

      items.push({
        type: 'instruction',
        text: line,
        isSectionHeader: isSubHeader,
        section: currentSubSection,
      });
      pendingBlankLine = false;
      continue;
    }

    // --- EXAM SECTION PROCESSING ---

    // 1. Stimulus Introduction Check (e.g. "Bacalah artikel...", "Cermati gambar...", "Stimulus 1")
    const isStimulusIntro =
      /^(bacalah\s+(artikel|teks|wacana|bacaan|penggalan|kutipan|paragraf)|cermati\s+(gambar|infografis|diagram|tabel|grafik|bagan|foto|ilustrasi|peta|skema|teks|artikel|wacana|bacaan|paragraf)|perhatikan\s+(gambar|infografis|diagram|tabel|grafik|bagan|foto|ilustrasi|peta|skema|teks|artikel|wacana|bacaan|paragraf)|stimulus\s*\d*|wacana\s*\d*|\[paket\s*\d+\])/i.test(
        line
      );

    if (isStimulusIntro) {
      flushTable();
      flushQuestion();
      flushStimulus();
      const hasImageKeyword = /(gambar|infografis|diagram|ilustrasi|grafik|bagan|foto|peta|skema)/i.test(line);
      const isPureTextReading = /^(bacalah\s+(artikel|teks|wacana|bacaan|penggalan|kutipan|paragraf))/i.test(line) && !hasImageKeyword;
      const isImg = hasImageKeyword && !isPureTextReading;

      // Auto-correct any inverted or unsorted question numbers in stimulus title (e.g. "nomor 13, 12!" -> "nomor 12, 13!")
      const sanitizedTitle = line.replace(
        /(menjawab\s+soal\s+nomor\s+)([\d\s,–\-dan]+)(!|\.|\?|$)/i,
        (match, prefix, numPart, punct) => {
          const numbers = extractAndSortQuestionNumbers([numPart]);
          if (numbers.length > 1) {
            return `${prefix}${numbers.join(', ')}${punct}`;
          }
          return match;
        }
      );

      currentStimulus = {
        type: 'stimulus',
        title: sanitizedTitle,
        paragraphs: [],
        isImageStimulus: isImg,
      };
      pendingBlankLine = false;
      continue;
    }

    // 2. Question Number Check (e.g. "1. ", "2. ", "1) ")
    const qMatch = line.match(/^(\d+)[\.\)]\s+(.*)$/);
    if (qMatch) {
      flushTable();
      flushQuestion();
      flushStimulus();

      const qNum = parseInt(qMatch[1], 10);
      detectedNumbers.push(qNum);

      currentQuestion = {
        type: 'question',
        number: qNum,
        questionText: qMatch[2].trim(),
        options: [],
        isEssay: true,
      };
      pendingBlankLine = false;
      continue;
    }

    // 3. Option Check for Current Question
    if (currentQuestion) {
      // PG Kompleks format: [A] Text, [ ] A. Text, [ ] [A] Text, [x] A. Text
      const pgkMatch =
        line.match(/^(?:\[[\sxX]?\]\s*)?\[([A-Ea-e])\]\s*(.*)$/) ||
        line.match(/^\[[\sxX]?\]\s*([A-Ea-e])[\.\)]?\s+(.*)$/);
      if (pgkMatch) {
        currentQuestion.isEssay = false;
        currentQuestion.options?.push({
          label: `[${pgkMatch[1].toUpperCase()}]`,
          text: pgkMatch[2].trim(),
        });
        pendingBlankLine = false;
        continue;
      }

      // Standard Pilihan Ganda format: A. Text or A) Text
      const pgMatch = line.match(/^([A-Ea-e])[\.\)]\s+(.*)$/);
      if (pgMatch) {
        currentQuestion.isEssay = false;
        currentQuestion.options?.push({
          label: `${pgMatch[1].toUpperCase()}.`,
          text: pgMatch[2].trim(),
        });
        pendingBlankLine = false;
        continue;
      }
    }

    // 4. Continuation Text Handling
    if (currentQuestion) {
      if (currentQuestion.options && currentQuestion.options.length > 0) {
        // Line belongs to previous multiple choice option
        const lastOpt = currentQuestion.options[currentQuestion.options.length - 1];
        lastOpt.text += ' ' + line;
      } else {
        // Line belongs to question stem
        currentQuestion.questionText = (currentQuestion.questionText ? currentQuestion.questionText + ' ' : '') + line;
      }
    } else if (currentStimulus) {
      if (!currentStimulus.paragraphs) currentStimulus.paragraphs = [];

      // Check if this line is an image prompt description e.g. [Deskripsi Gambar: ...] or [Gambar: ...]
      const imgPromptMatch = line.match(
        /^(\[|\()?\s*(?:deskripsi|prompt|instruksi|keterangan)?\s*(?:gambar|diagram|infografis|ilustrasi|visual)\s*:?\s*([^\]\)]+)(\]|\))?$/i
      );

      if (imgPromptMatch && imgPromptMatch[2]) {
        currentStimulus.isImageStimulus = true;
        currentStimulus.imagePrompt = cleanMarkdown(imgPromptMatch[2].trim());
      } else if (currentStimulus.isImageStimulus && !currentStimulus.imagePrompt && (line.startsWith('[') || line.startsWith('('))) {
        currentStimulus.imagePrompt = cleanMarkdown(line.replace(/^[\[\(]/, '').replace(/[\]\)]$/, '').trim());
      } else if (currentStimulus.isImageStimulus && !currentStimulus.imagePrompt && currentStimulus.paragraphs.length === 0) {
        currentStimulus.imagePrompt = cleanMarkdown(line);
      }

      if (pendingBlankLine || currentStimulus.paragraphs.length === 0) {
        currentStimulus.paragraphs.push(line);
      } else {
        currentStimulus.paragraphs[currentStimulus.paragraphs.length - 1] += ' ' + line;
      }
    } else {
      items.push({
        type: 'instruction',
        text: cleanMarkdown(line),
        section: currentSubSection,
      });
    }

    pendingBlankLine = false;
  }

  flushTable();
  flushQuestion();
  flushStimulus();

  // Validate number sequence continuity
  if (detectedNumbers.length > 0) {
    for (let k = 0; k < detectedNumbers.length; k++) {
      const expected = k + 1;
      if (detectedNumbers[k] !== expected) {
        warnings.push(
          `Urutan nomor soal terdeteksi melompat (ditemukan nomor ${detectedNumbers[k]} di posisi ke-${expected}).`
        );
        break;
      }
    }
  }

  return { items, warnings };
}

/**
 * Build Microsoft Word (.docx) Blob with F4 paper dimensions (210mm x 330mm)
 */
export async function buildExamDocxBlob(
  parsedItems: ParsedItem[],
  identity: ExamIdentity,
  settings: ExamSettings,
  kopBase64: string | null = null,
  kopWidthPercent: number = 100,
  options?: DocxExportOptions
): Promise<{ blob: Blob; fileName: string }> {
  const target = options?.targetDocument || 'all';
  const mode = options?.exportMode || 'image';
  const docChildren: any[] = [];

  // 1. KOP SURAT IMAGE OR FALLBACK
  if (kopBase64 && kopBase64.includes(',')) {
    try {
      const base64Data = kopBase64.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const targetWidth = Math.round(580 * (kopWidthPercent / 100));
      const imgType = kopBase64.includes('image/png') ? 'png' : 'jpg';
      const kopImageRun = new ImageRun({
        data: bytes,
        transformation: {
          width: targetWidth,
          height: Math.round(targetWidth * 0.22),
        },
        type: imgType as any,
      });

      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 120 },
          children: [kopImageRun],
        })
      );
    } catch (e) {
      console.warn('Gagal menyematkan gambar kop, beralih ke kop teks:', e);
      addFallbackHeader(docChildren);
    }
  } else {
    addFallbackHeader(docChildren);
  }

  function addFallbackHeader(arr: any[]) {
    arr.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0, line: 240 },
        children: [
          new TextRun({
            text: 'PEMERINTAH PROVINSI / KABUPATEN',
            bold: true,
            font: 'Times New Roman',
            size: 22,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0, line: 240 },
        children: [
          new TextRun({
            text: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
            bold: true,
            font: 'Times New Roman',
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0, line: 240 },
        children: [
          new TextRun({
            text: 'SEKOLAH MENENGAH PERTAMA / ATAS',
            bold: true,
            font: 'Times New Roman',
            size: 26,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120, line: 240 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
        },
        children: [
          new TextRun({
            text: 'Jl. Pendidikan No. 123, Telepon (021) 1234567, Pos 12345',
            italics: true,
            font: 'Times New Roman',
            size: 18,
          }),
        ],
      })
    );
  }

  // 2. JUDUL DAN TAHUN PELAJARAN SESUAI TARGET
  let jenisUjianText = (identity.jenisUjian || 'UJIAN SEKOLAH').toUpperCase();
  if (target === 'soal') {
    jenisUjianText = `${(identity.jenisUjian || 'UJIAN SEKOLAH').toUpperCase()} - NASKAH SOAL`;
  } else if (target === 'kisi_kisi') {
    jenisUjianText = 'KISI-KISI PENULISAN SOAL ASESMEN';
  } else if (target === 'kunci_skor') {
    jenisUjianText = 'KUNCI JAWABAN DAN PEDOMAN PENSKORAN';
  } else if (target === 'materi') {
    jenisUjianText = 'RANGKUMAN MATERI ESENSIAL';
  } else if (target === 'kartu_soal') {
    jenisUjianText = 'KARTU SOAL ASESMEN STANDAR RESMI';
  }

  const tapelText = identity.tapel
    ? `TAHUN PELAJARAN ${identity.tapel.replace(/^tahun\s+pelajaran\s+/i, '')}`.toUpperCase()
    : 'TAHUN PELAJARAN 2026/2027';

  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 20, line: 240 },
      children: [
        new TextRun({
          text: jenisUjianText,
          bold: true,
          font: 'Times New Roman',
          size: 26,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120, line: 240 },
      children: [
        new TextRun({
          text: tapelText,
          bold: true,
          font: 'Times New Roman',
          size: 22,
        }),
      ],
    })
  );

  // 3. IDENTITAS UJIAN (100% Borderless Table - Tampilan Bersih Tanpa Garis Tabel di Word)
  const noneBorder = {
    style: BorderStyle.NONE,
    size: 0,
    color: 'FFFFFF',
  };

  const identityTableBorders = {
    top: noneBorder,
    bottom: noneBorder,
    left: noneBorder,
    right: noneBorder,
    insideHorizontal: noneBorder,
    insideVertical: noneBorder,
  };

  const identityCellBorders = {
    top: noneBorder,
    bottom: noneBorder,
    left: noneBorder,
    right: noneBorder,
  };

  const createIdentityCell = (text: string, widthPercent: number, isBold = false) =>
    new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      borders: identityCellBorders,
      margins: { top: 20, bottom: 20, left: 30, right: 30 },
      children: [
        new Paragraph({
          spacing: { before: 0, after: 0, line: 240 },
          children: [
            new TextRun({
              text: text || '-',
              bold: isBold,
              font: 'Times New Roman',
              size: 22,
            }),
          ],
        }),
      ],
    });

  const identityTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: identityTableBorders,
    rows: [
      new TableRow({
        children: [
          createIdentityCell('Mata Pelajaran', 20),
          createIdentityCell(':', 3),
          createIdentityCell(identity.mapel, 37),
          createIdentityCell('Kelas / Fase', 18),
          createIdentityCell(':', 3),
          createIdentityCell(identity.kelas, 19),
        ],
      }),
      new TableRow({
        children: [
          createIdentityCell('Hari, Tanggal', 20),
          createIdentityCell(':', 3),
          createIdentityCell(identity.hariTanggal || identity.semester || '-', 37),
          createIdentityCell('Alokasi Waktu', 18),
          createIdentityCell(':', 3),
          createIdentityCell(identity.waktu, 19),
        ],
      }),
    ],
  });

  docChildren.push(identityTable);

  // 4. PETUNJUK PENGERJAAN (Hanya untuk Naskah Soal & Dokumen Lengkap)
  if ((target === 'soal' || target === 'all') && identity.petunjuk && identity.petunjuk.trim()) {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120, line: 240 },
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
        },
        children: [
          new TextRun({
            text: identity.petunjuk,
            bold: true,
            font: 'Times New Roman',
            size: 21,
          }),
        ],
      })
    );
  }

  // 5. QUESTIONS AND ITEMS
  const borderSingle = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const cellBorders = {
    top: borderSingle,
    bottom: borderSingle,
    left: borderSingle,
    right: borderSingle,
  };

  const spacingBeforeTwips = Math.round(settings.spacingBetween * 20); // 1 pt = 20 twips

  if (target === 'kartu_soal') {
    renderKartuSoalCards(docChildren, parsedItems, identity, cellBorders, options);
  } else if (target === 'kisi_kisi') {
    const kisiItems = parsedItems.filter((it) => it.section === 'kisi_kisi');
    if (kisiItems.length > 0) {
      renderGenericItems(kisiItems, docChildren, options, spacingBeforeTwips, cellBorders);
    } else {
      renderFallbackKisiKisi(docChildren, parsedItems, identity, cellBorders, options);
    }
  } else if (target === 'kunci_skor') {
    const kunciItems = parsedItems.filter((it) => it.section === 'kunci_skor');
    if (kunciItems.length > 0) {
      renderGenericItems(kunciItems, docChildren, options, spacingBeforeTwips, cellBorders);
    } else {
      renderFallbackKunciSkor(docChildren, parsedItems, identity, cellBorders);
    }
  } else if (target === 'materi') {
    renderFallbackMateriEsensial(docChildren, parsedItems, identity, cellBorders, options);
  } else {
    // target === 'soal' or 'all'
    const itemsToRender =
      target === 'soal'
        ? parsedItems.filter((it) => !it.section || it.section === 'soal')
        : parsedItems;
    renderGenericItems(itemsToRender, docChildren, options, spacingBeforeTwips, cellBorders);

    // If target is 'all' and no appendix items were parsed, append fallbacks so the complete doc is 100% full
    if (target === 'all') {
      const hasKunci = parsedItems.some((it) => it.section === 'kunci_skor');
      const hasKisi = parsedItems.some((it) => it.section === 'kisi_kisi');
      const hasMateri = parsedItems.some((it) => it.section === 'materi');

      if (!hasKunci) {
        renderFallbackKunciSkor(docChildren, parsedItems, identity, cellBorders);
      }
      if (!hasKisi) {
        renderFallbackKisiKisi(docChildren, parsedItems, identity, cellBorders, options);
      }
      if (!hasMateri) {
        renderFallbackMateriEsensial(docChildren, parsedItems, identity, cellBorders, options);
      }
    }
  }

  // F4 section packaging (210mm x 330mm = 11906 x 18709 twips)
  const doc = new Document({
    creator: 'Generator AI - Soal Zainul Bashori',
    description: 'Naskah Soal Ujian Resmi Ukuran F4 Standar Kurikulum Merdeka',
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 18709,
            },
            margin: {
              top: Math.round(settings.marginTop * 567),
              bottom: Math.round(settings.marginBottom * 567),
              left: Math.round(settings.marginLeft * 567),
              right: Math.round(settings.marginRight * 567),
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const modeSuffix =
    options?.exportMode === 'prompt'
      ? '_Prompt_Gambar'
      : options?.exportMode === 'both'
      ? '_Lengkap_Gambar'
      : '';

  const safeMapel = (identity.mapel || 'Ujian').replace(/[^a-zA-Z0-9]/g, '_');
  const safeKelas = (identity.kelas || '').replace(/[^a-zA-Z0-9]/g, '_');

  let prefix = 'Soal_';
  if (target === 'soal') prefix = 'Naskah_Soal_';
  else if (target === 'kisi_kisi') prefix = 'Kisi_Kisi_';
  else if (target === 'kunci_skor') prefix = 'Kunci_dan_Rubrik_';
  else if (target === 'materi') prefix = 'Materi_Esensial_';
  else if (target === 'kartu_soal') prefix = 'Kartu_Soal_';
  else if (target === 'all') prefix = 'Naskah_Lengkap_';

  const fileName = `${prefix}${safeMapel}${safeKelas ? '_' + safeKelas : ''}${modeSuffix}_F4.docx`;
  return { blob, fileName };
}

/**
 * Export specific document to Word (.docx) and trigger download
 */
export async function exportExamToDOCX(
  parsedItems: ParsedItem[],
  identity: ExamIdentity,
  settings: ExamSettings,
  kopBase64: string | null = null,
  kopWidthPercent: number = 100,
  options?: DocxExportOptions
): Promise<string> {
  const { blob, fileName } = await buildExamDocxBlob(
    parsedItems,
    identity,
    settings,
    kopBase64,
    kopWidthPercent,
    options
  );
  saveAs(blob, fileName);
  return fileName;
}

/**
 * Export all separated assessment files as a clean 1-click ZIP package
 */
export async function exportSeparatedPackageZip(
  parsedItems: ParsedItem[],
  identity: ExamIdentity,
  settings: ExamSettings,
  kopBase64: string | null = null,
  kopWidthPercent: number = 100,
  options?: DocxExportOptions
): Promise<string> {
  const zip = new JSZip();
  const safeMapel = (identity.mapel || 'Ujian').replace(/[^a-zA-Z0-9]/g, '_');
  const safeKelas = (identity.kelas || '').replace(/[^a-zA-Z0-9]/g, '_');

  // 1. Naskah Soal Siswa
  const soalDoc = await buildExamDocxBlob(parsedItems, identity, settings, kopBase64, kopWidthPercent, {
    ...options,
    targetDocument: 'soal',
  });
  zip.file(`1_${soalDoc.fileName}`, soalDoc.blob);

  // 2. Kunci & Rubrik Skor (Selalu disertakan, tidak akan pernah kosong)
  const kunciDoc = await buildExamDocxBlob(parsedItems, identity, settings, kopBase64, kopWidthPercent, {
    ...options,
    targetDocument: 'kunci_skor',
  });
  zip.file(`2_${kunciDoc.fileName}`, kunciDoc.blob);

  // 3. Kisi-Kisi Asesmen (Selalu disertakan, matriks lengkap Kurikulum Merdeka)
  const kisiDoc = await buildExamDocxBlob(parsedItems, identity, settings, kopBase64, kopWidthPercent, {
    ...options,
    targetDocument: 'kisi_kisi',
  });
  zip.file(`3_${kisiDoc.fileName}`, kisiDoc.blob);

  // 4. Kartu Soal Resmi (Selalu disertakan, kartu resmi per butir soal)
  const kartuDoc = await buildExamDocxBlob(parsedItems, identity, settings, kopBase64, kopWidthPercent, {
    ...options,
    targetDocument: 'kartu_soal',
  });
  zip.file(`4_${kartuDoc.fileName}`, kartuDoc.blob);

  // 5. Materi Esensial (Selalu disertakan, rangkuman esensial pendukung)
  const materiDoc = await buildExamDocxBlob(parsedItems, identity, settings, kopBase64, kopWidthPercent, {
    ...options,
    targetDocument: 'materi',
  });
  zip.file(`5_${materiDoc.fileName}`, materiDoc.blob);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipFileName = `Paket_Asesmen_${safeMapel}${safeKelas ? '_' + safeKelas : ''}_Terpisah.zip`;
  saveAs(zipBlob, zipFileName);
  return zipFileName;
}

export interface ResolvedQuestionCapaianMateri {
  capaian: string;
  tujuan: string;
  materi: string;
  uraianMateri: string;
  level?: string;
  jenisSoal?: string;
}

function extractCoreTopic(text: string, defaultMapel = 'Mata Pelajaran'): string {
  if (!text) return defaultMapel;
  const clean = cleanMarkdown(text);
  if (clean.includes('/')) {
    const parts = clean.split('/');
    return parts[parts.length - 1].trim();
  }
  if (clean.includes(':')) {
    const parts = clean.split(':');
    return parts[parts.length - 1].trim();
  }
  return clean.length > 50 ? clean.slice(0, 47) + '...' : clean;
}

/**
 * Normalizes question types into strictly ONE unambiguous canonical type:
 * 'Pilihan Ganda' | 'PG Kompleks' | 'Menjodohkan' | 'Benar-Salah' | 'Uraian'
 * Eliminates compound slashes (e.g. 'Isian / Tabel', 'PG Kompleks (PGK)', 'Uraian / Uraian Singkat', 'Benar - Salah').
 */
export function normalizeQuestionType(
  rawType?: string,
  question?: ParsedItem
): 'Pilihan Ganda' | 'PG Kompleks' | 'Menjodohkan' | 'Benar-Salah' | 'Uraian' {
  // If a question object is provided, prioritize its structural characteristics
  if (question) {
    if (question.options && question.options.length > 0) {
      const qText = (question.questionText || '').toLowerCase();
      const hasPgkOption = question.options.some((o) => o.label.includes('['));
      const hasPgkKeyword =
        qText.includes('kompleks') ||
        qText.includes('lebih dari satu') ||
        qText.includes('dua atau tiga') ||
        qText.includes('pilihlah dua') ||
        qText.includes('pilihlah 2') ||
        qText.includes('pilihlah 3') ||
        qText.includes('pilih 2') ||
        qText.includes('pilih 3');
      const rawIsPgk = !!rawType && /kompleks|pgk/i.test(rawType);

      if (hasPgkOption || hasPgkKeyword || rawIsPgk) {
        return 'PG Kompleks';
      }
      return 'Pilihan Ganda';
    }

    if (question.embeddedTable && question.embeddedTable.length > 0) {
      const qText = (question.questionText || '').toLowerCase();
      const tableContent = question.embeddedTable.map((r) => r.join(' ')).join(' ').toLowerCase();
      const combined = `${qText} ${tableContent}`;

      if (combined.includes('benar') || combined.includes('salah') || (rawType && /benar|salah|b\/s/i.test(rawType))) {
        return 'Benar-Salah';
      }
      if (combined.includes('jodoh') || combined.includes('pasang') || (rawType && /jodoh/i.test(rawType))) {
        return 'Menjodohkan';
      }
      return 'Uraian';
    }

    // Question has no options and no embedded table
    if (rawType) {
      const clean = rawType.toLowerCase().trim();
      if (clean.includes('kompleks') || clean.includes('pgk')) return 'PG Kompleks';
      if (clean.includes('ganda') || /^pg\b/.test(clean)) return 'Pilihan Ganda';
      if (clean.includes('jodoh') || clean.includes('pasang')) return 'Menjodohkan';
      if (clean.includes('benar') || clean.includes('salah') || clean.includes('b/s')) return 'Benar-Salah';
      return 'Uraian';
    }
    return 'Uraian';
  }

  // When no question object is provided, parse rawType string
  if (rawType) {
    const clean = rawType.toLowerCase().trim();
    if (clean.includes('kompleks') || clean.includes('pgk')) return 'PG Kompleks';
    if (clean.includes('ganda') || /^pg\b/.test(clean)) return 'Pilihan Ganda';
    if (clean.includes('jodoh') || clean.includes('pasang')) return 'Menjodohkan';
    if (clean.includes('benar') || clean.includes('salah') || clean.includes('b/s')) return 'Benar-Salah';
    return 'Uraian';
  }

  return 'Uraian';
}

/**
 * Resolves accurate Capaian Pembelajaran, Tujuan Pembelajaran, Materi Pokok, and Uraian Materi for a specific question number,
 * prioritizing the AI's actual generated thoughts from the exam and appendix tables over static templates.
 */
export function resolveQuestionCapaianAndMateri(
  qNum: number,
  packets?: PacketData[],
  precedingStimulus?: ParsedItem | null,
  defaultMapel: string = 'Mata Pelajaran',
  allParsedItems?: ParsedItem[],
  question?: ParsedItem
): ResolvedQuestionCapaianMateri {
  // 1. HIGHEST PRIORITY: Extract directly from the AI-generated "TABEL MATERI ESENSIAL" if present
  if (allParsedItems && allParsedItems.length > 0) {
    const materiTables = allParsedItems.filter(
      (it) => it.type === 'table' && it.rows && it.rows.length > 1 && (it.section === 'materi' || it.section === 'appendix_other' || !it.section)
    );

    for (const mTable of materiTables) {
      if (!mTable.rows) continue;
      const headerStr = (mTable.rows[0] || []).join(' ').toLowerCase();
      const isMateriTable =
        (headerStr.includes('capaian') || headerStr.includes('tujuan') || headerStr.includes('uraian')) &&
        (headerStr.includes('materi') || headerStr.includes('esensial') || headerStr.includes('soal'));

      if (isMateriTable) {
        for (let r = 1; r < mTable.rows.length; r++) {
          const row = mTable.rows[r];
          if (!row || row.length === 0) continue;
          const firstCell = cleanMarkdown(row[0] || '').trim();
          const numMatch = firstCell.match(/^(\d+)/);
          const rowNum = numMatch ? parseInt(numMatch[1], 10) : r;

          if (rowNum === qNum) {
            let cp = '';
            let tp = '';
            let uraian = '';
            let jenis = '';

            if (row.length >= 5) {
              cp = cleanMarkdown(row[1] || '');
              tp = cleanMarkdown(row[2] || '');
              uraian = cleanMarkdown(row[3] || '');
              jenis = cleanMarkdown(row[4] || '');
            } else if (row.length === 4) {
              cp = cleanMarkdown(row[1] || '');
              tp = cleanMarkdown(row[2] || '');
              uraian = cleanMarkdown(row[3] || '');
            } else if (row.length === 3) {
              cp = cleanMarkdown(row[1] || '');
              uraian = cleanMarkdown(row[2] || '');
              tp = cp;
            }

            if (cp || tp || uraian) {
              return {
                materi: extractCoreTopic(cp || uraian || defaultMapel, defaultMapel),
                capaian: cp || `Menganalisis prinsip dan konsep esensial pada butir soal nomor ${qNum}.`,
                tujuan: tp || `Peserta didik mampu menyelesaikan dan menganalisis permasalahan butir nomor ${qNum}.`,
                uraianMateri: uraian || `${cp || 'Konsep Materi'}: Pembahasan mendalam butir soal nomor ${qNum}.`,
                level: 'L2 / Sedang',
                jenisSoal: normalizeQuestionType(jenis, question),
              };
            }
          }
        }
      }
    }

    // 2. SECOND PRIORITY: Extract from AI-generated "KISI-KISI" table in parsedItems!
    // In Kisi-Kisi, the AI produces columns: | No | Capaian Pembelajaran / Materi Pokok | Indikator Soal | Level Kognitif | Bentuk Soal | No Soal |
    const kisiTables = allParsedItems.filter(
      (it) => it.type === 'table' && it.rows && it.rows.length > 1 && (it.section === 'kisi_kisi' || it.section === 'appendix_other' || !it.section)
    );

    for (const kTable of kisiTables) {
      if (!kTable.rows) continue;
      const headerStr = (kTable.rows[0] || []).join(' ').toLowerCase();
      if (!headerStr.includes('indikator') && !headerStr.includes('kisi')) continue;

      for (let r = 1; r < kTable.rows.length; r++) {
        const row = kTable.rows[r];
        if (!row || row.length === 0) continue;
        const firstCol = cleanMarkdown(row[0] || '').trim();
        const lastCol = cleanMarkdown(row[row.length - 1] || '').trim();
        const numMatch = firstCol.match(/^(\d+)/) || lastCol.match(/^(\d+)/);
        const rowNum = numMatch ? parseInt(numMatch[1], 10) : r;

        if (rowNum === qNum) {
          const aiCP = cleanMarkdown(row[1] || '');
          const aiIndikator = cleanMarkdown(row[2] || '');
          const aiLevel = cleanMarkdown(row[3] || '');
          const aiBentuk = cleanMarkdown(row[4] || '');

          if (aiCP && aiIndikator) {
            const coreTopic = extractCoreTopic(aiCP, defaultMapel);
            let dynamicExcerpt = '';
            if (precedingStimulus?.paragraphs && precedingStimulus.paragraphs.length > 0) {
              const pClean = cleanMarkdown(precedingStimulus.paragraphs[0])
                .replace(/^(bacalah|cermati|perhatikan)\s+.*?menjawab\s+soal\s*nomor\s*[\d,\s–-]+\s*!?/i, '')
                .trim();
              if (pClean.length > 15) {
                dynamicExcerpt = pClean.length > 150 ? pClean.slice(0, 147) + '...' : pClean;
              }
            }
            if (!dynamicExcerpt && question?.questionText) {
              dynamicExcerpt = cleanMarkdown(question.questionText).slice(0, 140);
            }

            return {
              materi: coreTopic,
              capaian: aiCP,
              tujuan: aiIndikator.toLowerCase().startsWith('disajikan')
                ? `Peserta didik mampu ${aiIndikator.replace(/^disajikan\s+.*?,?\s*(peserta\s+didik\s+mampu\s+)?/i, '')}`
                : aiIndikator,
              uraianMateri: dynamicExcerpt
                ? `${coreTopic}: ${dynamicExcerpt}`
                : `Konsep kunci dan telaah pemecahan masalah materi ${aiCP}.`,
              level: aiLevel,
              jenisSoal: normalizeQuestionType(aiBentuk, question),
            };
          }
        }
      }
    }
  }

  // 3. THIRD PRIORITY: Extract from structured packets if available
  if (packets && packets.length > 0) {
    for (const packet of packets) {
      for (const [formTypeKey, item] of Object.entries(packet.soalDetails)) {
        if (item.enabled && item.nomor) {
          const parts = item.nomor.split(/[ ,;]+/);
          for (const part of parts) {
            let matches = false;
            if (part.includes('-')) {
              const bounds = part.split('-').map((n) => parseInt(n.trim(), 10));
              if (bounds.length === 2 && !isNaN(bounds[0]) && !isNaN(bounds[1])) {
                const min = Math.min(bounds[0], bounds[1]);
                const max = Math.max(bounds[0], bounds[1]);
                if (qNum >= min && qNum <= max) matches = true;
              }
            } else if (parseInt(part, 10) === qNum) {
              matches = true;
            }

            if (matches) {
              const mat = packet.materi.trim() || defaultMapel;
              const subTopic = mat;

              let dynamicExcerpt = '';
              if (precedingStimulus?.paragraphs && precedingStimulus.paragraphs.length > 0) {
                const rawP = cleanMarkdown(precedingStimulus.paragraphs[0])
                  .replace(/^(bacalah|cermati|perhatikan)\s+.*?menjawab\s+soal\s*nomor\s*[\d,\s–-]+\s*!?/i, '')
                  .trim();
                if (rawP.length > 10) {
                  dynamicExcerpt = rawP.length > 150 ? rawP.slice(0, 147) + '...' : rawP;
                }
              }
              if (!dynamicExcerpt && question?.questionText) {
                dynamicExcerpt = cleanMarkdown(question.questionText).slice(0, 140);
              }

              const cp = `Menganalisis prinsip, fakta ilmiah, dan penerapan konsep ${subTopic} (${mat}).`;
              const tp = question?.questionText
                ? `Peserta didik mampu menyelesaikan butir soal: "${cleanMarkdown(question.questionText).slice(0, 90)}..."`
                : packet.tujuan.trim() || `Peserta didik mampu menganalisis konsep pokok materi ${subTopic}.`;
              const uraian = dynamicExcerpt
                ? `${subTopic}: ${dynamicExcerpt}`
                : `Pembahasan prinsip esensial, fakta kontekstual, dan analisis konsep ${subTopic}.`;

              return {
                materi: subTopic,
                tujuan: tp,
                capaian: cp,
                uraianMateri: uraian,
                level: item.level,
                jenisSoal: normalizeQuestionType(formTypeKey, question),
              };
            }
          }
        }
      }
    }
  }

  // 4. FOURTH PRIORITY: Contextual extraction from stimulus and question text
  let extractedMateri = '';
  if (precedingStimulus) {
    if (precedingStimulus.title) {
      const stripped = cleanMarkdown(precedingStimulus.title)
        .replace(
          /^(bacalah|cermati|perhatikan)\s+(artikel|gambar|diagram|teks|infografis|wacana|bacaan|tabel|grafik|bagan|ilustrasi)\s+.*?(menjawab|untuk)\s+soal\s*nomor\s*[\d,\s–-]+\s*!?/i,
          ''
        )
        .trim();
      if (stripped.length > 3) {
        extractedMateri = stripped;
      }
    }

    if (!extractedMateri && precedingStimulus.imagePrompt) {
      extractedMateri = cleanMarkdown(precedingStimulus.imagePrompt)
        .replace(/^(diagram|ilustrasi|grafik)\s+/i, '')
        .trim();
    }

    if (!extractedMateri && precedingStimulus.paragraphs && precedingStimulus.paragraphs.length > 0) {
      const firstLine = cleanMarkdown(precedingStimulus.paragraphs[0]);
      if (firstLine.length > 5 && firstLine.length < 80) {
        extractedMateri = firstLine;
      }
    }
  }

  if (!extractedMateri) {
    extractedMateri = defaultMapel;
  }

  let dynamicExcerpt = '';
  if (precedingStimulus?.paragraphs && precedingStimulus.paragraphs.length > 0) {
    const rawP = cleanMarkdown(precedingStimulus.paragraphs[0])
      .replace(/^(bacalah|cermati|perhatikan)\s+.*?menjawab\s+soal\s*nomor\s*[\d,\s–-]+\s*!?/i, '')
      .trim();
    if (rawP.length > 10) {
      dynamicExcerpt = rawP.length > 150 ? rawP.slice(0, 147) + '...' : rawP;
    }
  }
  if (!dynamicExcerpt && question?.questionText) {
    dynamicExcerpt = cleanMarkdown(question.questionText).slice(0, 140);
  }

  const cp = `Memahami konsep inti dan menganalisis fenomena kontekstual materi ${extractedMateri}.`;
  const tp = question?.questionText
    ? `Peserta didik mampu menganalisis stimulus dan menuntaskan butir soal: "${cleanMarkdown(question.questionText).slice(0, 90)}..."`
    : `Peserta didik mampu menganalisis permasalahan kontekstual materi ${extractedMateri}.`;
  const uraian = dynamicExcerpt
    ? `${extractedMateri}: ${dynamicExcerpt}`
    : `Pembahasan konsep esensial dan pokok bahasan materi ${extractedMateri}.`;

  return {
    materi: extractedMateri,
    tujuan: tp,
    capaian: cp,
    uraianMateri: uraian,
    level: question?.options ? 'L2 / Sedang' : 'L3 / Penalaran',
    jenisSoal: normalizeQuestionType(undefined, question),
  };
}

/**
 * Resolves answer key text and scoring rubric for a specific question number,
 * with special attention to PG Kompleks (multi-choice correct answers and proportional scoring).
 */
export function extractAnswerKeyForQuestion(
  qNum: number,
  kunciItems: ParsedItem[],
  bentukSoal: string,
  materi: string,
  allParsedItems?: ParsedItem[]
): string {
  // 1. Search in text items by exact question number (gabungkan jika ada baris kelanjutan opsi seperti B di baris berikutnya)
  for (let k = 0; k < kunciItems.length; k++) {
    const kItem = kunciItems[k];
    if (kItem.text) {
      const regex = new RegExp(`(^|\\b)(${qNum}[\\.\\)]|nomor\\s*${qNum}\\b)`, 'i');
      if (regex.test(kItem.text)) {
        let fullKey = cleanMarkdown(kItem.text).replace(/[\r\n]+/g, ' dan ');

        for (let nextK = k + 1; nextK < kunciItems.length; nextK++) {
          const nextItem = kunciItems[nextK];
          if (!nextItem.text || nextItem.isSectionHeader) break;
          if (/^(\d+[\.\)]|nomor\s*\d+|no\s*\d+)/i.test(nextItem.text.trim())) break;

          const nextTrimmed = nextItem.text.trim();
          if (/^(?:[-*•]\s*)?(\[?[A-Ea-e]\]?[\.\):]?|\b(?:dan|atau)\s+\[?[A-Ea-e]\]?)/i.test(nextTrimmed)) {
            const cleanNext = cleanMarkdown(nextTrimmed);
            if (/(?:\[?[A-Ea-e]\]?|kunci\s*:?\s*\[?[A-Ea-e]\]?)$/i.test(fullKey.trim())) {
              fullKey += ` dan ${cleanNext}`;
            } else {
              fullKey += `, ${cleanNext}`;
            }
          } else {
            fullKey += ` ${cleanMarkdown(nextTrimmed)}`;
          }
        }
        return fullKey;
      }
    }
  }

  // 2. Search in table rows (hilangkan <br> dan newline agar kunci sejajar dalam satu baris)
  for (const kItem of kunciItems) {
    if (kItem.rows && kItem.rows.length > 0) {
      for (const row of kItem.rows) {
        if (!row || row.length === 0) continue;
        const firstCol = (row[0] || '').trim();
        const regex = new RegExp(`(^|\\b)(${qNum}[\\.\\)]?|nomor\\s*${qNum}\\b)$`, 'i');
        if (regex.test(firstCol) || firstCol === String(qNum)) {
          if (row.length >= 4) {
            const bentuk = row[1] ? `[${row[1]}] ` : '';
            const rawKunci = (row[2] || '').replace(/<br\s*\/?>/gi, ' dan ').replace(/[\r\n]+/g, ' dan ').trim();
            const rubrik = row[3] ? ` (Rubrik Penskoran: ${row[3]})` : '';
            return `${bentuk}Kunci: ${rawKunci}${rubrik}`;
          } else if (row.length === 3) {
            const rawKunci = (row[1] || '').replace(/<br\s*\/?>/gi, ' dan ').replace(/[\r\n]+/g, ' dan ').trim();
            return `Kunci: ${rawKunci} (Rubrik: ${row[2]})`;
          }
          return row.slice(1).filter(Boolean).join(' - ').replace(/<br\s*\/?>/gi, ' dan ').replace(/[\r\n]+/g, ' dan ');
        }
      }
    }
  }

  // 3. Smart Search by relative index if AI grouped answers by question type (e.g. Pilihan Ganda 1..5)
  if (allParsedItems && allParsedItems.length > 0) {
    const allQuestions = allParsedItems.filter((i) => i.type === 'question');
    const isThisType = (q: ParsedItem) => {
      const qText = (q.questionText || '').toLowerCase();
      if (bentukSoal.includes('Kompleks')) {
        return (q.options && q.options.some((o) => o.label.includes('['))) ||
          qText.includes('kompleks') || qText.includes('lebih dari satu') || qText.includes('dua atau tiga');
      }
      if (bentukSoal.includes('Pilihan Ganda')) {
        return q.options && q.options.length > 0 && !q.options.some((o) => o.label.includes('['));
      }
      if (bentukSoal.includes('Benar')) {
        return q.embeddedTable && qText.includes('benar');
      }
      if (bentukSoal.includes('Jodoh')) {
        return q.embeddedTable && qText.includes('jodoh');
      }
      return !q.options || q.options.length === 0;
    };

    const questionsOfThisType = allQuestions.filter(isThisType);
    const targetQ = allQuestions.find((q, idx) => (q.number || idx + 1) === qNum);
    const relativeIdx = targetQ ? questionsOfThisType.indexOf(targetQ) + 1 : -1;

    if (relativeIdx > 0) {
      let inTargetTypeSection = false;
      const typeKeyword = bentukSoal.includes('Kompleks')
        ? 'kompleks'
        : bentukSoal.includes('Pilihan Ganda')
        ? 'pilihan ganda'
        : bentukSoal.includes('Benar')
        ? 'benar'
        : bentukSoal.includes('Jodoh')
        ? 'jodoh'
        : 'uraian';

      for (let k = 0; k < kunciItems.length; k++) {
        const kItem = kunciItems[k];
        const textLower = (kItem.text || '').toLowerCase();

        if (textLower.includes(typeKeyword) && !textLower.match(/^\d+[\.\)]/)) {
          inTargetTypeSection = true;
          continue;
        } else if (inTargetTypeSection && (textLower.includes('uraian') || textLower.includes('pilihan ganda') || textLower.includes('menjodohkan') || textLower.includes('benar')) && !textLower.includes(typeKeyword)) {
          inTargetTypeSection = false;
        }

        if (inTargetTypeSection && kItem.text) {
          const relRegex = new RegExp(`(^|\\b)(${relativeIdx}[\\.\\)]|nomor\\s*${relativeIdx}\\b)`, 'i');
          if (relRegex.test(kItem.text)) {
            return cleanMarkdown(kItem.text).replace(/[\r\n]+/g, ' dan ');
          }
        }
      }
    }
  }

  // 4. Default fallback when not found in parsed output:
  const isPgKompleks = bentukSoal.toLowerCase().includes('kompleks');
  if (isPgKompleks) {
    return `Kunci Jawaban PG Kompleks butir ${qNum}: Memilih minimal 2 opsi yang benar sesuai stimulus materi ${materi}. Pedoman Penskoran: Memilih semua opsi benar dengan tepat = skor 2; memilih sebagian benar = skor 1; salah/kosong = skor 0.`;
  } else if (bentukSoal.toLowerCase().includes('pilihan ganda')) {
    return `Kunci jawaban pilihan ganda butir nomor ${qNum} mengacu pada pemahaman konsep materi ${materi}. Pedoman Penskoran: Jawaban benar skor 1, salah/kosong skor 0.`;
  } else if (bentukSoal.toLowerCase().includes('benar')) {
    return `Kunci kesesuaian nilai Benar (B) atau Salah (S) butir nomor ${qNum} materi ${materi}. Pedoman Penskoran: Tiap pernyataan tepat skor 1 (Skor maksimal = 3).`;
  } else if (bentukSoal.toLowerCase().includes('jodoh')) {
    return `Pasangan tepat antara premis kolom kiri dengan respon kolom kanan butir nomor ${qNum} materi ${materi}. Pedoman Penskoran: Tiap pasangan tepat skor 1 (Skor maksimal = 4).`;
  } else {
    return `Kunci jawaban uraian komprehensif butir nomor ${qNum} materi ${materi}. Pedoman Penskoran: Lengkap & sistematis skor 4, cukup skor 3, kurang skor 2, minimal skor 1, kosong skor 0.`;
  }
}

/**
 * Helper to generate official Indonesian Standard Kartu Soal cards for each question
 */
function renderKartuSoalCards(
  docChildren: any[],
  parsedItems: ParsedItem[],
  identity: ExamIdentity,
  cellBorders: any,
  options?: DocxExportOptions
) {
  const questions = parsedItems.filter((i) => i.type === 'question');
  const kunciItems = parsedItems.filter((i) => i.section === 'kunci_skor');

  const semesterDisplay =
    identity.semester && !identity.semester.includes(',') && !identity.semester.includes('202')
      ? identity.semester
      : '1 (Ganjil)';

  questions.forEach((q, qIdx) => {
    const qNum = q.number || qIdx + 1;

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
      const textLower = (q.questionText || '').toLowerCase();
      if (textLower.includes('benar') || textLower.includes('salah')) {
        bentukSoal = 'Benar - Salah';
      } else if (textLower.includes('jodoh')) {
        bentukSoal = 'Menjodohkan';
      } else {
        bentukSoal = 'Isian / Tabel';
      }
    } else {
      bentukSoal = 'Uraian / Uraian Singkat';
    }

    // Cari Stimulus terkait
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

    // Resolusi Capaian Pembelajaran & Materi Pokok yang akurat dan tepat
    const resolved = resolveQuestionCapaianAndMateri(
      qNum,
      options?.packets,
      precedingStimulus,
      identity.mapel
    );
    const levelDisplay = resolved.level ? `${resolved.level} / L2` : 'L2 (Aplikasi) / Sedang';

    // Cari Kunci Jawaban terkait (Mendukung penuh PG Kompleks dengan multi-opsi dan rubrik)
    const matchedKeyText = extractAnswerKeyForQuestion(
      qNum,
      kunciItems,
      bentukSoal,
      resolved.materi
    );

    const soalContentParagraphs: Paragraph[] = [
      new Paragraph({
        spacing: { before: 20, after: 20, line: 240 },
        children: [
          new TextRun({
            text: 'RUMUSAN BUTIR SOAL:',
            bold: true,
            font: 'Times New Roman',
            size: 21,
          }),
        ],
      }),
    ];

    if (precedingStimulus) {
      soalContentParagraphs.push(
        new Paragraph({
          spacing: { before: 10, after: 20, line: 240 },
          children: [
            new TextRun({
              text: cleanMarkdown(precedingStimulus.title || ''),
              bold: true,
              italics: true,
              font: 'Times New Roman',
              size: 20,
            }),
          ],
        })
      );
      precedingStimulus.paragraphs?.forEach((p) => {
        soalContentParagraphs.push(
          new Paragraph({
            spacing: { before: 0, after: 20, line: 240 },
            children: [
              new TextRun({
                text: cleanMarkdown(p),
                font: 'Times New Roman',
                size: 20,
              }),
            ],
          })
        );
      });
    }

    soalContentParagraphs.push(
      new Paragraph({
        spacing: { before: 30, after: 20, line: 240 },
        alignment: AlignmentType.JUSTIFIED,
        indent: { left: 400, hanging: 400 },
        tabStops: [{ type: TabStopType.LEFT, position: 400 }],
        children: [
          new TextRun({
            text: `${qNum}.`,
            font: 'Times New Roman',
            size: 21,
          }),
          new TextRun({
            children: [new Tab()],
          }),
          new TextRun({
            text: cleanMarkdown(q.questionText || ''),
            font: 'Times New Roman',
            size: 21,
          }),
        ],
      })
    );

    // Options jika ada
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt) => {
        const rawLabel = (opt.label || '').trim();
        const isPgk = rawLabel.startsWith('[');
        const cleanLabel = rawLabel.endsWith('.') || rawLabel.endsWith(']') ? rawLabel : `${rawLabel}.`;
        const leftIndent = isPgk ? 950 : 800;
        const hangingIndent = isPgk ? 550 : 400; // both align the label at 400 twips

        soalContentParagraphs.push(
          new Paragraph({
            spacing: { before: 0, after: 10, line: 240 },
            alignment: AlignmentType.JUSTIFIED,
            indent: { left: leftIndent, hanging: hangingIndent },
            tabStops: [{ type: TabStopType.LEFT, position: leftIndent }],
            children: [
              new TextRun({
                text: cleanLabel,
                font: 'Times New Roman',
                size: 21,
              }),
              new TextRun({
                children: [new Tab()],
              }),
              new TextRun({
                text: cleanMarkdown(opt.text),
                font: 'Times New Roman',
                size: 21,
              }),
            ],
          })
        );
      });
    }

    // Kartu Soal Table
    const cardTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Header Row
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              columnSpan: 2,
              shading: { fill: 'F3F4F6' },
              margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: 0, line: 240 },
                  children: [
                    new TextRun({
                      text: `KARTU SOAL NOMOR : ${qNum}`,
                      bold: true,
                      font: 'Times New Roman',
                      size: 23,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        // Identitas & Level Kognitif (Tanpa Hari, Tanggal dan Tanpa Penyusun)
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { top: 40, bottom: 40, left: 60, right: 60 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Mata Pelajaran : ', bold: true, size: 20, font: 'Times New Roman' }),
                    new TextRun({ text: identity.mapel, size: 20, font: 'Times New Roman' }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Kelas / Sem.  : ', bold: true, size: 20, font: 'Times New Roman' }),
                    new TextRun({ text: `${identity.kelas} / ${semesterDisplay}`, size: 20, font: 'Times New Roman' }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Tahun Ajaran  : ', bold: true, size: 20, font: 'Times New Roman' }),
                    new TextRun({ text: identity.tapel, size: 20, font: 'Times New Roman' }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { top: 40, bottom: 40, left: 60, right: 60 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Bentuk Soal   : ', bold: true, size: 20, font: 'Times New Roman' }),
                    new TextRun({ text: bentukSoal, size: 20, font: 'Times New Roman' }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Level Kognitif : ', bold: true, size: 20, font: 'Times New Roman' }),
                    new TextRun({ text: levelDisplay, size: 20, font: 'Times New Roman' }),
                  ],
                }),
              ],
            }),
          ],
        }),
        // Capaian & Indikator
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              columnSpan: 2,
              margins: { top: 40, bottom: 40, left: 60, right: 60 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Capaian Pembelajaran (CP) : ', bold: true, size: 20, font: 'Times New Roman' }),
                    new TextRun({ text: resolved.capaian, size: 20, font: 'Times New Roman' }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Materi Pokok / Bab          : ', bold: true, size: 20, font: 'Times New Roman' }),
                    new TextRun({ text: resolved.materi, size: 20, font: 'Times New Roman' }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Indikator Soal             : ', bold: true, size: 20, font: 'Times New Roman' }),
                    new TextRun({
                      text: `Disajikan stimulus kontekstual materi ${resolved.materi}, peserta didik mampu menyelesaikan soal butir nomor ${qNum} secara tepat dan kritis.`,
                      size: 20,
                      font: 'Times New Roman',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        // Rumusan Butir Soal
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              columnSpan: 2,
              margins: { top: 40, bottom: 40, left: 60, right: 60 },
              children: soalContentParagraphs,
            }),
          ],
        }),
        // Kunci Jawaban
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              columnSpan: 2,
              margins: { top: 40, bottom: 40, left: 60, right: 60 },
              shading: { fill: 'FAFAFA' },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'KUNCI JAWABAN & PEDOMAN PENSKORAN: ', bold: true, size: 20, font: 'Times New Roman' }),
                    new TextRun({ text: cleanMarkdown(matchedKeyText), size: 20, font: 'Times New Roman' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    docChildren.push(cardTable);
    docChildren.push(
      new Paragraph({
        spacing: { before: 140, after: 40 },
        children: [],
      })
    );
  });
}

/**
 * Render standard list of ParsedItems (stimulus, question, tables, instructions) to Word docChildren
 */
function renderGenericItems(
  itemsToRender: ParsedItem[],
  docChildren: any[],
  options: DocxExportOptions | undefined,
  spacingBeforeTwips: number,
  cellBorders: any
) {
  const mode = options?.exportMode || 'image';

  itemsToRender.forEach((item) => {
    if (item.type === 'stimulus') {
      docChildren.push(
        new Paragraph({
          spacing: { before: spacingBeforeTwips, after: 40, line: 240 },
          children: [
            new TextRun({
              text: item.title || '',
              bold: true,
              italics: true,
              font: 'Times New Roman',
              size: 21,
            }),
          ],
        })
      );

      const hasImage = !!(item.imageUrl && item.imageUrl.includes(','));

      if ((mode === 'image' || mode === 'both') && hasImage && item.imageUrl) {
        try {
          const base64Data = item.imageUrl.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const imgType = item.imageUrl.includes('image/png') ? 'png' : 'jpg';
          const targetW = Math.round(500 * ((item.imageWidthPercent || 75) / 100));
          const targetH = Math.round(targetW * 0.58);

          const stimulusImgRun = new ImageRun({
            data: bytes,
            transformation: {
              width: targetW,
              height: targetH,
            },
            type: imgType as any,
          });

          docChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 80, after: 100 },
              children: [stimulusImgRun],
            })
          );
        } catch (imgErr) {
          console.warn('Gagal embed stimulus image ke Word:', imgErr);
        }
      } else if (mode === 'image' && item.isImageStimulus && !hasImage) {
        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 60, line: 240 },
            border: {
              top: { style: BorderStyle.DASHED, size: 6, color: '666666' },
              bottom: { style: BorderStyle.DASHED, size: 6, color: '666666' },
              left: { style: BorderStyle.DASHED, size: 6, color: '666666' },
              right: { style: BorderStyle.DASHED, size: 6, color: '666666' },
            },
            children: [
              new TextRun({
                text: `[TEMPAT GAMBAR JADI: ${item.imagePrompt || 'Diagram Stimulus'}]`,
                italics: true,
                font: 'Times New Roman',
                size: 20,
              }),
            ],
          })
        );
      }

      item.paragraphs?.forEach((p) => {
        const isPromptParagraph =
          /^((\[|\()?\s*(deskripsi|prompt|instruksi|keterangan)?\s*(gambar|diagram|infografis|ilustrasi|visual)\s*:?)/i.test(p) ||
          (item.isImageStimulus && (p === item.imagePrompt || (p.startsWith('[') && p.endsWith(']'))));

        if (mode === 'image' && hasImage && isPromptParagraph) {
          return;
        }

        const isCaption = mode === 'both' && hasImage && isPromptParagraph;

        docChildren.push(
          new Paragraph({
            spacing: { before: 0, after: 40, line: 240 },
            alignment: isCaption ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: cleanMarkdown(p),
                bold: false,
                italics: isCaption,
                font: 'Times New Roman',
                size: isCaption ? 19 : 22,
              }),
            ],
          })
        );
      });
    } else if (item.type === 'question') {
      docChildren.push(
        new Paragraph({
          spacing: { before: spacingBeforeTwips, after: 20, line: 240 },
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 450, hanging: 450 },
          tabStops: [{ type: TabStopType.LEFT, position: 450 }],
          children: [
            new TextRun({
              text: `${item.number}.`,
              bold: false,
              font: 'Times New Roman',
              size: 22,
            }),
            new TextRun({
              children: [new Tab()],
            }),
            new TextRun({
              text: cleanMarkdown(item.questionText || ''),
              bold: false,
              font: 'Times New Roman',
              size: 22,
            }),
          ],
        })
      );

      if (item.embeddedTable && item.embeddedTable.length > 0) {
        const tableRows = item.embeddedTable.map(
          (row, rIdx) =>
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    borders: cellBorders,
                    margins: { top: 60, bottom: 60, left: 100, right: 100 },
                    children: [
                      new Paragraph({
                        spacing: { before: 0, after: 0, line: 240 },
                        children: [
                          new TextRun({
                            text: cleanMarkdown(cell || ' '),
                            bold: rIdx === 0,
                            font: 'Times New Roman',
                            size: 20,
                          }),
                        ],
                      }),
                    ],
                  })
              ),
            })
        );

        docChildren.push(
          new Table({
            width: { size: 95, type: WidthType.PERCENTAGE },
            alignment: AlignmentType.CENTER,
            rows: tableRows,
          })
        );
      }

      if (item.options && item.options.length > 0) {
        item.options.forEach((opt) => {
          const rawLabel = (opt.label || '').trim();
          const isPgk = rawLabel.startsWith('[');
          const cleanLabel = rawLabel.endsWith('.') || rawLabel.endsWith(']') ? rawLabel : `${rawLabel}.`;
          const leftIndent = isPgk ? 1050 : 900;
          const hangingIndent = isPgk ? 600 : 450; // both align the label at 450 twips

          docChildren.push(
            new Paragraph({
              spacing: { before: 0, after: 0, line: 240 },
              alignment: AlignmentType.JUSTIFIED,
              indent: { left: leftIndent, hanging: hangingIndent },
              tabStops: [{ type: TabStopType.LEFT, position: leftIndent }],
              children: [
                new TextRun({
                  text: cleanLabel,
                  bold: false,
                  font: 'Times New Roman',
                  size: 22,
                }),
                new TextRun({
                  children: [new Tab()],
                }),
                new TextRun({
                  text: cleanMarkdown(opt.text),
                  bold: false,
                  font: 'Times New Roman',
                  size: 22,
                }),
              ],
            })
          );
        });
      }
    } else if (item.type === 'table' && item.rows) {
      const tableRows = item.rows.map(
        (row, rIdx) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  borders: cellBorders,
                  margins: { top: 60, bottom: 60, left: 80, right: 80 },
                  children: [
                    new Paragraph({
                      spacing: { before: 0, after: 0, line: 240 },
                      children: [
                        new TextRun({
                          text: cleanMarkdown(cell || ' '),
                          bold: rIdx === 0,
                          font: 'Times New Roman',
                          size: 19,
                        }),
                      ],
                    }),
                  ],
                })
            ),
          })
      );

      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
        })
      );
    } else if (item.type === 'instruction') {
      docChildren.push(
        new Paragraph({
          alignment: item.isSectionHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: item.isSectionHeader ? 240 : 60, after: item.isSectionHeader ? 80 : 40, line: 240 },
          children: [
            new TextRun({
              text: cleanMarkdown(item.text || ''),
              bold: !!item.isSectionHeader,
              font: 'Times New Roman',
              size: item.isSectionHeader ? 24 : 22,
            }),
          ],
        })
      );
    }
  });
}

function createTableCell(
  text: string,
  widthPercent: number,
  isBold = false,
  borders: any,
  shadingColor?: string,
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT
): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    borders,
    shading: shadingColor ? { fill: shadingColor } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment,
        spacing: { before: 0, after: 0, line: 240 },
        children: [
          new TextRun({
            text: cleanMarkdown(text || ' '),
            bold: isBold,
            font: 'Times New Roman',
            size: 20,
          }),
        ],
      }),
    ],
  });
}

/**
 * Fallback generator for Kisi-Kisi Asesmen if not present in raw parsed AI output
 */
function renderFallbackKisiKisi(
  docChildren: any[],
  parsedItems: ParsedItem[],
  identity: ExamIdentity,
  cellBorders: any,
  options?: DocxExportOptions
) {
  const questions = parsedItems.filter((i) => i.type === 'question');

  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 120, line: 240 },
      children: [
        new TextRun({
          text: 'MATRIKS KISI-KISI PENULISAN SOAL ASESMEN',
          bold: true,
          font: 'Times New Roman',
          size: 24,
        }),
      ],
    })
  );

  const headerRow = new TableRow({
    children: [
      createTableCell('No', 6, true, cellBorders, 'F3F4F6', AlignmentType.CENTER),
      createTableCell('Capaian Pembelajaran / Materi Pokok', 30, true, cellBorders, 'F3F4F6'),
      createTableCell('Indikator Soal', 32, true, cellBorders, 'F3F4F6'),
      createTableCell('Level', 10, true, cellBorders, 'F3F4F6', AlignmentType.CENTER),
      createTableCell('Bentuk Soal', 14, true, cellBorders, 'F3F4F6', AlignmentType.CENTER),
      createTableCell('No Soal', 8, true, cellBorders, 'F3F4F6', AlignmentType.CENTER),
    ],
  });

  const rows: TableRow[] = [headerRow];

  questions.forEach((q, qIdx) => {
    const qNum = q.number || qIdx + 1;
    const bentukSoal = normalizeQuestionType(undefined, q);

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
      options?.packets,
      precedingStimulus,
      identity.mapel
    );

    const level = bentukSoal === 'Uraian' ? 'L3 / Penalaran' : bentukSoal === 'PG Kompleks' ? 'L2 / Aplikasi' : 'L2 / Aplikasi';
    const cellMateriText = `${resolved.capaian} / ${resolved.materi}`;
    const indikator = `Disajikan stimulus kontekstual materi ${resolved.materi}, peserta didik dapat menganalisis dan menjawab butir nomor ${qNum} dengan tepat.`;

    rows.push(
      new TableRow({
        children: [
          createTableCell(`${qIdx + 1}`, 6, false, cellBorders, undefined, AlignmentType.CENTER),
          createTableCell(cellMateriText, 30, false, cellBorders),
          createTableCell(indikator, 32, false, cellBorders),
          createTableCell(level, 10, false, cellBorders, undefined, AlignmentType.CENTER),
          createTableCell(bentukSoal, 14, false, cellBorders, undefined, AlignmentType.CENTER),
          createTableCell(`${qNum}`, 8, false, cellBorders, undefined, AlignmentType.CENTER),
        ],
      })
    );
  });

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    })
  );
}

/**
 * Fallback generator for Kunci Jawaban & Rubrik Penskoran if not present in raw parsed AI output
 */
function renderFallbackKunciSkor(
  docChildren: any[],
  parsedItems: ParsedItem[],
  identity: ExamIdentity,
  cellBorders: any
) {
  const questions = parsedItems.filter((i) => i.type === 'question');

  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 120, line: 240 },
      children: [
        new TextRun({
          text: 'KUNCI JAWABAN DAN PEDOMAN PENSKORAN ASESMEN',
          bold: true,
          font: 'Times New Roman',
          size: 24,
        }),
      ],
    })
  );

  const headerRow = new TableRow({
    children: [
      createTableCell('No', 6, true, cellBorders, 'F3F4F6', AlignmentType.CENTER),
      createTableCell('Bentuk Soal', 16, true, cellBorders, 'F3F4F6', AlignmentType.CENTER),
      createTableCell('Kunci Jawaban & Uraian Jawaban', 48, true, cellBorders, 'F3F4F6'),
      createTableCell('Pedoman Penskoran', 30, true, cellBorders, 'F3F4F6'),
    ],
  });

  const rows: TableRow[] = [headerRow];
  const kunciItems = parsedItems.filter((i) => i.section === 'kunci_skor');

  questions.forEach((q, qIdx) => {
    const qNum = q.number || qIdx + 1;
    const bentukSoal = normalizeQuestionType(undefined, q);
    let rubrikDesc = 'Jawaban benar skor 1, salah/kosong skor 0.';

    if (bentukSoal === 'PG Kompleks') {
      rubrikDesc = 'Benar lengkap = 2; Benar sebagian = 1; Salah/kosong = 0.';
    } else if (bentukSoal === 'Benar-Salah') {
      rubrikDesc = 'Tiap pernyataan bernilai tepat = 1 (Skor maksimal = 3).';
    } else if (bentukSoal === 'Menjodohkan') {
      rubrikDesc = 'Tiap pasangan tepat = 1 (Skor maksimal = 4).';
    } else if (bentukSoal === 'Uraian') {
      rubrikDesc = 'Lengkap & logis = 4; Cukup = 3; Kurang = 2; Minimal = 1; Kosong = 0.';
    }

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
      undefined,
      precedingStimulus,
      identity.mapel
    );

    const kunciDesc = extractAnswerKeyForQuestion(
      qNum,
      kunciItems,
      bentukSoal,
      resolved.materi,
      parsedItems
    );

    rows.push(
      new TableRow({
        children: [
          createTableCell(`${qNum}`, 6, false, cellBorders, undefined, AlignmentType.CENTER),
          createTableCell(bentukSoal, 16, false, cellBorders, undefined, AlignmentType.CENTER),
          createTableCell(kunciDesc, 48, false, cellBorders),
          createTableCell(rubrikDesc, 30, false, cellBorders),
        ],
      })
    );
  });

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    })
  );

  docChildren.push(
    new Paragraph({
      spacing: { before: 140, after: 40, line: 240 },
      children: [
        new TextRun({
          text: 'Pedoman Perhitungan Nilai Akhir:',
          bold: true,
          font: 'Times New Roman',
          size: 21,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 60, line: 240 },
      children: [
        new TextRun({
          text: 'Nilai Akhir Siswa = (Skor Perolehan / Total Skor Maksimal) × 100',
          font: 'Times New Roman',
          size: 21,
          italics: true,
        }),
      ],
    })
  );
}

/**
 * Generator for Materi Esensial: Matriks Tabel Terstruktur (No Soal, Capaian Pembelajaran, Tujuan Pembelajaran, Uraian Materi, Jenis Soal)
 */
function renderFallbackMateriEsensial(
  docChildren: any[],
  parsedItems: ParsedItem[],
  identity: ExamIdentity,
  cellBorders: any,
  options?: DocxExportOptions
) {
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 120, line: 240 },
      children: [
        new TextRun({
          text: 'TABEL MATERI ESENSIAL PEMBELAJARAN',
          bold: true,
          font: 'Times New Roman',
          size: 24,
        }),
      ],
    })
  );

  const questions = parsedItems.filter((i) => i.type === 'question');

  const headerRow = new TableRow({
    children: [
      createTableCell('No Soal', 8, true, cellBorders, 'F3F4F6', AlignmentType.CENTER),
      createTableCell('Capaian Pembelajaran', 26, true, cellBorders, 'F3F4F6'),
      createTableCell('Tujuan Pembelajaran', 28, true, cellBorders, 'F3F4F6'),
      createTableCell('Uraian Materi', 24, true, cellBorders, 'F3F4F6'),
      createTableCell('Jenis Soal', 14, true, cellBorders, 'F3F4F6', AlignmentType.CENTER),
    ],
  });

  const rows: TableRow[] = [headerRow];

  questions.forEach((q, qIdx) => {
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
      options?.packets,
      precedingStimulus,
      identity.mapel,
      parsedItems,
      q
    );

    const finalJenis = normalizeQuestionType(resolved.jenisSoal, q);

    rows.push(
      new TableRow({
        children: [
          createTableCell(`${qNum}`, 8, false, cellBorders, undefined, AlignmentType.CENTER),
          createTableCell(resolved.capaian, 26, false, cellBorders),
          createTableCell(resolved.tujuan, 28, false, cellBorders),
          createTableCell(resolved.uraianMateri, 24, false, cellBorders),
          createTableCell(finalJenis, 14, false, cellBorders, undefined, AlignmentType.CENTER),
        ],
      })
    );
  });

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    })
  );
}
