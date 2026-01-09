// // import LobbyService from '../websocket/LobbyService';
// // import { webSocketService } from '../lobby/WebSocketService';
// import { Tournament, TournamentPlayer, TournamentMatch, CreateTournamentData, TournamentBracketData } from '../../types/tournament.types';
// // import { Lobby, LobbyPlayer } from '../../types/lobby.types';
// import UserService from '../user/UserService';

// class TournamentService 
// {
//     private currentTournament: Tournament | null = null;
//     private tournamentUpdateCallback: ((tournament: Tournament) => void) | null = null;

//     async createTournament(data: CreateTournamentData): Promise<Tournament> 
//     {
//         try 
//         {
//             // const lobby = await LobbyService.createLobby('pong', 4);
//             const currentUser = await UserService.getProfile();

//             const tournament: Tournament = {
//                 id: `tournament_${Date.now()}`,
//                 lobbyId: `lobby_${Date.now()}`, // Temporary ID until websocket is implemented
//                 name: data.name,
//                 hostId: currentUser.id,
//                 hostUsername: currentUser.username,
//                 players: [
//                     {
//                         id: '0',
//                         userId: currentUser.id,
//                         username: currentUser.username,
//                         avatarUrl: currentUser.avatarUrl || '/assets/images/default-avatar.jpeg',
//                         isAI: false,
//                         seed: 1
//                     }
//                 ],
//                 matches: this.initializeMatches(`tournament_${Date.now()}`),
//                 status: 'waiting',
//                 prizePool: 4000, // Fixed prize pool
//                 currentRound: null,
//                 winner: null,
//                 createdAt: new Date()
//             };

//             this.currentTournament = tournament;
//             this.subscribeTournamentUpdates();

//             return tournament;
//         }
//         catch (error) 
//         {
//             throw error;
//         }
//     }

//     async addAIPlayer(difficulty: 'easy' | 'hard'): Promise<void> 
//     {
//         if (!this.currentTournament) 
//         {
//             throw new Error('No active tournament');
//         }

//         if (this.currentTournament.players.length >= 4) 
//         {
//             throw new Error('Tournament is full');
//         }

//         const aiPlayer: TournamentPlayer = {
//             id: `ai_${Date.now()}`,
//             userId: `ai_${Date.now()}`,
//             username: `AI Bot ${difficulty === 'easy' ? '(Easy)' : '(Hard)'}`,
//             avatarUrl: '/assets/images/ai-avatar.png',
//             isAI: true,
//             aiDifficulty: difficulty,
//             seed: this.currentTournament.players.length + 1
//         };

//         this.currentTournament.players.push(aiPlayer);

//         if (this.tournamentUpdateCallback) 
//         {
//             this.tournamentUpdateCallback(this.currentTournament);
//         }
//     }

//     async kickPlayer(userId: string): Promise<void> 
//     {
//         if (!this.currentTournament) 
//         {
//             throw new Error('No active tournament');
//         }

//         const currentUser = await UserService.getProfile();
//         if (currentUser.id !== this.currentTournament.hostId) 
//         {
//             throw new Error('Only the host can kick players');
//         }

//         if (userId === this.currentTournament.hostId) 
//         {
//             throw new Error('Cannot kick the host');
//         }

//         this.currentTournament.players = this.currentTournament.players.filter(
//             player => player.userId !== userId
//         );

//         // Reassign seeds
//         this.currentTournament.players.forEach((player, index) => 
//         {
//             player.seed = index + 1;
//         });

//         if (this.tournamentUpdateCallback) 
//         {
//             this.tournamentUpdateCallback(this.currentTournament);
//         }
//     }

//     async startTournament(): Promise<void> 
//     {
//         if (!this.currentTournament) 
//         {
//             throw new Error('No active tournament');
//         }

//         if (this.currentTournament.players.length !== 4) 
//         {
//             throw new Error('Tournament requires exactly 4 players');
//         }

//         this.currentTournament.status = 'in-progress';
//         this.currentTournament.currentRound = 'semi-final';
//         this.currentTournament.startedAt = new Date();

//         this.assignPlayersToMatches();

//         if (this.tournamentUpdateCallback) 
//         {
//             this.tournamentUpdateCallback(this.currentTournament);
//         }
//     }

//     async updateMatchResult(matchId: string, winner: TournamentPlayer, score: { player1: number; player2: number }): Promise<void> 
//     {
//         if (!this.currentTournament) 
//         {
//             throw new Error('No active tournament');
//         }

//         const match = this.currentTournament.matches.find(m => m.id === matchId);
//         if (!match) 
//         {
//             throw new Error('Match not found');
//         }

//         match.winner = winner;
//         match.score = score;
//         match.status = 'completed';
//         match.completedAt = new Date();

//         if (match.round === 'semi-final') 
//         {
//             this.checkSemiFinalsComplete();
//         }
//         else if (match.round === 'final') 
//         {
//             this.completeTournament(winner);
//         }

//         if (this.tournamentUpdateCallback) 
//         {
//             this.tournamentUpdateCallback(this.currentTournament);
//         }
//     }

