import { BaseComponent } from '../../components/BaseComponent';

export default class TournamentPage extends BaseComponent 
{
    render(): string 
    {
        return `
            <div class="container mx-auto px-6 py-8">
                <h1 class="text-4xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-400 mb-8 text-center">
                    🏆 Tournaments
                </h1>
                
                <div class="grid lg:grid-cols-3 gap-8">
                    <!-- Active Tournaments -->
                    <div class="lg:col-span-2">
                        <h2 class="text-2xl font-bold text-yellow-400 mb-6">Active Tournaments</h2>
                        
                        <div class="space-y-4">
                            <!-- Tournament 1 -->
                            <div class="bg-gray-800/80 rounded-lg p-6 border border-yellow-500/50">
                                <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 class="text-xl font-bold text-white">Weekly Pong Championship</h3>
                                        <p class="text-gray-300">3D Pong Tournament</p>
                                    </div>
                                    <span class="bg-green-600 text-white px-3 py-1 rounded-full text-sm">LIVE</span>
                                </div>
                                
                                <div class="grid md:grid-cols-3 gap-4 mb-4">
                                    <div class="text-center">
                                        <p class="text-gray-400">Players</p>
                                        <p class="text-white font-bold">12/16</p>
                                    </div>
                                    <div class="text-center">
                                        <p class="text-gray-400">Prize Pool</p>
                                        <p class="text-yellow-400 font-bold">1000 pts</p>
                                    </div>
                                    <div class="text-center">
                                        <p class="text-gray-400">Time Left</p>
                                        <p class="text-red-400 font-bold">2h 15m</p>
                                    </div>
                                </div>
                                
                                <button class="w-full bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 font-bold">
                                    Join Tournament
                                </button>
                            </div>
                            
                            <!-- Tournament 2 -->
                            <div class="bg-gray-800/80 rounded-lg p-6 border border-purple-500/50">
                                <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 class="text-xl font-bold text-white">Pod Racing Grand Prix</h3>
                                        <p class="text-gray-300">Star Wars Pod Racing</p>
                                    </div>
                                    <span class="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">SOON</span>
                                </div>
                                
                                <div class="grid md:grid-cols-3 gap-4 mb-4">
                                    <div class="text-center">
                                        <p class="text-gray-400">Players</p>
                                        <p class="text-white font-bold">4/8</p>
                                    </div>
                                    <div class="text-center">
                                        <p class="text-gray-400">Prize Pool</p>
                                        <p class="text-purple-400 font-bold">2500 pts</p>
                                    </div>
                                    <div class="text-center">
                                        <p class="text-gray-400">Starts In</p>
                                        <p class="text-blue-400 font-bold">1 day</p>
                                    </div>
                                </div>
                                
                                <button class="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-bold">
                                    Register
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tournament Info -->
                    <div class="lg:col-span-1">
                        <div class="bg-gray-800/80 rounded-lg p-6 border border-gray-600">
                            <h3 class="text-xl font-bold text-yellow-400 mb-4">Tournament Rules</h3>
                            
                            <div class="space-y-3 text-gray-300">
                                <div class="flex items-start space-x-2">
                                    <span class="text-green-400">✓</span>
                                    <span>Single elimination format</span>
                                </div>
                                <div class="flex items-start space-x-2">
                                    <span class="text-green-400">✓</span>
                                    <span>Best of 3 matches</span>
                                </div>
                                <div class="flex items-start space-x-2">
                                    <span class="text-green-400">✓</span>
                                    <span>Fair play policy</span>
                                </div>
                                <div class="flex items-start space-x-2">
                                    <span class="text-green-400">✓</span>
                                    <span>No AI assistance</span>
                                </div>
                            </div>
                            
                            <div class="mt-6">
                                <h4 class="font-bold text-white mb-2">Prizes</h4>
                                <div class="space-y-1 text-sm">
                                    <div class="flex justify-between">
                                        <span class="text-yellow-400">🥇 1st Place:</span>
                                        <span class="text-white">50%</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-400">🥈 2nd Place:</span>
                                        <span class="text-white">30%</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-orange-400">🥉 3rd Place:</span>
                                        <span class="text-white">20%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Quick Actions -->
                        <div class="bg-gray-800/80 rounded-lg p-6 border border-gray-600 mt-6">
                            <h3 class="text-xl font-bold text-yellow-400 mb-4">Quick Actions</h3>
                            
                            <div class="space-y-3">
                                <button onclick="navigateTo('/games')" class="w-full bg-cyan-600 text-white py-2 rounded hover:bg-cyan-700">
                                    Practice Games
                                </button>
                                <button onclick="navigateTo('/leaderboard')" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                                    View Rankings
                                </button>
                                <button onclick="navigateTo('/dashboard')" class="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700">
                                    Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="text-center mt-8">
                    <button onclick="navigateTo('/')" class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
                        Back to Home
                    </button>
                </div>
            </div>
        `;
    }
}