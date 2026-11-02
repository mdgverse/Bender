import { readFile, writeFile, readdir } from 'node:fs/promises';
const assets = await readdir('dist/assets');
const js = await readFile('dist/assets/' + assets.find(x => x.endsWith('.js')), 'utf8');
const css = await readFile('dist/assets/' + assets.find(x => x.endsWith('.css')), 'utf8');
let html = await readFile('dist/index.html', 'utf8');
html = html.replace(/<script type="module" crossorigin src="[^"]+"><\/script>/, () => `<script type="module">${js.replaceAll('</script', '<\\/script')}</script>`);
html = html.replace(/<link rel="stylesheet" crossorigin href="[^"]+">/, () => `<style>${css}</style>`);
if (html.includes('/assets/')) throw new Error('Falha ao incorporar os arquivos do build');
await writeFile('bender-studio.html', html);
