import JSZip from 'jszip';

// Código fonte do app — lazy loading com timeout por arquivo
const srcModules = import.meta.glob('/src/**/*.{jsx,js,tsx,ts,css,json}', { query: '?raw' });

export async function exportSourceCode() {
  const zip = new JSZip();

  const entries = Object.entries(srcModules);
  const results = await Promise.allSettled(
    entries.map(async ([path, loader]) => {
      const mod = await Promise.race([
        loader(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]);
      const content = typeof mod?.default === 'string'
        ? mod.default
        : (typeof mod === 'string' ? mod : '');
      return { path, content };
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value?.content) {
      zip.file(result.value.path.replace(/^\//, ''), result.value.content);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shopee-hub-report-src.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}