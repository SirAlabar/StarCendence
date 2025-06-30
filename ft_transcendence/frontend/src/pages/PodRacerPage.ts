import { BaseComponent } from '../components/BaseComponent';

export default class PodRacerPage extends BaseComponent 
{
    render(): string 
    {
        return `
            <div class="h-full flex flex-col items-center justify-center text-center">
                <div class="bg-gradient-to-br from-purple-900/80 to-pink-900/80 rounded-3xl p-12 border border-purple-500/50">
                    <div class="text-8xl mb-6">🏎️</div>
                    <h1 class="text-5xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
                        Pod Racer Game
                    </h1>
                    <p class="text-xl text-gray-300 mb-8">
                        The pod racing game will be implemented here
                    </p>
                    <div class="bg-black/50 rounded-lg p-6 mb-8">
                        <h3 class="text-lg font-bold text-purple-400 mb-4">Coming Soon:</h3>
                        <ul class="text-gray-300 space-y-2">
                            <li>🎮 3D Pod Racing with Babylon.js</li>
                            <li>🏁 Multiple racing tracks</li>
                            <li>⚡ Power-ups and upgrades</li>
                            <li>🤖 AI opponents</li>
                            <li>🏆 Tournament mode</li>
                        </ul>
                    </div>
                    <div class="space-x-4">
                        <button onclick="navigateTo('/games')" class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
                            Back to Games
                        </button>
                        <button onclick="navigateTo('/')" class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
                            Home
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}