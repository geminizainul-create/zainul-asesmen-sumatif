/**
 * Pustaka Diagram Edukasi Ilmiah dan Utilitas Konversi Gambar Jadi (SVG -> PNG Base64)
 * Mendukung Kurikulum Merdeka: Sains, Matematika, Biologi, Fisika, dan Geografi.
 */

export interface DiagramTemplate {
  id: string;
  title: string;
  category: string;
  svg: string;
}

export const EDUCATIONAL_DIAGRAM_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'rantai-makanan',
    title: 'Rantai Makanan Ekosistem Sawah',
    category: 'Biologi / IPA',
    svg: `<svg viewBox="0 0 650 320" xmlns="http://www.w3.org/2000/svg" font-family="'Times New Roman', serif">
      <rect width="650" height="320" fill="#ffffff" stroke="#000000" stroke-width="2"/>
      <text x="325" y="32" text-anchor="middle" font-size="16" font-weight="bold">DIAGRAM RANTAI MAKANAN EKOSISTEM SAWAH</text>
      
      <!-- Padi -->
      <g transform="translate(30, 80)">
        <rect width="100" height="90" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
        <text x="50" y="35" text-anchor="middle" font-size="13" font-weight="bold" fill="#15803d">PADI</text>
        <text x="50" y="55" text-anchor="middle" font-size="10" fill="#4b5563">(Produsen)</text>
        <path d="M50 75 Q40 60 50 45 Q60 60 50 75" fill="#22c55e"/>
      </g>
      
      <!-- Panah 1 -->
      <path d="M135 125 L160 125" stroke="#000000" stroke-width="2.5" marker-end="url(#arrow)"/>
      <polygon points="165,125 155,120 155,130" fill="#000000"/>

      <!-- Belalang -->
      <g transform="translate(170, 80)">
        <rect width="100" height="90" rx="8" fill="#fefce8" stroke="#ca8a04" stroke-width="2"/>
        <text x="50" y="35" text-anchor="middle" font-size="13" font-weight="bold" fill="#a16207">BELALANG</text>
        <text x="50" y="55" text-anchor="middle" font-size="10" fill="#4b5563">(Konsumen I)</text>
        <circle cx="50" cy="70" r="10" fill="#eab308"/>
      </g>

      <!-- Panah 2 -->
      <polygon points="305,125 295,120 295,130" fill="#000000"/>
      <line x1="275" y1="125" x2="300" y2="125" stroke="#000000" stroke-width="2.5"/>

      <!-- Katak -->
      <g transform="translate(310, 80)">
        <rect width="100" height="90" rx="8" fill="#ecfdf5" stroke="#059669" stroke-width="2"/>
        <text x="50" y="35" text-anchor="middle" font-size="13" font-weight="bold" fill="#047857">KATAK</text>
        <text x="50" y="55" text-anchor="middle" font-size="10" fill="#4b5563">(Konsumen II)</text>
        <circle cx="50" cy="70" r="10" fill="#10b981"/>
      </g>

      <!-- Panah 3 -->
      <polygon points="445,125 435,120 435,130" fill="#000000"/>
      <line x1="415" y1="125" x2="440" y2="125" stroke="#000000" stroke-width="2.5"/>

      <!-- Ular -->
      <g transform="translate(450, 80)">
        <rect width="90" height="90" rx="8" fill="#fff7ed" stroke="#ea580c" stroke-width="2"/>
        <text x="45" y="35" text-anchor="middle" font-size="13" font-weight="bold" fill="#c2410c">ULAR</text>
        <text x="45" y="55" text-anchor="middle" font-size="10" fill="#4b5563">(Konsumen III)</text>
        <circle cx="45" cy="70" r="10" fill="#f97316"/>
      </g>

      <!-- Panah 4 -->
      <polygon points="575,125 565,120 565,130" fill="#000000"/>
      <line x1="545" y1="125" x2="570" y2="125" stroke="#000000" stroke-width="2.5"/>

      <!-- Elang -->
      <g transform="translate(580, 80)">
        <rect width="60" height="90" rx="8" fill="#fef2f2" stroke="#dc2626" stroke-width="2"/>
        <text x="30" y="35" text-anchor="middle" font-size="12" font-weight="bold" fill="#b91c1c">ELANG</text>
        <text x="30" y="55" text-anchor="middle" font-size="9" fill="#4b5563">(Puncak)</text>
        <circle cx="30" cy="70" r="8" fill="#ef4444"/>
      </g>

      <!-- Pengurai Bottom Box -->
      <g transform="translate(180, 205)">
        <rect width="290" height="60" rx="6" fill="#f8fafc" stroke="#475569" stroke-width="1.5" stroke-dasharray="4"/>
        <text x="145" y="28" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e293b">PENGURAI / DEKOMPOSER (Bakteri &amp; Jamur)</text>
        <text x="145" y="46" text-anchor="middle" font-size="10" fill="#64748b">Mengembalikan unsur hara ke tanah untuk diserap produsen</text>
      </g>

      <path d="M590 180 L590 235 L475 235" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4" fill="none"/>
      <path d="M80 180 L80 235 L175 235" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4" fill="none"/>
      <text x="325" y="300" text-anchor="middle" font-size="10" font-style="italic">Gambar: Aliran energi dan materi dalam rantai makanan</text>
    </svg>`,
  },
  {
    id: 'sel-tumbuhan',
    title: 'Penampang Sel Tumbuhan',
    category: 'Biologi / IPA',
    svg: `<svg viewBox="0 0 650 350" xmlns="http://www.w3.org/2000/svg" font-family="'Times New Roman', serif">
      <rect width="650" height="350" fill="#ffffff" stroke="#000000" stroke-width="2"/>
      <text x="325" y="30" text-anchor="middle" font-size="16" font-weight="bold">STRUKTUR PENAMPANG SEL TUMBUHAN</text>
      
      <!-- Dinding Sel Luar -->
      <polygon points="120,60 480,60 520,290 80,290" fill="#dcfce7" stroke="#15803d" stroke-width="4"/>
      <!-- Membran Sel Dalam -->
      <polygon points="128,70 472,70 510,280 90,280" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
      
      <!-- Vakuola Tengah Besar -->
      <ellipse cx="300" cy="180" rx="110" ry="60" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
      <text x="300" y="185" text-anchor="middle" font-size="13" font-weight="bold" fill="#0369a1">Vakuola Besar</text>

      <!-- Inti Sel / Nukleus -->
      <circle cx="170" cy="130" r="35" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
      <circle cx="170" cy="130" r="14" fill="#b45309"/>
      <text x="170" y="180" text-anchor="middle" font-size="11" font-weight="bold">Nukleus</text>

      <!-- Kloroplas -->
      <ellipse cx="440" cy="120" rx="28" ry="16" fill="#86efac" stroke="#15803d" stroke-width="1.5"/>
      <text x="440" y="125" text-anchor="middle" font-size="10" font-weight="bold">Kloroplas</text>
      
      <ellipse cx="430" cy="230" rx="28" ry="16" fill="#86efac" stroke="#15803d" stroke-width="1.5"/>
      <text x="430" y="235" text-anchor="middle" font-size="10" font-weight="bold">Kloroplas</text>

      <!-- Mitokondria -->
      <ellipse cx="160" cy="230" rx="24" ry="14" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5"/>
      <text x="160" y="234" text-anchor="middle" font-size="9" font-weight="bold">Mitokondria</text>

      <!-- Label Penunjuk Kiri -->
      <line x1="60" y1="100" x2="122" y2="90" stroke="#000000" stroke-width="1.5"/>
      <text x="55" y="104" text-anchor="end" font-size="12" font-weight="bold">Dinding Sel</text>

      <line x1="60" y1="140" x2="135" y2="130" stroke="#000000" stroke-width="1.5"/>
      <text x="55" y="144" text-anchor="end" font-size="12" font-weight="bold">Nukleus</text>

      <!-- Label Penunjuk Kanan -->
      <line x1="570" y1="120" x2="470" y2="120" stroke="#000000" stroke-width="1.5"/>
      <text x="575" y="124" text-anchor="start" font-size="12" font-weight="bold">Kloroplas</text>

      <line x1="570" y1="180" x2="410" y2="180" stroke="#000000" stroke-width="1.5"/>
      <text x="575" y="184" text-anchor="start" font-size="12" font-weight="bold">Vakuola</text>

      <text x="325" y="325" text-anchor="middle" font-size="10" font-style="italic">Gambar: Organel utama penyusun sel tumbuhan</text>
    </svg>`,
  },
  {
    id: 'fotosintesis',
    title: 'Mekanisme Proses Fotosintesis',
    category: 'Biologi / IPA',
    svg: `<svg viewBox="0 0 650 320" xmlns="http://www.w3.org/2000/svg" font-family="'Times New Roman', serif">
      <rect width="650" height="320" fill="#ffffff" stroke="#000000" stroke-width="2"/>
      <text x="325" y="30" text-anchor="middle" font-size="16" font-weight="bold">DIAGRAM PROSES FOTOSINTESIS PADA TUMBUHAN</text>

      <!-- Matahari -->
      <circle cx="80" cy="80" r="30" fill="#fde047" stroke="#ca8a04" stroke-width="2"/>
      <text x="80" y="85" text-anchor="middle" font-size="11" font-weight="bold">Cahaya Matahari</text>
      <!-- Sinar -->
      <line x1="115" y1="95" x2="230" y2="140" stroke="#eab308" stroke-width="2" stroke-dasharray="4"/>

      <!-- Daun Utama -->
      <path d="M220 180 C240 100 380 90 420 160 C400 240 260 250 220 180 Z" fill="#86efac" stroke="#16a34a" stroke-width="3"/>
      <line x1="220" y1="180" x2="420" y2="160" stroke="#15803d" stroke-width="2"/>
      <text x="320" y="165" text-anchor="middle" font-size="14" font-weight="bold" fill="#14532d">Klorofil dalam Daun</text>

      <!-- Masukan CO2 -->
      <text x="140" y="210" font-size="13" font-weight="bold">Karbon Dioksida (CO₂)</text>
      <line x1="200" y1="205" x2="245" y2="195" stroke="#000000" stroke-width="2"/>
      <polygon points="250,194 240,190 242,200" fill="#000000"/>

      <!-- Masukan Air dari Akar -->
      <text x="260" y="295" font-size="12" font-weight="bold">Air (H₂O) dari Tanah via Xilem</text>
      <line x1="330" y1="280" x2="330" y2="230" stroke="#0284c7" stroke-width="2.5"/>
      <polygon points="330,225 325,235 335,235" fill="#0284c7"/>

      <!-- Hasil Glukosa -->
      <line x1="400" y1="175" x2="480" y2="195" stroke="#000000" stroke-width="2"/>
      <polygon points="485,196 475,192 477,202" fill="#000000"/>
      <text x="495" y="200" font-size="13" font-weight="bold" fill="#b45309">Glukosa (C₆H₁₂O₆)</text>

      <!-- Hasil Oksigen -->
      <line x1="380" y1="130" x2="460" y2="105" stroke="#000000" stroke-width="2"/>
      <polygon points="465,103 455,103 460,113" fill="#000000"/>
      <text x="475" y="108" font-size="13" font-weight="bold" fill="#0284c7">Oksigen (O₂) Dilepaskan</text>

      <text x="325" y="310" text-anchor="middle" font-size="10" font-style="italic">Reaksi: 6CO₂ + 6H₂O + Cahaya → C₆H₁₂O₆ + 6O₂</text>
    </svg>`,
  },
  {
    id: 'organ-pernapasan',
    title: 'Sistem Pernapasan Manusia',
    category: 'Biologi / IPA',
    svg: `<svg viewBox="0 0 650 340" xmlns="http://www.w3.org/2000/svg" font-family="'Times New Roman', serif">
      <rect width="650" height="340" fill="#ffffff" stroke="#000000" stroke-width="2"/>
      <text x="325" y="30" text-anchor="middle" font-size="16" font-weight="bold">SISTEM ORGAN PERNAPASAN MANUSIA</text>

      <!-- Saluran Pernapasan -->
      <!-- Hidung / Rongga Hidung -->
      <circle cx="325" cy="70" r="18" fill="#fed7aa" stroke="#ea580c" stroke-width="2"/>
      <text x="420" y="75" font-size="12" font-weight="bold">1. Rongga Hidung (Menyaring debu)</text>
      <line x1="345" y1="70" x2="410" y2="72" stroke="#000" stroke-width="1.5"/>

      <!-- Faring & Laring -->
      <rect x="318" y="90" width="14" height="25" fill="#fdba74" stroke="#c2410c"/>
      <text x="420" y="105" font-size="12" font-weight="bold">2. Laring &amp; Pita Suara</text>
      <line x1="335" y1="102" x2="410" y2="105" stroke="#000" stroke-width="1.5"/>

      <!-- Trakea (Batang Tenggorokan) -->
      <rect x="317" y="120" width="16" height="50" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
      <line x1="317" y1="130" x2="333" y2="130" stroke="#475569"/>
      <line x1="317" y1="145" x2="333" y2="145" stroke="#475569"/>
      <line x1="317" y1="160" x2="333" y2="160" stroke="#475569"/>
      <text x="210" y="145" font-size="12" font-weight="bold" text-anchor="end">3. Trakea (Cincin Tulang Rawan)</text>
      <line x1="315" y1="145" x2="215" y2="145" stroke="#000" stroke-width="1.5"/>

      <!-- Bronkus & Paru-Paru Kiri/Kanan -->
      <path d="M317 170 L270 200" stroke="#000" stroke-width="3"/>
      <path d="M333 170 L380 200" stroke="#000" stroke-width="3"/>

      <!-- Paru-Paru Kiri -->
      <path d="M220 190 C200 240 210 280 280 280 C290 250 285 200 250 190 Z" fill="#fecdd3" stroke="#e11d48" stroke-width="2"/>
      <!-- Paru-Paru Kanan -->
      <path d="M430 190 C450 240 440 280 370 280 C360 250 365 200 400 190 Z" fill="#fecdd3" stroke="#e11d48" stroke-width="2"/>
      <text x="500" y="235" font-size="12" font-weight="bold">4. Paru-Paru (Pulmo)</text>
      <line x1="435" y1="230" x2="495" y2="235" stroke="#000" stroke-width="1.5"/>

      <!-- Alveolus Detail -->
      <circle cx="160" cy="245" r="25" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
      <text x="160" y="245" font-size="10" font-weight="bold" text-anchor="middle">Alveolus</text>
      <text x="160" y="260" font-size="8" text-anchor="middle">(Difusi O₂/CO₂)</text>
      <line x1="185" y1="245" x2="225" y2="245" stroke="#000" stroke-width="1.5" stroke-dasharray="3"/>

      <!-- Diafragma -->
      <path d="M190 300 Q325 285 460 300" stroke="#0f172a" stroke-width="3" fill="none"/>
      <text x="325" y="318" text-anchor="middle" font-size="12" font-weight="bold">5. Diafragma (Otot Pernapasan Dada &amp; Perut)</text>
    </svg>`,
  },
  {
    id: 'rangkaian-listrik',
    title: 'Rangkaian Listrik Seri vs Paralel',
    category: 'Fisika / IPA',
    svg: `<svg viewBox="0 0 650 320" xmlns="http://www.w3.org/2000/svg" font-family="'Times New Roman', serif">
      <rect width="650" height="320" fill="#ffffff" stroke="#000000" stroke-width="2"/>
      <text x="325" y="28" text-anchor="middle" font-size="15" font-weight="bold">PERBANDINGAN RANGKAIAN LISTRIK SERI DAN PARALEL</text>

      <!-- Kotak Seri Kiri -->
      <g transform="translate(30, 50)">
        <rect width="270" height="230" fill="#f8fafc" stroke="#475569" stroke-width="1.5"/>
        <text x="135" y="25" text-anchor="middle" font-size="13" font-weight="bold">Rangkaian Seri</text>
        
        <!-- Kabel Kotak -->
        <rect x="35" y="50" width="200" height="130" fill="none" stroke="#000000" stroke-width="2"/>
        
        <!-- Baterai Bawah -->
        <rect x="110" y="176" width="50" height="8" fill="#ffffff"/>
        <line x1="125" y1="170" x2="125" y2="190" stroke="#000" stroke-width="3"/>
        <line x1="140" y1="175" x2="140" y2="185" stroke="#000" stroke-width="1.5"/>
        <text x="133" y="205" text-anchor="middle" font-size="10">Baterai (V)</text>

        <!-- Lampu 1 & 2 Atas -->
        <rect x="70" y="46" width="30" height="8" fill="#ffffff"/>
        <circle cx="85" cy="50" r="10" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
        <text x="85" y="54" text-anchor="middle" font-size="9" font-weight="bold">L₁</text>

        <rect x="160" y="46" width="30" height="8" fill="#ffffff"/>
        <circle cx="175" cy="50" r="10" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
        <text x="175" y="54" text-anchor="middle" font-size="9" font-weight="bold">L₂</text>

        <text x="135" y="222" text-anchor="middle" font-size="10" font-style="italic">Arus listrik sama: I_total = I₁ = I₂</text>
      </g>

      <!-- Kotak Paralel Kanan -->
      <g transform="translate(340, 50)">
        <rect width="280" height="230" fill="#f8fafc" stroke="#475569" stroke-width="1.5"/>
        <text x="140" y="25" text-anchor="middle" font-size="13" font-weight="bold">Rangkaian Paralel</text>
        
        <!-- Cabang Paralel -->
        <line x1="40" y1="60" x2="240" y2="60" stroke="#000" stroke-width="2"/>
        <line x1="40" y1="120" x2="240" y2="120" stroke="#000" stroke-width="2"/>
        <line x1="40" y1="60" x2="40" y2="180" stroke="#000" stroke-width="2"/>
        <line x1="240" y1="60" x2="240" y2="180" stroke="#000" stroke-width="2"/>
        <line x1="40" y1="180" x2="240" y2="180" stroke="#000" stroke-width="2"/>

        <!-- Lampu Cabang 1 -->
        <rect x="125" y="56" width="30" height="8" fill="#ffffff"/>
        <circle cx="140" cy="60" r="10" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
        <text x="140" y="64" text-anchor="middle" font-size="9" font-weight="bold">L₁</text>

        <!-- Lampu Cabang 2 -->
        <rect x="125" y="116" width="30" height="8" fill="#ffffff"/>
        <circle cx="140" cy="120" r="10" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
        <text x="140" y="124" text-anchor="middle" font-size="9" font-weight="bold">L₂</text>

        <!-- Baterai Bawah -->
        <rect x="115" y="176" width="50" height="8" fill="#ffffff"/>
        <line x1="130" y1="170" x2="130" y2="190" stroke="#000" stroke-width="3"/>
        <line x1="145" y1="175" x2="145" y2="185" stroke="#000" stroke-width="1.5"/>
        <text x="138" y="205" text-anchor="middle" font-size="10">Baterai (V)</text>

        <text x="140" y="222" text-anchor="middle" font-size="10" font-style="italic">Tegangan sama: V_total = V₁ = V₂</text>
      </g>
    </svg>`,
  },
];

