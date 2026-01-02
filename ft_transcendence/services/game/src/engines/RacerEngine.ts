/**
 * RacerEngine
 * Authoritative server-side racing game engine
 * Validates inputs, tracks race progress, broadcasts state
 */

import { 
  RacerInput, 
  PlayerState, 
  RacerGameState, 
  RaceStatus,
  RaceEvent,
  RaceEventType,
  PlayerStanding,
  Vector3,
  Quaternion,
  PlayerStateDTO,
  Checkpoint
} from '../types/racer.types';
import { RacerValidator } from '../managers/RacerValidator';
import { 
  RACE_CONFIG, 
  SPAWN_POSITIONS, 
  TRACK_BOUNDS
} from '../utils/racerConstants';

export class RacerEngine 
{
  private gameState: RacerGameState;
  private validator: RacerValidator;
  private events: RaceEvent[] = [];
  private countdownTimer: number = 0;
  private checkpoints: Checkpoint[] = [];

  constructor(
    gameId: string, 
    checkpoints: Checkpoint[],
    totalLaps: number = RACE_CONFIG.DEFAULT_LAPS
  ) 
  {
    this.validator = new RacerValidator();
    this.checkpoints = checkpoints;
    
    this.gameState = {
      gameId,
      players: new Map(),
      totalLaps,
      totalCheckpoints: checkpoints.length,
      maxPlayers: RACE_CONFIG.MAX_PLAYERS,
      raceStatus: RaceStatus.WAITING,
      startTime: null,
      endTime: null,
      trackName: 'polar_pass',
      trackBounds: {
        minX: TRACK_BOUNDS.MIN_X,
        maxX: TRACK_BOUNDS.MAX_X,
        minY: TRACK_BOUNDS.MIN_Y,
        maxY: TRACK_BOUNDS.MAX_Y,
        minZ: TRACK_BOUNDS.MIN_Z,
        maxZ: TRACK_BOUNDS.MAX_Z
      }
    };
    
    console.log(`[RacerEngine] 🏁 Race created with ${checkpoints.length} checkpoints`);
  }

  /**
   * Add player to race
   */
  public addPlayer(playerId: string, username: string): boolean 
  {
    if (this.gameState.players.size >= RACE_CONFIG.MAX_PLAYERS) 
    {
      console.warn(`[RacerEngine] ❌ Cannot add player ${playerId}: race is full`);
      return false;
    }

    if (this.gameState.raceStatus !== RaceStatus.WAITING) 
    {
      console.warn(`[RacerEngine] ❌ Cannot add player ${playerId}: race already started`);
      return false;
    }

    const spawnIndex = this.gameState.players.size;
    const spawn = SPAWN_POSITIONS[spawnIndex];

    const playerState: PlayerState = {
      playerId,
      username,
      position: { ...spawn.position },
      rotation: { ...spawn.rotation },
      velocity: { x: 0, y: 0, z: 0 },
      currentLap: 1,
      checkpointIndex: 0,
      lastCheckpointTime: 0,
      isFinished: false,
      isRespawning: false,
      finishTime: null,
      lapTimes: [],
      bestLapTime: null
    };

    this.gameState.players.set(playerId, playerState);
    console.log(`[RacerEngine] ✅ Player ${username} (${playerId}) joined race at position ${spawnIndex + 1}`);

    return true;
  }

  /**
   * Remove player from race
   */
  public removePlayer(playerId: string): void 
  {
    const player = this.gameState.players.get(playerId);
    
    if (player) 
    {
      this.gameState.players.delete(playerId);
      this.validator.cleanupPlayer(playerId);
      console.log(`[RacerEngine] 🚪 Player ${player.username} (${playerId}) left race`);
    }
  }

  /**
   * Handle player input
   */
  public handleInput(playerId: string, input: RacerInput): void 
  {
    const player = this.gameState.players.get(playerId);
    
    if (!player) 
    {
      console.warn(`[RacerEngine] ⚠️  Input from unknown player: ${playerId}`);
      return;
    }

    if (this.gameState.raceStatus !== RaceStatus.RACING) 
    {
      return;
    }

    if (player.isFinished || player.isRespawning) 
    {
      return;
    }

    // Validate input rate (anti-spam)
    if (!this.validator.validateInputRate(playerId)) 
    {
      return;
    }

    // Sanitize input values
    const sanitizedInput = this.validator.sanitizeInput(input);

    // Apply input to player (simplified physics - real physics on client)
    // Server just validates, client does prediction
    this.applyInput(player, sanitizedInput);
  }

