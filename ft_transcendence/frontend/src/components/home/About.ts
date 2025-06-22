import { BaseComponent } from '../BaseComponent';

export class About extends BaseComponent {
    render(): string {
        return `
            <section id="about" class="section-min-height flex items-center justify-center scroll-mt-20 p-6">
                <div class="w-full">
                    <h2 class="mb-12 text-center text-4xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400 sm:text-5xl">
                        About 42 Transcendence
                    </h2>
                    
                    <div class="mx-auto max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
                        ${this.renderProjectInfo()}
                        ${this.renderTechStack()}
                    </div>
                </div>
            </section>
        `;
    }

    private renderProjectInfo(): string {
        return `
            <div class="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl p-8 border border-gray-600">
                <h3 class="text-2xl font-bold text-cyan-400 mb-4 font-game">🎯 Project Mission</h3>
                <p class="text-gray-300 leading-relaxed">
                    42 Transcendence is the final project of 42 School's web development curriculum. 
                    Our mission is to create a cutting-edge gaming platform that pushes the boundaries 
                    of web technology while delivering an exceptional user experience.
                </p>
            </div>
        `;
    }

    private renderTechStack(): string {
        const technologies = ['TypeScript', 'Babylon.js', 'Fastify', 'Redis', 'SQLite', 'Docker'];
        
        return `
            <div class="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl p-8 border border-gray-600">
                <h3 class="text-2xl font-bold text-purple-400 mb-4 font-game">⚡ Technology Stack</h3>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    ${technologies.map(tech => `
                        <span class="bg-purple-500/20 text-purple-400 px-3 py-1 rounded">${tech}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }
}