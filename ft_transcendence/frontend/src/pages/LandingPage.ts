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
        const resetAndAnimate = () =>
        {
            // === TEAM ANIMATION (2 up / 2 down)
            const teamCards = document.querySelectorAll(".team-card");
            teamCards.forEach((card, index) =>
            {
                const fromTop = index % 2 === 0;
                card.classList.remove("opacity-100", "translate-y-0", "scale-100");
                card.classList.add(
                    "opacity-0",
                    fromTop ? "-translate-y-48" : "translate-y-48",
                    "scale-60",
                    "transition-all",
                    "duration-900",
                    "ease-[cubic-bezier(0.13,1.22,0.35,1.0)]"
                );
                setTimeout(() =>
                {
                    card.classList.remove("opacity-0", "-translate-y-48", "translate-y-48", "scale-60");
                    card.classList.add("opacity-100", "translate-y-0", "scale-100");
                }, index * 350);
            });

            // === FEATURES ANIMATION (fade + lateral)
            const featureCards = document.querySelectorAll(".feature-card");
            featureCards.forEach((card, index) =>
            {
                card.classList.remove("opacity-100", "translate-x-0");
                card.classList.add(
                    "opacity-0",
                    index % 2 === 0 ? "-translate-x-32" : "translate-x-32",
                    "transition-all",
                    "duration-700",
                    "ease-out"
                );
                setTimeout(() =>
                {
                    card.classList.remove("opacity-0", "-translate-x-32", "translate-x-32");
                    card.classList.add("opacity-100", "translate-x-0");
                }, index * 150);
            });

            // === ABOUT ANIMATION (fade + bottom to top)
            const aboutBoxes = document.querySelectorAll(".about-box");
            aboutBoxes.forEach((box, index) =>
            {
                box.classList.remove("opacity-100", "translate-y-0");
                box.classList.add(
                    "opacity-0",
                    "translate-y-24",
                    "transition-all",
                    "duration-700",
                    "ease-out"
                );
                setTimeout(() => {
                    box.classList.remove("opacity-0", "translate-y-24");
                    box.classList.add("opacity-100", "translate-y-0");
                }, index * 200);
            });

            // === HERO ANIMATION
            const heroContent = document.querySelector(".hero-content");
            const heroMedia = document.querySelector(".hero-media");

            if (heroContent) {
                heroContent.classList.remove("opacity-100", "translate-x-0");
                heroContent.classList.add("opacity-0", "-translate-x-48", "transition-all", "duration-900", "ease-[cubic-bezier(0.13,1.22,0.35,1.0)]");
            }
            if (heroMedia) {
                heroMedia.classList.remove("opacity-100", "translate-x-0");
                heroMedia.classList.add("opacity-0", "translate-x-48", "transition-all", "duration-900", "ease-[cubic-bezier(0.13,1.22,0.35,1.0)]");
            }

            setTimeout(() =>
            {
                if (heroContent) {
                    heroContent.classList.remove("opacity-0", "-translate-x-48");
                    heroContent.classList.add("opacity-100", "translate-x-0");
                }
                if (heroMedia) {
                    heroMedia.classList.remove("opacity-0", "translate-x-48");
                    heroMedia.classList.add("opacity-100", "translate-x-0");
                }
            }, 150);
        };

        // Execute initial animation
        resetAndAnimate();

        // Re-trigger on navigation
        window.addEventListener("popstate", resetAndAnimate);
        window.addEventListener("hashchange", resetAndAnimate);
        document.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === "A" && target.getAttribute("href")?.startsWith("#")) {
                setTimeout(() => resetAndAnimate(), 100);
            }
        });

        // === 3D TILT EFFECT
        const tiltTargets = document.querySelectorAll<HTMLElement>(".feature-card, .about-box, .team-card");
        tiltTargets.forEach(el => {
            el.addEventListener("mousemove", (e) => {
                const r = el.getBoundingClientRect();
                const x = e.clientX - r.left - r.width / 2;
                const y = e.clientY - r.top - r.height / 2;
                el.style.transform = `perspective(1000px) rotateX(${(-y / 18)}deg) rotateY(${(x / 18)}deg) scale(1.05)`;
            });
            el.addEventListener("mouseleave", () => {
                el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
            });
        });

        // === CAROUSELS WITH AUTO-SCROLL + DRAG
        this.initCarousel(".gameplay-track");
        this.initCarousel(".techsocial-track");
        this.initCarousel(".about-track");
    }

    /**
     * Initialize carousel with both auto-scroll AND drag
     */
    private initCarousel(trackSelector: string): void {
        const track = document.querySelector(trackSelector) as HTMLElement;
        if (!track) return;

        const parent = track.parentElement as HTMLElement;
        if (!parent) return;

        let offset = 0;
        let paused = false;
        let isDragging = false;
        let startX = 0;
        let dragOffset = 0;

        // Pause on hover
        parent.addEventListener('mouseenter', () => {
            paused = true;
        });

        parent.addEventListener('mouseleave', () => {
            if (!isDragging) {
                paused = false;
            }
        });

        // Drag to scroll
        track.addEventListener('mousedown', (e) => {
            isDragging = true;
            paused = true;
            startX = e.pageX;
            dragOffset = offset;
            track.style.cursor = 'grabbing';
        });

        const handleMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                track.style.cursor = 'grab';
                // Resume auto-scroll after 2 seconds
                setTimeout(() => {
                    if (!isDragging) paused = false;
                }, 2000);
            }
        };

        track.addEventListener('mouseup', handleMouseUp);
        track.addEventListener('mouseleave', handleMouseUp);
        document.addEventListener('mouseup', handleMouseUp);

        track.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const walk = (e.pageX - startX) * 1.5;
            offset = dragOffset + walk;
            track.style.transform = `translateX(${offset}px)`;
        });

        // Touch support
        track.addEventListener('touchstart', (e) => {
            isDragging = true;
            paused = true;
            startX = e.touches[0].pageX;
            dragOffset = offset;
        });

        track.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                setTimeout(() => {
                    if (!isDragging) paused = false;
                }, 2000);
            }
        });

        track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const walk = (e.touches[0].pageX - startX) * 1.5;
            offset = dragOffset + walk;
            track.style.transform = `translateX(${offset}px)`;
        });

        // Auto-scroll
        const speed = parseFloat(track.dataset.speed || '0.7');
        const animate = () => {
            if (!paused && !isDragging) {
                offset -= speed;
                if (Math.abs(offset) >= track.scrollWidth / 2) {
                    offset = 0;
                }
                track.style.transform = `translateX(${offset}px)`;
            }
            requestAnimationFrame(animate);
        };
        animate();
    }
}