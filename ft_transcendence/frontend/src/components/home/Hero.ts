import { BaseComponent } from '../BaseComponent';

export class Hero extends BaseComponent {
  render(): string {
    return `
      <section id="hero-section"
        class="relative w-screen min-h-screen overflow-hidden flex items-center justify-center 
               bg-black">

        <!-- Fundo -->
        <div class="absolute inset-0 
                    bg-[url('/assets/images/backgrounds/space_background.jpg')]
                    bg-cover bg-center bg-no-repeat">
        </div>

        <!-- Overlay escuro -->
        <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>

        <!-- Conteúdo -->
        <div class="relative z-10 text-center px-6 flex flex-col items-center justify-center py-32 md:py-48">
          <h1 class="text-6xl sm:text-8xl font-game font-bold tracking-wider 
                     text-transparent bg-clip-text 
                     bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-400
                     drop-shadow-[0_0_30px_rgba(140,60,255,0.6)]">
            TRANSCENDENCE
          </h1>
        </div>
      </section>
    `;
  }

  mount(): void {
    const section = document.getElementById('hero-section');
    if (section) {
      const resize = () => {
        // pega altura exata da viewport menos navbar
        const navbar = document.querySelector('nav') as HTMLElement;
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        section.style.height = `${window.innerHeight - navbarHeight}px`;
      };
      resize();
      window.addEventListener('resize', resize);
    }

    const app = document.getElementById('app');
    if (app) {
      app.style.maxWidth = '100%';
      app.style.overflow = 'visible';
    }
  }
}
