export type SoalType = 
  | 'Pilihan Ganda' 
  | 'PG Kompleks' 
  | 'Menjodohkan' 
  | 'Benar-Salah' 
  | 'Uraian Pendek' 
  | 'Uraian';

export type LevelType = 'Mudah' | 'Sedang' | 'Sulit';

export type StimulusMode = 'dengan' | 'tanpa';

export type GayaGambar = 'Berwarna' | 'Hitam Putih';

export interface SoalConfigItem {
  enabled: boolean;
  level: LevelType;
  nomor: string;
}

export type SoalDetailsMap = Record<SoalType, SoalConfigItem>;

export interface PacketData {
  id: string;
  packetNumber: number;
  materi: string;
  tujuan: string;
  stimulusMode: StimulusMode;
  useGambar: boolean;
  gaya: GayaGambar;
  jumlahParagraf: string;
  soalDetails: SoalDetailsMap;
}

export interface GeneralInfo {
  mapel: string;
  kelas: string;
  tingkatan: string;
}

export type KelengkapanType = 
  | 'Materi Esensial' 
  | 'Kisi-Kisi' 
  | 'Kunci dan Skor Jawaban' 
  | 'Kartu Soal'
  | 'Telaah Soal';

export interface RecommendationRow {
  packetNumber: number;
  bab: string;
  sub: string;
  type: string;
  level: LevelType;
  numbers: string;
  stimulusDesc: string;
}

export interface FixedMappingItem {
  type: string;
  level: LevelType;
  formType: SoalType;
}

export interface ExportDataFormat {
  mapel: string;
  kelas: string;
  tingkatan: string;
  packets: Array<{
    materi: string;
    tujuan: string;
    stimulusMode: StimulusMode;
    useGambar: boolean;
    gaya: GayaGambar;
    jumlahParagraf: string;
    soalDetails: Array<{
      jenis: string;
      nomor: string;
      level: LevelType;
    }>;
  }>;
}
