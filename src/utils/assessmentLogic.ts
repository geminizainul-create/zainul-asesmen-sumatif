import { 
  FixedMappingItem, 
  GeneralInfo, 
  KelengkapanType, 
  LevelType, 
  PacketData, 
  RecommendationRow, 
  SoalDetailsMap, 
  SoalType 
} from '../types/assessment';

export const SOAL_TYPES: SoalType[] = [
  'Pilihan Ganda',
  'PG Kompleks',
  'Menjodohkan',
  'Benar-Salah',
  'Uraian Pendek',
  'Uraian'
];

export const SOAL_DESCRIPTIONS: Record<SoalType, string> = {
  'Pilihan Ganda': '1 jawaban benar (opsi A, B, C, D)',
  'PG Kompleks': 'Format kurung siku [A], [B], [C], [D] - lebih dari 1 benar',
  'Menjodohkan': 'Tabel 2 kolom (4 pernyataan vs 5 pilihan jawaban + 1 pengecoh)',
  'Benar-Salah': 'Tabel No, Pernyataan, B, S (tepat 3 pernyataan)',
  'Uraian Pendek': 'Jawaban isian singkat (maksimal 2 kata)',
  'Uraian': 'Uraian komprehensif / pemecahan masalah'
};

export const FIXED_MAPPING_25: Record<number, FixedMappingItem> = {
  1:  { type: "Pilihan Ganda", level: "Sedang", formType: "Pilihan Ganda" },
  2:  { type: "PG Kompleks (PGK)", level: "Sedang", formType: "PG Kompleks" },
  3:  { type: "Uraian Singkat", level: "Mudah", formType: "Uraian Pendek" },
  4:  { type: "Benar/Salah", level: "Mudah", formType: "Benar-Salah" },
  5:  { type: "Menjodohkan", level: "Sedang", formType: "Menjodohkan" },
  6:  { type: "Uraian Panjang", level: "Sulit", formType: "Uraian" },
  7:  { type: "Pilihan Ganda", level: "Sedang", formType: "Pilihan Ganda" },
  8:  { type: "Uraian Singkat", level: "Mudah", formType: "Uraian Pendek" },
  9:  { type: "Benar/Salah", level: "Sedang", formType: "Benar-Salah" },
  10: { type: "PG Kompleks (PGK)", level: "Sulit", formType: "PG Kompleks" },
  11: { type: "Menjodohkan", level: "Sedang", formType: "Menjodohkan" },
  12: { type: "Uraian Panjang", level: "Sulit", formType: "Uraian" },
  13: { type: "Pilihan Ganda", level: "Mudah", formType: "Pilihan Ganda" },
  14: { type: "PG Kompleks (PGK)", level: "Sedang", formType: "PG Kompleks" },
  15: { type: "Benar/Salah", level: "Mudah", formType: "Benar-Salah" },
  16: { type: "Benar/Salah", level: "Sedang", formType: "Benar-Salah" },
  17: { type: "Menjodohkan", level: "Sulit", formType: "Menjodohkan" },
  18: { type: "Uraian Panjang", level: "Sulit", formType: "Uraian" },
  19: { type: "Pilihan Ganda", level: "Sedang", formType: "Pilihan Ganda" },
  20: { type: "PG Kompleks (PGK)", level: "Sulit", formType: "PG Kompleks" },
  21: { type: "Uraian Panjang", level: "Sedang", formType: "Uraian" },
  22: { type: "Benar/Salah", level: "Sedang", formType: "Benar-Salah" },
  23: { type: "PG Kompleks (PGK)", level: "Sedang", formType: "PG Kompleks" },
  24: { type: "Uraian Panjang", level: "Sulit", formType: "Uraian" },
  25: { type: "Pilihan Ganda", level: "Sulit", formType: "Pilihan Ganda" }
};

export function createDefaultSoalDetails(): SoalDetailsMap {
  return {
    'Pilihan Ganda': { enabled: false, level: 'Sedang', nomor: '' },
    'PG Kompleks': { enabled: false, level: 'Sedang', nomor: '' },
    'Menjodohkan': { enabled: false, level: 'Sedang', nomor: '' },
    'Benar-Salah': { enabled: false, level: 'Sedang', nomor: '' },
    'Uraian Pendek': { enabled: false, level: 'Sedang', nomor: '' },
    'Uraian': { enabled: false, level: 'Sedang', nomor: '' },
  };
}

