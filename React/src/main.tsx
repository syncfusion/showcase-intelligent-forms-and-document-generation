import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerLicense } from '@syncfusion/ej2-base';
import App from './App';

import './styles/syncfusion.css';
import './styles/tokens.css';
import './styles/app.css';

const licenseKey = import.meta.env.VITE_SF_LICENSE_KEY;
if (licenseKey) {
  registerLicense(licenseKey);
} else {
  // No key yet — the editor still works, just shows Syncfusion's trial banner.
  console.info(
    '[HR Doc Studio] No VITE_SF_LICENSE_KEY set — Syncfusion components will show a trial banner. ' +
      'Add your key to .env.development (see .env.example).',
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
