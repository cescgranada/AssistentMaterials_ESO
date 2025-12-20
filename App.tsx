import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { MaterialDisplay } from './components/MaterialDisplay';
import { MaterialParams, GeneratedMaterial } from './types';
import { generateEducationalMaterial } from './services/geminiService';
import { GraduationCap } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<'setup' | 'topics' | 'result'>('setup');
  const [isGenerating, setIsGenerating] = useState(false);
  const [params, setParams] = useState<MaterialParams | null>(null);
  const [result, setResult] = useState<GeneratedMaterial | null>(null);

  const handleSubmit = async (p: MaterialParams) => {
    setParams(p);
    setIsGenerating(true);
    try {
      const generated = await generateEducationalMaterial(p);
      setResult(generated);
      setStep('result');
    } catch (error) {
      console.error(error);
      alert("Error generant el material. Revisa la clau API a l'entorn.");
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setStep('setup');
    setResult(null);
    setParams(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 py-4 px-8 flex items-center justify-between no-print sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-slate-900 tracking-tighter uppercase text-sm">Assistent Didàctic <span className="text-blue-600">ESO</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generador de Materials d'Aprenentatge</p>
          </div>
        </div>
        {step !== 'setup' && (
          <button onClick={reset} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
            Nova Unitat
          </button>
        )}
      </nav>

      <main className="flex-grow flex flex-col items-center py-12 px-4">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="text-center animate-pulse">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Preparant Materials Didàctics</h2>
              <p className="text-slate-400 font-medium text-sm">Dissenyant exercicis i taules curriculars...</p>
            </div>
          </div>
        ) : (
          <>
            {(step === 'setup' || step === 'topics') && (
              <InputForm 
                onSubmit={handleSubmit} 
                isGenerating={false} 
                initialParams={params}
                initialStep={step}
                onStepChange={(s) => setStep(s)}
              />
            )}
            {step === 'result' && result && (
              <MaterialDisplay 
                content={result} 
                onReset={reset} 
                onBackToEdit={() => setStep('topics')}
              />
            )}
          </>
        )}
      </main>

      <footer className="py-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.5em] no-print">
        Protocol Didàctic V2025 • Gemini AI
      </footer>
    </div>
  );
};

export default App;