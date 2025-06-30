import { BaseComponent, tw } from '../BaseComponent';

export class Layout extends BaseComponent 
{
    render(): string 
    {
        return `
            <div class="min-h-screen relative">
                <!-- Fixed Space Background -->
                ${this.renderBackground()}
                
                <!-- Header Section -->
                <div id="header-mount" class="relative z-20"></div>
                
                <!-- Main Content Area -->
                <main id="main-content" class="relative z-10">
                    <div id="content-mount"></div>
                </main>
                
                <!-- Footer Section -->
                ${this.renderFooter()}
            </div>
        `;
    }

    private renderBackground(): string 
    {
        return `
            <div class="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 -z-10">
                <!-- Animated stars background -->
                <div class="absolute inset-0 bg-[url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="1" fill="white" opacity="0.3"/><circle cx="80" cy="40" r="0.8" fill="white" opacity="0.2"/><circle cx="40" cy="80" r="1.2" fill="white" opacity="0.4"/><circle cx="90" cy="90" r="0.5" fill="white" opacity="0.3"/></svg>')] bg-repeat opacity-40 animate-pulse-slow"></div>
            </div>
        `;
    }

    private renderFooter(): string 
    {
        return `
            <footer class="relative z-20 bg-gray-900/90 border-t border-purple-500/20 mt-12">
                <div class="mx-auto max-w-4xl p-6">
                    <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div class="text-gray-400 text-sm">
                            © 2024 42 Transcendence. Built with ❤️ at 42 School.
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