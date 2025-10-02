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

  private countdownOverlay: HTMLElement | null = null;
  private finishScreen: HTMLElement | null = null;
  private onRestartCallback: (() => void) | null = null;
  private onLeaveCallback: (() => void) | null = null;
  
  // Current racer state
  private currentRacerData: RacerData = 
  {
    currentLap: 1,
    totalLaps: 3,
    raceTime: '00:00.00',
    position: 1,
    totalRacers: 4,
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
      totalRacers: 4,
      ...config
    };
    
    this.initializeUI();
  }
  
  // Initialize all UI components
  private initializeUI(): void 
  {
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
  
  public updateLap(_currentLap: number): void 
  {
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

  private createCountdownOverlay(): void 
  {
    const countdownHTML = `
      <div id="racerCountdownOverlay" class="fixed inset-0 flex items-center justify-center" style="z-index: 3000; display: none; pointer-events: none;">
        <div class="text-center">
          <div id="countdownNumber" class="font-bold" style="
            font-size: 220px;
            color: #63eafe;
            text-shadow: 
              0 0 10px #63eafe,
              0 0 20px #63eafe,
              0 0 40px #63eafe,
              0 0 80px #9333ea,
              0 0 120px #9333ea,
              0 0 160px #9333ea;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            letter-spacing: 0.05em;
          ">
            3
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', countdownHTML);
    this.countdownOverlay = document.getElementById('racerCountdownOverlay');
  }

  public showCountdown(seconds: number = 5): Promise<void> 
  {
    return new Promise((resolve) => 
    {
      if (!this.countdownOverlay) 
      {
        this.createCountdownOverlay();
      }
      
      if (!this.countdownOverlay) 
      {
        resolve();
        return;
      }
      
      const numberElement = document.getElementById('countdownNumber');
      if (!numberElement) 
      {
        resolve();
        return;
      }
      
      this.countdownOverlay.style.display = 'flex';
      
      let currentSecond = seconds;
      
      const updateCountdown = () => 
      {
        if (currentSecond > 0) 
        {
          numberElement.textContent = currentSecond.toString();
          numberElement.style.transform = 'scale(0.8)';
          numberElement.style.opacity = '0';
          
          // Animate in
          setTimeout(() => 
          {
            numberElement.style.transition = 'all 0.3s ease-out';
            numberElement.style.transform = 'scale(1.2)';
            numberElement.style.opacity = '1';
          }, 50);
          
          // Fade out before next number
          setTimeout(() => 
          {
            numberElement.style.transition = 'all 0.4s ease-in';
            numberElement.style.transform = 'scale(0.9)';
            numberElement.style.opacity = '0.3';
          }, 600);
          
          currentSecond--;
          setTimeout(updateCountdown, 1000);
        } 
        else 
        {
          // Show "GO!"
          numberElement.textContent = 'GO!';
          numberElement.style.fontSize = '180px';
          numberElement.style.color = '#63eafe';
          numberElement.style.transform = 'scale(0.8)';
          numberElement.style.opacity = '0';
          
          setTimeout(() => 
          {
            numberElement.style.transition = 'all 0.2s ease-out';
            numberElement.style.transform = 'scale(1.3)';
            numberElement.style.opacity = '1';
          }, 50);
          
          setTimeout(() => 
          {
            numberElement.style.transition = 'all 0.3s ease-in';
            numberElement.style.transform = 'scale(1.5)';
            numberElement.style.opacity = '0';
            
            setTimeout(() => 
            {
              if (this.countdownOverlay) 
              {
                this.countdownOverlay.style.display = 'none';
              }
              resolve();
            }, 300);
          }, 700);
        }
      };
      
      updateCountdown();
    });
  }

 private createFinishScreen(): void 
{
  const finishHTML = `
    <div id="racerFinishScreen" class="fixed inset-0 flex items-center justify-center" style="z-index: 3000; display: none; backdrop-filter: blur(8px); background: rgba(0, 0, 0, 0.5);">
      <div class="relative max-w-5xl w-full mx-8" style="
        background: linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(20, 20, 35, 0.95) 100%);
        border-radius: 24px;
        border: 3px solid transparent;
        background-clip: padding-box;
        box-shadow: 
          0 0 40px rgba(99, 234, 254, 0.3),
          0 0 80px rgba(147, 51, 234, 0.2),
          inset 0 0 60px rgba(99, 234, 254, 0.05);
      ">
        <!-- Neon border effect -->
        <div style="
          position: absolute;
          inset: -3px;
          border-radius: 24px;
          padding: 3px;
          background: linear-gradient(135deg, #63eafe 0%, #9333ea 50%, #ec4899 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          opacity: 0.6;
        "></div>

        <!-- Header -->
        <div style="
          background: linear-gradient(90deg, #f59e0b 0%, #ef4444 100%);
          padding: 24px;
          border-radius: 20px 20px 0 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            animation: shimmer 2s infinite;
          "></div>
          <h2 class="text-4xl font-bold text-white" style="text-shadow: 0 2px 10px rgba(0,0,0,0.3);">
            🏁 Race Complete!
          </h2>
        </div>

        <!-- Content -->
        <div class="p-8">
          <!-- 4 Player Grid -->
          <div class="grid grid-cols-2 gap-6 mb-6">
            <!-- Player 1 (User) -->
            <div id="finishPlayer1" class="relative p-6 rounded-xl flex flex-col items-center" style="
              background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(99, 234, 254, 0.1) 100%);
              border: 2px solid #a855f7;
              box-shadow: 0 0 20px rgba(168, 85, 247, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.1);
            ">
              <div class="absolute top-4 left-4 text-6xl font-bold" style="
                color: #fbbf24;
                text-shadow: 0 0 20px #fbbf24, 0 0 40px #f59e0b;
              ">1st</div>
              
              <!-- Centered Avatar -->
              <div class="flex flex-col items-center mt-8 mb-4">
                <img id="finishAvatar1" src="/assets/images/default-avatar.jpeg" alt="Player" class="w-32 h-32 rounded-full mb-3" style="
                  border: 4px solid #63eafe;
                  box-shadow: 0 0 30px rgba(99, 234, 254, 0.6), 0 0 60px rgba(147, 51, 234, 0.4);
                "/>
                <div class="text-center">
                  <div id="finishPlayerName1" class="text-white text-2xl font-bold mb-2">You</div>
                  <div id="finishTotalTime1" class="text-cyan-400 text-xl font-semibold" style="text-shadow: 0 0 10px #63eafe;">02:45.32</div>
                </div>
              </div>
              
              <div class="w-full mt-4 pt-4 border-t border-gray-600">
                <div class="text-gray-400 text-sm mb-2 text-center">Lap Times:</div>
                <div id="finishLapTimes1" class="space-y-1 text-sm">
                  <!-- Lap times inserted here -->
                </div>
              </div>
            </div>

            <!-- Player 2 (AI) -->
            <div id="finishPlayer2" class="relative p-6 rounded-xl flex flex-col items-center" style="
              background: rgba(60, 60, 80, 0.4);
              border: 2px solid #6b7280;
              box-shadow: 0 0 15px rgba(107, 114, 128, 0.2);
            ">
              <div class="absolute top-4 left-4 text-5xl font-bold text-gray-400">2nd</div>
              
              <div class="flex flex-col items-center mt-8 mb-4">
                <img src="/assets/images/default-avatar.jpeg" alt="AI" class="w-32 h-32 rounded-full mb-3 opacity-60" style="
                  border: 3px solid #6b7280;
                "/>
                <div class="text-center">
                  <div class="text-gray-300 text-2xl font-bold mb-2">AI Racer 1</div>
                  <div class="text-gray-400 text-xl">02:47.10</div>
                </div>
              </div>
            </div>

            <!-- Player 3 (AI) -->
            <div id="finishPlayer3" class="relative p-6 rounded-xl flex flex-col items-center" style="
              background: rgba(60, 60, 80, 0.4);
              border: 2px solid #6b7280;
              box-shadow: 0 0 15px rgba(107, 114, 128, 0.2);
            ">
              <div class="absolute top-4 left-4 text-5xl font-bold text-gray-400">3rd</div>
              
              <div class="flex flex-col items-center mt-8 mb-4">
                <img src="/assets/images/default-avatar.jpeg" alt="AI" class="w-32 h-32 rounded-full mb-3 opacity-60" style="
                  border: 3px solid #6b7280;
                "/>
                <div class="text-center">
                  <div class="text-gray-300 text-2xl font-bold mb-2">AI Racer 2</div>
                  <div class="text-gray-400 text-xl">02:49.85</div>
                </div>
              </div>
            </div>

            <!-- Player 4 (AI) -->
            <div id="finishPlayer4" class="relative p-6 rounded-xl flex flex-col items-center" style="
              background: rgba(60, 60, 80, 0.4);
              border: 2px solid #6b7280;
              box-shadow: 0 0 15px rgba(107, 114, 128, 0.2);
            ">
              <div class="absolute top-4 left-4 text-5xl font-bold text-gray-400">4th</div>
              
              <div class="flex flex-col items-center mt-8 mb-4">
                <img src="/assets/images/default-avatar.jpeg" alt="AI" class="w-32 h-32 rounded-full mb-3 opacity-60" style="
                  border: 3px solid #6b7280;
                "/>
                <div class="text-center">
                  <div class="text-gray-300 text-2xl font-bold mb-2">AI Racer 3</div>
                  <div class="text-gray-400 text-xl">02:52.43</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Best Lap Info -->
          <div class="mb-6 p-4 rounded-lg text-center" style="
            background: rgba(99, 234, 254, 0.1);
            border: 1px solid rgba(99, 234, 254, 0.3);
          ">
            <div class="text-gray-400 text-sm mb-1">Your Best Lap</div>
            <div id="finishBestLap" class="text-cyan-400 text-2xl font-bold" style="text-shadow: 0 0 15px #63eafe;">00:54.21</div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4">
            <button id="finishRestartBtn" class="flex-1 font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3" style="
              background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
              color: white;
              box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
              border: 2px solid rgba(168, 85, 247, 0.5);
            " onmouseover="this.style.boxShadow='0 0 30px rgba(168, 85, 247, 0.6)'" onmouseout="this.style.boxShadow='0 0 20px rgba(168, 85, 247, 0.4)'">
              <img src="/assets/images/restart_icon.png" alt="Restart" class="w-6 h-6" style="filter: brightness(0) invert(1);" />
              <span>Race Again</span>
            </button>
            <button id="finishLeaveBtn" class="flex-1 font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3" style="
              background: rgba(75, 85, 99, 0.5);
              color: white;
              border: 2px solid #6b7280;
            " onmouseover="this.style.background='rgba(75, 85, 99, 0.7)'" onmouseout="this.style.background='rgba(75, 85, 99, 0.5)'">
              <img src="/assets/images/exit_icon.png" alt="Exit" class="w-6 h-6" style="filter: brightness(0) invert(1);" />
              <span>Leave Race</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <style>
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    </style>
  `;
  
  document.body.insertAdjacentHTML('beforeend', finishHTML);
  this.finishScreen = document.getElementById('racerFinishScreen');
  
  const restartBtn = document.getElementById('finishRestartBtn');
  const leaveBtn = document.getElementById('finishLeaveBtn');
  
  if (restartBtn) 
  {
    restartBtn.addEventListener('click', () => 
    {
      if (this.onRestartCallback) 
      {
        this.onRestartCallback();
      }
    });
  }
  
  if (leaveBtn) 
  {
    leaveBtn.addEventListener('click', () => 
    {
      if (this.onLeaveCallback) 
      {
        this.onLeaveCallback();
      }
    });
  }
}

  public showRaceFinishScreen(data: {position: number; totalTime: string; lapTimes: number[];
  bestLap: number | null; playerName?: string; avatarUrl?: string;}): void 
  {
    if (!this.finishScreen) 
    {
      this.createFinishScreen();
    }
    
    if (!this.finishScreen) return;
    
    // Update position
    const positionElement = document.getElementById('finishPosition');
    if (positionElement) 
    {
      const suffix = this.getOrdinalSuffix(data.position);
      positionElement.textContent = `${data.position}${suffix}`;
      
      // Color based on position
      if (data.position === 1) 
      {
        positionElement.className = 'text-8xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent mb-2';
      } 
      else if (data.position === 2) 
      {
        positionElement.className = 'text-8xl font-bold bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 bg-clip-text text-transparent mb-2';
      } 
      else if (data.position === 3) 
      {
        positionElement.className = 'text-8xl font-bold bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 bg-clip-text text-transparent mb-2';
      } 
      else 
      {
        positionElement.className = 'text-8xl font-bold text-gray-500 mb-2';
      }
    }
    
    // Update avatar
    const avatarElement = document.getElementById('finishAvatar') as HTMLImageElement;
    if (avatarElement && data.avatarUrl) 
    {
      avatarElement.src = data.avatarUrl;
    }
    
    // Update player name
    const nameElement = document.getElementById('finishPlayerName');
    if (nameElement && data.playerName) 
    {
      nameElement.textContent = data.playerName;
    }
    
    // Update total time
    const totalTimeElement = document.getElementById('finishTotalTime');
    if (totalTimeElement) 
    {
      totalTimeElement.textContent = data.totalTime;
    }
    
    // Update best lap
    const bestLapElement = document.getElementById('finishBestLap');
    if (bestLapElement) 
    {
      if (data.bestLap !== null) 
      {
        bestLapElement.textContent = this.formatTime(data.bestLap);
      } 
      else 
      {
        bestLapElement.textContent = '--:--.-';
      }
    }
    
    // Update lap times list
    const lapTimesListElement = document.getElementById('finishLapTimesList');
    if (lapTimesListElement) 
    {
      lapTimesListElement.innerHTML = '';
      
      data.lapTimes.forEach((time, index) => 
      {
        const lapDiv = document.createElement('div');
        lapDiv.className = 'flex justify-between items-center text-sm';
        
        const isBestLap = data.bestLap !== null && time === data.bestLap;
        
        lapDiv.innerHTML = `
          <span class="text-gray-400">Lap ${index + 1}:</span>
          <span class="${isBestLap ? 'text-cyan-400 font-bold' : 'text-white'}">${this.formatTime(time)}</span>
        `;
        
        lapTimesListElement.appendChild(lapDiv);
      });
    }
    
    // Show the screen
    this.finishScreen.style.display = 'flex';
  }

  public hideFinishScreen(): void 
  {
    if (this.finishScreen) 
    {
      this.finishScreen.style.display = 'none';
    }
  }

  public setFinishScreenCallbacks(onRestart: () => void, onLeave: () => void): void 
  {
    this.onRestartCallback = onRestart;
    this.onLeaveCallback = onLeave;
  }

  private getOrdinalSuffix(num: number): string 
  {
    const j = num % 10;
    const k = num % 100;
    
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
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
    this.stopRace();
    
    if (this.racerHUD) 
    {
      this.racerHUD.dispose();
      this.racerHUD = null;
    }
    
    // Remove countdown overlay
    if (this.countdownOverlay) 
    {
      this.countdownOverlay.remove();
      this.countdownOverlay = null;
    }
    
    // Remove finish screen
    if (this.finishScreen) 
    {
      this.finishScreen.remove();
      this.finishScreen = null;
    }
    
    this.onRestartCallback = null;
    this.onLeaveCallback = null;
    
    this.isActive = false;
  }
}