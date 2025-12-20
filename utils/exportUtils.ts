
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

export const exportMaterial = (content: string, type: 'md' | 'txt') => {
  const filename = type === 'md' ? "material-didactic.md" : "material-didactic.txt";
  const mime = type === 'md' ? "text/markdown" : "text/plain";
  downloadFile(content, filename, mime);
};
