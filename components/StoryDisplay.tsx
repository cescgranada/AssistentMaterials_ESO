import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, FileCode, FileType, FileText, Check, Copy, Accessibility, Eye, FileDown, BookOpen, CheckCircle, ClipboardList, ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { exportToColab, exportToOverleaf, exportToWord } from '../utils/exportUtils';
import { GeneratedMaterial } from '../types';
import { generateAIImage } from '../services/geminiService';

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

  if (loading) {
    return (
      <div className="my-10 p-12 bg-blue-50 rounded-[3rem] border-4 border-dashed border-blue-100 flex flex-col items-center gap-6 text-center animate-pulse">
        <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-xl">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
        <div className="space-y-3">
          <p className="font-black text-blue-700 uppercase tracking-[0.3em] text-xs">Generant Suport Visual IA...</p>
          <p className="text-blue-400 text-sm font-bold italic max-w-md">"{prompt}"</p>
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="my-10 p-10 bg-slate-50 rounded-[3rem] border-2 border-slate-200 flex flex-col items-center gap-4 text-center">
        <ImageIcon className="w-10 h-10 text-slate-300" />
        <p className="text-slate-400 text-sm font-bold italic">No s'ha pogut carregar l'esquema: {prompt}</p>
      </div>
    );
  }

  return (
    <div className="my-12 group">
      <div className="relative overflow-hidden rounded-[3rem] shadow-2xl border-8 border-white bg-slate-100 transition-all hover:scale-[1.01] hover:shadow-blue-200">
        <img src={imageUrl} alt={prompt} className="w-full h-auto object-cover" />
        <div className="absolute top-6 left-6 bg-blue-600 text-white px-5 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl">
          <Sparkles className="w-3.5 h-3.5" /> Suport Visual IA
        </div>
      </div>
      <p className="mt-6 text-center text-slate-400 text-xs font-black uppercase tracking-[0.2em] px-8 leading-relaxed">
        {prompt}
      </p>
    </div>
  );
};

interface MaterialDisplayProps {
  content: GeneratedMaterial;
  onReset: () => void;
}

type TabType = 'general' | 'adapted' | 'pedagogical' | 'solGeneral' | 'solAdapted';

