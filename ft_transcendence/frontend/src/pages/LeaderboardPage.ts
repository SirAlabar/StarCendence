import { BaseComponent } from '../components/BaseComponent';

export default class LeaderboardPage extends BaseComponent 
{
    render(): string 
    {
        return `
            <div class="container mx-auto px-6 py-8">
                <h1 class="text-4xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-8 text-center">
                    🏆 Leaderboard
                </h1>
                
                <div class="max-w-4xl mx-auto">
                    <div class="bg-gray-800/80 rounded-lg border border-gray-600 overflow-hidden">
                        <div class="bg-gradient-to-r from-yellow-600 to-orange-600 p-4">
                            <h2 class="text-xl font-bold text-center">Top Players</h2>
                        </div>
                        
                        <div class="p-6">
                            <!-- Top 3 -->
                            <div class="grid md:grid-cols-3 gap-4 mb-8">
                                <div class="text-center p-4 bg-yellow-900/30 rounded-lg border border-yellow-500/50">
                                    <div class="text-3xl mb-2">🥇</div>
                                    <h3 class="font-bold text-yellow-400">Player1</h3>
                                    <p class="text-gray-300">2,450 pts</p>
                                </div>
                                <div class="text-center p-4 bg-gray-700/30 rounded-lg border border-gray-500/50">
                                    <div class="text-3xl mb-2">🥈</div>
                                    <h3 class="font-bold text-gray-300">Player2</h3>
                                    <p class="text-gray-300">2,180 pts</p>
                                </div>
                                <div class="text-center p-4 bg-orange-900/30 rounded-lg border border-orange-500/50">
                                    <div class="text-3xl mb-2">🥉</div>
                                    <h3 class="font-bold text-orange-400">Player3</h3>
                                    <p class="text-gray-300">1,920 pts</p>
                                </div>
                            </div>
                            
                            <!-- Rest of leaderboard -->
                            <div class="space-y-2">
                                ${Array.from({length: 7}, (_, i) => `
                                    <div class="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                                        <div class="flex items-center space-x-4">
                                            <span class="text-gray-400 font-bold w-8">#${i + 4}</span>
                                            <span class="text-white">Player${i + 4}</span>
                                        </div>
                                        <span class="text-cyan-400 font-bold">${1800 - (i * 100)} pts</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center mt-8 space-x-4">
                        <button onclick="navigateTo('/games')" class="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700">
                            Play to Climb
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