  /**
   * Apply input to player state (simplified server-side physics)
   */
  private applyInput(_player: PlayerState, _input: RacerInput): void 
  {
    // Note: In production, this would be more sophisticated
    // For now, server trusts client position but validates it
    
    // This is where we'd apply throttle/steering to velocity
    // But since we're doing client prediction, we mainly validate
  }

  /**
   * Main game loop update
   */
  public update(deltaTime: number): RaceEvent[] 
  {
    this.events = [];

    switch (this.gameState.raceStatus) 
    {
      case RaceStatus.COUNTDOWN:
        this.updateCountdown(deltaTime);
        break;

      case RaceStatus.RACING:
        this.updateRacing(deltaTime);
        break;

      case RaceStatus.FINISHED:
        // Race is over, no updates needed
        break;
    }

    return this.events;
  }

  /**
   * Update countdown phase
   */
  private updateCountdown(deltaTime: number): void 
  {
    this.countdownTimer -= deltaTime;

    if (this.countdownTimer <= 0) 
    {
      this.startRace();
    } 
    else 
    {
      // Emit countdown tick event
      const secondsLeft = Math.ceil(this.countdownTimer);
      this.addEvent(RaceEventType.COUNTDOWN_TICK, '', { secondsLeft });
    }
  }

  /**
   * Update racing phase
   */
  private updateRacing(_deltaTime: number): void 
  {
    this.gameState.players.forEach((player, playerId) => 
    {
      if (player.isFinished || player.isRespawning) 
      {
        return;
      }

      // Check for out of bounds
      if (this.validator.isOutOfBounds(player.position)) 
      {
        this.respawnPlayer(playerId);
        return;
      }

      // Check checkpoint collision (this would be called when client reports checkpoint)
      // For now, we just validate when client claims they passed checkpoint
    });

    // Check if all players finished
    const allFinished = Array.from(this.gameState.players.values()).every(p => p.isFinished);
    
    if (allFinished && this.gameState.players.size > 0) 
    {
      this.endRace();
    }
  }

  /**
   * Start countdown before race
   */
  public startCountdown(): void 
  {
    if (this.gameState.raceStatus !== RaceStatus.WAITING) 
    {
      return;
    }

    this.gameState.raceStatus = RaceStatus.COUNTDOWN;
    this.countdownTimer = RACE_CONFIG.COUNTDOWN_DURATION;
    
    console.log(`[RacerEngine] 🏁 Countdown started: ${RACE_CONFIG.COUNTDOWN_DURATION} seconds`);
  }

  /**
   * Start race
   */
  private startRace(): void 
  {
    this.gameState.raceStatus = RaceStatus.RACING;
    this.gameState.startTime = Date.now();
    
    // Reset all player lap timers
    this.gameState.players.forEach((player) => 
    {
      player.lastCheckpointTime = this.gameState.startTime!;
    });

    this.addEvent(RaceEventType.RACE_STARTED, '', {});
    
    console.log(`[RacerEngine] 🏁 Race started with ${this.gameState.players.size} players`);
  }

  /**
   * Handle checkpoint passage (called when client reports checkpoint)
   */
  public onCheckpointPassed(playerId: string, checkpointIndex: number): void 
  {
    const player = this.gameState.players.get(playerId);
    
    if (!player || player.isFinished) 
    {
      return;
    }

    const checkpoint = this.checkpoints[checkpointIndex];
    
    if (!checkpoint) 
    {
      console.warn(`[RacerEngine] ⚠️  Invalid checkpoint index: ${checkpointIndex}`);
      return;
    }

    // Validate checkpoint distance
    if (!this.validator.validateCheckpointDistance(player.position, checkpoint.position, checkpoint)) 
    {
      console.warn(`[RacerEngine] ❌ Player ${playerId} too far from checkpoint ${checkpointIndex}`);
      return;
    }

    // Check cooldown
    if (!this.validator.canPassCheckpoint(playerId)) 
    {
      return;
    }

    // Validate checkpoint order (unless it's start line)
    if (!checkpoint.isStartLine) 
    {
      const orderValidation = this.validator.validateCheckpointOrder(
        playerId,
        player.checkpointIndex,
        checkpointIndex,
        this.gameState.totalCheckpoints
      );

      if (!orderValidation.valid) 
      {
        console.warn(`[RacerEngine] ❌ Player ${playerId} checkpoint order invalid`);
        return;
      }

      player.checkpointIndex = checkpointIndex;
      this.addEvent(RaceEventType.CHECKPOINT_PASSED, playerId, { checkpointIndex });
    } 
    else 
    {
      // Start line crossed - check for lap completion
      const enoughCheckpoints = this.validator.validateLapCompletion(
        player.checkpointIndex,
        this.gameState.totalCheckpoints
      );

      if (enoughCheckpoints) 
      {
        this.completeLap(playerId);
      }
    }
  }