//     private initializeMatches(tournamentId: string): TournamentMatch[] 
//     {
//         return [
//             {
//                 id: `${tournamentId}_sf1`,
//                 tournamentId,
//                 round: 'semi-final',
//                 matchNumber: 1,
//                 player1: null,
//                 player2: null,
//                 winner: null,
//                 score: { player1: 0, player2: 0 },
//                 status: 'waiting'
//             },
//             {
//                 id: `${tournamentId}_sf2`,
//                 tournamentId,
//                 round: 'semi-final',
//                 matchNumber: 2,
//                 player1: null,
//                 player2: null,
//                 winner: null,
//                 score: { player1: 0, player2: 0 },
//                 status: 'waiting'
//             },
//             {
//                 id: `${tournamentId}_final`,
//                 tournamentId,
//                 round: 'final',
//                 matchNumber: 1,
//                 player1: null,
//                 player2: null,
//                 winner: null,
//                 score: { player1: 0, player2: 0 },
//                 status: 'waiting'
//             }
//         ];
//     }

//     private assignPlayersToMatches(): void 
//     {
//         if (!this.currentTournament) 
//         {
//             return;
//         }

//         const players = this.currentTournament.players;

//         // Semi-final 1: Seed 1 vs Seed 4
//         this.currentTournament.matches[0].player1 = players[0];
//         this.currentTournament.matches[0].player2 = players[3];
//         this.currentTournament.matches[0].status = 'waiting';

//         // Semi-final 2: Seed 2 vs Seed 3
//         this.currentTournament.matches[1].player1 = players[1];
//         this.currentTournament.matches[1].player2 = players[2];
//         this.currentTournament.matches[1].status = 'waiting';
//     }

//     private checkSemiFinalsComplete(): void 
//     {
//         if (!this.currentTournament) 
//         {
//             return;
//         }

//         const semiFinals = this.currentTournament.matches.filter(m => m.round === 'semi-final');
//         const allComplete = semiFinals.every(m => m.status === 'completed');

//         if (allComplete) 
//         {
//             const finalMatch = this.currentTournament.matches.find(m => m.round === 'final');
//             if (finalMatch) 
//             {
//                 finalMatch.player1 = semiFinals[0].winner;
//                 finalMatch.player2 = semiFinals[1].winner;
//                 finalMatch.status = 'waiting';
//             }

//             this.currentTournament.currentRound = 'final';
//         }
//     }

//     private completeTournament(winner: TournamentPlayer): void 
//     {
//         if (!this.currentTournament) 
//         {
//             return;
//         }

//         this.currentTournament.status = 'completed';
//         this.currentTournament.winner = winner;
//         this.currentTournament.completedAt = new Date();
//         this.currentTournament.currentRound = null;
//     }

//     private subscribeTournamentUpdates(): void 
//     {
//         // LobbyService.onLobbyUpdate((lobby: Lobby) => 
//         // {
//         //     if (!this.currentTournament) 
//         //     {
//         //         return;
//         //     }

//         //     this.syncPlayersFromLobby(lobby.players);

//         //     if (this.tournamentUpdateCallback) 
//         //     {
//         //         this.tournamentUpdateCallback(this.currentTournament);
//         //     }
//         // });
//     }

//     // private syncPlayersFromLobby(lobbyPlayers: LobbyPlayer[]): void 
//     // {
//     //     if (!this.currentTournament) 
//     //     {
//     //         return;
//     //     }

//     //     lobbyPlayers.forEach(lobbyPlayer => 
//     //     {
//     //         const exists = this.currentTournament!.players.find(p => p.userId === lobbyPlayer.userId);
//     //         if (!exists && this.currentTournament!.players.length < 4) 
//     //         {
//     //             const newPlayer: TournamentPlayer = {
//     //                 id: lobbyPlayer.id,
//     //                 userId: lobbyPlayer.userId,
//     //                 username: lobbyPlayer.username,
//     //                 avatarUrl: lobbyPlayer.avatarUrl,
//     //                 isAI: lobbyPlayer.isAI,
//     //                 aiDifficulty: lobbyPlayer.aiDifficulty,
//     //                 seed: this.currentTournament!.players.length + 1
//     //             };
//     //             this.currentTournament!.players.push(newPlayer);
//     //         }
//     //     });
//     // }

//     getBracketData(): TournamentBracketData | null 
//     {
//         if (!this.currentTournament) 
//         {
//             return null;
//         }

//         const matches = this.currentTournament.matches;

//         return {
//             semiFinal1: matches[0],
//             semiFinal2: matches[1],
//             final: matches[2]
//         };
//     }

//     onTournamentUpdate(callback: (tournament: Tournament) => void): void 
//     {
//         this.tournamentUpdateCallback = callback;
//     }

//     getCurrentTournament(): Tournament | null 
//     {
//         return this.currentTournament;
//     }

//     async leaveTournament(): Promise<void> 
//     {
//         if (!this.currentTournament) 
//         {
//             return;
//         }

//         // await LobbyService.leaveLobby();
//         this.currentTournament = null;
//         this.tournamentUpdateCallback = null;
//     }

//     canStartTournament(): boolean 
//     {
//         if (!this.currentTournament) 
//         {
//             return false;
//         }

//         return this.currentTournament.players.length === 4;
//     }

//     // Mock active tournaments - In production, this would fetch from backend
//     getActiveTournaments(): Tournament[] 
//     {
//         // Return empty array for now - backend would provide real tournaments
//         return [];
//     }

//     async joinTournament(_tournamentId: string): Promise<Tournament> 
//     {
//         try 
//         {
//             // In production, this would call backend API to join tournament
//             // For now, just throw error as feature is pending implementation
//             throw new Error('Join tournament feature coming soon!');
//         }
//         catch (error) 
//         {
//             throw error;
//         }
//     }
// }

// export default new TournamentService();