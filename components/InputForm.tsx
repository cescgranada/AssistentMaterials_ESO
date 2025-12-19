import React, { useState, useRef } from 'react';
import { MaterialParams, ESOGrade, TheoryType, Subject, TopicConfig } from '../types';
import { FileText, CheckCircle, Accessibility, Upload, Loader2, ListTree, Check, X, FileUp, Sparkles, Wand2 } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
import { analyzeContentParts } from '../services/geminiService';

pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface InputFormProps {
  onSubmit: (params: MaterialParams) => void;
  isGenerating: boolean;
}

const SUBJECT_OPTIONS: Subject[] = ['Física', 'Química', 'Biologia', 'Geologia', 'Tecnologia', 'Matemàtiques', 'Llengua i Literatura'];

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isGenerating }) => {
  const [step, setStep] = useState<'setup' | 'topics'>('setup');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [params, setParams] = useState<MaterialParams>({
    subject: '',
    grade: '1r',
    topics: [],
    manualDescription: ''
  });
  
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    let text = "";
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
      } else if (ext === 'docx' || ext === 'doc') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        text = await file.text();
      }
      setFileContent(text);
    } catch (err) {
      alert("Error llegint el fitxer.");
    }
  };

  const handleStartAnalysis = async () => {
    if (!params.subject) {
      alert("Selecciona primer la matèria.");
      return;
    }
    if (!fileContent && !params.manualDescription) {
      alert("Siusplau, puja un fitxer o redacta el tema del material.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const analyzedParts = await analyzeContentParts(fileContent, params.manualDescription || "");
      const initialTopics: TopicConfig[] = analyzedParts.map((p, idx) => ({
        id: `topic-${idx}`,
        title: p.title,
        contentSnippet: p.snippet,
        isIncluded: true,
        isAdapted: false,
        theory: 'resum breu',
        systematizationCount: 3,
        extensionCount: 1
      }));

      setParams(prev => ({ ...prev, topics: initialTopics }));
      setStep('topics');
    } catch (error) {
      console.error(error);
      alert("No s'ha pogut analitzar el contingut.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateTopic = (id: string, updates: Partial<TopicConfig>) => {
    setParams(prev => ({
      ...prev,
      topics: prev.topics.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  if (step === 'setup') {
    return (
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-fade-in-up">
        <div className="bg-slate-900 p-10 text-white text-center">
          <div className="inline-flex bg-blue-600 p-4 rounded-3xl mb-6 shadow-xl shadow-blue-900/20"><Sparkles className="w-8 h-8" /></div>
          <h2 className="text-3xl font-black tracking-tight mb-2">Pas 1: Configuració</h2>
          <p className="text-slate-400 font-medium">Defineix el focus didàctic de la unitat.</p>
        </div>
        
        <div className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Matèria</label>
              <select 
                value={params.subject} 
                onChange={e => setParams(p => ({...p, subject: e.target.value as Subject}))}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none bg-slate-50 font-bold text-slate-800 transition-all cursor-pointer shadow-sm text-sm"
              >
                <option value="">Tria matèria...</option>
                {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Curs d'ESO</label>
              <select 
                value={params.grade} 
                onChange={e => setParams(p => ({...p, grade: e.target.value as ESOGrade}))}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none bg-slate-50 font-bold text-slate-800 transition-all cursor-pointer shadow-sm text-sm"
              >
                <option value="1r">1r d'ESO</option>
                <option value="2n">2n d'ESO</option>
                <option value="3r">3r d'ESO</option>
                <option value="4t">4t d'ESO</option>
              </select>
            </div>
          </div>

          <div className="space-y-8 pt-6 border-t border-slate-100">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Pujar document de referència</label>
              <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-[2rem] p-8 text-center transition-all cursor-pointer group hover:bg-blue-50 border-slate-200 hover:border-blue-400 ${fileName ? 'bg-blue-50 border-blue-400' : ''}`}>
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} />
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-4 rounded-2xl ${fileName ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'} transition-all`}>
                    <FileUp className="w-6 h-6" />
                  </div>
                  <p className={`font-black text-xs uppercase tracking-widest ${fileName ? 'text-blue-700' : 'text-slate-500'}`}>
                    {fileName ? `Fixter: ${fileName}` : 'Puja un PDF, Word o Text'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">O descriu el tema manualment</label>
              <textarea 
                value={params.manualDescription}
                onChange={e => setParams(p => ({...p, manualDescription: e.target.value}))}
                placeholder="Exemple: Vull treballar les cèl·lules eucariotes i procariotes amb un enfocament en els orgànuls..."
                className="w-full h-40 p-6 rounded-3xl border-2 border-slate-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none bg-slate-50 font-medium text-slate-700 transition-all shadow-sm resize-none text-sm leading-relaxed"
              />
            </div>
          </div>

          <button 
            onClick={handleStartAnalysis}
            disabled={isAnalyzing || (!fileContent && !params.manualDescription) || !params.subject}
            className="w-full py-6 rounded-3xl bg-blue-700 text-white font-black uppercase tracking-[0.25em] shadow-2xl shadow-blue-200 hover:bg-blue-800 disabled:bg-slate-200 disabled:shadow-none transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />}
            {isAnalyzing ? 'Analitzant Contingut...' : 'Analitzar i Continuar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-8 animate-fade-in-up pb-20">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-xl shadow-blue-100"><ListTree className="w-8 h-8" /></div>
          <div>
            <h3 className="font-black text-slate-900 text-2xl tracking-tight">Pas 2: Aprofundiment Didàctic</h3>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
              Personalitza cada apartat de la teva unitat
            </p>
          </div>
        </div>
        <button onClick={() => setStep('setup')} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-xs transition-all uppercase tracking-widest">Tornar enrere</button>
      </div>

      <div className="space-y-8">
        {params.topics.map((topic, idx) => (
          <div key={topic.id} className={`bg-white rounded-[3rem] shadow-2xl border-2 transition-all duration-500 overflow-hidden flex flex-col md:flex-row ${!topic.isIncluded ? 'opacity-40 grayscale border-transparent' : 'border-white'}`}>
            <div className={`p-10 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-50 flex flex-col justify-between ${!topic.isIncluded ? 'bg-slate-50' : 'bg-blue-50/30'}`}>
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg shadow-blue-100">Apartat {idx + 1}</span>
                  <button 
                    onClick={() => updateTopic(topic.id, { isIncluded: !topic.isIncluded })}
                    className={`p-2.5 rounded-2xl transition-all shadow-sm ${topic.isIncluded ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-500'}`}
                  >
                    {topic.isIncluded ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </button>
                </div>
                <h4 className="text-2xl font-black text-slate-900 leading-tight mb-4">{topic.title}</h4>
                <p className="text-slate-500 text-xs font-medium leading-relaxed italic border-l-4 border-blue-200 pl-4 py-1">"{topic.contentSnippet}"</p>
              </div>
              
              {topic.isIncluded && (
                <div className="mt-8 pt-8 border-t border-blue-100">
                  <div 
                    onClick={() => updateTopic(topic.id, { isAdapted: !topic.isAdapted })}
                    className={`p-5 rounded-2xl cursor-pointer flex items-center justify-center gap-4 transition-all border-2
                      ${topic.isAdapted ? 'bg-blue-700 border-blue-800 text-white shadow-xl shadow-blue-200' : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50'}`}
                  >
                    <Accessibility className="w-6 h-6" />
                    <span className="font-black text-[11px] uppercase tracking-[0.2em]">Adaptació DUA</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-10 md:w-2/3 space-y-10">
              {topic.isIncluded ? (
                <>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] block px-1">Nivell de Teoria i Visuals</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(['cap', 'resum breu', 'esquemàtic', 'detallat'] as TheoryType[]).map(type => (
                        <button 
                          key={type}
                          onClick={() => updateTopic(topic.id, { theory: type })}
                          className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2
                            ${topic.theory === type 
                              ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105' 
                              : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
                        >
                          {type === 'detallat' ? 'Detallat (+Visuals)' : type}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] block px-1">Sistematització (X.Y.)</label>
                      <input type="number" min="0" value={topic.systematizationCount} onChange={e => updateTopic(topic.id, { systematizationCount: parseInt(e.target.value) || 0 })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 font-black text-3xl text-blue-700 outline-none focus:bg-white focus:border-blue-600 transition-all text-center shadow-inner" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] block px-1">Ampliació/Reptes</label>
                      <input type="number" min="0" value={topic.extensionCount} onChange={e => updateTopic(topic.id, { extensionCount: parseInt(e.target.value) || 0 })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 font-black text-3xl text-blue-700 outline-none focus:bg-white focus:border-blue-600 transition-all text-center shadow-inner" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-200 gap-4 py-16">
                  <div className="w-20 h-20 border-4 border-slate-50 rounded-full flex items-center justify-center"><X className="w-10 h-10" /></div>
                  <p className="font-black uppercase text-xs tracking-[0.3em]">Apartat exclòs de la unitat</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-12">
        <button onClick={() => onSubmit(params)} disabled={isGenerating || !params.topics.some(t => t.isIncluded)} className="w-full max-w-2xl py-8 rounded-[2.5rem] bg-blue-700 text-white text-2xl font-black shadow-2xl shadow-blue-200 hover:bg-blue-800 transition-all flex items-center justify-center gap-6 active:scale-95 disabled:bg-slate-200 disabled:shadow-none group">
          {isGenerating ? <Loader2 className="w-10 h-10 animate-spin" /> : <CheckCircle className="w-10 h-10 group-hover:scale-110 transition-transform" />}
          {isGenerating ? 'Dissenyant Unitat Didàctica...' : 'Generar Unitat i Visuals'}
        </button>
      </div>
    </div>
  );
};