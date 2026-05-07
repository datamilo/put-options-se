import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/index'

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found in DOM");
  }

  createRoot(rootElement).render(<App />);
} catch (error) {
  const errorDetails = error instanceof Error ? error.message : String(error);
  const isSv = (navigator.language || '').startsWith('sv');
  const s = isSv
    ? { title: 'Programfel', desc: 'Det gick inte att ladda Put Options SE-applikationen.', details: 'Felinformation', reload: 'Ladda om sidan' }
    : { title: 'Application Error', desc: 'Failed to load the Put Options SE application.', details: 'Error Details', reload: 'Reload Page' };
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; background: #f5f5f5; border-radius: 8px;">
      <h1 style="color: #d32f2f;">${s.title}</h1>
      <p>${s.desc}</p>
      <details style="margin: 20px 0; padding: 10px; background: white; border-radius: 4px;">
        <summary style="cursor: pointer; font-weight: bold;">${s.details}</summary>
        <pre style="margin-top: 10px; font-size: 12px; overflow: auto;">${errorDetails}</pre>
      </details>
      <div style="margin-top: 20px;">
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
          ${s.reload}
        </button>
      </div>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">
        Base URL: ${import.meta.env.BASE_URL}<br>
        Mode: ${import.meta.env.MODE}<br>
        Location: ${window.location.href}
      </p>
    </div>
  `;
}
