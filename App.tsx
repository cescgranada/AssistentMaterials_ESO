
import React, { useState } from 'react';
import { Sparkles, User, MapPin, BookOpen, Send, RefreshCcw } from 'lucide-react';
import { StoryConfig, StoryState } from './types';
import { generateStory } from './services/geminiService';
import ReactMarkdown from 'react-markdown';

const App: React.FC = () => {
  const [config, setConfig] = useState<StoryConfig>({
    name1: '',
    name2: '',
    name3: '',
    description: '',
    setting: ''
  });

  const [state, setState] = useState<StoryState>({
    content: '',
    isGenerating: false,
    error: null
  });

  const handleGenerate = async () => {
    if (!config.name1 || !config.name2 || !config.name3 || !config.setting) {
      setState(s => ({ ...s, error: "Si us plau, omple tots els camps dels personatges i l'escenari." }));
      return;
    }

    setState({ content: '', isGenerating: true, error: null });
    try {
      const story = await generateStory(config);
      setState({ content: story, isGenerating: false, error: null });
    } catch (err: any) {
      setState({ content: '', isGenerating: false, error: err.message });
    }
  };

  const isFormValid = config.name1 && config.name2 && config.name3 && config.setting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12 animate-fade">
          <div className="inline-flex p-3 bg-indigo-600 rounded-2xl shadow-lg mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Creador d' <span className="text-indigo-600">Històries</span>
          </h1>
          <p className="mt-4 text-slate-600 font-medium">Defineix els teus protagonistes i deixa que la màgia de la IA faci la resta.</p>
        </header>

        {!state.content ? (
          <div className="glass-card rounded-[2rem] shadow-xl p-8 md:p-10 animate-fade">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                  <User className="w-3 h-3" /> Personatge 1
                </label>
                <input 
                  type="text" 
                  value={config.name1}
                  onChange={e => setConfig({...config, name1: e.target.value})}
                  placeholder="Ex: Marc el Guerrer"
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                  <User className="w-3 h-3" /> Personatge 2
                </label>
                <input 
                  type="text" 
                  value={config.name2}
                  onChange={e => setConfig({...config, name2: e.target.value})}
                  placeholder="Ex: Laia la Maga"
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                  <User className="w-3 h-3" /> Personatge 3
                </label>
                <input 
                  type="text" 
                  value={config.name3}
                  onChange={e => setConfig({...config, name3: e.target.value})}
                  placeholder="Ex: Drac Ruffy"
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium transition-all"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                  <MapPin className="w-3 h-3" /> Escenari
                </label>
                <input 
                  type="text" 
                  value={config.setting}
                  onChange={e => setConfig({...config, setting: e.target.value})}
                  placeholder="Ex: Un bosc encantat sota la llum de la lluna blava"
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                  <BookOpen className="w-3 h-3" /> Breu Descripció / Trama
                </label>
                <textarea 
                  value={config.description}
                  onChange={e => setConfig({...config, description: e.target.value})}
                  placeholder="De què tractarà la història? Ex: Un viatge per trobar un tresor perdut..."
                  className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium transition-all resize-none"
                />
              </div>
            </div>

            {state.error && (
              <p className="mt-4 text-rose-500 text-sm font-bold bg-rose-50 p-3 rounded-lg border border-rose-100 italic">
                {state.error}
              </p>
            )}

            <button 
              onClick={handleGenerate}
              disabled={state.isGenerating || !isFormValid}
              className={`w-full mt-10 py-5 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-lg shadow-xl transition-all active:scale-95 ${isFormValid ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'}`}
            >
              {state.isGenerating ? (
                <RefreshCcw className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
              {state.isGenerating ? 'Generant el teu relat...' : 'Crear Història'}
            </button>
          </div>
        ) : (
          <div className="animate-fade">
            <div className="bg-white rounded-[2rem] shadow-2xl p-8 md:p-16 border border-slate-100 prose prose-indigo max-w-none prose-h1:text-4xl prose-h2:text-2xl prose-p:text-lg prose-p:leading-relaxed">
              <ReactMarkdown>{state.content}</ReactMarkdown>
            </div>
            
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => setState(s => ({...s, content: ''}))}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
              >
                <RefreshCcw className="w-5 h-5" /> Crear una altra història
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-16 text-center text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">
        IA STORYTELLER • CATALÀ • 2024
      </footer>
    </div>
  );
};

export default App;