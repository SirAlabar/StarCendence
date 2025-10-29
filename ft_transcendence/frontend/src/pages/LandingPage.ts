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

		const featureCards = document.querySelectorAll(".feature-card");
		featureCards.forEach((card, index) =>
		{
			const fromLeft = index === 0;
			const rotation = fromLeft ? "-rotate-24" : "rotate-24";

			card.classList.remove("opacity-100", "translate-x-0", "rotate-0");
			card.classList.add(
				"opacity-0",
				fromLeft ? "-translate-x-48" : "translate-x-48",
				rotation,
				"transition-all",
				"duration-900",
				"ease-[cubic-bezier(0.13,1.22,0.35,1.0)]"
			);

			setTimeout(() =>
			{
				card.classList.remove(
					"opacity-0",
					"-translate-x-48",
					"translate-x-48",
					"-rotate-24",
					"rotate-24"
				);
				card.classList.add("opacity-100", "translate-x-0", "rotate-0");
			}, index * 350);
		});

		const heroContent = document.querySelector(".hero-content");
		const heroMedia = document.querySelector(".hero-media");

		if (heroContent)
		{
			heroContent.classList.remove("opacity-100", "translate-x-0");
			heroContent.classList.add(
				"opacity-0",
				"-translate-x-48",
				"transition-all",
				"duration-900",
				"ease-[cubic-bezier(0.13,1.22,0.35,1.0)]"
			);
		}

		if (heroMedia)
		{
			heroMedia.classList.remove("opacity-100", "translate-x-0");
			heroMedia.classList.add(
				"opacity-0",
				"translate-x-48",
				"transition-all",
				"duration-900",
				"ease-[cubic-bezier(0.13,1.22,0.35,1.0)]"
			);
		}

        const aboutBoxes = document.querySelectorAll(".about-box");

        aboutBoxes.forEach((box, index) =>
        {
            box.classList.remove("opacity-100", "translate-y-0", "rotate-0");

            box.classList.add(
                "opacity-0",
                "translate-y-48",
                "-rotate-12",
                "transition-all",
                "duration-[1100ms]",
                "ease-[cubic-bezier(0.22,1.0,0.36,1.0)]"
            );

            setTimeout(() => {
                box.classList.remove("opacity-0", "translate-y-48", "-rotate-12");
                box.classList.add("opacity-100", "translate-y-0", "rotate-0");
            }, index * 350);
        });


		setTimeout(() =>
		{
			if (heroContent) heroContent.classList.remove("opacity-0", "-translate-x-48");
			if (heroContent) heroContent.classList.add("opacity-100", "translate-x-0");

			if (heroMedia) heroMedia.classList.remove("opacity-0", "translate-x-48");
			if (heroMedia) heroMedia.classList.add("opacity-100", "translate-x-0");
		}, 200);
	};

	resetAndAnimate();

	window.addEventListener("popstate", resetAndAnimate);
	window.addEventListener("hashchange", resetAndAnimate);

	document.addEventListener("click", (e) => {
		const target = e.target as HTMLElement;
		if (target.tagName === "A" && target.getAttribute("href")?.startsWith("#")) {
			setTimeout(() => resetAndAnimate(), 100);
		}
	});
}








}