// ====================================================
// RacerUIManager.ts - UI COORDINATOR FOR RACER INTERFACE
// ====================================================
import { RacerHUD, RacerData } from '../engines/racer/RacerHUD';

export interface RacerUIConfig 
{
  showHUD: boolean;
  showDebugInfo: boolean;
  maxSpeed: number;
  totalLaps: number;
  totalRacers: number;
}

export class RacerUIManager 
{
  private racerHUD: RacerHUD | null = null;
  private config: RacerUIConfig;
  private isActive: boolean = false;
  private startTime: number = 0;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  
  // Current racer state
  private currentRacerData: RacerData = 
  {
    currentLap: 1,
    totalLaps: 3,
    raceTime: '00:00.00',
    position: 1,
    totalRacers: 8,
    speed: 0,
    maxSpeed: 600
  };
  
  constructor(config?: Partial<RacerUIConfig>) 
  {
    this.config = 
    {
      showHUD: true,
      showDebugInfo: false,
      maxSpeed: 600,
      totalLaps: 3,
      totalRacers: 8,
      ...config
    };
    
    this.initializeUI();
  }
  
  // Initialize all UI components
  private initializeUI(): void 
  {
    console.log('RACER-UI-MANAGER: Initializing racer UI...');
    
    if (this.config.showHUD) 
    {
      this.racerHUD = new RacerHUD();
    }
    
    // Set initial racer data from config
    this.currentRacerData.totalLaps = this.config.totalLaps;
    this.currentRacerData.totalRacers = this.config.totalRacers;
    this.currentRacerData.maxSpeed = this.config.maxSpeed;
  }
  
  // Start racer UI (called when race begins)
  public startRace(): void 
  {
    console.log('RACER-UI-MANAGER: Starting racer UI...');
    
    this.isActive = true;
    this.startTime = Date.now();
    
    // Show HUD
    if (this.racerHUD) 
    {
      this.racerHUD.show();
    }
    
    // Start update loop for race time
    this.startUpdateLoop();
    
    // Show race start message
    if (this.racerHUD) 
    {
      this.racerHUD.showMessage('Race Started!', 2000, 'info');
    }
  }
  
  // Stop racer UI
  public stopRace(): void 
  {
    console.log('RACER-UI-MANAGER: Stopping racer UI...');
    
    this.isActive = false;
    
    if (this.updateInterval) 
    {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.racerHUD) 
    {
      this.racerHUD.hide();
    }
  }
  
  // Update racer data from game engine
  public updateSpeed(speed: number): void 
  {
    this.currentRacerData.speed = speed;
    this.pushUpdate();
  }
  
  public updateLap(currentLap: number): void 
  {
    const wasLapChange = this.currentRacerData.currentLap !== currentLap;
    this.currentRacerData.currentLap = currentLap;
    
    if (wasLapChange && this.racerHUD) 
    {
      const lapTime = this.formatTime(Date.now() - this.startTime);
      this.racerHUD.showLapComplete(currentLap - 1, lapTime);
    }
    
    this.pushUpdate();
  }
  
  public updatePosition(position: number): void 
  {
    this.currentRacerData.position = position;
    this.pushUpdate();
  }
  
  // Update race time automatically
  private startUpdateLoop(): void 
  {
    this.updateInterval = setInterval(() => 
    {
      if (this.isActive) 
      {
        this.updateRaceTime();
        this.pushUpdate();
      }
    }, 100);
  }
  
  private updateRaceTime(): void 
  {
    const elapsed = Date.now() - this.startTime;
    this.currentRacerData.raceTime = this.formatTime(elapsed);
  }
  
  private formatTime(milliseconds: number): string 
  {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
  
  // Push current data to HUD
  private pushUpdate(): void 
  {
    if (this.racerHUD && this.isActive) 
    {
      this.racerHUD.updateRacerData(this.currentRacerData);
    }
  }
  
  // Racer events
  public onLapComplete(lapNumber: number, lapTime: number): void 
  {
    if (this.racerHUD) 
    {
      this.racerHUD.showLapComplete(lapNumber, this.formatTime(lapTime));
    }
  }
  
  public onRaceFinished(finalPosition: number): void 
  {
    const totalTime = this.currentRacerData.raceTime;
    
    if (this.racerHUD) 
    {
      this.racerHUD.showRaceFinished(finalPosition, totalTime);
    }
    
    // Stop the racer UI after a delay
    setTimeout(() => 
    {
      this.stopRace();
    }, 5000);
  }
  
  public onCheckpointPassed(checkpointId: string): void 
  {
    if (this.racerHUD) 
    {
      this.racerHUD.showMessage(`Checkpoint ${checkpointId}`, 1000, 'info');
    }
  }
  
  public onSpeedBoost(boostAmount: number): void 
  {
    if (this.racerHUD) 
    {
      this.racerHUD.showMessage(`Speed Boost! +${boostAmount}`, 1500, 'success');
    }
  }
  
  // Configuration methods
  public updateConfig(newConfig: Partial<RacerUIConfig>): void 
  {
    this.config = { ...this.config, ...newConfig };
    
    // Update current racer data if needed
    if (newConfig.totalLaps) 
    {
      this.currentRacerData.totalLaps = newConfig.totalLaps;
    }
    if (newConfig.totalRacers) 
    {
      this.currentRacerData.totalRacers = newConfig.totalRacers;
    }
    if (newConfig.maxSpeed) 
    {
      this.currentRacerData.maxSpeed = newConfig.maxSpeed;
    }
    
    this.pushUpdate();
  }
  
  // Debug methods
  public showDebugMessage(message: string): void 
  {
    if (this.config.showDebugInfo && this.racerHUD) 
    {
      this.racerHUD.showMessage(`DEBUG: ${message}`, 1000, 'warning');
    }
  }
  
  public simulateRacerData(): void 
  {
    let testSpeed = 0;
    const testInterval = setInterval(() => 
    {
      testSpeed = Math.random() * this.config.maxSpeed;
      this.updateSpeed(testSpeed);
      
      if (Math.random() < 0.1) // 10% chance to advance lap
      {
        this.updateLap(this.currentRacerData.currentLap + 1);
      }
      
      if (Math.random() < 0.05) // 5% chance to change position
      {
        const newPos = Math.floor(Math.random() * this.config.totalRacers) + 1;
        this.updatePosition(newPos);
      }
    }, 200);
    
    // Stop simulation after 30 seconds
    setTimeout(() => 
    {
      clearInterval(testInterval);
      this.onRaceFinished(Math.floor(Math.random() * this.config.totalRacers) + 1);
    }, 30000);
  }
  
  // Getters
  public isUIActive(): boolean 
  {
    return this.isActive;
  }
  
  public getCurrentRacerData(): RacerData 
  {
    return { ...this.currentRacerData };
  }
  
  // Cleanup
  public dispose(): void 
  {
    console.log('RACER-UI-MANAGER: Disposing...');
    
    this.stopRace();
    
    if (this.racerHUD) 
    {
      this.racerHUD.dispose();
      this.racerHUD = null;
    }
    
    this.isActive = false;
  }
}