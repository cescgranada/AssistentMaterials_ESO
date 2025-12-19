
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, BookOpen, CheckCircle, Accessibility, Eye, Copy, Check, ClipboardList, FileText, Printer, Code2, Terminal, HelpCircle, X } from 'lucide-react';
import { GeneratedMaterial } from '../types';
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
          <h4 className="font-black text-blue-700 uppercase tracking-widest text-sm flex items-center gap-2">🧬 Overleaf (LaTeX)</h4>
          <div className="bg-slate-50 p-6 rounded-2xl text-sm text-slate-600 space-y-2 border border-slate-100">
            <p>1. Vés a <strong>overleaf.com</strong>, crea un "Blank Project".</p>
            <p>2. Enganxa el codi LaTeX generat per a una versió tipogràfica professional.</p>
          </div>
        </section>
        <section className="space-y-4">
          <h4 className="font-black text-emerald-600 uppercase tracking-widest text-sm flex items-center gap-2">🐍 Colab (Notebook)</h4>
          <p className="text-sm text-slate-600 pl-7">Enganxa el format .ipynb per a treballar amb cel·les de text i codi.</p>
        </section>
      </div>
      <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
        <button onClick={onClose} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 active:scale-95 shadow-lg">Entesos</button>
      </div>
    </div>
  </div>
);

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
    let filename = `material-didactic-${activeTab}`;
    let mime = "text/plain";
    let exportText = currentRawContent;

    if (format === 'md') {
      filename += ".md";
      mime = "text/markdown";
    } else if (format === 'tex') {
      filename += ".tex";
      exportText = `\\documentclass[12pt]{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage[catalan]{babel}\n\\usepackage[margin=1in]{geometry}\n\\begin{document}\n${currentRawContent.replace(/#/g, '\\section')}\n\\end{document}`;
    } else if (format === 'ipynb') {
      filename += ".ipynb";
      mime = "application/x-ipynb+json";
      exportText = JSON.stringify({ cells: [{ cell_type: "markdown", metadata: {}, source: currentRawContent.split('\n').map(l => l + '\n') }], metadata: {}, nbformat: 4, nbformat_minor: 0 });
    }

    downloadFile(exportText, filename, mime);
  };

  return (
    <div className="w-full max-w-7xl animate-fade-in-up pb-20 px-4">
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      
      <div className="mb-6 flex flex-col gap-4 no-print">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button onClick={onReset} className="flex items-center gap-2 text-slate-500 font-bold bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-95 text-[10px] uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Tornar a l'inici
          </button>
          <button onClick={() => setShowHelp(true)} className="text-blue-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 px-3 py-2 rounded-xl">
            [❔ CLICA AQUÍ PER VEURE LA GUIA D'ÚS DELS FORMATS]
          </button>
        </div>

        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex flex-nowrap items-center gap-1 bg-white p-1.5 rounded-[1.5rem] border border-slate-200 shadow-xl min-w-max">
            <ActionButton 
              onClick={() => { navigator.clipboard.writeText(currentRawContent); setCopied(true); setTimeout(() => setCopied(false), 2000); }} 
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
          <TabButton active={activeTab === 'solGeneral'} onClick={() => setActiveTab('solGeneral')} icon={<CheckCircle className="w-4 h-4" />} label="Sols. General" variant="green" />
          <TabButton active={activeTab === 'solAdapted'} onClick={() => setActiveTab('solAdapted')} icon={<ClipboardList className="w-4 h-4" />} label="Sols. Adaptat" variant="green" />
        </div>
      </div>

      <div className="bg-white rounded-[1rem] shadow-2xl border border-slate-100 min-h-[11in] flex flex-col print:shadow-none print:border-none mx-auto max-w-[900px] p-12 md:p-24 relative overflow-hidden">
        <div className="mb-12 flex justify-between items-center border-b pb-10 border-slate-50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-700 rounded-2xl flex items-center justify-center text-white text-base font-black shadow-xl">ESO</div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-700">Assistent Didàctic</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{getDocTitle(activeTab)}</p>
              </div>
           </div>
        </div>

        <div className="flex-grow document-content text-slate-900">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'Calibri, sans-serif', marginBottom: '25px', color: '#1e293b' }} {...props} />,
              h2: ({node, ...props}) => <h2 style={{ fontSize: '18.6px', fontWeight: 'bold', fontFamily: 'Calibri, sans-serif', marginTop: '30px', marginBottom: '15px', color: '#334155' }} {...props} />,
              p: ({node, ...props}) => <p style={{ fontSize: '16px', fontWeight: 'normal', fontFamily: 'Calibri, sans-serif', marginBottom: '15px', lineHeight: '1.6' }} {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-6 space-y-3" {...props} />,
              li: ({node, ...props}) => <li style={{ fontSize: '16px', fontFamily: 'Calibri, sans-serif' }} {...props} />,
              table: ({node, ...props}) => (
                <div className="overflow-x-auto my-8 border border-slate-200 rounded-2xl">
                  <table className="min-w-full divide-y divide-slate-200 border-collapse" {...props} />
                </div>
              ),
              th: ({node, ...props}) => <th className="px-4 py-3 bg-slate-50 text-left text-[10px] font-black uppercase tracking-widest border border-slate-200" {...props} />,
              td: ({node, ...props}) => <td className="px-4 py-3 text-xs border border-slate-200" {...props} />,
            }}
          >
            {currentRawContent}
          </ReactMarkdown>
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
    case 'general': return 'Material Alumnat';
    case 'adapted': return 'Material Adaptat DUA';
    case 'pedagogical': return 'Taula Curricular';
    case 'solGeneral': return 'Solucionari General';
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