/**
 * Konversi kode string SVG menjadi PNG Data URL (Base64) menggunakan HTML5 Canvas
 */
export async function convertSvgToPngDataUrl(
  svgString: string,
  width = 650,
  height = 350
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      const svgClean = svgString.trim();
      const svgBlob = new Blob([svgClean], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        // Background putih bersih standar kertas ujian
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const pngUrl = canvas.toDataURL('image/png');
        URL.revokeObjectURL(url);
        resolve(pngUrl);
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };

      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Mencari diagram yang paling relevan dari pustaka bawaan berdasarkan kata kunci prompt
 */
export function findBestMatchingDiagram(promptText: string): DiagramTemplate | null {
  if (!promptText) return null;
  const lower = promptText.toLowerCase();

  if (lower.includes('rantai makanan') || lower.includes('ekosistem') || lower.includes('konsumen') || lower.includes('produsen') || lower.includes('jaring')) {
    return EDUCATIONAL_DIAGRAM_TEMPLATES.find((t) => t.id === 'rantai-makanan') || null;
  }
  if (lower.includes('sel tumbuhan') || lower.includes('dinding sel') || lower.includes('kloroplas') || lower.includes('vakuola')) {
    return EDUCATIONAL_DIAGRAM_TEMPLATES.find((t) => t.id === 'sel-tumbuhan') || null;
  }
  if (lower.includes('fotosintesis') || lower.includes('klorofil') || lower.includes('cahaya matahari') || lower.includes('glukosa')) {
    return EDUCATIONAL_DIAGRAM_TEMPLATES.find((t) => t.id === 'fotosintesis') || null;
  }
  if (lower.includes('pernapasan') || lower.includes('paru-paru') || lower.includes('trakea') || lower.includes('hidung') || lower.includes('alveolus')) {
    return EDUCATIONAL_DIAGRAM_TEMPLATES.find((t) => t.id === 'organ-pernapasan') || null;
  }
  if (lower.includes('listrik') || lower.includes('seri') || lower.includes('paralel') || lower.includes('baterai') || lower.includes('lampu') || lower.includes('arus')) {
    return EDUCATIONAL_DIAGRAM_TEMPLATES.find((t) => t.id === 'rangkaian-listrik') || null;
  }

  return null;
}

/**
 * Membuat diagram SVG edukatif berkualitas tinggi secara terstruktur jika AI offline
 */
export function generateFallbackSvgDiagram(title: string, promptText: string): string {
  const cleanTitle = (title || 'DIAGRAM / ILUSTRASI STIMULUS SOAL')
    .replace(/^cermati\s+(gambar|diagram|infografis)\s*(berikut)?/i, '')
    .replace(/untuk\s+menjawab\s+soal.*$/i, '')
    .trim()
    .toUpperCase() || 'DIAGRAM STIMULUS PEMBELAJARAN';

  const cleanPrompt = (promptText || '').replace(/^(\[|\()?(deskripsi|prompt)?\s*gambar\s*:?/i, '').replace(/(\]|\))?$/, '').trim();

  return `<svg viewBox="0 0 650 330" xmlns="http://www.w3.org/2000/svg" font-family="'Times New Roman', serif">
    <rect width="650" height="330" fill="#ffffff" stroke="#000000" stroke-width="2"/>
    
    <!-- Header Diagram -->
    <rect x="20" y="16" width="610" height="40" fill="#f8fafc" stroke="#334155" stroke-width="1.5" rx="4"/>
    <text x="325" y="41" text-anchor="middle" font-size="14" font-weight="bold" fill="#0f172a">${cleanTitle}</text>
    
    <!-- Area Ilustrasi Visual Kontekstual -->
    <g transform="translate(40, 75)">
      <!-- Kotak Komponen A -->
      <rect x="20" y="20" width="160" height="130" fill="#f0f9ff" stroke="#0284c7" stroke-width="2" rx="8"/>
      <rect x="35" y="35" width="130" height="45" fill="#e0f2fe" stroke="#38bdf8" rx="4"/>
      <text x="100" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="#0369a1">KOMPONEN 1</text>
      <text x="100" y="105" text-anchor="middle" font-size="10" fill="#0c4a6e">Variabel Masukan / Awal</text>
      <circle cx="100" cy="130" r="8" fill="#0284c7"/>

      <!-- Tanda Panah Hubungan / Alur -->
      <path d="M190 85 L250 85" stroke="#000000" stroke-width="3"/>
      <polygon points="255,85 242,79 242,91" fill="#000000"/>
      <text x="220" y="75" text-anchor="middle" font-size="10" font-style="italic">Proses</text>

      <!-- Kotak Komponen B -->
      <rect x="260" y="20" width="160" height="130" fill="#fefce8" stroke="#ca8a04" stroke-width="2" rx="8"/>
      <rect x="275" y="35" width="130" height="45" fill="#fef08a" stroke="#eab308" rx="4"/>
      <text x="340" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="#854d0e">KOMPONEN 2</text>
      <text x="340" y="105" text-anchor="middle" font-size="10" fill="#713f12">Interaksi &amp; Perubahan</text>
      <circle cx="340" cy="130" r="8" fill="#ca8a04"/>

      <!-- Tanda Panah Ke Hasil -->
      <path d="M430 85 L490 85" stroke="#000000" stroke-width="3"/>
      <polygon points="495,85 482,79 482,91" fill="#000000"/>
      <text x="460" y="75" text-anchor="middle" font-size="10" font-style="italic">Hasil</text>

      <!-- Kotak Komponen C (Hasil / Simpulan) -->
      <rect x="500" y="20" width="140" height="130" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" rx="8"/>
      <rect x="510" y="35" width="120" height="45" fill="#dcfce7" stroke="#4ade80" rx="4"/>
      <text x="570" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="#166534">HASIL AKHIR</text>
      <text x="570" y="105" text-anchor="middle" font-size="10" fill="#14532d">Kondisi Terukur</text>
      <circle cx="570" cy="130" r="8" fill="#16a34a"/>
    </g>

    <!-- Keterangan / Deskripsi Stimulus di Bawah -->
    <rect x="40" y="250" width="570" height="55" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" rx="6"/>
    <text x="55" y="272" font-size="10.5" font-weight="bold" fill="#334155">Keterangan Stimulus:</text>
    <text x="55" y="290" font-size="9.5" fill="#475569" font-style="italic">
      ${cleanPrompt ? (cleanPrompt.length > 90 ? cleanPrompt.substring(0, 87) + '...' : cleanPrompt) : 'Amati variabel, bagan alur, dan nilai yang tertera pada diagram di atas.'}
    </text>
  </svg>`;
}
