import { BaseComponent } from '../components/BaseComponent';

export default class NotFoundPage extends BaseComponent 
{
    render(): string 
    {
        return `
            <div class="min-h-screen flex items-center justify-center text-center">
                <div class="max-w-md mx-auto">
                    <div class="text-8xl mb-6">🤖</div>
                    <h1 class="text-6xl font-bold text-red-500 mb-4">404</h1>
                    <h2 class="text-3xl font-bold text-white mb-4">Page Not Found</h2>
                    <p class="text-xl text-gray-300 mb-8">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                    
                    <div class="space-y-4">
                        <button onclick="navigateTo('/')" class="w-full bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 font-bold">
                            🏠 Go Home
                        </button>
                        <button onclick="navigateTo('/games')" class="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-bold">
                            🎮 Play Games
                        </button>
                        <button onclick="history.back()" class="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-bold">
                            ⬅️ Go Back
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}