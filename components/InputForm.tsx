
import React, { useState } from 'react';
import { MaterialParams, Character, ESOGrade } from '../types';
import { Sparkles, Wand2, Users, MapPin, GraduationCap, ChevronRight } from 'lucide-react';

interface InputFormProps {
  onSubmit: (params: MaterialParams) => void;
  isGenerating: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isGenerating }) => {
  const [params, setParams] = useState<MaterialParams>({
    subject: 'Creació Literària',
    grade: '1r',
    characters: [
      { name: '', description: '' },
      { name: '', description: '' },
      { name: '', description: '' }
    ],
    scenario: '',
    settings: {
      temperature: 0.7,
      model: 'gemini-3-flash-preview'
    }
  });

  const updateCharacter = (index: number, field: keyof Character, value: string) => {
    const newChars = [...params.characters];
    newChars[index] = { ...newChars[index], [field]: value };
    setParams({ ...params, characters: newChars });
  };

  const isFormValid = params.characters.every(c => c.name && c.description) && params.scenario;

  return (
    <div className="w-full max-w-4xl space-y-8 animate-fade-in-up">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Generador de Narrativa ESO</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Protocol DUA i Bloom Activat</p>
            </div>
          </div>
          <div className="flex gap-4">
            <select 
              value={params.grade} 
              onChange={e => setParams({...params, grade: e.target.value as ESOGrade})}
              className="bg-slate-800 border-none rounded-xl px-4 py-2 font-bold text-xs outline-none"
            >
              <option value="1r">1r ESO</option>
              <option value="2n">2n ESO</option>
              <option value="3r">3r ESO</option>
              <option value="4t">4t ESO</option>
            </select>
          </div>
        </div>

        <div className="p-10 space-y-10">
          {/* Secció Personatges */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-blue-700">
              <Users className="w-5 h-5" />
              <h3 className="font-black uppercase tracking-widest text-sm">Els 3 Personatges Protagonistes</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {params.characters.map((char, i) => (
                <div key={i} className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 space-y-4 hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-md">{i+1}</span>
                    <input 
                      type="text"
                      placeholder="Nom del personatge"
                      value={char.name}
                      onChange={e => updateCharacter(i, 'name', e.target.value)}
                      className="bg-transparent border-b-2 border-slate-200 focus:border-blue-600 outline-none font-bold text-slate-800 w-full pb-1 text-sm"
                    />
                  </div>
                  <textarea 
                    placeholder="Breu descripció (personalitat, trets...)"
                    value={char.description}
                    onChange={e => updateCharacter(i, 'description', e.target.value)}
                    className="w-full bg-white rounded-xl p-4 border border-slate-100 text-xs text-slate-600 h-24 resize-none focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Secció Escenari */}
          <div className="space-y-6 pt-4 border-t border-slate-50">
            <div className="flex items-center gap-2 text-emerald-600">
              <MapPin className="w-5 h-5" />
              <h3 className="font-black uppercase tracking-widest text-sm">L'Escenari de la Història</h3>
            </div>
            <textarea 
              placeholder="Descriu on passa l'acció (un bosc encantat, una nau espacial, l'institut...)"
              value={params.scenario}
              onChange={e => setParams({...params, scenario: e.target.value})}
              className="w-full h-32 p-6 rounded-[2rem] border-2 border-slate-100 focus:border-blue-600 outline-none bg-slate-50 font-medium text-slate-700 transition-all text-sm resize-none"
            />
          </div>

          <button 
            onClick={() => onSubmit(params)}
            disabled={isGenerating || !isFormValid}
            className={`w-full py-8 rounded-[2.5rem] text-white font-black uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 ${isFormValid ? 'bg-blue-700 hover:bg-blue-800' : 'bg-slate-200 cursor-not-allowed'}`}
          >
            {isGenerating ? <Loader2 className="w-8 h-8 animate-spin" /> : <Wand2 className="w-8 h-8" />}
            {isGenerating ? 'Processant Didàctica...' : 'Generar Materials'}
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-8 text-slate-400 font-bold text-[9px] uppercase tracking-widest">
        <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> ESO Nivell {params.grade}</span>
        <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3" /> Calibri 12/14/18</span>
        <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3" /> Solucionari Inclòs</span>
      </div>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
