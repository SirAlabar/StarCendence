import { BaseComponent } from '../BaseComponent';

export class Layout extends BaseComponent 
{
    render(): string 
    {
        return `
            <div class="min-h-screen flex flex-col relative">
                <!-- Fixed Space Background -->
                ${this.renderBackground()}
                
                <!-- Header Section -->
                <div id="header-mount" class="relative z-20"></div>
                
                <!-- Main Content Area -->
                <main id="main-content" class="flex-1 relative z-10">
                    <div id="content-mount"></div>
                </main>
                
                <!-- Footer Section -->
                ${this.renderFooter()}
            </div>
        `;
    }

    // Page-level section wrapper - handles 100vh, alignment, spacing
    renderPageSection(id: string, content: string, _addPadding: boolean = true): string 
    {
        return `
            <section id="${id}" class="min-h-screen flex items-center justify-center scroll-mt-20">
                <div class="w-full">
                    ${content}
                </div>
            </section>
        `;
    }

    // Section separator
    renderSectionSeparator(): string 
    {
        return `
            <hr class="mx-auto w-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-400 border-0 my-12" />
        `;
    }

    private renderBackground(): string 
    {
        return `
            <div class="neon-background fixed inset-0 -z-10"></div>

            <style>
                .neon-background {
                    background: linear-gradient(135deg, 
                        #0a0a1a 0%, 
                        #0d1326 25%, 
                        #0b0f24 50%, 
                        #141233 75%, 
                        #1b1760 100%);
                    position: fixed;
                    inset: 0;
                    overflow: hidden;
                    z-index: -10;
                }

                .neon-background::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 30%, rgba(0,255,255,0.12), transparent 60%);
                    filter: blur(40px);
                    pointer-events: none;
                }
            </style>
        `;
    }



    private renderFooter(): string 
    {
        return `
            <footer class="relative z-20 bg-gray-900/90 border-t border-purple-500/20">
                <div class="mx-auto w-full max-w-6xl px-4 sm:px-6 py-4 sm:py-6">
                    <div class="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-center sm:text-left">
                        <!-- Copyright Text -->
                        <div class="text-gray-400 text-xs sm:text-sm order-2 sm:order-1">
                            © 2025 42 Transcendence. Built with ❤️ at 42 School.
                        </div>
                        
                        <!-- Footer Links -->
                        <nav class="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-xs sm:text-sm order-1 sm:order-2">
                            <a href="/privacy-policy" 
                               class="text-cyan-400 hover:text-purple-400 transition-colors duration-200 whitespace-nowrap" 
                               data-link
                               aria-label="Privacy Policy">
                                Privacy Policy
                            </a>
                            <span class="text-gray-600 hidden sm:inline">•</span>
                            <a href="/terms-of-service" 
                               class="text-cyan-400 hover:text-purple-400 transition-colors duration-200 whitespace-nowrap" 
                               data-link
                               aria-label="Terms of Service">
                                Terms of Service
                            </a>
                            <span class="text-gray-600 hidden sm:inline">•</span>
                            <a href="mailto:support@starcendence.dev" 
                               class="text-cyan-400 hover:text-purple-400 transition-colors duration-200 whitespace-nowrap"
                               aria-label="Contact Support">
                                Support
                            </a>
                        </nav>
                    </div>
                </div>
            </footer>
        `;
    }
}