export function createDefaultPacket(packetNumber: number): PacketData {
  return {
    id: `packet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    packetNumber,
    materi: '',
    tujuan: '',
    stimulusMode: 'dengan',
    useGambar: false,
    gaya: 'Berwarna',
    jumlahParagraf: '1',
    soalDetails: createDefaultSoalDetails(),
  };
}

export function parseNomorSoal(inputStr: string): number {
  let total = 0;
  if (!inputStr) return 0;
  const parts = inputStr.split(/[ ,;]+/);
  for (const part of parts) {
    if (part.includes('-')) {
      const bounds = part.split('-');
      if (bounds.length === 2 && !isNaN(Number(bounds[0])) && !isNaN(Number(bounds[1]))) {
        total += Math.abs(parseInt(bounds[1], 10) - parseInt(bounds[0], 10)) + 1;
      }
    } else if (!isNaN(Number(part)) && part.trim() !== '') {
      total += 1;
    }
  }
  return total;
}

export function parseInputMateri(rawText: string): Array<{ bab: string; subs: string[] }> {
  if (!rawText || !rawText.trim()) return [];
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const results: Array<{ bab: string; subs: string[] }> = [];
  let currentBab = '';
  let currentSubbab: string[] = [];

  for (const line of lines) {
    const cleanLine = line.replace(/^[0-9]+[\.\)]\s*/, '').replace(/^[-*•]\s*/, '').trim();
    const isBabIndicator =
      /^(bab\s*\d+|bab\b|materi\s*\d+|tema\s*\d+)/i.test(line) ||
      (!line.startsWith('-') && !line.startsWith('*') && !line.startsWith('•') && currentBab === '');

    if (isBabIndicator) {
      if (currentBab) {
        results.push({ bab: currentBab, subs: currentSubbab.length > 0 ? [...currentSubbab] : ['—'] });
      }
      currentBab = cleanLine;
      currentSubbab = [];
    } else {
      currentSubbab.push(cleanLine);
    }
  }

  if (currentBab) {
    results.push({ bab: currentBab, subs: currentSubbab.length > 0 ? [...currentSubbab] : ['—'] });
  } else if (lines.length > 0) {
    results.push({ bab: lines[0], subs: lines.slice(1).length > 0 ? lines.slice(1) : ['—'] });
  }
  return results;
}

export interface GeneratedPacketStructure {
  packetNumber: number;
  bab: string;
  sub: string;
  stimulusDesc: string;
  useGambar: boolean;
  gayaGambar: 'Berwarna' | 'Hitam Putih';
  jumlahParagraf: string;
  items: Array<{
    no: number;
    type: string;
    level: LevelType;
    formType: SoalType;
  }>;
}

export function buildAutomaticAssessment(rawMateri: string, totalQuestions: number): {
  packets: PacketData[];
  recommendationRows: RecommendationRow[];
} {
  const parsedMateri = parseInputMateri(rawMateri);
  const numQ = Math.max(1, totalQuestions || 25);

  const questionItems: Array<{
    no: number;
    type: string;
    level: LevelType;
    formType: SoalType;
  }> = [];

  for (let i = 1; i <= numQ; i++) {
    if (i <= 25) {
      questionItems.push({
        no: i,
        type: FIXED_MAPPING_25[i].type,
        level: FIXED_MAPPING_25[i].level,
        formType: FIXED_MAPPING_25[i].formType,
      });
    } else {
      const mapItem = FIXED_MAPPING_25[((i - 1) % 25) + 1];
      questionItems.push({
        no: i,
        type: mapItem.type,
        level: mapItem.level,
        formType: mapItem.formType,
      });
    }
  }

  let targets: Array<{ bab: string; sub: string }> = [];
  if (parsedMateri.length === 0) {
    targets.push({ bab: 'Materi Pokok 1', sub: '—' });
  } else {
    parsedMateri.forEach((m) => {
      m.subs.forEach((s) => {
        targets.push({ bab: m.bab, sub: s });
      });
    });
  }

  const targetPerPacket = Math.max(3, Math.min(5, Math.ceil(numQ / Math.max(targets.length, 1))));

  const intermediatePackets: GeneratedPacketStructure[] = [];
  let currentPacketItems: typeof questionItems = [];
  let targetIdx = 0;

  questionItems.forEach((item) => {
    const conflict = currentPacketItems.find(
      (it) => it.formType === item.formType && it.level !== item.level
    );
    const packetFull = currentPacketItems.length >= targetPerPacket;

    if ((conflict || packetFull) && currentPacketItems.length > 0) {
      const t = targets[targetIdx % targets.length];
      intermediatePackets.push({
        packetNumber: intermediatePackets.length + 1,
        bab: t.bab,
        sub: t.sub,
        stimulusDesc: '',
        useGambar: false,
        gayaGambar: 'Berwarna',
        jumlahParagraf: '2',
        items: [...currentPacketItems],
      });
      currentPacketItems = [];
      targetIdx++;
    }

    currentPacketItems.push(item);
  });

  if (currentPacketItems.length > 0) {
    const t = targets[targetIdx % targets.length];
    intermediatePackets.push({
      packetNumber: intermediatePackets.length + 1,
      bab: t.bab,
      sub: t.sub,
      stimulusDesc: '',
      useGambar: false,
      gayaGambar: 'Berwarna',
      jumlahParagraf: '2',
      items: [...currentPacketItems],
    });
  }

  intermediatePackets.forEach((p, idx) => {
    p.packetNumber = idx + 1;
    const minNo = Math.min(...p.items.map((it) => it.no));
    const maxNo = Math.max(...p.items.map((it) => it.no));
    const rangeText = minNo === maxNo ? `nomor ${minNo}` : `nomor ${minNo}–${maxNo}`;

    const hasVisualNeed =
      p.items.some((it) => it.formType === 'Menjodohkan' || it.level === 'Sulit') && idx % 2 === 1;
    const topicWord = p.sub !== '—' ? p.sub : p.bab;

    if (hasVisualNeed) {
      p.useGambar = true;
      p.gayaGambar = 'Hitam Putih';
      p.stimulusDesc = `Gambar (1) ilustrasi/diagram kontekstual ${topicWord} untuk ${rangeText}`;
    } else {
      const paragrafNum = Math.min(3, Math.max(1, Math.ceil(p.items.length / 2)));
      p.useGambar = false;
      p.jumlahParagraf = paragrafNum.toString();
      p.stimulusDesc = `Paragraf (${paragrafNum}) teks bacaan kontekstual ${topicWord} untuk ${rangeText}`;
    }
  });

  // Convert to PacketData format for React state
  const finalPackets: PacketData[] = intermediatePackets.map((p) => {
    const details = createDefaultSoalDetails();
    const groupedByType: Record<string, { level: LevelType; numbers: number[] }> = {};

    p.items.forEach((it) => {
      if (!groupedByType[it.formType]) {
        groupedByType[it.formType] = {
          level: it.level,
          numbers: [],
        };
      }
      groupedByType[it.formType].numbers.push(it.no);
    });

    Object.entries(groupedByType).forEach(([formType, val]) => {
      const fType = formType as SoalType;
      if (details[fType]) {
        details[fType].enabled = true;
        details[fType].level = val.level;
        details[fType].nomor = val.numbers.join(', ');
      }
    });

    return {
      id: `packet_auto_${p.packetNumber}_${Date.now()}`,
      packetNumber: p.packetNumber,
      materi: p.bab,
      tujuan: p.sub !== '—' ? p.sub : '',
      stimulusMode: 'dengan',
      useGambar: p.useGambar,
      gaya: p.gayaGambar,
      jumlahParagraf: p.jumlahParagraf,
      soalDetails: details,
    };
  });

  // Build recommendation table rows
  const recommendationRows: RecommendationRow[] = [];
  intermediatePackets.forEach((p) => {
    const groups: Record<string, { type: string; level: LevelType; numbers: number[] }> = {};
    p.items.forEach((item) => {
      const key = `${item.type}_${item.level}`;
      if (!groups[key]) {
        groups[key] = {
          type: item.type,
          level: item.level,
          numbers: [],
        };
      }
      groups[key].numbers.push(item.no);
    });

    Object.values(groups).forEach((g) => {
      recommendationRows.push({
        packetNumber: p.packetNumber,
        bab: p.bab,
        sub: p.sub,
        type: g.type,
        level: g.level,
        numbers: g.numbers.join(', '),
        stimulusDesc: p.stimulusDesc,
      });
    });
  });

  return { packets: finalPackets, recommendationRows };
}

export function generateAssessmentPrompt(
  info: GeneralInfo,
  packets: PacketData[],
  totalQuestions: number,
  kelengkapan: KelengkapanType[]
): string {
  const mapel = info.mapel.trim() || '(Belum ditentukan)';
  const kelas = info.kelas.trim() || '(Belum ditentukan)';
  const tingkatan = info.tingkatan;

  let p = `Anda adalah ahli pengembang instrumen asesmen pembelajaran standar Kurikulum Merdeka di Indonesia. Sila buatkan satu set penilaian lengkap untuk:\n\n`;
  p += `--- INFORMASI UMUM ---\nMata Pelajaran: ${mapel}\nKelas: ${kelas}\nTingkatan: ${tingkatan}\nTotal Keseluruhan Soal: ${totalQuestions} Butir\n\n--- RANCANGAN KONTEN PER PAKET ---\n`;

  let validPackets = 0;

  packets.forEach((card, index) => {
    const materi = card.materi.trim() || `Materi ${index + 1}`;
    const tujuan = card.tujuan.trim() || `Tujuan pembelajaran paket ${index + 1}`;
    const stimulusMode = card.stimulusMode;
    const useGambar = card.useGambar;
    const gaya = card.gaya;
    const jumlahParagraf = card.jumlahParagraf;

    // Filter enabled question types
    const activeDetails = Object.entries(card.soalDetails).filter(([, item]) => item.enabled);
    if (activeDetails.length === 0) return;
    validPackets++;

    const nomorList: string[] = [];
    activeDetails.forEach(([, item]) => {
      const noVal = item.nomor.trim();
      if (noVal) nomorList.push(noVal);
    });
    const rentangNomor = nomorList.length > 0 ? nomorList.join(', ') : 'terkait';

    p += `\n[PAKET ${String(validPackets).padStart(2, '0')}]\n`;
    p += `Materi: ${materi}\nTujuan: ${tujuan}\n`;

    if (stimulusMode === 'dengan') {
      if (useGambar) {
        const gayaText =
          gaya === 'Berwarna'
            ? 'berwarna yang profesional dan tajam'
            : 'hitam putih (line art) beresolusi dan kontras tinggi agar tidak buram saat difotokopi';
        p += `WAJIB CANTUMKAN KALIMAT PERINTAH STIMULUS GAMBAR DI ATAS GAMBAR:
Format wajib: "Cermati gambar/diagram/infografis berikut untuk menjawab soal nomor ${rentangNomor}!"

Buatlah deskripsi/instruksi gambar yang detail bergaya ${gayaText} dalam kurung siku: [Deskripsi Gambar: detail visual lengkap]. Gambar ini WAJIB menjadi inti masalah visual. Soal-soal di bawah ini TIDAK BOLEH bisa dijawab hanya dengan membaca teks/teori, melainkan siswa wajib mengobservasi detail visual tersebut. Dilarang menambahkan teks artikel bacaan panjang karena stimulus ini berupa gambar/diagram.\n`;
      } else {
        p += `WAJIB CANTUMKAN KALIMAT PERINTAH BACAAN DI ATAS TEKS:
Format wajib: "Bacalah artikel di bawah ini secara saksama untuk menjawab soal nomor ${rentangNomor}!"

Buatlah teks bacaan/paragraf yang mendalam sebanyak TEPAT ${jumlahParagraf} paragraf. Teks ini harus sangat relevan dengan materi dan tujuan, serta wajib menjadi dasar analisis. Soal-soal di bawah ini tidak boleh bisa dijawab hanya dengan ingatan teori, melainkan siswa wajib menyimpulkan dari teks bacaan ini. DILARANG KERAS mencantumkan deskripsi gambar, prompt gambar, atau instruksi visual apapun karena stimulus ini murni berupa paragraf bacaan teks.\n`;
      }
      p += `Buat butir soal berdasarkan stimulus di atas:\n`;
    } else {
      p += `Ketentuan: Paket soal ini dibuat TANPA STIMULUS (langsung ke butir pertanyaan tanpa teks bacaan ataupun gambar). Buatlah soal langsung berdasarkan materi dan tujuan di atas:\n`;
    }

    activeDetails.forEach(([jenisStr, item]) => {
      const jenis = jenisStr as SoalType;
      const level = item.level;
      const nomor = item.nomor.trim() || '-';
      let rule = '';
      if (jenis === 'Benar-Salah') {
        rule = ' (Wajib 3 pernyataan, sajikan dalam tabel dengan kolom No, Pernyataan, B, S)';
      }
      if (jenis === 'Menjodohkan') {
        rule =
          ' (Wajib menyajikan tepat 4 pernyataan bernomor 1, 2, 3, 4 di kolom kiri dan 5 pilihan jawaban A, B, C, D, E di kolom kanan dengan 1 jawaban sebagai pengecoh)';
      }
      if (jenis === 'PG Kompleks') {
        rule =
          " (PENTING: Pilihan jawaban WAJIB menggunakan format kurung siku [A], [B], [C], [D] untuk membedakannya secara visual dari Pilihan Ganda biasa, dengan instruksi memilih lebih dari satu jawaban benar, contoh: 'Pilihlah dua atau tiga jawaban yang benar!')";
      }
      if (jenis === 'Uraian Pendek') {
        rule = ' (PENTING: Jawaban harus terbatas maksimal 2 kata)';
      }
      p += `- ${jenis} [${level}]: Nomor ${nomor}${rule}\n`;
    });
  });

  p += `\n--- KETENTUAN OUTPUT & STRUKTUR PENYAJIAN SOAL ---\n`;
  p += `Sangat Penting: Mohon sajikan hasil draf soal persis mengikuti pola struktur contoh di bawah ini:

CONTOH STRUKTUR DAN TATA LETAK PENYAJIAN SOAL:
---------------------------------------------------------------------------------
[Contoh Tipe 1: Jika Stimulus Meminta Teks Paragraf Bacaan (Bukan Gambar)]
Bacalah artikel di bawah ini secara saksama untuk menjawab soal nomor 1!
[Isi Teks Paragraf Stimulus berupa bacaan literasi murni tanpa gambar/prompt gambar...]

1. [Pertanyaan Pilihan Ganda Tunggal berdasarkan bacaan]
A. [Pilihan A]
B. [Pilihan B]
C. [Pilihan C]
D. [Pilihan D]

[Contoh Tipe 2: Jika Stimulus Meminta Gambar/Diagram Visual]
Cermati gambar/diagram berikut untuk menjawab soal nomor 2!
[Deskripsi Gambar: Rincian visual diagram/bagan/ilustrasi secara jelas dan kontekstual]

2. [Pertanyaan Pilihan Ganda Kompleks - Wajib berikan instruksi memilih lebih dari satu opsi benar]
[A] [Pilihan A]
[B] [Pilihan B]
[C] [Pilihan C]
[D] [Pilihan D]

Bacalah artikel di bawah ini secara saksama untuk menjawab soal nomor 3, dan 4!
[Isi Teks Paragraf Stimulus yang menaungi nomor 3 dan 4...]

3. Berdasarkan teks di atas, tentukan apakah pernyataan-pernyataan berikut bernilai Benar (B) atau Salah (S)!
| No | Pernyataan | B | S |
| 1 | [Pernyataan 1] | | |
| 2 | [Pernyataan 2] | | |
| 3 | [Pernyataan 3] | | |

4. Jodohkan pernyataan berikut dengan pilihan jawaban yang tersedia di sebelah kanan!
| No | Pernyataan | Pilihan Jawaban |
| 1 | [Pernyataan 1] | A. [Opsi Jawaban A] |
| 2 | [Pernyataan 2] | B. [Opsi Jawaban B] |
| 3 | [Pernyataan 3] | C. [Opsi Jawaban C] |
| 4 | [Pernyataan 4] | D. [Opsi Jawaban D] |
| | | E. [Opsi Jawaban Pengecoh] |
---------------------------------------------------------------------------------

ATURAN WAJIB DRAF UTAMA:
1. ATURAN PENYAJIAN STIMULUS (DIBEDAKAN TEGAS ANTARA GAMBAR DAN TEKS PARAGRAF):
   - Jika paket meminta STIMULUS GAMBAR (useGambar = true): Awali dengan kalimat pengantar "Cermati gambar/diagram/infografis berikut untuk menjawab soal nomor [X]!" lalu cantumkan deskripsi gambar dalam format: [Deskripsi Gambar: rincian visual]. DILARANG membuat teks artikel panjang.
   - Jika paket meminta STIMULUS PARAGRAF BACAAN (useGambar = false): Awali dengan kalimat pengantar "Bacalah artikel di bawah ini secara saksama untuk menjawab soal nomor [X]!" lalu sajikan teks bacaan murni berupa paragraf. DILARANG KERAS menyisipkan deskripsi gambar, prompt gambar, atau instruksi visual apapun pada stimulus paragraf bacaan ini.
2. DILARANG mencantumkan label teknis seperti "Paket 01", "Jenis Soal: Pilihan Ganda Kompleks", atau "[Sedang]" pada draf naskah soal siswa. Tulis langsung nomor dan butir pertanyaannya.
3. KHUSUS Pilihan Ganda Kompleks (PG Kompleks): Wajib menggunakan label opsi kurung siku [A], [B], [C], [D] untuk membedakannya secara visual dari Pilihan Ganda biasa (yang memakai A., B., C., D.), serta wajib cantumkan instruksi jelas kepada siswa untuk memilih lebih dari satu jawaban yang benar (contoh: "Pilihlah dua atau tiga jawaban yang benar!"). DILARANG menggunakan format A., B., C., D. biasa untuk PG Kompleks.
4. LARANGAN MEMBUAT SELURUH SOAL DALAM TABEL (SANGAT PENTING):
   - DILARANG KERAS membungkus seluruh naskah atau butir soal lain (Pilihan Ganda, PG Kompleks, Uraian Pendek, Uraian Panjang) ke dalam tabel.
   - Pilihan Ganda, PG Kompleks, dan Uraian WAJIB disajikan sebagai teks biasa (paragraf/daftar baris baru lepas tanpa karakter pipe "|").
   - Format tabel (| ... |) HANYA dan EKSKLUSIF digunakan untuk butir soal Benar-Salah dan Menjodohkan saja.
   - Setelah tabel Benar-Salah atau Menjodohkan selesai, WAJIB beri jarak dua baris kosong baru agar tabel tertutup sempurna dan tidak menyeret nomor soal berikutnya ke dalam tabel.
5. Untuk soal Benar-Salah, sajikan dalam format tabel dengan kolom No, Pernyataan, B, dan S (tepat 3 pernyataan).
6. Untuk soal Menjodohkan, sajikan dalam format tabel 2-kolom yang WAJIB terdiri atas tepat 4 baris pernyataan bernomor (1, 2, 3, 4) di sisi kiri dan tepat 5 pilihan jawaban (A, B, C, D, E) di sisi kanan, di mana salah satu opsi jawaban berfungsi sebagai pengecoh.
7. ATURAN PENTING FORMAT FONT (MENCEGAH TEKS MENJADI TEBAL/BOLD SEMUA):
   - JANGAN menggunakan sintaks Markdown tebal (**...**) pada kalimat stimulus, teks bacaan, butir pertanyaan soal, maupun opsi pilihan jawaban (A, B, C, D atau [A], [B], [C], [D]).
   - Semua teks soal WAJIB disajikan sebagai teks polos/biasa (normal regular font) agar saat disalin ke Microsoft Word teks tidak berubah menjadi huruf tebal semua.
   - Penebalan huruf hanya diperbolehkan secara selektif untuk header tabel (misal: | No | Pernyataan | B | S |) atau judul kelengkapan lampiran jika diperlukan.
8. ATURAN PENOMORAN MANUAL MURNI (DILARANG MENGGUNAKAN AUTO-NUMBERING / ORDERED LIST):
   - Gunakan penomoran manual murni berupa teks biasa tanpa memicu format daftar otomatis (ordered list / auto-numbering).
   - Tulis nomor soal dan pilihan jawaban langsung sebagai teks biasa (contoh teks biasa tanpa spasi tab otomatis: "1. Teks soal...", lalu baris baru "A. Teks pilihan...", dst.).
   - Hal ini SANGAT PENTING agar saat disalin ke Microsoft Word, nomor dan abjad opsi TIDAK otomatis terkonversi menjadi fitur "Numbering" Word yang dapat mengacaukan spasi dan perataan inden paragraf.
9. ATURAN PENULISAN RUMUS MATEMATIKA & SAINS (BEBAS KODE LATEX MENTAH - WAJIB SIMBOL RAPI):
   - KHUSUS soal Matematika, Fisika, Kimia, atau IPA: DILARANG KERAS menyajikan rumus dalam bentuk kode LaTeX mentah (seperti \\frac{a}{b}, \\sqrt{x}, \\times, $$...$$, dll) yang membingungkan siswa dan guru.
   - WAJIB sajikan rumus matematika dengan simbol rapi dan jelas:
     * Pecahan: gunakan karakter pecahan langsung (½, ¼, ¾) atau pembagian bersih (a/b) atau ((x + 1)/(x - 2)).
     * Pangkat & Indeks: gunakan karakter superscript (x², x³, yⁿ, 10⁵, cm², m³) dan subscript (x₁, x₂, H₂O).
     * Akar: gunakan simbol √ atau akar(x) (contoh: √64, √(b² - 4ac)).
     * Simbol operasi & relasi: gunakan × (kali), ÷ (bagi), ± (plus-minus), ≤, ≥, ≠, ≈, °, π, α, β, θ.
     * Tulis langsung sebagai teks mengalir tanpa membungkusnya dengan tanda dollar ($...$ atau $$...$$).
\n`;

  if (kelengkapan.length > 0) {
    p += `\n--- KELENGKAPAN LAMPIRAN WAJIB (JANGAN SAMPAI KOSONG / DILEWATI) ---\n`;
    p += `PENTING SEKALI: Anda WAJIB menyajikan seluruh dokumen kelengkapan berikut secara LENGKAP dan TUNTAS sampai selesai di bagian bawah naskah soal. DILARANG KERAS memotong, menyingkat ("dst."), atau mengosongkan bagian-bagian ini:\n\n`;

    if (kelengkapan.includes('Kunci dan Skor Jawaban')) {
      p += `### KUNCI JAWABAN DAN PEDOMAN PENSKORAN
Sajikan kunci jawaban nomor 1 sampai ${totalQuestions} secara lengkap dan tuntas:
- Pilihan Ganda: Kunci 1 jawaban benar (A, B, C, atau D) beserta pembahasan ringkas (Bobot skor = 1).
- Pilihan Ganda Kompleks (PG Kompleks): Kunci WAJIB mencantumkan SEMUA pilihan abjad yang benar DALAM SATU BARIS YANG SAMA / SEJAJAR (lebih dari 1 pilihan benar, contoh: "[A] dan [B]" atau "[A], [C], [D]") beserta pembahasan dan pedoman penskoran (skor 2 jika semua benar, skor 1 jika sebagian benar, skor 0 jika salah/kosong). DILARANG KERAS memisahkan atau membuat baris baru per huruf opsi (misal menulis A lalu enter ke baris baru B)! Seluruh huruf opsi kunci PG Kompleks WAJIB ditulis berdampingan dalam satu baris yang sama.
- Benar-Salah: Kunci per baris pernyataan (B/S) (Maksimal skor 3).
- Menjodohkan: Pasangan jawaban yang tepat (1-X, 2-Y, dst.) (Maksimal skor 4).
- Uraian / Isian: Kunci jawaban lengkap beserta rubrik penskoran dan bobot skor tiap butir nomor.\n\n`;
    }

    if (kelengkapan.includes('Kisi-Kisi')) {
      p += `### KISI-KISI PENULISAN SOAL ASESMEN
Sajikan matriks kisi-kisi asesmen dalam format TABEL MARKDOWN lengkap untuk seluruh butir nomor 1 sampai ${totalQuestions} dengan kolom:
| No | Capaian Pembelajaran / Materi Pokok | Indikator Soal | Level Kognitif | Bentuk Soal | Nomor Soal |
Wajib cantumkan baris tabel untuk setiap butir soal tanpa terlewat.\n\n`;
    }

    if (kelengkapan.includes('Kartu Soal')) {
      p += `### KARTU SOAL RESMI KURIKULUM MERDEKA
Sajikan format kartu soal resmi standar Kurikulum Merdeka (per butir soal) memuat:
- Nomor Soal: [Nomor]
- Bentuk Soal: [Pilihan Ganda / PG Kompleks / Menjodohkan / Benar-Salah / Uraian]
- Capaian Pembelajaran / Materi Pokok: [Materi Pokok]
- Indikator Soal: [Indikator Ketercapaian]
- Level Kognitif: [L1/L2/L3]
- Rumusan Butir Soal: [Pertanyaan & Opsi]
- Kunci Jawaban & Rubrik: [Kunci & Skor]\n\n`;
    }

    if (kelengkapan.includes('Materi Esensial')) {
      p += `### TABEL MATERI ESENSIAL PEMBELAJARAN
Sajikan materi esensial dalam format TABEL MATRIKS LENGKAP nomor 1 sampai ${totalQuestions} dengan kolom:
| No Soal | Capaian Pembelajaran | Tujuan Pembelajaran | Uraian Materi | Jenis Soal |
Wajib cantumkan baris tabel untuk setiap butir soal secara runtut dan mendalam sesuai materi pokok yang diujikan.\n\n`;
    }

    if (kelengkapan.includes('Telaah Soal')) {
      p += `### LEMBAR TELAAH BUTIR SOAL
Sajikan instrumen telaah butir soal (aspek materi, konstruksi, dan kaidah bahasa Indonesia baku).\n\n`;
    }
  }

  return p;
}

export const SAMPLE_PRESETS = [
  {
    name: 'IPA SMP Kelas 7 (25 Soal)',
    info: {
      mapel: 'Ilmu Pengetahuan Alam (IPA)',
      kelas: '7',
      tingkatan: 'SMP / Menengah Rendah',
    },
    materiText: `Bab 1: Hakikat Ilmu Sains dan Metode Ilmiah
- Subbab: Laboratorium IPA dan keselamatan kerja
- TP: Mengenal alat-alat laboratorium serta menerapkan aturan keselamatan kerja
Bab 2: Zat dan Perubahannya
- Subbab: Wujud zat dan model partikel
- TP: Menjelaskan perbedaan sifat fisik zat padat, cair, dan gas berdasarkan model partikel
Bab 3: Suhu, Kalor, dan Pemuaian
- Subbab: Pengukuran suhu dan konsep kalor
- TP: Menganalisis pengaruh kalor terhadap perubahan suhu dan wujud zat
Bab 4: Gerak dan Gaya
- Subbab: Hukum Newton dan macam-macam gaya
- TP: Menerapkan konsep Hukum Newton dalam peristiwa kehidupan sehari-hari`,
    jumlahSoal: 25,
  },
  {
    name: 'Matematika SD Kelas 5 (15 Soal)',
    info: {
      mapel: 'Matematika',
      kelas: '5',
      tingkatan: 'SD / Sekolah Rendah',
    },
    materiText: `Bab 1: Operasi Hitung Pecahan
- Subbab: Penjumlahan dan pengurangan pecahan berpenyebut beda
- TP: Menyelesaikan masalah kontekstual penjumlahan pecahan
Bab 2: Kecepatan dan Debit
- Subbab: Hubungan jarak, waktu, dan kecepatan
- TP: Menghitung kecepatan rata-rata perjalanan kendaraan
Bab 3: Denah dan Skala
- Subbab: Membaca dan menggambar denah berskala
- TP: Menentukan jarak sebenarnya berdasarkan denah dan skala`,
    jumlahSoal: 15,
  },
  {
    name: 'Bahasa Indonesia SMA Kelas 10 (25 Soal)',
    info: {
      mapel: 'Bahasa Indonesia',
      kelas: '10',
      tingkatan: 'SMA / Menengah Atas',
    },
    materiText: `Bab 1: Mengungkap Fakta Alam Melalui Teks Laporan Hasil Observasi (LHO)
- Subbab: Struktur teks dan kaidah kebahasaan LHO
- TP: Mengevaluasi akurasi informasi dan struktur teks laporan hasil observasi
Bab 2: Mengungkapkan Kritik Lewat Senyuman (Teks Anekdot)
- Subbab: Makna tersirat dan kaidah teks anekdot
- TP: Menganalisis pesan tersirat dan kritik sosial dalam teks anekdot
Bab 3: Menyusuri Nilai dalam Cerita Lintas Zaman (Hikayat & Cerpen)
- Subbab: Karakteristik nilai moral dan budaya hikayat
- TP: Membandingkan nilai-nilai kehidupan dalam hikayat dan cerpen modern`,
    jumlahSoal: 25,
  },
];
