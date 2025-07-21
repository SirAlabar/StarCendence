import './input.css'
import './css/style.css';  // ← This tells Vite to process our CSS through Tailwind
import { App } from './App';

// Initialize the app
const app = new App();
app.mount('#app');