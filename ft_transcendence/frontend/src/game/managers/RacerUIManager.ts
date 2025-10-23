import { RacerHUD, RacerData } from '../engines/racer/RacerHUD';

export interface RacerUIConfig 
{
  showHUD: boolean;
  showDebugInfo: boolean;
  maxSpeed: number;
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
  
  private currentRacerData: RacerData = 
  {
    currentLap: 1,
    totalLaps: 1,
    raceTime: '00:00.00',
    position: 1,
    totalRacers: 1,
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
      ...config
    };

    this.currentRacerData.maxSpeed = this.config.maxSpeed;
    this.initializeUI();
  }
  
  private initializeUI(): void 
  {
    if (this.config.showHUD) 
    {
      this.racerHUD = new RacerHUD();
    }
  }
  
  public startRace(): void 
  {
    this.isActive = true;
    this.startTime = Date.now();
    
    if (this.racerHUD) 
    {
      this.racerHUD.show();
    }
    
    this.startUpdateLoop();
    
    if (this.racerHUD) 
    {
      this.racerHUD.showMessage('Race Started!', 2000, 'info');
    }
  }
  
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
  
  public updateSpeed(speed: number): void 
  {
    this.currentRacerData.speed = speed;
    this.pushUpdate();
  }
  
  public updateLap(currentLap: number): void 
  {
    this.currentRacerData.currentLap = currentLap;
    this.pushUpdate();
  }
  
  public updatePosition(position: number): void 
  {
    this.currentRacerData.position = position;
    this.pushUpdate();
  }

  public setRaceInfo(totalLaps: number, totalRacers: number): void 
  {
    this.currentRacerData.totalLaps = totalLaps;
    this.currentRacerData.totalRacers = totalRacers;
    this.pushUpdate();
  }
  
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
  
  private pushUpdate(): void 
  {
    if (this.racerHUD && this.isActive) 
    {
      this.racerHUD.updateRacerData(this.currentRacerData);
    }
  }
  
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
          
          setTimeout(() => 
          {
            numberElement.style.transition = 'all 0.3s ease-out';
            numberElement.style.transform = 'scale(1.2)';
            numberElement.style.opacity = '1';
          }, 50);
          
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
    <div id="racerFinishScreen" class="fixed inset-0 flex items-center justify-center p-4" style="z-index: 3000; display: none; backdrop-filter: blur(8px); background: rgba(0, 0, 0, 0.5);">
      <div class="relative w-full max-w-4xl" style="
        background: linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(20, 20, 35, 0.95) 100%);
        border-radius: 24px;
        box-shadow: 0 0 40px rgba(99, 234, 254, 0.3), 0 0 80px rgba(147, 51, 234, 0.2);
      ">
        <div class="absolute -inset-1 rounded-3xl pointer-events-none opacity-60" style="
          background: linear-gradient(135deg, #63eafe 0%, #9333ea 50%, #ec4899 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        "></div>

        <div class="flex-shrink-0 px-6 py-4 text-center rounded-t-3xl" style="background: linear-gradient(90deg, #f59e0b 0%, #ef4444 100%);">
          <h2 class="text-2xl md:text-3xl lg:text-4xl font-bold text-white">🏁 RACE COMPLETE!</h2>
        </div>

        <div class="p-6 md:p-8">
          <div class="flex flex-col items-center mb-6">
            <img id="finishPlayerAvatar" src="/assets/images/default-avatar.jpeg" alt="Player" 
              class="w-24 h-24 md:w-32 md:h-32 rounded-full mb-4 border-4 border-cyan-400" 
              style="box-shadow: 0 0 30px rgba(99, 234, 254, 0.6);"
              onerror="this.src='/assets/images/default-avatar.jpeg'"/>
            
            <div id="finishPosition" class="text-6xl md:text-8xl font-bold mb-2">1st</div>
            <div id="finishPlayerName" class="text-white text-2xl md:text-3xl font-bold mb-2">You</div>
            <div id="finishTotalTime" class="text-cyan-400 text-xl md:text-2xl font-semibold mb-4" style="text-shadow: 0 0 10px #63eafe;">02:45.32</div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="p-4 rounded-lg text-center bg-cyan-400/10 border border-cyan-400/30">
              <div class="text-gray-400 text-sm mb-1">Best Lap</div>
              <div id="finishBestLap" class="text-cyan-400 text-2xl font-bold" style="text-shadow: 0 0 15px #63eafe;">00:54.21</div>
            </div>
            
            <div class="p-4 rounded-lg text-center bg-purple-400/10 border border-purple-400/30">
              <div class="text-gray-400 text-sm mb-1">Total Laps</div>
              <div id="finishTotalLaps" class="text-purple-400 text-2xl font-bold">3</div>
            </div>
          </div>

          <div class="mb-6 p-4 rounded-lg bg-gray-700/30 border border-gray-600">
            <div class="text-gray-400 text-sm mb-3 text-center">Lap Times</div>
            <div id="finishLapTimesList" class="space-y-2"></div>
          </div>

          <div class="flex gap-4">
            <button id="finishRestartBtn" class="flex-1 font-bold py-4 px-6 rounded-xl text-base transition-all flex items-center justify-center gap-2 text-white border-2" style="
              background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
              border-color: rgba(168, 85, 247, 0.5);
            ">
              🔄 Race Again
            </button>
            <button id="finishLeaveBtn" class="flex-1 font-bold py-4 px-6 rounded-xl text-base transition-all flex items-center justify-center gap-2 text-white bg-gray-600/50 border-2 border-gray-500 hover:bg-gray-600/70">
              🚪 Leave Race
            </button>
          </div>
        </div>
      </div>
    </div>
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

  public showRaceFinishScreen(data: {position: number; totalTime: string; lapTimes: number[]; bestLap: number | null; playerName?: string; avatarUrl?: string;}): void 
  {
    if (!this.finishScreen) 
    {
      this.createFinishScreen();
    }
    
    if (!this.finishScreen) 
    {
      return;
    }
    
    const positionElement = document.getElementById('finishPosition');
    if (positionElement) 
    {
      const suffix = this.getOrdinalSuffix(data.position);
      positionElement.textContent = `${data.position}${suffix}`;
      
      if (data.position === 1) 
      {
        positionElement.className = 'text-6xl md:text-8xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent';
        positionElement.style.textShadow = '0 0 20px #fbbf24';
      } 
      else if (data.position === 2) 
      {
        positionElement.className = 'text-6xl md:text-8xl font-bold mb-2 bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 bg-clip-text text-transparent';
      } 
      else if (data.position === 3) 
      {
        positionElement.className = 'text-6xl md:text-8xl font-bold mb-2 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 bg-clip-text text-transparent';
      } 
      else 
      {
        positionElement.className = 'text-6xl md:text-8xl font-bold mb-2 text-gray-500';
      }
    }
    
    const avatarElement = document.getElementById('finishPlayerAvatar') as HTMLImageElement;
    if (avatarElement && data.avatarUrl) 
    {
      avatarElement.src = data.avatarUrl;
    }
    
    const nameElement = document.getElementById('finishPlayerName');
    if (nameElement && data.playerName) 
    {
      nameElement.textContent = data.playerName;
    }
    
    const totalTimeElement = document.getElementById('finishTotalTime');
    if (totalTimeElement) 
    {
      totalTimeElement.textContent = data.totalTime;
    }
    
    const totalLapsElement = document.getElementById('finishTotalLaps');
    if (totalLapsElement) 
    {
      totalLapsElement.textContent = this.currentRacerData.totalLaps.toString();
    }
    
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
    
    if (j === 1 && k !== 11) 
    {
      return 'st';
    }
    if (j === 2 && k !== 12) 
    {
      return 'nd';
    }
    if (j === 3 && k !== 13) 
    {
      return 'rd';
    }
    return 'th';
  }

  public isUIActive(): boolean 
  {
    return this.isActive;
  }
  
  public getCurrentRacerData(): RacerData 
  {
    return { ...this.currentRacerData };
  }
  
  public dispose(): void 
  {  
    this.stopRace();
    
    if (this.racerHUD) 
    {
      this.racerHUD.dispose();
      this.racerHUD = null;
    }
    
    if (this.countdownOverlay) 
    {
      this.countdownOverlay.remove();
      this.countdownOverlay = null;
    }
    
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