  /**
   * Complete lap for player
   */
  private completeLap(playerId: string): void 
  {
    const player = this.gameState.players.get(playerId);
    
    if (!player) 
    {
      return;
    }

    const now = Date.now();
    const lapTime = now - player.lastCheckpointTime;
    
    player.lapTimes.push(lapTime);
    player.lastCheckpointTime = now;

    // Update best lap time
    if (!player.bestLapTime || lapTime < player.bestLapTime) 
    {
      player.bestLapTime = lapTime;
    }

    this.addEvent(RaceEventType.LAP_COMPLETED, playerId, {
      lap: player.currentLap,
      lapTime,
      bestLapTime: player.bestLapTime
    });

    console.log(`[RacerEngine] 🏁 Player ${player.username} completed lap ${player.currentLap} in ${(lapTime / 1000).toFixed(2)}s`);

    player.currentLap++;

    // Check if race finished
    if (player.currentLap > this.gameState.totalLaps) 
    {
      this.finishPlayer(playerId);
    } 
    else 
    {
      // Reset checkpoints for next lap
      player.checkpointIndex = 0;
    }
  }

  /**
   * Finish race for player
   */
  private finishPlayer(playerId: string): void 
  {
    const player = this.gameState.players.get(playerId);
    
    if (!player || player.isFinished) 
    {
      return;
    }

    player.isFinished = true;
    player.finishTime = Date.now() - (this.gameState.startTime || 0);

    const position = this.calculatePosition(playerId);

    this.addEvent(RaceEventType.RACE_FINISHED, playerId, {
      position,
      totalTime: player.finishTime,
      lapTimes: player.lapTimes,
      bestLapTime: player.bestLapTime
    });

    console.log(`[RacerEngine] 🏆 Player ${player.username} finished in position ${position}`);
  }

  /**
   * Respawn player at last checkpoint
   */
  private respawnPlayer(playerId: string): void 
  {
    const player = this.gameState.players.get(playerId);
    
    if (!player) 
    {
      return;
    }

    player.isRespawning = true;

    // Find last checkpoint position
    const lastCheckpoint = this.checkpoints[player.checkpointIndex] || this.checkpoints[0];

    // Set respawn position slightly above checkpoint
    player.position = {
      x: lastCheckpoint.position.x,
      y: lastCheckpoint.position.y + 5,
      z: lastCheckpoint.position.z
    };

    player.velocity = { x: 0, y: 0, z: 0 };

    this.addEvent(RaceEventType.PLAYER_RESPAWNED, playerId, {
      position: player.position,
      rotation: player.rotation
    });

    // Clear respawning flag after cooldown
    setTimeout(() => 
    {
      if (player) 
      {
        player.isRespawning = false;
      }
    }, RACE_CONFIG.RESPAWN_COOLDOWN);

    console.log(`[RacerEngine] 🔄 Player ${player.username} respawned at checkpoint ${player.checkpointIndex}`);
  }

  /**
   * Calculate player position in race
   */
  public calculatePosition(playerId: string): number 
  {
    const standings = this.getStandings();
    const index = standings.findIndex(s => s.playerId === playerId);
    
    return index >= 0 ? index + 1 : this.gameState.players.size;
  }

