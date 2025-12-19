
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, FileDown, BookOpen, CheckCircle, Accessibility, Eye, Copy, Check, Loader2, ClipboardList, FileText, Printer, Download, Code2, BookMarked, Terminal } from 'lucide-react';
import { GeneratedMaterial } from '../types';
import { generateAIImage } from '../services/geminiService';
import { downloadFile } from '../utils/exportUtils';

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
      exportText = `\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\begin{document}\n${text.replace(/#/g, '\\section')}\n\\end{document}`;
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

      if (isMainTitle && cleanPart) {
        return <h1 key={i} style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'Calibri, sans-serif', marginBottom: '30px' }}>{cleanPart}</h1>;
      }

      return (
        <ReactMarkdown
          key={i}
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'Calibri, sans-serif', marginBottom: '25px' }} {...props} />,
            h2: ({node, ...props}) => <h2 style={{ fontSize: '18.6px', fontWeight: 'bold', fontFamily: 'Calibri, sans-serif', marginTop: '25px', marginBottom: '12px' }} {...props} />,
            h3: ({node, ...props}) => <h3 style={{ fontSize: '18.6px', fontWeight: 'bold', fontFamily: 'Calibri, sans-serif', marginTop: '20px', marginBottom: '10px' }} {...props} />,
            p: ({node, ...props}) => <p style={{ fontSize: '16px', fontFamily: 'Calibri, sans-serif', marginBottom: '15px', lineHeight: '1.5' }} {...props} />,
            ul: ({node, ...props}) => <ul className="list-none ml-0 mb-6 space-y-2" {...props} />,
            li: ({node, ...props}) => <li style={{ fontSize: '16px', fontFamily: 'Calibri, sans-serif' }} {...props} />,
            table: ({node, ...props}) => (
              <div className="overflow-x-auto my-6 border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 border-collapse" {...props} />
              </div>
            ),
            th: ({node, ...props}) => <th className="px-3 py-3 bg-slate-50 text-left text-[9px] font-black uppercase tracking-widest border border-slate-200 align-middle" {...props} />,
            td: ({node, ...props}) => <td className="px-3 py-3 text-xs border border-slate-200 align-top leading-normal" {...props} />,
          }}
        >
          {cleanPart}
        </ReactMarkdown>
      );
    });
  };

  return (
    <div className="w-full max-w-6xl animate-fade-in-up pb-20 px-4">
      <div className="mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center no-print">
        <button onClick={onReset} className="flex items-center gap-2 text-slate-500 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest">
          <ArrowLeft className="w-3.5 h-3.5" /> Tornar
        </button>

        <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-lg">
          <ActionButton onClick={() => { navigator.clipboard.writeText(currentRawContent); setCopied(true); setTimeout(() => setCopied(false), 2000); }} icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} label="Copiar" />
          <div className="w-px h-4 bg-slate-100 mx-1"></div>
          <ActionButton onClick={() => handleDownload('md')} icon={<FileText className="w-3.5 h-3.5" />} label="Word" />
          <ActionButton onClick={() => handleDownload('tex')} icon={<Code2 className="w-3.5 h-3.5" />} label="LaTeX" />
          <ActionButton onClick={() => handleDownload('ipynb')} icon={<Terminal className="w-3.5 h-3.5" />} label="Colab" />
          <ActionButton onClick={() => window.print()} icon={<Printer className="w-3.5 h-3.5" />} label="PDF" highlight />
        </div>
      </div>

      <div className="mb-8 overflow-x-auto no-print">
        <div className="bg-slate-200/40 p-1.5 rounded-[2rem] flex gap-1.5 shadow-inner w-max mx-auto border border-white backdrop-blur-sm">
          <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Eye className="w-3.5 h-3.5" />} label="Alumnat" />
          <TabButton active={activeTab === 'adapted'} onClick={() => setActiveTab('adapted')} icon={<Accessibility className="w-3.5 h-3.5" />} label="Adaptat" />
          <TabButton active={activeTab === 'pedagogical'} onClick={() => setActiveTab('pedagogical')} icon={<BookOpen className="w-3.5 h-3.5" />} label="Curricular" variant="blue" />
          <TabButton active={activeTab === 'solGeneral'} onClick={() => setActiveTab('solGeneral')} icon={<CheckCircle className="w-3.5 h-3.5" />} label="Sols. Base" variant="green" />
          <TabButton active={activeTab === 'solAdapted'} onClick={() => setActiveTab('solAdapted')} icon={<ClipboardList className="w-3.5 h-3.5" />} label="Sols. Adaptat" variant="green" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-2xl border border-slate-100 min-h-[11in] flex flex-col print:shadow-none print:border-none mx-auto max-w-[900px] p-12 md:p-20 relative overflow-hidden">
        <div className="mb-12 flex justify-between items-center border-b pb-8 border-slate-50">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-xl">ESO</div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-700">Assistent Didàctic</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">{getDocTitle(activeTab)}</p>
              </div>
           </div>
        </div>

        <div className="flex-grow document-content" style={{ fontFamily: 'Calibri, sans-serif' }}>
          {renderContent(currentRawContent)}
        </div>

        <div className="mt-16 pt-8 border-t border-slate-50 text-center">
           <p className="text-slate-300 text-[9px] font-black tracking-[0.5em] uppercase">ESO • DUA • CALIBRI 12/14/18 • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

const getDocTitle = (tab: TabType) => {
  switch (tab) {
    case 'general': return 'Material Alumnat';
    case 'adapted': return 'Material Adaptat (DUA)';
    case 'pedagogical': return 'Taula Curricular';
    case 'solGeneral': return 'Solucionari Base';
    case 'solAdapted': return 'Solucionari Adaptat';
    default: return '';
  }
};

const TabButton = ({ active, onClick, icon, label, variant = 'white' }: any) => {
  const styles: any = {
    white: active ? 'bg-white text-blue-700 shadow-md border border-blue-50' : 'text-slate-500 hover:bg-white/50',
    blue: active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/50',
    green: active ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'
  };
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-[1.2rem] font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap active:scale-95 ${styles[variant]}`}>
      {icon} {label}
    </button>
  );
};

const ActionButton = ({ onClick, icon, label, highlight = false }: any) => (
  <button 
    onClick={onClick} 
    className={`px-2.5 py-1 rounded-xl font-bold text-[8px] uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-90 ${highlight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-slate-400 hover:bg-slate-50 hover:text-blue-600'}`}
  >
    {icon} <span>{label}</span>
  </button>
);
