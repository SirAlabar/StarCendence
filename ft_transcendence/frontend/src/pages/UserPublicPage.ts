import { BaseComponent } from '../components/BaseComponent';

export default class UserPublicPage extends BaseComponent 
{
    render(): string 
    {
        return `
            <div class="container mx-auto px-6 py-8 max-w-4xl">
                <h1 class="text-4xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-8 text-center">
                    👤 User Profile
                </h1>
                
                <div class="bg-gray-800/80 rounded-lg p-8 border border-gray-600 text-center">
                    <div class="w-32 h-32 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                        👤
                    </div>
                    <h2 class="text-3xl font-bold text-white mb-2">Loading...</h2>
                    <p class="text-gray-400">Fetching user profile...</p>
                </div>
            </div>
        `;
    }
}