  /**
   * Get current race standings
   */
  public getStandings(): PlayerStanding[] 
  {
    const standings: PlayerStanding[] = [];

    this.gameState.players.forEach((player) => 
    {
      // Calculate distance to next checkpoint
      const nextCheckpointIndex = (player.checkpointIndex + 1) % this.gameState.totalCheckpoints;
      const nextCheckpoint = this.checkpoints[nextCheckpointIndex];
      
      const distance = nextCheckpoint 
        ? this.calculateDistance(player.position, nextCheckpoint.position)
        : 0;

      standings.push({
        position: 0,
        playerId: player.playerId,
        username: player.username,
        currentLap: player.currentLap,
        checkpointIndex: player.checkpointIndex,
        distanceToNextCheckpoint: distance,
        isFinished: player.isFinished,
        finishTime: player.finishTime
      });
    });

    // Sort by: finished > lap > checkpoint > distance
    standings.sort((a, b) => 
    {
      if (a.isFinished && !b.isFinished) return -1;
      if (!a.isFinished && b.isFinished) return 1;
      
      if (a.isFinished && b.isFinished) 
      {
        return (a.finishTime || 0) - (b.finishTime || 0);
      }

      if (a.currentLap !== b.currentLap) 
      {
        return b.currentLap - a.currentLap;
      }

      if (a.checkpointIndex !== b.checkpointIndex) 
      {
        return b.checkpointIndex - a.checkpointIndex;
      }

      return a.distanceToNextCheckpoint - b.distanceToNextCheckpoint;
    });

    standings.forEach((standing, index) => 
    {
      standing.position = index + 1;
    });

    return standings;
  }

  /**
   * End race
   */
  private endRace(): void 
  {
    this.gameState.raceStatus = RaceStatus.FINISHED;
    this.gameState.endTime = Date.now();

    console.log(`[RacerEngine] 🏁 Race finished`);
  }

  /**
   * Get current game state
   */
  public getState(): RacerGameState 
  {
    return this.gameState;
  }

  /**
   * Get state for network broadcast (DTO)
   */
  public getStateDTO(): PlayerStateDTO[] 
  {
    const dto: PlayerStateDTO[] = [];

    this.gameState.players.forEach((player) => 
    {
      dto.push({
        playerId: player.playerId,
        username: player.username,
        position: player.position,
        rotation: player.rotation,
        velocity: player.velocity,
        currentLap: player.currentLap,
        checkpointIndex: player.checkpointIndex,
        isFinished: player.isFinished
      });
    });

    return dto;
  }

  /**
   * Check if race is finished
   */
  public isFinished(): boolean 
  {
    return this.gameState.raceStatus === RaceStatus.FINISHED;
  }

  /**
   * Get winner
   */
  public getWinner(): string | null 
  {
    if (!this.isFinished()) 
    {
      return null;
    }

    const standings = this.getStandings();
    return standings.length > 0 ? standings[0].playerId : null;
  }

  /**
   * Update player position (called when client sends position update)
   */
  public updatePlayerPosition(
    playerId: string, 
    position: Vector3, 
    rotation: Quaternion, 
    velocity: Vector3
  ): boolean 
  {
    const player = this.gameState.players.get(playerId);
    
    if (!player) 
    {
      return false;
    }

    // Validate position delta
    const deltaTime = 1 / RACE_CONFIG.TICK_RATE;
    const positionValidation = this.validator.validatePositionDelta(
      playerId,
      player.position,
      position,
      deltaTime
    );

    if (!positionValidation.valid) 
    {
      // Reject position update, use server position
      return false;
    }

    // Validate velocity
    const velocityValidation = this.validator.validateVelocity(velocity);
    const validatedVelocity = velocityValidation.correctedValue || velocity;

    // Update player state
    player.position = position;
    player.rotation = rotation;
    player.velocity = validatedVelocity;

    return true;
  }

  /**
   * Add event to queue
   */
  private addEvent(type: RaceEventType, playerId: string, data: any): void 
  {
    this.events.push({
      type,
      gameId: this.gameState.gameId,
      playerId,
      timestamp: Date.now(),
      data
    });
  }

  /**
   * Helper: Calculate distance
   */
  private calculateDistance(pos1: Vector3, pos2: Vector3): number 
  {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Cleanup
   */
  public dispose(): void 
  {
    this.gameState.players.clear();
    this.validator.reset();
    this.events = [];
    
    console.log(`[RacerEngine] 🗑️  Game ${this.gameState.gameId} disposed`);
  }
}