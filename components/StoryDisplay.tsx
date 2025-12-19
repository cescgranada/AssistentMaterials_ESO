
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, BookOpen, CheckCircle, Accessibility, Eye, Copy, Check, Loader2, ClipboardList, FileText, Printer, Code2, Terminal, Info, X, HelpCircle } from 'lucide-react';
import { GeneratedMaterial } from '../types';
import { generateAIImage } from '../services/geminiService';
import { downloadFile } from '../utils/exportUtils';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
    <div className="bg-white rounded-[2.5rem] max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up">
      <div className="bg-blue-700 p-8 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-8 h-8" />
          <h3 className="text-2xl font-black uppercase tracking-tight">Guia d'Ús dels Formats</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
        <section className="space-y-4">
          <h4 className="font-black text-blue-700 uppercase tracking-widest text-sm flex items-center gap-2">
            <Code2 className="w-5 h-5" /> 🧬 Overleaf (LaTeX)
          </h4>
          <div className="bg-slate-50 p-6 rounded-2xl text-sm text-slate-600 space-y-2 border border-slate-100">
            <p>1. Vés a <strong>overleaf.com</strong> i inicia sessió.</p>
            <p>2. Clica a <strong>"New Project"</strong> i selecciona <strong>"Blank Project"</strong>.</p>
            <p>3. Selecciona tot el text del fitxer <em>main.tex</em> que surt per defecte i esborra'l.</p>
            <p>4. Enganxa el codi generat al botó d'Overleaf i clica a <strong>"Recompile"</strong>.</p>
          </div>
        </section>
        
        <section className="space-y-4">
          <h4 className="font-black text-emerald-600 uppercase tracking-widest text-sm flex items-center gap-2">
            <Terminal className="w-5 h-5" /> 🐍 Google Colab (Notebook)
          </h4>
          <div className="bg-slate-50 p-6 rounded-2xl text-sm text-slate-600 space-y-2 border border-slate-100">
            <p>1. Vés a <strong>colab.research.google.com</strong>.</p>
            <p>2. Selecciona <strong>"Nuevo cuaderno"</strong>.</p>
            <p>3. El format generat és un fitxer .ipynb que pots pujar directament des del menú <em>Archivo > Subir bloc de notas</em>.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="font-black text-slate-700 uppercase tracking-widest text-sm flex items-center gap-2">
            <FileText className="w-5 h-5" /> 📄 Word / Markdown
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed pl-7">
            Copia el contingut o descarrega el fitxer .md. Pots obrir-lo directament amb Microsoft Word i mantindrà la jerarquia de títols per a una edició ràpida.
          </p>
        </section>
      </div>
      <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
        <button onClick={onClose} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 shadow-lg">Entesos, tancar guia</button>
      </div>
    </div>
  </div>
);

interface AIVisualProps {
  prompt: string;
}

const AIVisual: React.FC<AIVisualProps> = ({ prompt }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const generate = async () => {
      try {
        const url = await generateAIImage(prompt);
        if (mounted) {
          setImageUrl(url);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    };
    generate();
    return () => { mounted = false; };
  }, [prompt]);

  if (loading) return (
    <div className="my-8 p-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center gap-4 text-center animate-pulse">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generant suport visual IA...</p>
    </div>
  );

  if (error || !imageUrl) return null;

  return (
    <div className="my-10">
      <div className="rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl bg-slate-100">
        <img src={imageUrl} alt={prompt} className="w-full h-auto" />
      </div>
      <p className="mt-3 text-center text-slate-400 text-[10px] font-bold italic">{prompt}</p>
    </div>
  );
};

interface MaterialDisplayProps {
  content: GeneratedMaterial;
  onReset: () => void;
}

type TabType = 'general' | 'adapted' | 'pedagogical' | 'solGeneral' | 'solAdapted';

