import { BaseComponent } from '../BaseComponent';

interface Feature 
{
    title: string;
    description: string;
    icon: string;
    color: string;
    features: string[];
}

export class Features extends BaseComponent 
{
    private features: Feature[] = [
        {
            title: '3D Pong Arena',
            description: 'Experience classic Pong in stunning 3D with realistic physics and particle effects.',
            icon: '🏓',
            color: 'cyan',
            features: ['Real-time multiplayer', 'AI opponents', 'Tournament mode', 'Power-ups system']
        },
        {
            title: 'Star Wars Racer',
            description: 'High-speed pod racing through iconic Star Wars environments.',
            icon: '🏎️',
            color: 'purple',
            features: ['Multiple tracks', 'Vehicle customization', 'Time trials', 'Championship mode']
        },
        {
            title: 'Live Tournament',
            description: 'Compete against players worldwide in organized tournaments.',
            icon: '🏆',
            color: 'pink',
            features: ['Bracket system', 'Real-time scoring', 'Prize pools', 'Spectator mode']
        }
    ];

    render(): string 
    {
        return `
            <div class="text-center">
                ${this.renderTitle()}
                ${this.renderFeatureGrid()}
            </div>
        `;
    }

    private renderTitle(): string 
    {
        return `
            <h2 class="mb-12 text-4xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 sm:text-5xl">
                Platform Features
            </h2>
        `;
    }

    private renderFeatureGrid(): string 
    {
        return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                ${this.features.map(feature => this.renderFeature(feature)).join('')}
            </div>
        `;
    }

    private renderFeature(feature: Feature): string 
    {
        return `
            <div class="feature-card flex flex-col items-center rounded-3xl border border-gray-600 bg-gradient-to-br from-gray-800/80 to-gray-900/80 py-8 px-6 shadow-xl hover:border-${feature.color}-400 transition-all duration-300">
                <div class="text-6xl mb-6">${feature.icon}</div>
                <h3 class="text-2xl text-${feature.color}-400 font-bold font-game mb-4">${feature.title}</h3>
                <p class="text-gray-400 mb-6 text-center">${feature.description}</p>
                <ul class="text-sm text-gray-500 space-y-2">
                    ${feature.features.map(f => `<li class="flex items-center"><span class="text-${feature.color}-400 mr-2">•</span>${f}</li>`).join('')}
                </ul>
            </div>
        `;
    }
}