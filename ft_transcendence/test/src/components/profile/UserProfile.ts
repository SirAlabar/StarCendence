import { BaseComponent } from '../BaseComponent';
import { UserProfile as UserProfileType } from '../../types/user.types';
import { AvatarUpload } from './AvatarUpload';
import { ProfileEdit } from './ProfileEdit';

interface UserProfileComponentProps 
{
    userProfile: UserProfileType;
    onProfileUpdated: (profile: UserProfileType) => void;
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

export class UserProfileComponent extends BaseComponent 
{
    private props: UserProfileComponentProps;
    private avatarUpload: AvatarUpload | null = null;
    private profileEdit: ProfileEdit | null = null;

    constructor(props: UserProfileComponentProps) 
    {
        super();
        this.props = props;
    }

    render(): string 
    {
        const statusColor = this.getStatusColor(this.props.userProfile.status);
        const statusText = this.getStatusText(this.props.userProfile.status);

        return `
            <div class="bg-gray-800/20 backdrop-blur-md rounded-lg p-4 sm:p-6 md:p-8 border border-gray-700/50">
                <!-- Avatar Section -->
                <div id="avatar-container" class="mb-4 sm:mb-6"></div>
                
                <h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-400 mb-3 sm:mb-4 tracking-wider text-center break-words">
                    ${this.escapeHtml(this.props.userProfile.username).toUpperCase()}
                </h2>
                
                <div class="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <span class="inline-block w-3 h-3 sm:w-4 sm:h-4 rounded-full ${statusColor}"></span>
                    <span class="text-gray-300 text-xs sm:text-sm font-bold tracking-wide">${statusText}</span>
                </div>
                
                <div class="space-y-2 sm:space-y-3 text-xs sm:text-sm mb-6 sm:mb-8">
                    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-700/50 gap-1">
                        <span class="text-gray-400 font-medium">TRANSMISSION:</span>
                        <span class="text-cyan-300 text-xs break-all">${this.escapeHtml(this.props.userProfile.email)}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-700/50 gap-1">
                        <span class="text-gray-400 font-medium">ENLISTED:</span>
                        <span class="text-cyan-300">${this.formatDate(this.props.userProfile.createdAt)}</span>
                    </div>
                </div>
                
                <!-- Bio Edit Section -->
                <div id="profile-edit-container"></div>
            </div>
        `;
    }

    protected afterMount(): void 
    {
        this.mountAvatarUpload();
        this.mountProfileEdit();
    }

    private mountAvatarUpload(): void 
    {
        this.avatarUpload = new AvatarUpload({
            avatarUrl: this.props.userProfile.avatarUrl || null,
            username: this.props.userProfile.username,
            onAvatarUpdated: (newAvatarUrl: string) => 
            {
                const updatedProfile = { ...this.props.userProfile, avatarUrl: newAvatarUrl };
                this.props.onProfileUpdated(updatedProfile);
            },
            onError: this.props.onError,
            onSuccess: this.props.onSuccess
        });

        this.avatarUpload.mount('#avatar-container');
    }

    private mountProfileEdit(): void 
    {
        this.profileEdit = new ProfileEdit({
            bio: this.props.userProfile.bio || '',
            onBioUpdated: (newBio: string) => 
            {
                const updatedProfile = { ...this.props.userProfile, bio: newBio };
                this.props.onProfileUpdated(updatedProfile);
            },
            onError: this.props.onError,
            onSuccess: this.props.onSuccess
        });

        this.profileEdit.mount('#profile-edit-container');
    }

    private getStatusColor(status?: string): string 
    {
        switch (status) 
        {
            case 'ONLINE':
                return 'bg-green-500';
            case 'AWAY':
                return 'bg-yellow-500';
            case 'IN_GAME':
                return 'bg-blue-500';
            case 'OFFLINE':
            default:
                return 'bg-gray-500';
        }
    }

    private getStatusText(status?: string): string 
    {
        switch (status) 
        {
            case 'ONLINE':
                return 'CONNECT';
            case 'AWAY':
                return 'ON STANDBY';
            case 'IN_GAME':
                return 'IN COMBAT';
            case 'OFFLINE':
            default:
                return 'OFF DUTY';
        }
    }

    private formatDate(dateString: string): string 
    {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-US', options).toUpperCase();
    }

    private escapeHtml(text: string): string 
    {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}