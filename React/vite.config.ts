import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Dev-only endpoint used by the /?authoring=1 template-authoring route (see
 * src/templates/authoring/) to persist a freshly built SFDT into public/templates/.
 * This never runs in a production build — it exists purely so a developer can capture
 * guaranteed-valid SFDT straight from the live DocumentEditor, with no backend involved
 * in the shipped app. Template names are restricted to a known allow-list.
 */
function templateAuthoringMiddleware(): Plugin {
  const ALLOWED_NAMES = new Set([
    'employee-onboarding',
    'employee-information-sheet',
    'welcome-letter',
    'offer-letter',
    'nda-agreement',
    'asset-request-form',
    'benefits-enrollment-form',
    'background-verification-form',
  ]);

  return {
    name: 'hr-doc-studio-template-authoring',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev/save-template', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }
        const url = new URL(req.url ?? '', 'http://localhost');
        const name = url.searchParams.get('name') ?? '';
        if (!ALLOWED_NAMES.has(name)) {
          res.statusCode = 400;
          res.end(`Unknown template name: ${name}`);
          return;
        }
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          try {
            const dir = resolve(fileURLToPath(new URL('.', import.meta.url)), 'public/templates');
            mkdirSync(dir, { recursive: true });
            writeFileSync(resolve(dir, `${name}.sfdt`), body, 'utf-8');
            res.statusCode = 200;
            res.end('ok');
          } catch (err) {
            res.statusCode = 500;
            res.end(String(err));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/intelligent-forms-doc-generation/react/',
  plugins: [react(), templateAuthoringMiddleware()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    // Pre-bundle every heavy dep upfront. The Syncfusion node graph is huge and partly lazy
    // (Ribbon/dialogs), so a mid-session "new dependency discovered" re-optimization can
    // invalidate the old chunks and make the browser request them → "504 Outdated Optimize Dep".
    include: [
      'react',
      'react-dom/client',
      'jszip',
      'lucide-react',
      '@syncfusion/ej2-base',
      '@syncfusion/ej2-react-documenteditor',
      '@syncfusion/ej2-react-grids',
      '@syncfusion/ej2-react-dropdowns',
      '@syncfusion/ej2-react-inputs',
      '@syncfusion/ej2-react-buttons',
      '@syncfusion/ej2-react-calendars',
      '@syncfusion/ej2-react-navigations',
      '@syncfusion/ej2-pdf-export',
      '@syncfusion/ej2-documenteditor',
    ],
  },
  server: {
    port: 5173,
  },
});
