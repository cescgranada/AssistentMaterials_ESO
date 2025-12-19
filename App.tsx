
import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { StoryDisplay } from './components/StoryDisplay';
import { generateMaterialStream } from './services/geminiService';
import { MaterialParams, GeneratedMaterial, MaterialState } from './types';
import { ShieldAlert, GraduationCap } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<MaterialState>({
    material: null,
    isGenerating: false,
    error: null
  });
  const [showResult, setShowResult] = useState(false);

  const handleGenerate = async (params: MaterialParams) => {
    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      error: null, 
      material: { general: '', adapted: '', pedagogical: '', solGeneral: '', solAdapted: '', hasAdaptedVersion: false } 
    }));
    setShowResult(true);

    try {
      await generateMaterialStream(params, (update) => {
        setState(prev => ({
          ...prev,
          material: prev.material ? { ...prev.material, ...update } : update
        }));
      });
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message || "Error generant el material.", isGenerating: false }));
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleReset = () => {
    setState({ material: null, isGenerating: false, error: null });
    setShowResult(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center">
      
      {!showResult && (
        <header className="mb-12 text-center max-w-2xl animate-fade-in-up">
          <div className="inline-flex items-center justify-center p-4 bg-blue-700 rounded-3xl shadow-xl mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Assistent Didàctic <span className="text-blue-700">ESO</span>
          </h1>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-left border-l-8 border-l-blue-700">
             <p className="text-slate-700 font-bold text-lg mb-2">Generació de materials acadèmics</p>
             <p className="text-slate-600 text-sm leading-relaxed">
               Crea apunts, exercicis numerats amb resultats immediats i materials adaptats DUA a partir dels teus documents o descripcions temàtiques.
             </p>
          </div>
        </header>
      )}

      <main className="w-full flex justify-center">
        {state.error && (
          <div className="fixed bottom-10 right-10 max-w-md bg-white border-l-8 border-red-600 p-6 rounded-lg shadow-2xl z-50 animate-fade-in-up">
            <div className="flex items-center gap-3 text-red-700 mb-2">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-black text-lg uppercase tracking-tight">Error Motor</h3>
            </div>
            <p className="text-slate-600 text-sm mb-4">{state.error}</p>
            <button onClick={() => setState(s => ({...s, error: null}))} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors w-full text-xs uppercase tracking-widest">Tancar</button>
          </div>
        )}

        {!showResult ? (
          <InputForm onSubmit={handleGenerate} isGenerating={state.isGenerating} />
        ) : (
          state.material && <StoryDisplay content={state.material} onReset={handleReset} />
        )}
      </main>

      <footer className="mt-20 border-t border-slate-200 pt-8 w-full max-w-4xl flex flex-col md:flex-row justify-between items-center text-slate-400 text-[10px] px-4 font-bold uppercase tracking-[0.2em]">
        <p>© 2024 Assistent Didàctic • ESO • DUA • Bloom</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <span>Calibri 12/14/18</span>
          <span>Protocol Mestre V4</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
