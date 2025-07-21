import { initRouter } from './router/router';

export class App 
{
    private container: HTMLElement | null = null;

    constructor() 
    {
    }

    mount(selector: string): void 
    {
        this.container = document.querySelector(selector);
        if (!this.container) 
        {
            throw new Error(`Element with selector "${selector}" not found`);
        }

        // Initialize the functional router system
        initRouter();
    }
}