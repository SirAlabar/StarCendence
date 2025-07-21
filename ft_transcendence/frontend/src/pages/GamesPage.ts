import { BaseComponent } from '../components/BaseComponent';

export default class GamesPage extends BaseComponent 
{
    render(): string 
    {
        return `
            <div class="container mx-auto px-6 py-12 text-center">
                <h1 class="text-5xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-8">
                    Choose Your Game
                </h1>
                <p class="text-xl text-gray-300 mb-12">
                    Experience epic gaming in stunning 3D environments
                </p>

                <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <!-- Pong Game Card -->
                    <div class="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-3xl p-8 border border-gray-600 hover:border-cyan-400/50 transition-all group">
                        <div class="aspect-video bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center mb-6">
                            <div class="text-6xl opacity-70 group-hover:scale-110 transition-transform">🏓</div>
                        </div>
                        <h3 class="text-2xl font-bold text-cyan-400 mb-3">3D Pong</h3>
                        <p class="text-gray-300 mb-6">Classic Pong reimagined in stunning 3D. Battle friends or AI opponents in real-time multiplayer matches.</p>
                        <button onclick="navigateTo('/pong')" class="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-bold hover:scale-105 transition-transform">
                            Play Pong
                        </button>
                    </div>

                    <!-- Pod Racer Game Card -->
                    <div class="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-3xl p-8 border border-gray-600 hover:border-purple-400/50 transition-all group">
                        <div class="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl flex items-center justify-center mb-6">
                            <div class="text-6xl opacity-70 group-hover:scale-110 transition-transform">🏎️</div>
                        </div>
                        <h3 class="text-2xl font-bold text-purple-400 mb-3">Star Wars Pod Racer</h3>
                        <p class="text-gray-300 mb-6">Race through alien worlds at breakneck speeds. Master the art of podracing with realistic physics.</p>
                        <button onclick="navigateTo('/pod-racer')" class="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-bold hover:scale-105 transition-transform">
                            Start Racing
                        </button>
                    </div>
                </div>

                <!-- Navigation Test -->
                <div class="mt-16 text-center">
                    <h2 class="text-3xl font-bold text-white mb-6">Navigation Test</h2>
                    <div class="flex justify-center space-x-4">
                        <button onclick="navigateTo('/')" class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
                            Home
                        </button>
                        <button onclick="navigateTo('/tournament')" class="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700">
                            Tournament
                        </button>
                        <button onclick="navigateTo('/leaderboard')" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
                            Leaderboard
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}