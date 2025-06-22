
import { BaseComponent } from '../BaseComponent';

interface Feature {
    title: string;
    description: string;
    icon: string;
    color: string;
    features: string[];
}

export class Features extends BaseComponent {
    private features: Feature[] = [
        {
            title: '3D Pong Arena',
            description: 'Experience classic Pong in stunning 3D with realistic physics and particle effects.',
            icon: '🏓',
            color: 'cyan',
            features: ['Real-time multiplayer', 'AI opponents', 'Tournament mode', 'Power-ups system']
        },
        // other
    ];

    render(): string {
        return `
            <section id="features" class="section-min-height flex items-center justify-center scroll-mt-20 p-6">
                <div class="w-full">
                    <h2 class="mb-12 text-center text-4xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 sm:text-5xl">
                        Platform Features
                    </h2>
                    <div class="mx-auto flex list-none flex-col items-center gap-8 sm:flex-row">
                        ${this.features.map(feature => this.renderFeature(feature)).join('')}
                    </div>
                </div>
            </section>
        `;
    }

    private renderFeature(feature: Feature): string {
        return `
            <div class="flex w-2/3 flex-col items-center rounded-3xl border border-gray-600 bg-gradient-to-br from-gray-800/80 to-gray-900/80 py-6 px-4 shadow-xl hover:border-${feature.color}-400 transition-all duration-300 sm:w-5/6">
                <div class="text-6xl mb-6">${feature.icon}</div>
                <h3 class="text-center text-2xl text-${feature.color}-400 font-bold font-game">${feature.title}</h3>
                <p class="text-center mt-2 text-gray-400 mb-4">${feature.description}</p>
                <ul class="text-sm text-gray-500 space-y-1 text-center">
                    ${feature.features.map(f => `<li>• ${f}</li>`).join('')}
                </ul>
            </div>
        `;
    }
}