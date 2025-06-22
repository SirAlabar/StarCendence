// frontend/src/components/home/Hero.ts
import { BaseComponent, tw } from '../BaseComponent';

export class Hero extends BaseComponent {
    render(): string {
        return `
            <section id="hero" class="section-min-height flex scroll-mt-40 flex-col-reverse items-center justify-center gap-8 p-6 sm:flex-row">
                ${this.renderContent()}
                ${this.renderGamePreview()}
            </section>
        `;
    }

    private renderContent(): string {
        return `
            <article class="sm:w-1/2">
                <h2 class="max-w-md text-center text-4xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-400 sm:text-left sm:text-5xl">
                    TRANSCENDENCE
                </h2>
                <p class="mt-4 max-w-md text-center text-2xl text-gray-300 sm:text-left">
                    Experience the ultimate gaming platform with <span class="text-cyan-400">3D Pong</span> and 
                    <span class="text-purple-400">Star Wars Pod Racing</span> in stunning multiplayer environments.
                </p>
                ${this.renderButtons()}
            </article>
        `;
    }

    private renderButtons(): string {
        return `
            <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
                <button class="${tw.bg.gradient} px-8 py-4 rounded-lg font-bold text-lg text-black hover:scale-105 transition-transform">
                    🚀 Start Playing
                </button>
                <button class="border-2 border-purple-500 px-8 py-4 rounded-lg font-bold text-lg hover:bg-purple-500 hover:bg-opacity-20 transition-colors">
                    📊 View Tournament
                </button>
            </div>
        `;
    }

    private renderGamePreview(): string {
        return `
            <div class="sm:w-1/2">
                <div class="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-3xl p-8 border border-gray-600">
                    <div class="aspect-video bg-gradient-to-br from-purple-500/20 to-cyan-400/20 rounded-2xl flex items-center justify-center">
                        <div class="text-6xl opacity-50">🏓</div>
                    </div>
                    <div class="mt-6 text-center">
                        <h3 class="text-2xl font-game font-bold text-cyan-400 mb-2">3D Pong Arena</h3>
                        <p class="text-gray-400">Real-time multiplayer gaming experience</p>
                    </div>
                </div>
            </div>
        `;
    }
}

