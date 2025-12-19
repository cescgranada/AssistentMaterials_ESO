import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { MaterialDisplay } from './components/StoryDisplay';
import { generateMaterialStream } from './services/geminiService';
import { MaterialParams, GeneratedMaterial } from './types';
import { GraduationCap, ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  const [material, setMaterial] = useState<GeneratedMaterial | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showMaterial, setShowMaterial] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateMaterial = async (params: MaterialParams) => {
    setIsGenerating(true);
    setError(null);
    setMaterial({ 
      general: "", 
      adapted: "", 
      pedagogical: "", 
      solGeneral: "", 
      solAdapted: "", 
      hasAdaptedVersion: false 
    });
    setShowMaterial(true);

    try {
      await generateMaterialStream(params, (update) => {
        setMaterial(update);
      });
    } catch (err: any) {
      setError(err.message || "Hi ha hagut un error inesperat en el disseny.");
      setShowMaterial(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setMaterial(null);
    setShowMaterial(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center">
      
      {!showMaterial && (
        <header className="mb-12 text-center max-w-2xl animate-fade-in-up">
          <div className="inline-flex items-center justify-center p-4 bg-blue-700 rounded-3xl shadow-xl shadow-blue-200 mb-6">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Assistent de Materials <span className="text-blue-700">ESO</span>
          </h1>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-left border-l-8 border-l-blue-700">
             <p className="text-slate-700 font-bold text-lg mb-2">
               Hola! Soc el teu expert en disseny didàctic.
             </p>
             <p className="text-slate-600 text-base leading-relaxed">
               Pujant un document, el podré analitzar i podràs triar quins temes vols treballar i amb quin detall.
             </p>
          </div>
        </header>
      )}

      <main className="w-full flex justify-center">
        {error && (
          <div className="fixed bottom-10 right-10 max-w-md bg-white border-l-8 border-red-600 p-6 rounded-lg shadow-2xl z-50 animate-fade-in-up">
            <div className="flex items-center gap-3 text-red-700 mb-2">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-black text-lg">Error Crític</h3>
            </div>
            <p className="text-slate-600 mb-4">{error}</p>
            <button onClick={() => setError(null)} className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 transition-colors w-full">Entès</button>
          </div>
        )}

        {!showMaterial ? (
          <InputForm onSubmit={handleGenerateMaterial} isGenerating={isGenerating} />
        ) : (
          material && <MaterialDisplay content={material} onReset={handleReset} />
        )}
      </main>

      <footer className="mt-20 border-t border-slate-200 pt-8 w-full max-w-4xl flex flex-col md:flex-row justify-between items-center text-slate-400 text-xs px-4">
        <p>© 2024 Generador Didàctic Pro • Creat per a docents compromesos</p>
        <div className="flex gap-6 mt-4 md:mt-0 font-bold uppercase tracking-widest">
          <span>Bloom</span>
          <span>Inclusió</span>
          <span>DUA</span>
        </div>
      </footer>
    </div>
  );
};

export default App;