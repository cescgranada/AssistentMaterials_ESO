export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToMarkdown = (content: string, isAdapted: boolean) => {
  const filename = isAdapted ? "material-adaptat-nee.md" : "material-didactic-eso.md";
  downloadFile(content, filename, "text/markdown");
};

export const exportToColab = (content: string) => {
  const notebook = {
    cells: [{ cell_type: "markdown", metadata: {}, source: content.split('\n').map(l => l + '\n') }],
    metadata: { kernelspec: { display_name: "Python 3", name: "python3" }, language_info: { name: "python" } },
    nbformat: 4, nbformat_minor: 0
  };
  downloadFile(JSON.stringify(notebook, null, 2), "material.ipynb", "application/x-ipynb+json");
};

export const exportToOverleaf = (content: string) => {
  const latex = `
\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[catalan]{babel}
\\usepackage{geometry}
\\usepackage{longtable}
\\usepackage{booktabs}
\\geometry{a4paper, margin=1in}
\\begin{document}
${content.replace(/#/g, '\\section*').replace(/\n\n/g, '\\par\n').replace(/\|/g, '&')}
\\end{document}
  `.trim();
  downloadFile(latex, "material.tex", "text/x-tex");
};

export const exportToWord = (content: string) => {
  // Use .md extension for Word as requested, or raw text if preferred
  downloadFile(content, "material-word.md", "text/markdown");
};