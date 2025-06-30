import { BaseComponent } from '../components/BaseComponent';

export default class ProfilePage extends BaseComponent 
{
    render(): string 
    {
        return `
            <div class="container mx-auto px-6 py-8 max-w-4xl">
                <h1 class="text-4xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-8 text-center">
                    👤 Player Profile
                </h1>
                
                <div class="grid md:grid-cols-3 gap-8">
                    <!-- Profile Info -->
                    <div class="md:col-span-1">
                        <div class="bg-gray-800/80 rounded-lg p-6 border border-gray-600 text-center">
                            <div class="w-24 h-24 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
                                👤
                            </div>
                            <h2 class="text-2xl font-bold text-white mb-2">Player Name</h2>
                            <p class="text-gray-400 mb-4">Level 15 Gamer</p>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-400">Joined:</span>
                                    <span class="text-white">Jan 2024</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-400">Rank:</span>
                                    <span class="text-cyan-400">#42</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Profile Details -->
                    <div class="md:col-span-2">
                        <div class="bg-gray-800/80 rounded-lg p-6 border border-gray-600">
                            <h3 class="text-xl font-bold text-green-400 mb-6">Profile Information</h3>
                            
                            <form class="space-y-4">
                                <div class="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-300 mb-2">Username</label>
                                        <input type="text" value="PlayerName" class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-400 focus:outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                        <input type="email" value="player@example.com" class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-400 focus:outline-none">
                                    </div>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                                    <textarea rows="3" placeholder="Tell us about yourself..." class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-400 focus:outline-none resize-none"></textarea>
                                </div>
                                
                                <div class="flex space-x-4">
                                    <button type="submit" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                                        Save Changes
                                    </button>
                                    <button onclick="navigateTo('/dashboard')" class="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">
                                        Back to Dashboard
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                
                <div class="text-center mt-8">
                    <button onclick="navigateTo('/')" class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
                        Home
                    </button>
                </div>
            </div>
        `;
    }
}