
import React, { useState, useRef } from 'react';
import { MaterialParams, ESOGrade, TheoryType, Subject, TopicConfig } from '../types';
import { CheckCircle, Accessibility, Loader2, ListTree, Check, X, FileUp, Sparkles, Wand2, Settings2, SlidersHorizontal, Trash2 } from 'lucide-react';
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [params, setParams] = useState<MaterialParams>({
    subject: '',
    grade: '1r',
    topics: [],
    manualDescription: '',
    settings: {
      temperature: 0.1,
      model: 'gemini-3-pro-preview'
    }
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileName(null);
    setFileContent("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleStartAnalysis = async () => {
    if (!params.subject || (!fileContent && !params.manualDescription)) return;
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
      alert("Error d'anàlisi del document.");
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

  const formatBlocTitle = (title: string, index: number) => {
    if (index === 0) return title;
    // Elimina números previs i posa el nou índex (index. Títol)
    const cleanTitle = title.replace(/^\d+[\s.]*/, '');
    return `${index}. ${cleanTitle}`;
  };

  if (step === 'setup') {
    return (
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-fade-in-up">
        <div className="bg-slate-900 p-10 text-white text-center">
          <div className="inline-flex bg-blue-600 p-4 rounded-3xl mb-6 shadow-xl"><Sparkles className="w-8 h-8" /></div>
          <h2 className="text-3xl font-black tracking-tight mb-2 uppercase">Configuració Unitat ESO</h2>
          <p className="text-slate-400 font-medium tracking-wide">Fidelitat absoluta al currículum oficial.</p>
        </div>
        
        <div className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Matèria</label>
              <select 
                value={params.subject} 
                onChange={e => setParams(p => ({...p, subject: e.target.value as Subject}))}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none bg-slate-50 font-bold text-slate-800 transition-all text-sm"
              >
                <option value="">Tria matèria...</option>
                {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Curs</label>
              <select 
                value={params.grade} 
                onChange={e => setParams(p => ({...p, grade: e.target.value as ESOGrade}))}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none bg-slate-50 font-bold text-slate-800 transition-all text-sm"
              >
                <option value="1r">1r d'ESO</option>
                <option value="2n">2n d'ESO</option>
                <option value="3r">3r d'ESO</option>
                <option value="4t">4t d'ESO</option>
              </select>
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-slate-50">
             <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] hover:text-blue-700 transition-colors"
            >
              <Settings2 className="w-4 h-4" />
              {showAdvanced ? 'Amagar paràmetres IA' : 'Paràmetres IA Avançats'}
            </button>

            {showAdvanced && (
              <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 space-y-6 animate-fade-in-up">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Temperatura: {params.settings.temperature}</label>
                    <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.1" 
                    value={params.settings.temperature} 
                    onChange={e => setParams(p => ({...p, settings: {...p.settings, temperature: parseFloat(e.target.value)}}))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Model de Generació</label>
                  <select 
                    value={params.settings.model} 
                    onChange={e => setParams(p => ({...p, settings: {...p.settings, model: e.target.value as any}}))}
                    className="w-full p-3 rounded-xl border-2 border-white focus:border-blue-600 outline-none bg-white font-bold text-slate-800 text-xs shadow-sm"
                  >
                    <option value="gemini-3-pro-preview">Gemini 3 Pro (Recomanat)</option>
                    <option value="gemini-3-flash-preview">Gemini 3 Flash (Ràpid)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8 pt-6 border-t border-slate-100">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Document de suport (PDF/DOC)</label>
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className={`relative border-2 border-dashed rounded-[2rem] p-8 text-center transition-all cursor-pointer group hover:bg-blue-50 border-slate-200 hover:border-blue-400 ${fileName ? 'bg-blue-50 border-blue-400' : ''}`}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} />
                <div className="flex flex-col items-center gap-2">
                  <FileUp className={`w-8 h-8 ${fileName ? 'text-blue-600' : 'text-slate-300'}`} />
                  <p className="font-black text-[10px] uppercase tracking-widest text-slate-600 max-w-full truncate px-4">
                    {fileName || 'Pujar apunts o llibre'}
                  </p>
                </div>
                {fileName && (
                  <button 
                    onClick={removeFile}
                    className="absolute top-4 right-4 p-2 bg-white rounded-xl shadow-md text-red-500 hover:bg-red-50 transition-all border border-red-100 active:scale-90"
                    title="Eliminar fitxer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">O descriu el tema manualment</label>
              <textarea 
                value={params.manualDescription}
                onChange={e => setParams(p => ({...p, manualDescription: e.target.value}))}
                placeholder="Ex: Unitat sobre cinemàtica: MRU, MRUA i gràfics..."
                className="w-full h-32 p-6 rounded-[2rem] border-2 border-slate-100 focus:border-blue-600 outline-none bg-slate-50 font-medium text-slate-700 transition-all text-sm resize-none"
              />
            </div>
          </div>

          <button 
            onClick={handleStartAnalysis}
            disabled={isAnalyzing || (!fileContent && !params.manualDescription) || !params.subject}
            className="w-full py-6 rounded-3xl bg-blue-700 text-white font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-blue-800 disabled:bg-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />}
            {isAnalyzing ? 'Analitzant document...' : 'Analitzar i continuar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-8 animate-fade-in-up pb-20">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-xl"><ListTree className="w-8 h-8" /></div>
          <div>
            <h3 className="font-black text-slate-900 text-2xl tracking-tight uppercase">Estructura del Material</h3>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Defineix el nivell de cada apartat</p>
          </div>
        </div>
        <button onClick={() => setStep('setup')} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-xs transition-all uppercase tracking-widest border border-slate-200">Enrere</button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {params.topics.map((topic, idx) => (
          <div key={topic.id} className={`bg-white rounded-[3rem] shadow-2xl border-2 transition-all flex flex-col md:flex-row overflow-hidden ${!topic.isIncluded ? 'opacity-40 grayscale border-transparent' : 'border-white'}`}>
            <div className="p-10 md:w-1/3 border-r border-slate-50 bg-blue-50/10">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">Bloc {idx + 1}</span>
                <button onClick={() => updateTopic(topic.id, { isIncluded: !topic.isIncluded })} className="p-2 rounded-xl bg-white text-blue-600 shadow-sm border border-slate-100 transition-all active:scale-90">
                  {topic.isIncluded ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-4 leading-tight">
                {formatBlocTitle(topic.title, idx + 1)}
              </h4>
              <p className="text-slate-500 text-xs italic font-medium leading-relaxed">"{topic.contentSnippet}"</p>
              
              {topic.isIncluded && (
                <div onClick={() => updateTopic(topic.id, { isAdapted: !topic.isAdapted })} className={`mt-8 p-4 rounded-2xl cursor-pointer flex items-center justify-center gap-3 transition-all border-2 ${topic.isAdapted ? 'bg-blue-700 border-blue-800 text-white shadow-xl' : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50'}`}>
                  <Accessibility className="w-5 h-5" />
                  <span className="font-black text-[10px] uppercase tracking-[0.2em]">Inclusió DUA</span>
                </div>
              )}
            </div>
            
            <div className="p-10 md:w-2/3 space-y-10">
              {topic.isIncluded && (
                <>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] block">Nivell de Teoria i Visuals</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(['cap', 'resum breu', 'esquemàtic', 'detallat'] as TheoryType[]).map(type => (
                        <button key={type} onClick={() => updateTopic(topic.id, { theory: type })} className={`px-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${topic.theory === type ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] block">Problemes X.Y. (Base)</label>
                      <input type="number" min="0" value={topic.systematizationCount} onChange={e => updateTopic(topic.id, { systematizationCount: parseInt(e.target.value) || 0 })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 font-black text-4xl text-blue-700 text-center focus:bg-white focus:border-blue-600 transition-all outline-none" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] block">Exercicis de Repte</label>
                      <input type="number" min="0" value={topic.extensionCount} onChange={e => updateTopic(topic.id, { extensionCount: parseInt(e.target.value) || 0 })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 font-black text-4xl text-blue-700 text-center focus:bg-white focus:border-blue-600 transition-all outline-none" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-12">
        <button onClick={() => onSubmit(params)} disabled={isGenerating || !params.topics.some(t => t.isIncluded)} className="w-full max-w-2xl py-8 rounded-[3rem] bg-blue-700 text-white text-2xl font-black shadow-2xl hover:bg-blue-800 transition-all flex items-center justify-center gap-6 active:scale-95 disabled:bg-slate-200 group uppercase tracking-[0.3em]">
          {isGenerating ? <Loader2 className="w-10 h-10 animate-spin" /> : <CheckCircle className="w-10 h-10 group-hover:scale-110 transition-transform" />}
          {isGenerating ? 'Generant Material...' : 'Generar Unitat Didàctica'}
        </button>
      </div>
    </div>
  );
};
