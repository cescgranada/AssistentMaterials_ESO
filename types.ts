
export type ESOGrade = '1r' | '2n' | '3r' | '4t';
export type Subject = 'Llengua i Literatura' | 'Creació Literària' | 'Teatre' | 'Anglès';

export interface Character {
  name: string;
  description: string;
}

export interface MaterialParams {
  subject: Subject | string;
  grade: ESOGrade;
  characters: Character[];
  scenario: string;
  settings: {
    temperature: number;
    model: string;
  };
}

export interface GeneratedMaterial {
  general: string;
  adapted: string;
  pedagogical: string;
  solGeneral: string;
  solAdapted: string;
  hasAdaptedVersion: boolean;
}

export interface MaterialState {
  material: GeneratedMaterial | null;
  isGenerating: boolean;
  error: string | null;
}
