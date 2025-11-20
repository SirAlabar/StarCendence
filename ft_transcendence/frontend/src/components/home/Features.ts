import { BaseComponent } from '../BaseComponent';

type FeatureCategory = 'gameplay' | 'social' | 'tech';

interface Feature {
  category: FeatureCategory;
  title: string;
  description: string;
  bullets: string[];
  icon?: string;           
  imageUrl?: string;
}

export class Features extends BaseComponent 
{
  private gameplay: Feature[] = [
    {
      category: 'gameplay',
      title: '3D Pong Arena',
      description: 'Competitive multiplayer with stunning visuals.',
      bullets: ['Tournament Mode', 'Anti-Cheat System', 'Adaptive AI'],
      icon: '🔥',
      imageUrl: '/assets/images/pong_3d.png'
    },
    {
      category: 'gameplay',
      title: '2D Pong Mode',
      description: 'Classic camera with modern netcode and fairplay checks.',
      bullets: ['Retro View', 'Low Latency', 'Server Validation'],
      icon: '🕹️',
      imageUrl: '/assets/images/pong_2d.png'
    },
    {
      category: 'gameplay',
      title: 'Pod Racing',
      description: 'High-speed racing with collision physics and real-time sync.',
      bullets: ['Advanced Physics', 'Matchmaking', 'Babylon 3D'],
      icon: '🚀',
      imageUrl: '/assets/images/pod_racer.png'
    },
    {
      category: 'gameplay',

      title: 'Multiplayer Engine',
      description: 'Full networking stack built for fast, fair and scalable online play.',
      bullets: ['WebSockets', 'Authoritative Server', 'Anti-Cheat', 'Chat'],
      icon: '🔌',
      imageUrl: '/assets/images/multiplayer_feature.png'
    }
  ];

  private social: Feature[] = [
    {
      category: 'social',
      title: 'Live Chat',
      description: 'Real-time messaging, invites and presence.',
      bullets: ['Invitations', 'Presence', 'Moderation'],
      icon: '💬',
      imageUrl: ''
    },
    {
      category: 'social',
      title: 'Profiles & Friends',
      description: 'Avatars, friendship and blocking for safe play.',
      bullets: ['Avatars', 'Friends List', 'Chat Integration'],
      icon: '👤',
      imageUrl: '/assets/images/user_profile.png'
    },
    {
      category: 'social',
      title: 'Stats & Achievements',
      description: 'Progression and match history dashboards.',
      bullets: ['Leaderboards', 'History', 'Badges'],
      icon: '📊',
      imageUrl: '/assets/images/feature-stats.png'
    }
  ];

  private tech: Feature[] = [
    {
      category: 'tech',
      title: 'WebSocket Real-Time Engine',
      description: 'Low-latency event bus for gameplay and chat.',
      bullets: ['60 FPS Streams', 'Room Routing', 'Broadcast'],
      icon: '🔌',
      imageUrl: ''
    },
    {
      category: 'tech',
      title: 'Security First',
      description: 'JWT, 2FA and OAuth for protected gameplay.',
      bullets: ['JWT & 2FA', 'Google OAuth', 'Rate Limits'],
      icon: '🔒',
      imageUrl: '/assets/images/login.png'
    },
    {
      category: 'tech',
      title: 'Microservices',
      description: 'Fastify services orchestrated by Nginx + Redis.',
      bullets: ['Redis PubSub', 'Nginx Gateway', 'SQLite Persistent'],
      icon: '🧩',
      imageUrl: ''
    },
    {
      category: 'tech',
      title: 'Monitoring',
      description: 'Observability across services and gameplay.',
      bullets: ['Prometheus', 'Grafana', 'Alerts'],
      icon: '📈',
      imageUrl: '/assets/images/grafana.png'
    }
  ];


  render(): string 
  {
    return `
      <div class="text-center">
        <h2 class="mb-16 text-3xl md:text-4xl lg:text-5xl font-bold font-game text-atransparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          Platform Features
        </h2>

        <!-- GAMEPLAY CAROUSEL - Show 3 cards -->
        <div class="relative w-screen overflow-visible max-w-none px-0 py-8 mb-12">
          <div class="gameplay-track flex gap-6 md:gap-8 will-change-transform cursor-grab active:cursor-grabbing select-none" data-speed="0.5">
            ${this.renderGameplay()}
            ${this.renderGameplay()}
          </div>
        </div>

        <!-- TECH + SOCIAL CAROUSEL - Show 2 cards -->
        <div class="relative w-screen overflow-visible max-w-none px-0 py-6">
          <div class="techsocial-track flex gap-6 md:gap-8 will-change-transform cursor-grab active:cursor-grabbing select-none" data-speed="0.4">
            ${this.renderTechSocial()}
            ${this.renderTechSocial()}
          </div>
        </div>
      </div>
    `;
  }

  private renderGameplay(): string {
    return this.gameplay.map(f => this.cardGameplay(f)).join('');
  }

