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

        // Mount main content sections using Layout's renderPageSection
        this.renderMainContent();
    }

    private renderMainContent(): void 
    {
        const contentMount = document.querySelector('#content-mount');
        if (!contentMount) return;

        // Use Layout to wrap each page component with proper styling
        contentMount.innerHTML = `
            ${this.layout.renderPageSection('hero', this.hero.render(), true)}
            ${this.layout.renderSectionSeparator()}
            ${this.layout.renderPageSection('team', this.team.render(), false)}
            ${this.layout.renderSectionSeparator()}
            ${this.layout.renderPageSection('features', this.features.render(), false)}
            ${this.layout.renderSectionSeparator()}
            ${this.layout.renderPageSection('about', this.about.render(), false)}
        `;
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
    }
}