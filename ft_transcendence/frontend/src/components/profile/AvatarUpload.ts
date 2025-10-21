//  Avatar upload component
import { BaseComponent } from '../BaseComponent';
import UserService from '../../services/user/UserService';
import { getAvatarUrl } from '../../types/api.types';

interface AvatarUploadProps 
{
    avatarUrl: string | null;
    username: string;
    onAvatarUpdated: (newAvatarUrl: string) => void;
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

export class AvatarUpload extends BaseComponent 
{
    private props: AvatarUploadProps;

    constructor(props: AvatarUploadProps) 
    {
        super();
        this.props = props;
    }

    render(): string 
    {
        const avatarUrl = getAvatarUrl(this.props.avatarUrl);

        return `
        <div class="relative group w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto rounded-full overflow-hidden">
            ${avatarUrl
            ? `<img 
                src="${avatarUrl}" 
                alt="Avatar" 
                class="w-full h-full object-cover border-2 sm:border-4 border-cyan-500/50 rounded-full"
                >`
            : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-purple-600 border-2 sm:border-4 border-cyan-500/50 rounded-full">
                <svg class="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-cyan-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                </svg>
                </div>`
            }

            <!-- Hover overlay -->
            <div 
            class="absolute inset-0 flex items-center justify-center opacity-0 
                    group-hover:opacity-100 transition-opacity duration-300 
                    bg-black/60 cursor-pointer rounded-full"
            id="avatar-upload-trigger">
            <svg class="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            </div>

            <input 
            type="file" 
            id="avatar-input" 
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" 
            class="hidden"
            >
        </div>
        `;
    }

    protected afterMount(): void 
    {
        this.setupEventListeners();
    }

    private setupEventListeners(): void 
    {
        const uploadTrigger = document.getElementById('avatar-upload-trigger');
        const avatarInput = document.getElementById('avatar-input') as HTMLInputElement;

        if (uploadTrigger && avatarInput) 
        {
            uploadTrigger.addEventListener('click', () => 
            {
                avatarInput.click();
            });

            avatarInput.addEventListener('change', (e) => 
            {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) 
                {
                    this.handleUploadAvatar(file);
                }
            });
        }
    }

    private async handleUploadAvatar(file: File): Promise<void> 
    {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) 
        {
            this.props.onError('⌠Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.');
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) 
        {
            this.props.onError('⌠File size must be less than 5MB');
            return;
        }

        const isValidImage = await this.validateImageFile(file);
        if (!isValidImage) 
        {
            this.props.onError('⌠File is not a valid image. Please upload a real image file.');
            return;
        }

        try 
        {
            this.props.onSuccess('📤 Uploading avatar...');
            const avatarUrl = await UserService.uploadAvatar(file);
            this.props.onAvatarUpdated(avatarUrl);
            this.props.onSuccess('✅ Avatar uploaded successfully!');
        } 
        catch (err) 
        {
            const errorMessage = (err as Error).message;
            console.error('Failed to upload avatar:', err);
            
            if (errorMessage.includes('Session expired')) 
            {
                this.props.onError('⌠Session expired. Please login again.');
                setTimeout(() => 
                {
                    (window as any).navigateTo('/login');
                }, 2000);
            }
            else 
            {
                this.props.onError(`⌠${errorMessage}`);
            }
        }
    }

    private validateImageFile(file: File): Promise<boolean> 
    {
        return new Promise((resolve) => 
        {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            
            img.onload = () => 
            {
                URL.revokeObjectURL(objectUrl);
                resolve(true);
            };
            
            img.onerror = () => 
            {
                URL.revokeObjectURL(objectUrl);
                resolve(false);
            };
            
            img.src = objectUrl;
        });
    }
}