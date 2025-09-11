import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("Main.tsx loading...", {
  env: import.meta.env.MODE,
  location: window.location.href
});

try {
  createRoot(document.getElementById("root")!).render(<App />);
  console.log("App rendered successfully");
} catch (error) {
  console.error("Failed to render app:", error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>Application Error</h1>
      <p>Failed to load the application. Please check the console for details.</p>
      <p>Error: ${error}</p>
      <button onclick="window.location.reload()">Reload Page</button>
    </div>
  `;
}
