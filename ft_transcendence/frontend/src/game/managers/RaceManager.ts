import { RacerPod } from '../engines/racer/RacerPods';
import { Vector3 } from '@babylonjs/core';

export interface RacerProgress 
{
  podId: string;
  pod: RacerPod;
  currentLap: number;
  checkpointsPassed: number;
  totalCheckpoints: number;
  isFinished: boolean;
  finishTime: number | null;
  distanceToNextCheckpoint: number;
  lapTimes: number[];
  lapStartTime: number;
}

export interface RaceStandings 
{
  position: number;
  podId: string;
  pod: RacerPod;
  currentLap: number;
  checkpointsPassed: number;
  isFinished: boolean;
}

export class RaceManager 
{
  private racers: Map<string, RacerProgress> = new Map();
  private raceStartTime: number = 0;
  private raceStarted: boolean = false;
  private totalLaps: number = 1;
  private readonly MIN_CHECKPOINTS_FOR_LAP = 10;
  
  constructor(totalLaps: number = 1) 
  {
    this.totalLaps = totalLaps;
  }

  public registerRacer(pod: RacerPod): void 
  {
    const podId = pod.getConfig().id;
    
    if (this.racers.has(podId)) 
    {
      console.warn(`Racer ${podId} already registered`);
      return;
    }

    const checkpointInfo = pod.getCheckpointInfo();
    
    const racerProgress: RacerProgress = 
    {
      podId,
      pod,
      currentLap: 1,
      checkpointsPassed: 0,
      totalCheckpoints: checkpointInfo.total,
      isFinished: false,
      finishTime: null,
      distanceToNextCheckpoint: Infinity,
      lapTimes: [],
      lapStartTime: 0
    };

    this.racers.set(podId, racerProgress);
  }

  public unregisterRacer(podId: string): void 
  {
    this.racers.delete(podId);
  }

  public startRace(): void 
  {
    this.raceStartTime = Date.now();
    this.raceStarted = true;
    
    // Initialize lap timers for all racers
    this.racers.forEach((racer) => 
    {
      racer.lapStartTime = this.raceStartTime;
    });
  }

  public onCheckpointPassed(podId: string, isStartLine: boolean): void 
  {
    const racer = this.racers.get(podId);
    if (!racer || racer.isFinished) 
    {
      return;
    }

    if (isStartLine) 
    {
      // Check if enough checkpoints passed to complete lap
      if (racer.checkpointsPassed >= this.MIN_CHECKPOINTS_FOR_LAP) 
      {
        this.completeLap(podId);
      }
    } 
    else 
    {
      racer.checkpointsPassed++;
    }
  }

  private completeLap(podId: string): void 
  {
    const racer = this.racers.get(podId);
    if (!racer) 
    {
      return;
    }

    const currentTime = Date.now();
    const lapTime = currentTime - racer.lapStartTime;
    
    racer.lapTimes.push(lapTime);
    
    // Notify UI
    if ((window as any).racerUIManager) 
    {
      (window as any).racerUIManager.onLapComplete(racer.currentLap, lapTime);
    }
    
    racer.currentLap++;
    
    if (racer.currentLap > this.totalLaps) 
    {
      this.finishRace(podId);
    } 
    else 
    {
      // Reset for next lap
      racer.checkpointsPassed = 0;
      racer.lapStartTime = currentTime;
      racer.pod.resetCheckpointProgress();
      
      // Update UI
      if ((window as any).racerUIManager) 
      {
        (window as any).racerUIManager.updateLap(racer.currentLap);
      }
    }
  }

  private finishRace(podId: string): void 
  {
    const racer = this.racers.get(podId);
    if (!racer) 
    {
      return;
    }

    racer.isFinished = true;
    racer.finishTime = Date.now() - this.raceStartTime;
    
    const position = this.calculatePosition(podId);
    const bestLap = this.getBestLapTime(podId);
    
    // Show finish screen
    if ((window as any).racerUIManager) 
    {
      (window as any).racerUIManager.showRaceFinishScreen({
        position: position,
        totalTime: this.formatTime(racer.finishTime),
        lapTimes: racer.lapTimes,
        bestLap: bestLap,
        playerName: 'Player',
        avatarUrl: (window as any).playerAvatarUrl || '/assets/images/default-avatar.jpeg'
      });
    }
  }

