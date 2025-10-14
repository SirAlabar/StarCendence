//  Profile editing form
import { BaseComponent } from '../BaseComponent';
import UserService from '../../services/UserService';

interface ProfileEditProps 
{
    bio: string;
    onBioUpdated: (newBio: string) => void;
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

export class ProfileEdit extends BaseComponent 
{
    private props: ProfileEditProps;

    constructor(props: ProfileEditProps) 
    {
        super();
        this.props = props;
    }

    render(): string 
    {
        return `
            <div class="mb-6">
                <label class="block text-sm font-bold text-cyan-300 mb-3 tracking-wide">BIOGRAPHICAL DATA</label>
                <textarea 
                    id="bio-input"
                    rows="5" 
                    placeholder="Write your bio..."
                    maxlength="160"
                    class="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700/50 rounded-lg text-cyan-100 focus:border-cyan-500 focus:outline-none resize-none font-mono text-sm backdrop-blur-sm"
                >${this.escapeHtml(this.props.bio)}</textarea>
                <div class="text-right text-sm text-cyan-400 mt-2 font-mono">
                    <span id="bio-counter">${this.props.bio.length}</span>/160 CHARACTERS
                </div>
            </div>
            
            <div class="flex justify-center gap-3">
                <button id="save-bio-btn" class="neon-border-green px-6 py-2 rounded-lg font-bold text-green-400 tracking-wide transition-all backdrop-blur-sm text-sm">
                    SAVE
                </button>
                <button id="cancel-bio-btn" class="neon-border px-6 py-2 rounded-lg font-bold text-cyan-400 tracking-wide transition-all backdrop-blur-sm text-sm">
                    CANCEL
                </button>
            </div>
            
            <style>
                .neon-border {
                    border: 2px solid #00ffff;
                    box-shadow:
                        0 0 10px rgba(0, 255, 255, 0.5),
                        0 0 20px rgba(0, 255, 255, 0.3),
                        inset 0 0 10px rgba(0, 255, 255, 0.2);
                    transition: all 0.3s ease;
                }

                .neon-border:hover {
                    box-shadow:
                        0 0 15px rgba(0, 255, 255, 0.8),
                        0 0 30px rgba(0, 255, 255, 0.5),
                        inset 0 0 15px rgba(0, 255, 255, 0.3);
                    transform: translateY(-2px);
                }
                
                .neon-border-green {
                    border: 2px solid #00ff88;
                    box-shadow:
                        0 0 10px rgba(0, 255, 136, 0.6),
                        0 0 20px rgba(0, 255, 136, 0.4),
                        inset 0 0 10px rgba(0, 255, 136, 0.2);
                    transition: all 0.3s ease;
                }

                .neon-border-green:hover {
                    box-shadow:
                        0 0 15px rgba(0, 255, 136, 0.9),
                        0 0 30px rgba(0, 255, 136, 0.6),
                        inset 0 0 15px rgba(0, 255, 136, 0.3);
                    transform: translateY(-2px);
                }
            </style>
        `;
    }

    protected afterMount(): void 
    {
        this.setupEventListeners();
    }

    private setupEventListeners(): void 
    {
        const bioInput = document.getElementById('bio-input') as HTMLTextAreaElement;
        const bioCounter = document.getElementById('bio-counter');
        
        if (bioInput && bioCounter) 
        {
            bioInput.addEventListener('input', () => 
            {
                bioCounter.textContent = bioInput.value.length.toString();
            });
        }

        const saveBioBtn = document.getElementById('save-bio-btn');
        if (saveBioBtn) 
        {
            saveBioBtn.addEventListener('click', () => this.handleSaveBio());
        }

        const cancelBioBtn = document.getElementById('cancel-bio-btn');
        if (cancelBioBtn && bioInput) 
        {
            cancelBioBtn.addEventListener('click', () => 
            {
                bioInput.value = this.props.bio;
                if (bioCounter) 
                {
                    bioCounter.textContent = bioInput.value.length.toString();
                }
            });
        }
    }

    private async handleSaveBio(): Promise<void> 
    {
        const bioInput = document.getElementById('bio-input') as HTMLTextAreaElement;
        if (!bioInput) 
        {
            return;
        }

        const newBio = bioInput.value.trim();

        try 
        {
            const updatedProfile = await UserService.updateProfile(newBio);
            this.props.onBioUpdated(updatedProfile.bio || '');
            this.props.onSuccess('Bio updated successfully');
        } 
        catch (err) 
        {
            this.props.onError((err as Error).message);
            console.error('Failed to update bio:', err);
        }
    }

    private escapeHtml(text: string): string 
    {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}