export const MaterialDisplay: React.FC<MaterialDisplayProps> = ({ content, onReset }) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [copied, setCopied] = useState(false);

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

  const currentContent = getActiveContent();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to detect [VISUAL: ...] and render AIVisual components
  const renderContent = (text: string) => {
    const parts = text.split(/(\[VISUAL:.*?\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[VISUAL:(.*?)\]/);
      if (match) {
        return <AIVisual key={i} prompt={match[1].trim()} />;
      }
      return (
        <ReactMarkdown
          key={i}
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 className="text-5xl font-black text-slate-900 mb-12 pb-6 border-b-8 border-blue-600 tracking-tight leading-tight" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-3xl font-black text-blue-800 mt-20 mb-8 border-l-[12px] border-blue-600 pl-6 py-2 bg-blue-50/20 rounded-r-[2rem]" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-xl font-black text-slate-800 mt-12 mb-6 uppercase tracking-[0.2em] border-b-4 border-slate-100 pb-2 inline-block" {...props} />,
            p: ({node, ...props}) => <p className="text-xl leading-[1.9] text-slate-700 mb-8 font-medium" {...props} />,
            table: ({node, ...props}) => (
              <div className="overflow-x-auto my-16 shadow-2xl rounded-[2.5rem] border-4 border-black overflow-hidden bg-white">
                <table className="min-w-full divide-y divide-black border-collapse" {...props} />
              </div>
            ),
            thead: ({node, ...props}) => <thead className="bg-black text-white" {...props} />,
            th: ({node, ...props}) => <th className="px-8 py-6 text-left text-xs font-black uppercase tracking-[0.2em] border-r border-slate-800 last:border-0 text-white bg-black align-middle" {...props} />,
            td: ({node, ...props}) => <td className="px-8 py-6 text-[15px] text-slate-900 border-r border-b border-slate-200 last:border-r-0 font-bold bg-white align-top leading-relaxed" {...props} />,
            li: ({node, ...props}) => <li className="text-xl text-slate-700 mb-4 ml-8 marker:text-blue-600 font-medium" {...props} />,
            strong: ({node, ...props}) => <strong className="text-slate-900 font-black" {...props} />,
            hr: () => <hr className="my-20 border-t-8 border-slate-50" />,
            img: ({src, alt}) => <AIVisual prompt={alt || "Esquema didàctic"} />
          }}
        >
          {part}
        </ReactMarkdown>
      );
    });
  };

  return (
    <div className="w-full max-w-6xl animate-fade-in-up pb-20 px-4">
      <div className="mb-8 flex flex-col xl:flex-row gap-6 justify-between items-center no-print">
        <button 
          onClick={onReset}
          className="flex items-center gap-3 text-slate-700 font-black bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 text-xs uppercase tracking-widest group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Editar Unitat
        </button>

        <div className="flex items-center gap-2 bg-white p-2 rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <MiniExportAction icon={<FileText className="w-5 h-5" />} onClick={() => exportToWord(currentContent)} color="blue" label="Word" />
          <MiniExportAction icon={<FileDown className="w-5 h-5" />} onClick={() => window.print()} color="red" label="PDF" />
          <MiniExportAction icon={<FileCode className="w-5 h-5" />} onClick={() => exportToColab(currentContent)} color="orange" label="Colab" />
          <MiniExportAction icon={<FileType className="w-5 h-5" />} onClick={() => exportToOverleaf(currentContent)} color="green" label="LaTeX" />
          <div className="w-px h-8 bg-slate-100 mx-2"></div>
          <button onClick={copyToClipboard} title="Copiar text" className="p-3 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-90">
            {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="mb-12 overflow-x-auto no-print">
        <div className="bg-slate-200/40 p-2 rounded-[2.5rem] flex gap-2 shadow-inner backdrop-blur-md w-max mx-auto border border-white">
          <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Eye className="w-4 h-4" />} label="Doc. Base" />
          {content.hasAdaptedVersion && <TabButton active={activeTab === 'adapted'} onClick={() => setActiveTab('adapted')} icon={<Accessibility className="w-4 h-4" />} label="Doc. Adaptat" />}
          <TabButton active={activeTab === 'pedagogical'} onClick={() => setActiveTab('pedagogical')} icon={<BookOpen className="w-4 h-4" />} label="Pedagogia" variant="blue" />
          <TabButton active={activeTab === 'solGeneral'} onClick={() => setActiveTab('solGeneral')} icon={<CheckCircle className="w-4 h-4" />} label="Sol. Base" variant="green" />
          {content.hasAdaptedVersion && <TabButton active={activeTab === 'solAdapted'} onClick={() => setActiveTab('solAdapted')} icon={<ClipboardList className="w-4 h-4" />} label="Sol. Adaptat" variant="green" />}
        </div>
      </div>

      <div className="w-full">
        <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 min-h-[11in] flex flex-col print:shadow-none print:border-none overflow-hidden mx-auto max-w-[900px]">
          <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/10">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                  <BookOpen className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">Unitat Didàctic Professional</p>
                  <p className="text-slate-400 font-serif italic text-xs">Escola Inclusiva i de Qualitat</p>
               </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-slate-300 font-black tracking-[0.3em] uppercase">{getDocLabel(activeTab)}</p>
            </div>
          </div>
          
          <div className="p-12 md:p-20 prose prose-slate max-w-none flex-grow bg-white selection:bg-blue-100">
              {renderContent(currentContent || "S'està generant el material expert...")}
          </div>

          <div className="p-8 border-t border-slate-50 bg-slate-50/30 text-center">
            <p className="text-slate-300 text-[9px] font-black tracking-[0.5em] uppercase">ESO • DUA • VISUALS • QUALITAT DIDÀCTICA</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const getDocLabel = (tab: TabType) => {
  switch (tab) {
    case 'general': return 'Document de l\'Alumne/a';
    case 'adapted': return 'Document Adaptat (DUA)';
    case 'pedagogical': return 'Fitxa Tècnica Curricular';
    case 'solGeneral': return 'Solucionari per al Docent';
    case 'solAdapted': return 'Solucionari Document Adaptat';
    default: return '';
  }
};

const TabButton = ({ active, onClick, icon, label, variant = 'white' }: any) => {
  const styles: any = {
    white: active ? 'bg-white text-blue-700 shadow-xl border border-blue-50' : 'text-slate-500 hover:bg-white/50',
    blue: active ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:bg-white/50',
    green: active ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-500 hover:bg-white/50'
  };
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3.5 rounded-[1.75rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all whitespace-nowrap active:scale-95 ${styles[variant]}`}
    >
      {icon} {label}
    </button>
  );
};

const MiniExportAction = ({ icon, onClick, color, label }: any) => {
  const styles: any = {
    blue: 'text-blue-700 hover:bg-blue-600',
    red: 'text-red-700 hover:bg-red-600',
    orange: 'text-orange-700 hover:bg-orange-600',
    green: 'text-green-700 hover:bg-green-600'
  };
  return (
    <button 
      onClick={onClick}
      title={`Baixar en format ${label}`}
      className={`p-3 rounded-2xl transition-all active:scale-90 flex items-center gap-2 hover:text-white ${styles[color]}`}
    >
      {icon}
      <span className="text-[11px] font-black uppercase tracking-tight hidden md:block">{label}</span>
    </button>
  );
};