  private renderTechSocial(): string {
    const combined: Feature[] = [];
    const maxLength = Math.max(this.social.length, this.tech.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i < this.social.length) combined.push(this.social[i]);
      if (i < this.tech.length) combined.push(this.tech[i]);
    }
    
    return combined.map(f => this.cardTech(f)).join('');
  }

  // Game card - vertical (image top, content below)
  private cardGameplay(f: Feature): string {
    return `
      <article class="feature-card w-[280px] sm:w-[320px] lg:w-[340px] shrink-0 rounded-3xl p-4 sm:p-6
               border border-purple-500/40 
               shadow-[0_0_30px_rgba(140,60,255,0.25)]
               bg-[radial-gradient(circle_at_30%_30%,rgba(148,0,255,0.35),rgba(60,10,100,0.85)50%,rgba(10,10,31,1)90%)]
               hover:border-purple-400/60 hover:shadow-[0_0_40px_rgba(140,60,255,0.4)]
               transition-all duration-500 text-left">
        <div class="mb-4 overflow-hidden rounded-xl h-[160px] sm:h-[200px] bg-black/30 border border-purple-400/20">
          ${f.imageUrl 
            ? `<img src="${f.imageUrl}" alt="${f.title}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" draggable="false">` 
            : '<div class="w-full h-full flex items-center justify-center text-5xl sm:text-6xl">' + (f.icon ?? '🎮') + '</div>'
          }
        </div>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl sm:text-3xl">${f.icon ?? '🎮'}</span>
          <h3 class="text-xl sm:text-2xl font-bold text-purple-200 font-game">${f.title}</h3>
        </div>
        <p class="text-gray-300 text-sm leading-relaxed mb-3">${f.description}</p>
        <ul class="text-xs sm:text-sm text-gray-400 space-y-1.5">
          ${f.bullets.map(b => `<li class="flex items-start gap-2"><span class="text-purple-400 mt-0.5">●</span><span>${b}</span></li>`).join('')}
        </ul>
      </article>
    `;
  }

  // Tech card - 50/50 split
  private cardTech(f: Feature): string {
    const themeColor = f.category === 'tech' ? 'purple' : 'cyan';
    const borderColor = themeColor === 'purple' ? 'border-purple-500/40' : 'border-cyan-400/40';
    const shadowColor = themeColor === 'purple' 
      ? 'shadow-[0_0_30px_rgba(140,60,255,0.25)]' 
      : 'shadow-[0_0_30px_rgba(0,255,255,0.25)]';
    const hoverBorder = themeColor === 'purple' ? 'hover:border-purple-400/60' : 'hover:border-cyan-400/60';
    const hoverShadow = themeColor === 'purple' 
      ? 'hover:shadow-[0_0_40px_rgba(140,60,255,0.4)]' 
      : 'hover:shadow-[0_0_40px_rgba(0,255,255,0.4)]';
    const textColor = themeColor === 'purple' ? 'text-purple-200' : 'text-cyan-300';
    const bulletColor = themeColor === 'purple' ? 'text-purple-400' : 'text-cyan-400';
    const bgGradient = themeColor === 'purple'
      ? 'bg-[radial-gradient(circle_at_30%_30%,rgba(148,0,255,0.35),rgba(60,10,100,0.85)50%,rgba(10,10,31,1)90%)]'
      : 'bg-[radial-gradient(circle_at_30%_30%,rgba(0,255,255,0.22),rgba(0,65,100,0.7)55%,rgba(10,10,31,1)90%)]';

    return `
      <article class="feature-card w-[280px] sm:w-[460px] md:w-[520px] lg:w-[560px] shrink-0 rounded-3xl overflow-hidden
               border ${borderColor} ${shadowColor} ${bgGradient}
               ${hoverBorder} ${hoverShadow}
               transition-all duration-500 text-left">
        <div class="grid grid-cols-1 sm:grid-cols-2 h-full min-h-[280px] sm:min-h-[240px]">
          <!-- Image FULL HEIGHT -->
          <div class="h-[160px] sm:h-full bg-black/30">
            ${f.imageUrl 
              ? `<img src="${f.imageUrl}" alt="${f.title}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" draggable="false">` 
              : '<div class="w-full h-full flex items-center justify-center text-5xl sm:text-6xl">' + (f.icon ?? '⚙️') + '</div>'
            }
          </div>
          <!-- Content -->
          <div class="p-4 sm:p-6 flex flex-col justify-center">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-2xl">${f.icon ?? '⚙️'}</span>
              <h3 class="text-lg sm:text-xl font-bold ${textColor} font-game">${f.title}</h3>
            </div>
            <p class="text-gray-300 text-sm leading-relaxed mb-3">${f.description}</p>
            <ul class="text-xs sm:text-sm text-gray-400 space-y-1">
              ${f.bullets.map(b => `<li class="flex items-start gap-2"><span class="${bulletColor} mt-0.5">●</span><span>${b}</span></li>`).join('')}
            </ul>
          </div>
        </div>
      </article>
    `;
  }
}