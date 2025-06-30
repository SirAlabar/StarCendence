import { Layout } from './components/common/Layout';
import { Header } from './components/common/Header';
import { Hero } from './components/home/Hero';
import { Team } from './components/home/Team';
import { Features } from './components/home/Features';
import { About } from './components/home/About';

export class App 
{
    private container: HTMLElement | null = null;
    private layout: Layout;
    private header: Header;
    private hero: Hero;
    private team: Team;
    private features: Features;
    private about: About;

    constructor() 
    {
        this.layout = new Layout();
        this.header = new Header();
        this.hero = new Hero();
        this.team = new Team();
        this.features = new Features();
        this.about = new About();
    }

    mount(selector: string): void 
    {
        this.container = document.querySelector(selector);
        if (!this.container) 
        {
            throw new Error(`Element with selector "${selector}" not found`);
        }

        this.render();
        this.setupEventListeners();
    }

    private render(): void 
    {
        if (!this.container) return;

        // Mount the main layout first
        this.layout.mount('#app');

        // Mount header
        this.header.mount('#header-mount');

        // Mount main content sections
        this.renderMainContent();
    }

    private renderMainContent(): void 
    {
        const contentMount = document.querySelector('#content-mount');
        if (!contentMount) return;

        contentMount.innerHTML = `
            <div class="mx-auto max-w-4xl">
                <!-- Hero Section -->
                <div id="hero-mount"></div>
                
                <!-- Separator -->
                <hr class="mx-auto w-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-400 border-0 my-12" />
                
                <!-- Team Section -->
                <div id="team-mount"></div>
                
                <!-- Separator -->
                <hr class="mx-auto w-1/2 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 border-0 my-12" />
                
                <!-- Features Section -->
                <div id="features-mount"></div>
                
                <!-- Separator -->
                <hr class="mx-auto w-1/2 h-0.5 bg-gradient-to-r from-pink-400 to-cyan-400 border-0 my-12" />
                
                <!-- About Section -->
                <div id="about-mount"></div>
            </div>
        `;

        // Mount individual components
        this.hero.mount('#hero-mount');
        this.team.mount('#team-mount');
        this.features.mount('#features-mount');
        this.about.mount('#about-mount');
    }

    private setupEventListeners(): void 
    {
        // Smooth scrolling for navigation
        document.addEventListener('click', (e) => 
        {
            const target = e.target as HTMLElement;
            if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) 
            {
                e.preventDefault();
                const section = document.querySelector(target.getAttribute('href')!);
                section?.scrollIntoView({ behavior: 'smooth' });
            }
        });

        // Add scroll-based animations
        this.setupScrollAnimations();
    }

    private setupScrollAnimations(): void 
    {
        const observer = new IntersectionObserver((entries) => 
        {
            entries.forEach(entry => 
            {
                if (entry.isIntersecting) 
                {
                    entry.target.classList.add('animate-fadeIn');
                }
            });
        }, { threshold: 0.1 });

        // Observe all main sections
        setTimeout(() => 
        {
            document.querySelectorAll('section').forEach(section => 
            {
                observer.observe(section);
            });
        }, 100);
    }
}