/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}"
  ],
  theme: {
    extend: {
      // Gaming-themed colors
      colors: {
        // Primary brand colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a'
        },
        // Game-specific colors
        game: {
          pong: '#00ff41',      // Matrix green for Pong
          racer: '#ffd700',     // Gold for Star Wars
          danger: '#ff1744',    // Red for warnings
          success: '#00e676'    // Green for success
        },
        // Dark theme
        dark: {
          bg: '#0a0a0a',        // Almost black background
          surface: '#1a1a1a',   // Dark surface
          border: '#2a2a2a',    // Dark borders
          text: '#e0e0e0'       // Light text
        }
      },
      
      // Gaming fonts
      fontFamily: {
        'mono': ['"Fira Code"', 'Monaco', '"Cascadia Code"', '"Roboto Mono"', 'monospace'],
        'game': ['Rebellion', 'Orbitron', '"Exo 2"', 'sans-serif'],
        'sans': ['Rebellion', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        'constellation': ['Trattorian', 'Orbitron', 'sans-serif']
      },
      
      // Animation for gaming effects
      animation: {
        'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite'
      },
      
      // Gaming-specific spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      
      // Gaming shadows
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-green': '0 0 20px rgba(0, 255, 65, 0.5)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.5)'
      }
    }
  },
  plugins: [
    // Add any additional Tailwind plugins here
  ],
  
  // Dark mode configuration
  darkMode: 'class'
}