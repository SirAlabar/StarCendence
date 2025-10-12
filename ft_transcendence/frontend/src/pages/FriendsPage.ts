import { BaseComponent } from '../components/BaseComponent';

export default class FriendsPage extends BaseComponent 
{
    render(): string 
    {
        return `
            <div class="container mx-auto px-6 py-8 max-w-4xl">
                <h1 class="text-4xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-8 text-center">
                    👥 Friends
                </h1>
                
                <div class="bg-gray-800/80 rounded-lg p-8 border border-gray-600">
                    <div class="text-center">
                        <p class="text-gray-400 text-lg">Friends management coming soon...</p>
                    </div>
                </div>
            </div>
        `;
    }
}