  public updateRacerProgress(podId: string): void 
  {
    const racer = this.racers.get(podId);
    if (!racer || racer.isFinished) 
    {
      return;
    }

    const pod = racer.pod;
    const checkpointInfo = pod.getCheckpointInfo();
    
    racer.checkpointsPassed = Math.floor(checkpointInfo.progress / 100 * checkpointInfo.total);
    
    // Calculate distance to next checkpoint
    const nextCheckpointPos = pod.getNextCheckpointPosition();
    if (nextCheckpointPos) 
    {
      const podPos = pod.getPosition();
      racer.distanceToNextCheckpoint = Vector3.Distance(podPos, nextCheckpointPos);
    }
  }

  public calculatePosition(podId: string): number 
  {
    const standings = this.getStandings();
    const position = standings.findIndex(s => s.podId === podId);
    
    if (position >= 0)
    {
      return position + 1;
    }
    else
    {
      return this.racers.size;
    }
  }

  public getStandings(): RaceStandings[] 
  {
    const standings: RaceStandings[] = [];

    this.racers.forEach((racer) => 
    {
      standings.push(
      {
        position: 0,
        podId: racer.podId,
        pod: racer.pod,
        currentLap: racer.currentLap,
        checkpointsPassed: racer.checkpointsPassed,
        isFinished: racer.isFinished
      });
    });

    standings.sort((a, b) => 
    {
      const racerA = this.racers.get(a.podId)!;
      const racerB = this.racers.get(b.podId)!;

      if (racerA.isFinished && !racerB.isFinished) 
      {
        return -1;
      }
      if (!racerA.isFinished && racerB.isFinished) 
      {
        return 1;
      }
      
      if (racerA.isFinished && racerB.isFinished) 
      {
        return (racerA.finishTime || 0) - (racerB.finishTime || 0);
      }

      if (racerA.currentLap !== racerB.currentLap) 
      {
        return racerB.currentLap - racerA.currentLap;
      }

      if (racerA.checkpointsPassed !== racerB.checkpointsPassed) 
      {
        return racerB.checkpointsPassed - racerA.checkpointsPassed;
      }

      return racerA.distanceToNextCheckpoint - racerB.distanceToNextCheckpoint;
    });

    standings.forEach((standing, index) => 
    {
      standing.position = index + 1;
    });

    return standings;
  }

  public getRacerProgress(podId: string): RacerProgress | null 
  {
    const progress = this.racers.get(podId);
    
    if (progress)
    {
      return progress;
    }
    else
    {
      return null;
    }
  }

  public getCurrentLap(podId: string): number 
  {
    const racer = this.racers.get(podId);
    return racer ? racer.currentLap : 1;
  }

  public getBestLapTime(podId: string): number | null 
  {
    const racer = this.racers.get(podId);
    if (!racer || racer.lapTimes.length === 0) 
    {
      return null;
    }
    return Math.min(...racer.lapTimes);
  }

  public getTotalLaps(): number 
  {
    return this.totalLaps;
  }

  public getTotalRacers(): number 
  {
    return this.racers.size;
  }

  public isRaceStarted(): boolean 
  {
    return this.raceStarted;
  }

  private formatTime(milliseconds: number): string 
  {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  public reset(): void 
  {
    this.racers.forEach((racer) => 
    {
      racer.currentLap = 1;
      racer.checkpointsPassed = 0;
      racer.isFinished = false;
      racer.finishTime = null;
      racer.distanceToNextCheckpoint = Infinity;
      racer.lapTimes = [];
      racer.lapStartTime = 0;
    });
    
    this.raceStartTime = 0;
    this.raceStarted = false;
  }

  public clear(): void 
  {
    this.racers.clear();
    this.raceStartTime = 0;
    this.raceStarted = false;
  }

  public dispose(): void 
  {
    this.clear();
  }
}