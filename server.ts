import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini SDK on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Streaming endpoint for direct AI assessment generation using gemini-3.8-flash
app.post('/api/generate-exam', async (req: Request, res: Response) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Set SSE headers for streaming back to client
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah asisten pakar kurikulum dan ahli penyusun instrumen asesmen pembelajaran standar Kurikulum Merdeka di Indonesia. 
Ikuti seluruh aturan penulisan, struktur tata letak, format butir soal, penomoran manual murni, label kurung siku [A][B][C][D] untuk PG Kompleks, serta format tabel khusus untuk Benar-Salah dan Menjodohkan persis sesuai instruksi dalam prompt.
PENTING KHUSUS KUNCI PG KOMPLEKS: Pada Kunci Jawaban PG Kompleks, tuliskan seluruh pilihan kunci jawaban benar dalam satu baris yang sama sejajar (contoh: "2. Kunci: [A] dan [B]" atau "2. A dan B"), jangan memecah huruf kunci ke baris berikutnya.
PENTING & WAJIB: Jangan pernah mengosongkan, memotong, atau menghentikan respon sebelum seluruh lampiran kelengkapan (Kunci Jawaban & Pedoman Penskoran, Kisi-Kisi Soal dalam tabel Markdown, Kartu Soal Resmi, dan Rangkuman Materi Esensial) tersusun secara lengkap, utuh, dan tuntas sampai akhir.
Sajikan naskah soal yang berkualitas tinggi, valid, mendalam, bebas kesalahan ketik, dan ramah untuk langsung disalin ke Microsoft Word.`,
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Error generating exam content:', error);
    const errorMessage = error?.message || 'Gagal menghasilkan soal dengan AI';
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }
});

// Endpoint to generate finished stimulus images ("gambar jadi") from text prompts
app.post('/api/generate-stimulus-image', async (req: Request, res: Response) => {
  const { prompt, title, subject } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt deskripsi gambar diperlukan' });
  }

  // First strategy: Try Gemini Flash image generation
  try {
    const imageResp = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            text: `High-resolution educational diagram or scientific illustration for an Indonesian school test paper: ${prompt}. Clean white background, high contrast, crisp lines, textbook clarity, no watermark, no extraneous borders. Context: ${title || subject || 'Ujian Sekolah'}.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: '4:3',
        },
      },
    });

    for (const part of imageResp.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        return res.json({
          imageUrl: `data:${mime};base64,${part.inlineData.data}`,
          source: 'ai-image-model',
        });
      }
    }
  } catch (imgError: any) {
    console.warn('Image model note (falling back to Gemini SVG diagram generator):', imgError?.message || imgError);
  }

  // Second strategy: Use gemini-3.8-flash to generate a custom, precise, high-contrast SVG educational diagram
  try {
    const svgPrompt = `Anda adalah ahli grafis edukasi dan kurikulum sains/matematika/sosial Indonesia.
Buatlah kode SVG (Scalable Vector Graphics) lengkap, presisi, dan siap pakai untuk menggambarkan stimulus soal ujian berikut:
Deskripsi Gambar/Topik: "${prompt}"
Konteks: "${title || subject || 'Ujian Sekolah'}"

KETENTUAN SVG:
1. Mulai langsung dengan tag <svg viewBox="0 0 650 360" xmlns="http://www.w3.org/2000/svg" font-family="'Times New Roman', serif"> dan akhiri dengan </svg>.
2. Latar belakang wajib putih bersih: <rect width="650" height="360" fill="#ffffff" stroke="#000000" stroke-width="2"/>
3. Kontras tinggi, garis hitam tajam (stroke-width 2-3), cocok untuk dicetak hitam putih maupun berwarna pada naskah ujian F4 / Microsoft Word.
4. Berikan label-label teks dalam Bahasa Indonesia yang jelas, terbaca (font-size 11-14pt), dan informatif.
5. Bentuk visual (diagram, organ, siklus, grafik, skema, tabel, kartesius, atau ilustrasi) harus proporsional dan akurat secara ilmiah.
6. HANYA kembalikan kode SVG murni (atau di dalam blok \`\`\`xml atau \`\`\`svg). Tanpa penjelasan basa-basi di luar tag svg.`;

    const svgResp = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: svgPrompt,
      config: {
        temperature: 0.2,
      },
    });

    const outputText = svgResp.text || '';
    const svgMatch = outputText.match(/<svg[\s\S]*?<\/svg>/i);

    if (svgMatch && svgMatch[0]) {
      return res.json({
        svg: svgMatch[0],
        source: 'ai-svg-diagram',
      });
    }

    return res.status(500).json({ error: 'Gagal mengekstrak format visual diagram' });
  } catch (error: any) {
    console.error('Error generating stimulus image:', error);
    return res.status(500).json({
      error: error?.message || 'Gagal menghasilkan gambar jadi dengan AI',
    });
  }
});

// Setup Vite in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