export const StoryDisplay: React.FC<MaterialDisplayProps> = ({ content, onReset }) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const getActiveContent = () => {
    switch (activeTab) {
      case 'general': return content.general;
      case 'adapted': return content.adapted;
      case 'pedagogical': return content.pedagogical;
      case 'solGeneral': return content.solGeneral;
      case 'solAdapted': return content.solAdapted;
      default: return content.general;
    }
  };

  const currentRawContent = getActiveContent();

  const handleDownload = (format: 'md' | 'tex' | 'ipynb') => {
    const text = currentRawContent.replace('[MAIN_TITLE]', '').trim();
    let filename = `material-eso-${activeTab}`;
    let mime = "text/plain";
    let exportText = text;

    if (format === 'md') {
      filename += ".md";
      mime = "text/markdown";
    } else if (format === 'tex') {
      filename += ".tex";
      exportText = `\\documentclass[12pt]{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage[margin=1in]{geometry}\n\\begin{document}\n${text.replace(/#/g, '\\section')}\n\\end{document}`;
    } else if (format === 'ipynb') {
      filename += ".ipynb";
      mime = "application/x-ipynb+json";
      exportText = JSON.stringify({
        cells: [{ cell_type: "markdown", metadata: {}, source: text.split('\n').map(l => l + '\n') }],
        metadata: { kernelspec: { display_name: "Python 3", language: "python", name: "python3" } },
        nbformat: 4, nbformat_minor: 0
      });
    }

    downloadFile(exportText, filename, mime);
  };

  const renderContent = (text: string) => {
    if (!text) return <p className="text-slate-400 italic">Generant contingut...</p>;
    
    const parts = text.split(/(\[VISUAL:.*?\])/g);
    return parts.map((part, i) => {
      const visualMatch = part.match(/\[VISUAL:(.*?)\]/);
      if (visualMatch) return <AIVisual key={i} prompt={visualMatch[1].trim()} />;
      
      const isMainTitle = part.includes('[MAIN_TITLE]');
      const cleanPart = part.replace('[MAIN_TITLE]', '').trim();

      return (
        <ReactMarkdown
          key={i}
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'Calibri, sans-serif', marginBottom: '25px', color: '#1e293b' }} {...props} />,
            h2: ({node, ...props}) => <h2 style={{ fontSize: '18.6px', fontWeight: 'bold', fontFamily: 'Calibri, sans-serif', marginTop: '30px', marginBottom: '15px', color: '#334155' }} {...props} />,
            p: ({node, ...props}) => <p style={{ fontSize: '16px', fontWeight: 'normal', fontFamily: 'Calibri, sans-serif', marginBottom: '15px', lineHeight: '1.6' }} {...props} />,
            ul: ({node, ...props}) => <ul className="list-none ml-0 mb-6 space-y-3" {...props} />,
            li: ({node, ...props}) => <li style={{ fontSize: '16px', fontWeight: 'normal', fontFamily: 'Calibri, sans-serif' }} {...props} />,
            table: ({node, ...props}) => (
              <div className="overflow-x-auto my-8 border border-slate-200 rounded-2xl shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 border-collapse" {...props} />
              </div>
            ),
            th: ({node, ...props}) => <th className="px-4 py-3 bg-slate-50 text-left text-[10px] font-black uppercase tracking-widest border border-slate-200 align-middle" {...props} />,
            td: ({node, ...props}) => <td className="px-4 py-3 text-xs border border-slate-200 align-top leading-normal" {...props} />,
          }}
        >
          {cleanPart}
        </ReactMarkdown>
      );
    });
  };

  return (
    <div className="w-full max-w-7xl animate-fade-in-up pb-20 px-4">
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      
      <div className="mb-6 flex flex-col gap-4 no-print">
        {/* Fila superior: Botons de navegació i ajuda */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button onClick={onReset} className="flex items-center gap-2 text-slate-500 font-bold bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest active:scale-95">
            <ArrowLeft className="w-4 h-4" /> Tornar a l'inici
          </button>
          <button onClick={() => setShowHelp(true)} className="text-blue-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors">
            [❔ CLICA AQUÍ PER VEURE LA GUIA D'ÚS DELS FORMATS]
          </button>
        </div>

        {/* Fila de botons de descàrrega: TOTS EN UNA SOLA FILA */}
        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex flex-nowrap items-center gap-1 bg-white p-1.5 rounded-[1.5rem] border border-slate-200 shadow-xl min-w-max">
            <ActionButton 
              onClick={() => { navigator.clipboard.writeText(currentRawContent.replace('[MAIN_TITLE]', '')); setCopied(true); setTimeout(() => setCopied(false), 2000); }} 
              icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} 
              label="[📋 Copiar Text]" 
            />
            <div className="w-px h-5 bg-slate-100 mx-1 flex-shrink-0"></div>
            <ActionButton onClick={() => handleDownload('md')} icon={<FileText className="w-4 h-4" />} label="[📄 Word/MarkDown]" />
            <ActionButton onClick={() => handleDownload('tex')} icon={<Code2 className="w-4 h-4" />} label="[🧬 Overleaf (LaTeX)]" />
            <ActionButton onClick={() => handleDownload('ipynb')} icon={<Terminal className="w-4 h-4" />} label="[🐍 Colab]" />
            <ActionButton onClick={() => window.print()} icon={<Printer className="w-4 h-4" />} label="[🖨️ Descarrega en PDF]" highlight />
          </div>
        </div>
      </div>

      <div className="mb-8 overflow-x-auto no-print">
        <div className="bg-slate-200/40 p-2 rounded-[2.5rem] flex gap-2 shadow-inner w-max mx-auto border border-white backdrop-blur-sm">
          <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Eye className="w-4 h-4" />} label="Alumnat" />
          <TabButton active={activeTab === 'adapted'} onClick={() => setActiveTab('adapted')} icon={<Accessibility className="w-4 h-4" />} label="Adaptat" />
          <TabButton active={activeTab === 'pedagogical'} onClick={() => setActiveTab('pedagogical')} icon={<BookOpen className="w-4 h-4" />} label="Curricular" variant="blue" />
          <TabButton active={activeTab === 'solGeneral'} onClick={() => setActiveTab('solGeneral')} icon={<CheckCircle className="w-4 h-4" />} label="Sols. Base" variant="green" />
          <TabButton active={activeTab === 'solAdapted'} onClick={() => setActiveTab('solAdapted')} icon={<ClipboardList className="w-4 h-4" />} label="Sols. Adaptat" variant="green" />
        </div>
      </div>

      <div className="bg-white rounded-[1rem] shadow-2xl border border-slate-100 min-h-[11in] flex flex-col print:shadow-none print:border-none mx-auto max-w-[900px] p-12 md:p-24 relative overflow-hidden" style={{ fontVariantLigatures: 'none' }}>
        <div className="mb-12 flex justify-between items-center border-b pb-10 border-slate-50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-700 rounded-2xl flex items-center justify-center text-white text-base font-black shadow-xl">ESO</div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-700">Assistent Didàctic</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{getDocTitle(activeTab)}</p>
              </div>
           </div>
           <div className="text-right no-print">
             <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
               <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Optimitzat per a Calibri</span>
             </div>
           </div>
        </div>

        <div className="flex-grow document-content text-slate-900">
          {renderContent(currentRawContent)}
        </div>

        <div className="mt-20 pt-10 border-t border-slate-50 text-center">
           <p className="text-slate-300 text-[10px] font-black tracking-[0.6em] uppercase">ESO • DUA • BLOOM • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

const getDocTitle = (tab: TabType) => {
  switch (tab) {
    case 'general': return 'Material Alumnat (ESO)';
    case 'adapted': return 'Material Adaptat (DUA)';
    case 'pedagogical': return 'Programació Curricular (5 Col.)';
    case 'solGeneral': return 'Solucionari Base';
    case 'solAdapted': return 'Solucionari Adaptat';
    default: return '';
  }
};

const TabButton = ({ active, onClick, icon, label, variant = 'white' }: any) => {
  const styles: any = {
    white: active ? 'bg-white text-blue-700 shadow-lg border border-blue-50' : 'text-slate-500 hover:bg-white/50',
    blue: active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/50',
    green: active ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/50'
  };
  return (
    <button onClick={onClick} className={`px-5 py-3 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-2.5 transition-all whitespace-nowrap active:scale-95 ${styles[variant]}`}>
      {icon} {label}
    </button>
  );
};

const ActionButton = ({ onClick, icon, label, highlight = false }: any) => (
  <button 
    onClick={onClick} 
    className={`px-4 py-2.5 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 flex-shrink-0 ${highlight ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-700'}`}
  >
    {icon} <span>{label}</span>
  </button>
);
