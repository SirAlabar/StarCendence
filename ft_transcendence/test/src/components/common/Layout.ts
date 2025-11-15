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
    renderPageSection(id: string, content: string, addPadding: boolean = true): string 
    {
        const paddingClass = addPadding ? 'pt-20' : '';
        return `
            <section id="${id}" class="min-h-screen flex items-center justify-center scroll-mt-20 p-6 ${paddingClass}">
                <div class="w-full max-w-7xl mx-auto">
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
            <div class="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 -z-10">
            </div>
        `;
    }

    private renderFooter(): string 
    {
        return `
            <footer class="relative z-20 bg-gray-900/90 border-t border-purple-500/20">
                <div class="mx-auto max-w-4xl p-6">
                    <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div class="text-gray-400 text-sm">
                            © 2025 42 Transcendence. Built with ❤️ at 42 School.
                        </div>
                        <div class="flex gap-4 text-sm">
                            <a href="#" class="text-cyan-400 hover:text-purple-400 transition-colors">Privacy</a>
                            <a href="#" class="text-cyan-400 hover:text-purple-400 transition-colors">Terms</a>
                            <a href="#" class="text-cyan-400 hover:text-purple-400 transition-colors">Support</a>
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }
}