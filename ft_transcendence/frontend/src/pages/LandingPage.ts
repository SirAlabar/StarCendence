import { BaseComponent } from '../components/BaseComponent';
import { Layout } from '../components/common/Layout';
import { Hero } from '../components/home/Hero';
import { Team } from '../components/home/Team';
import { Features } from '../components/home/Features';
import { About } from '../components/home/About';

export default class LandingPage extends BaseComponent 
{
    private layout: Layout;
    private hero: Hero;
    private team: Team;
    private features: Features;
    private about: About;

    constructor() 
    {
        super();
        this.layout = new Layout();
        this.hero = new Hero();
        this.team = new Team();
        this.features = new Features();
        this.about = new About();
    }

    render(): string 
    {
        return `
            <div class="space-y-0">
                ${this.layout.renderPageSection('hero', this.hero.render(), true)}
                ${this.layout.renderSectionSeparator()}
                ${this.layout.renderPageSection('team', this.team.render(), false)}
                ${this.layout.renderSectionSeparator()}
                ${this.layout.renderPageSection('features', this.features.render(), false)}
                ${this.layout.renderSectionSeparator()}
                ${this.layout.renderPageSection('about', this.about.render(), false)}
            </div>
        `;
    }

    mount(_selector: string): void 
    {
        // Add smooth scrolling for internal navigation
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