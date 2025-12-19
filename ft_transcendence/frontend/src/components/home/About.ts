import { BaseComponent } from '../BaseComponent';

interface AboutItem {
  title: string;
  description: string;
  imageUrl?: string;
  icon?: string;
}

export class About extends BaseComponent {
  private items: AboutItem[] = [
    {
      title: 'Project Mission',
      description:
        'Final milestone of the 42 Web Curriculum — building a complete real-time multiplayer gaming platform combining 3D graphics, secure user systems and distributed architecture.',
      imageUrl: '/assets/images/42_project.png',
      icon: '🎯'
    },
    {
      title: 'Platform Technology',
      description:
        'Microservices orchestrated through Nginx, Redis PubSub and secure Fastify APIs with WebSocket real-time engine for seamless multiplayer experiences.',
      imageUrl: '/assets/images/tech.png',
      icon: '⚡'
    },
    {
      title: 'Reliability & Monitoring',
      description:
        'Prometheus metrics, Grafana dashboards and an extensive test suite keep the platform observable, stable and production-ready.',
      imageUrl: '/assets/images/monitoring.png',
      icon: '📊'
    }
  ];

  render(): string {
    return `
      <div class="text-center">
        <h2 class="mb-16 text-3xl md:text-4xl lg:text-5xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400">
          About 42 Transcendence
        </h2>

        <div class="relative w-screen overflow-visible max-w-none px-0 py-8">
          <div class="about-track flex gap-6 md:gap-8 will-change-transform cursor-grab active:cursor-grabbing select-none" data-speed="0.3">
            ${this.items.map(i => this.renderAboutCard(i)).join('')}
            ${this.items.map(i => this.renderAboutCard(i)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // About card - bigger tech style (640px), 50/50 full height
  private renderAboutCard(i: AboutItem): string {
    return `
      <article
        class="about-box w-[320px] sm:w-[540px] md:w-[600px] lg:w-[640px] shrink-0 rounded-3xl overflow-hidden
               border border-cyan-400/40
               shadow-[0_0_35px_rgba(0,255,255,0.25)]
               bg-[radial-gradient(circle_at_30%_30%,rgba(0,255,255,0.22),rgba(0,65,100,0.7)55%,rgba(10,10,31,1)90%)]
               hover:border-cyan-400/60 hover:shadow-[0_0_45px_rgba(0,255,255,0.35)]
               transition-all duration-500 text-left">
        <div class="grid grid-cols-1 sm:grid-cols-2 h-full min-h-[300px] sm:min-h-[260px]">
          <!-- Image FULL HEIGHT -->
          <div class="h-[180px] sm:h-full bg-black/30">
            ${i.imageUrl 
              ? `<img src="${i.imageUrl}" alt="${i.title}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" draggable="false">` 
              : '<div class="w-full h-full flex items-center justify-center text-6xl">' + (i.icon ?? '📦') + '</div>'
            }
          </div>
          <!-- Content -->
          <div class="p-5 sm:p-7 flex flex-col justify-center">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-3xl">${i.icon ?? '📦'}</span>
              <h3 class="text-xl sm:text-2xl font-bold text-cyan-300 font-game">${i.title}</h3>
            </div>
            <p class="text-gray-300 text-sm sm:text-base leading-relaxed">${i.description}</p>
          </div>
        </div>
      </article>
    `;
  }
}