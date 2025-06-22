import { BaseComponent, tw } from '../BaseComponent';

interface TeamMember {
    role: string;
    description: string;
    technologies: string[];
    emoji: string;
    accentColor: 'cyan' | 'purple' | 'pink';
}

export class Team extends BaseComponent {
    private teamMembers: TeamMember[] = [
        {
            role: 'DEV 1',
            description: 'DEV ',
            technologies: ['1', '2', '3', '4'],
            emoji: '👨‍💻',
            accentColor: 'cyan'
        },
        {
            role: 'DEV 2',
            description: 'DEV ',
            technologies: ['1', '2', '3', '4'],
            emoji: '⚡',
            accentColor: 'purple'
        },
        {
            role: 'DEV 3',
            description: 'DEV ',
            technologies: ['1', '2', '3', '4'],
            emoji: '🎮',
            accentColor: 'pink'
        },
        {
            role: 'DEV 4',
            description: 'DEV 1',
            technologies: ['1', '2', '3', '4'],
            emoji: '🛡️',
            accentColor: 'cyan'
        }
    ];

    render(): string {
        return `
            <section id="team" class="min-h-screen flex items-center justify-center scroll-mt-20 p-6">
                <div class="w-full">
                    ${this.renderTitle()}
                    ${this.renderTeamGrid()}
                </div>
            </section>
        `;
    }

    private renderTitle(): string {
        return `
            <h2 class="mb-12 text-center text-4xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400 sm:text-5xl">
                Meet Our Team
            </h2>
        `;
    }

    private renderTeamGrid(): string {
        return `
            <div class="mx-auto flex flex-col gap-12 max-w-4xl">
                ${this.teamMembers.map(member => this.renderTeamMember(member)).join('')}
            </div>
        `;
    }

    private renderTeamMember(member: TeamMember): string {
        const accentColorClass = this.getAccentColorClass(member.accentColor);
        
        return `
            <div class="flex items-center bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-2xl p-8 border border-gray-600 hover:border-${member.accentColor}-400 transition-all duration-300 relative">
                ${this.renderMemberBadge(member.accentColor)}
                ${this.renderMemberAvatar(member)}
                ${this.renderMemberInfo(member)}
            </div>
        `;
    }

    private renderMemberBadge(color: string): string {
        return `
            <div class="absolute top-6 right-6 text-sm text-${color}-400 font-game">
                42 Transcendence
            </div>
        `;
    }

    private renderMemberAvatar(member: TeamMember): string {
        return `
            <div class="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-400/30 flex items-center justify-center text-5xl mr-8 flex-shrink-0">
                ${member.emoji}
            </div>
        `;
    }

    private renderMemberInfo(member: TeamMember): string {
        return `
            <div class="flex-1">
                <h3 class="text-3xl font-bold text-white font-game mb-2">
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

    private getAccentColorClass(color: 'cyan' | 'purple' | 'pink'): string {
        const colorMap = {
            cyan: 'text-cyan-400 border-cyan-400',
            purple: 'text-purple-400 border-purple-400',
            pink: 'text-pink-400 border-pink-400'
        };
        return colorMap[color];
    }
}