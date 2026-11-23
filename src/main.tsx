import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AppProvider } from './context/AppContext.tsx';
import { PortalApp } from './portal/PortalApp.tsx';
import './index.css';

const isPortal = window.location.pathname === '/portal' || window.location.pathname.startsWith('/portal/');
createRoot(document.getElementById('root')!).render(isPortal ? <StrictMode><PortalApp /></StrictMode> : (
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
));
