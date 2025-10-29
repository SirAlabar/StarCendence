import { BaseComponent } from '../BaseComponent';

interface TeamMember {
    role: string;
    description: string;
    technologies: string[];
    accentColor: 'cyan' | 'purple' | 'pink';
    avatarUrl: string;
    profileUrl: string;
}

export class Team extends BaseComponent 
{
    private teamMembers: TeamMember[] = [
        {
            role: 'Full Stack Developer',
            description: 'Architecture • 3D Game • Integration',
            technologies: ['TypeScript', 'Node.js', 'Docker', 'Nginx', 'Redis', 'Babylon.js', 'Ammo.js'],
            accentColor: 'cyan',
            avatarUrl: 'https://avatars.githubusercontent.com/u/150078628?v=4',
            profileUrl: 'https://github.com/SirAlabar'
        },
        {
            role: 'DEV 2',
            description: 'm3irel3s - Developer',
            technologies: ['Vue.js', 'CSS', 'JavaScript', 'Webpack'],
            accentColor: 'purple',
            avatarUrl: 'https://avatars.githubusercontent.com/u/160427475?v=4',
            profileUrl: 'https://github.com/m3irel3s'
        },
        {
            role: 'DEV 3',
            description: 'therappha - Developer',
            technologies: ['Babylon.js', '3D Graphics', 'WebGL', 'Physics'],
            accentColor: 'pink',
            avatarUrl: 'https://avatars.githubusercontent.com/u/102710499?v=4',
            profileUrl: 'https://github.com/therappha'
        },
        {
            role: 'DEV 4',
            description: 'joaorema - Developer',
            technologies: ['Fastify', 'PostgreSQL', 'Redis', 'Docker'],
            accentColor: 'cyan',
            avatarUrl: 'https://avatars.githubusercontent.com/u/175852784?v=4',
            profileUrl: 'https://github.com/joaorema'
        }
    ];

    render(): string 
    {
        return `
            <div class="w-full h-full flex flex-col justify-center">
                ${this.renderTitle()}
                ${this.renderTeamGrid()}
            </div>
        `;
    }

    private renderTitle(): string 
    {
        return `
            <h2 class="mb-12 text-center text-4xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400 sm:text-5xl">
                Meet Our Team
            </h2>
        `;
    }

    private renderTeamGrid(): string 
    {
        return `
            <div class="flex-1 grid grid-cols-2 gap-6 max-w-4xl mx-auto">
                ${this.teamMembers.map(member => this.renderTeamMember(member)).join('')}
            </div>
        `;
    }

    private renderTeamMember(member: TeamMember): string 
    {
        return `
            <div class="team-card flex flex-col items-center justify-center bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl p-6 border border-gray-600 hover:border-${member.accentColor}-400 transition-all duration-300 relative">                ${this.renderMemberBadge(member.accentColor)}
                ${this.renderMemberAvatar(member)}
                ${this.renderMemberInfo(member)}
            </div>
        `;
    }

    private renderMemberBadge(color: string): string 
    {
        return `
            <div class="absolute top-6 right-6 text-sm text-${color}-400 font-game">
                🖥️
            </div>
        `;
    }

    private renderMemberAvatar(member: TeamMember): string 
    {
        return `
            <a 
                href="${member.profileUrl}" 
                target="_blank" 
                rel="noopener noreferrer"
                class="w-24 h-24 rounded-full overflow-hidden border-2 border-${member.accentColor}-400/50 mb-4 hover:border-${member.accentColor}-400 transition-colors duration-300 cursor-pointer"
            >
                <img 
                    src="${member.avatarUrl}" 
                    alt="${member.role} Profile Picture" 
                    class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onerror="this.src='https://github.com/octocat.png'"
                >
            </a>
        `;
    }

    private renderMemberInfo(member: TeamMember): string 
    {
        return `
            <div class="text-center">
                <h3 class="text-2xl font-bold text-white font-game mb-2">
                    ${member.role}
                </h3>
                <p class="text-gray-400 text-lg mb-4">
                    ${member.description}
                </p>
                <div class="text-sm text-gray-500">
                    ${member.technologies.join(' • ')}
                </div>
            </div>
        `;
    }
}