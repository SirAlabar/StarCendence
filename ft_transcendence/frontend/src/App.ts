import { Header } from './components/common/Header';
import { Hero } from './components/home/Hero';
import { Team } from './components/home/Team';
import { Features } from './components/home/Features';
import { About } from './components/home/About';

export class App {
    private container: HTMLElement | null = null;
    private header: Header;
    private hero: Hero;
    private team: Team;
    private features: Features;
    private about: About;

    constructor() {
        this.header = new Header();
        this.hero = new Hero();
        this.team = new Team();
        this.features = new Features();
        this.about = new About();
    }

    mount(selector: string): void {
        this.container = document.querySelector(selector);
        if (!this.container) {
            throw new Error(`Element with selector "${selector}" not found`);
        }

        this.render();
        this.setupEventListeners();
    }

    private render(): void {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="min-h-screen">
                <!-- Fixed Space Background -->
                <div class="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 -z-10"></div>
                
                <!-- Header -->
                <div id="header-mount"></div>
                
                <!-- Main Content -->
                <main class="mx-auto max-w-4xl">
                    <div id="hero-mount"></div>
                    <hr class="mx-auto w-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-400 border-0" />
                    
                    <div id="team-mount"></div>
                    <hr class="mx-auto w-1/2 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 border-0" />
                    
                    <div id="features-mount"></div>
                    <hr class="mx-auto w-1/2 h-0.5 bg-gradient-to-r from-pink-400 to-cyan-400 border-0" />
                    
                    <div id="about-mount"></div>
                </main>
            </div>
        `;

        // Mount components
        this.header.mount('#header-mount');
        this.hero.mount('#hero-mount');
        this.team.mount('#team-mount');
        this.features.mount('#features-mount');
        this.about.mount('#about-mount');
    }

    private setupEventListeners(): void {
        // Smooth scrolling for navigation
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
                e.preventDefault();
                const section = document.querySelector(target.getAttribute('href')!);
                section?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}