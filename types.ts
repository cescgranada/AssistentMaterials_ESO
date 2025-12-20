
export type ESOGrade = '1r' | '2n' | '3r' | '4t';
export type TheoryType = 'cap' | 'resum breu' | 'esquemàtic' | 'detallat';
export type Subject = 'Física' | 'Química' | 'Biologia' | 'Geologia' | 'Tecnologia' | 'Matemàtiques' | 'Llengua i Literatura';

export interface TopicConfig {
  id: string;
  title: string;
  contentSnippet: string;
  isIncluded: boolean;
  isAdapted: boolean;
  theory: TheoryType;
  systematizationCount: number;
  extensionCount: number;
}

export interface MaterialParams {
  subject: Subject | '';
  grade: ESOGrade;
  topics: TopicConfig[];
  manualDescription: string;
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
}
