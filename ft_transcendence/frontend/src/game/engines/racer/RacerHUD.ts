// ====================================================
// RacerHUD.ts - MAIN RACER INTERFACE OVERLAY
// ====================================================

export interface RacerData 
{
  currentLap: number;
  totalLaps: number;
  raceTime: string;
  position: number;
  totalRacers: number;
  speed: number;
  maxSpeed: number;
}

export class RacerHUD 
{
  private container: HTMLElement | null = null;
  private isVisible: boolean = false;
  private lastUpdateTime: number = 0;
  
  constructor() 
  {
    this.createHUD();
  }
  
  // Create the HUD overlay
  private createHUD(): void 
  {
    const hudHTML = `
      <div id="racerHUD" class="absolute inset-0 pointer-events-none" style="display: none; z-index: 1000;">
        <!-- Top Race Info Bar -->
        <div class="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div class="bg-gradient-to-br from-purple-900/75 via-blue-900/65 to-indigo-900/65 backdrop-blur rounded-lg px-16 py-3 border border-blue-400/30">
            <div class="flex items-center space-x-8 text-white">
              <!-- Lap Counter -->
              <div class="text-center">
                <div class="text-xs text-blue-300 uppercase tracking-wide">Lap</div>
                <div class="text-xl font-bold">
                  <span id="currentLap">1</span>/<span id="totalLaps">3</span>
                </div>
              </div>
              
              <!-- Race Time -->
              <div class="text-center">
                <div class="text-xs text-blue-300 uppercase tracking-wide">Time</div>
                <div id="raceTime" class="text-xl font-bold font-mono">00:00.00</div>
              </div>
              
              <!-- Position -->
              <div class="text-center">
                <div class="text-xs text-blue-300 uppercase tracking-wide">Position</div>
                <div class="text-xl font-bold">
                  <span id="currentPosition">1</span>/<span id="totalRacers">8</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Control Buttons (Top Right) -->
        <div class="absolute top-4 right-4 pointer-events-auto space-x-2">
          <button 
            id="toggleDevelopmentMode"
            onclick="racerHUD.toggleDevelopmentMode()" 
            class="bg-blue-600/80 backdrop-blur text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Dev Mode: OFF
          </button>
          <button 
            onclick="racerHUD.resetCamera()" 
            class="bg-green-600/80 backdrop-blur text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Reset Camera
          </button>
          <button 
            onclick="racerHUD.goBack()" 
            class="bg-gray-600/80 backdrop-blur text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Back
          </button>
        </div>

        <!-- Performance Info (Bottom Left) -->
        <div class="absolute bottom-4 left-4 pointer-events-auto">
          <div class="bg-gradient-to-br from-purple-900/75 via-blue-900/65 to-indigo-900/65 backdrop-blur rounded-lg p-3 border border-gray-500/30">
            <div class="text-gray-300 text-xs space-y-1">
              <div>FPS: <span id="fpsCounter">60</span></div>
              <div>Meshes: <span id="meshCounter">0</span></div>
              <div>Camera: <span id="cameraMode">Racing</span></div>
            </div>
          </div>
        </div>
        
        <!-- Speed Display (Bottom Right) -->
        <div class="absolute bottom-8 right-8">
          <div class="relative">
            <!-- Oval Speedometer Container -->
            <div class="w-48 h-24 bg-gradient-to-br from-purple-900/70 via-blue-900/60 to-indigo-900/60 backdrop-blur rounded-full border-4 border-gray-600 relative overflow-hidden">
              
            <!-- Speed Arc (Right Side) -->
            <div class="absolute right-0 top-0 w-24 h-24">
              <svg width="96" height="96" class="absolute inset-0">
                
                <!-- Background Arc -->
                <path id="speedArcOval"
                      d="M 48 8 A 40 40 0 0 1 48 88" 
                      fill="none" 
                      stroke="rgba(75,85,99,0.1)" 
                      stroke-width="10" 
                      stroke-linecap="round"/>
                
                <!-- Base Gradient Arc -->
                <path id="speedArcBase" 
                      d="M 48 8 A 40 40 0 0 1 48 88" 
                      fill="none" 
                      stroke="url(#ovalSpeedGradient)" 
                      stroke-width="10" 
                      stroke-linecap="round"/>
                
                <!-- Glow Overlay Arc (for highlight while accelerating) -->
                <path id="speedArcGlow" 
                      d="M 48 8 A 40 40 0 0 1 48 88" 
                      fill="none" 
                      stroke="url(#glowGradient)" 
                      stroke-width="14" 
                      stroke-linecap="round"
                      stroke-dasharray="0 999"
                      stroke-dashoffset="0"
                      opacity="0.9"
                      filter="url(#glowFilter)"/>
                
                <!-- Gradient Definitions -->
                <defs>
                  <!-- Base Gradient -->
                  <linearGradient id="ovalSpeedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#22d3ee"/>
                    <stop offset="40%" stop-color="#3b82f6"/>
                    <stop offset="70%" stop-color="#8b5cf6"/>
                    <stop offset="100%" stop-color="#ec4899"/>
                  </linearGradient>

                  <!-- Glow Gradient -->
                  <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="white" stop-opacity="1"/>
                    <stop offset="50%" stop-color="#a5f3fc" stop-opacity="0.8"/>
                    <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
                  </linearGradient>

                  <!-- Blur filter for glow -->
                  <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur"/>
                    <feMerge>
                      <feMergeNode in="blur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
              </svg>
            </div>

              
              <!-- Speed Value (Left Side) -->
              <div class="absolute inset-0 flex items-center justify-center" style="transform: translateY(-2px);">
                <div class="text-center relative">
                  
                  <!-- Shadow -->
                  <span class="absolute inset-0 text-5xl font-extrabold text-black translate-x-1 translate-y-1"
                        style="font-family: 'Arial Black', sans-serif;">
                    0
                  </span>

                  <!-- Text -->
                  <span id="speedValue" 
                    class="relative text-5xl font-extrabold 
                          bg-gradient-to-b from-cyan-200 via-cyan-400 to-cyan-600 
                          bg-clip-text text-transparent"
                    style="font-family: 'Arial Black', sans-serif;">
                    0
                  </span>

                  <div class="text-xs text-gray-300 uppercase tracking-widest font-bold">KM/H</div>
                </div>
              </div>

              
              <!-- Inner Oval Highlight -->
              <div class="absolute inset-2 rounded-full border border-gray-500/30"></div>
            </div>
          </div>
        </div>
        
        <!-- Status Messages Area -->
        <div id="statusMessages" class="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <!-- Dynamic messages will appear here -->
        </div>
      </div>
    `;
    
    // Add to page
    document.body.insertAdjacentHTML('beforeend', hudHTML);
    this.container = document.getElementById('racerHUD');
    
    (window as any).racerHUD = this;
  }
  
  // Show/Hide HUD
  public show(): void 
  {
    if (this.container) 
    {
      this.container.style.display = 'block';
      this.isVisible = true;
      console.log('RACER-HUD: HUD visible');
    }
  }
  
  public hide(): void 
  {
    if (this.container) 
    {
      this.container.style.display = 'none';
      this.isVisible = false;
      console.log('RACER-HUD: HUD hidden');
    }
  }
  
  // Update race data (called by RacerRenderer)
  public updateRacerData(data: RacerData): void 
  {
    if (!this.isVisible) 
    {
      return;
    }
    
    const now = Date.now();
    if (now - this.lastUpdateTime < 50)
    {
      return;
    }
    this.lastUpdateTime = now;
    
    // Update lap counter
    const currentLapEl = document.getElementById('currentLap');
    const totalLapsEl = document.getElementById('totalLaps');
    if (currentLapEl && totalLapsEl) 
    {
      currentLapEl.textContent = data.currentLap.toString();
      totalLapsEl.textContent = data.totalLaps.toString();
    }
    
    // Update race time
    const raceTimeEl = document.getElementById('raceTime');
    if (raceTimeEl) 
    {
      raceTimeEl.textContent = data.raceTime;
    }
    
    // Update position
    const positionEl = document.getElementById('currentPosition');
    const totalRacersEl = document.getElementById('totalRacers');
    if (positionEl && totalRacersEl) 
    {
      positionEl.textContent = data.position.toString();
      totalRacersEl.textContent = data.totalRacers.toString();
    }
    
    // Update speed
    this.updateSpeed(data.speed, data.maxSpeed);
  }
  
  // Update speed display with oval gauge like reference image
  private updateSpeed(speed: number, maxSpeed: number): void 
  {
    const speedValueEl = document.getElementById('speedValue');
    
    if (speedValueEl) 
    {
      speedValueEl.textContent = Math.round(speed).toString();
    }
    
    // Update the right-side arc
    this.updateOvalSpeedArc(speed, maxSpeed);
  }
  
  // Update oval arc on right side only
  private updateOvalSpeedArc(speed: number, maxSpeed: number): void 
  {
    const speedArc = document.getElementById('speedArcOval');
    if (!speedArc) 
    {
      return;
    }
    
    const percentage = Math.min((speed / maxSpeed) * 100, 100);
    
    // Right-side semicircle arc (top to bottom)
    const centerX = 48;
    const centerY = 48;
    const radius = 40;
    
    const startAngle = -90;
    const totalSweep = 180; 
    const currentSweep = (percentage / 100) * totalSweep;
    const endAngle = startAngle + currentSweep;
    
    // Convert to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    // Calculate coordinates
    const startX = centerX + radius * Math.cos(startRad);
    const startY = centerY + radius * Math.sin(startRad);
    const endX = centerX + radius * Math.cos(endRad);
    const endY = centerY + radius * Math.sin(endRad);
    
    // Create arc path
    if (percentage === 0) 
    {
      speedArc.setAttribute('d', `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${startX} ${startY}`);
    } 
    else 
    {
      const largeArcFlag = currentSweep > 90 ? 1 : 0;
      const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
      speedArc.setAttribute('d', pathData);
    }
  }
  
  // Show temporary status messages
  public showMessage(message: string, duration: number = 2000, type: 'info' | 'success' | 'warning' = 'info'): void 
  {
    const statusEl = document.getElementById('statusMessages');
    if (!statusEl) 
    {
      return;
    }
    
    const messageId = `msg-${Date.now()}`;
    const colorClass = type === 'success' ? 'text-green-500' : type === 'warning' ? 'text-yellow-500' : 'text-blue-500';
    
    const messageHTML = `
      <div id="${messageId}" class=" from-purple-900/75 via-blue-900/65 to-indigo-900/65 backdrop-blur rounded-lg px-6 py-2 mb-2 border border-white/20">
        <div class="${colorClass} text-lg font-semibold text-center">${message}</div>
      </div>
    `;
    
    statusEl.insertAdjacentHTML('beforeend', messageHTML);
    
    // Auto remove after duration
    setTimeout(() => 
    {
      const msgEl = document.getElementById(messageId);
      if (msgEl) 
      {
        msgEl.remove();
      }
    }, duration);
  }
  
  // Lap completion effect
  public showLapComplete(lapNumber: number, lapTime: string): void 
  {
    this.showMessage(`Lap ${lapNumber} Complete!<br><small>${lapTime}</small>`, 3000, 'success');
    
    // Flash effect
    if (this.container) 
    {
      this.container.style.animation = 'flash 0.5s ease-in-out';
      setTimeout(() => 
      {
        if (this.container) 
        {
          this.container.style.animation = '';
        }
      }, 500);
    }
  }
  
  // Race finish effect
  public showRaceFinished(finalPosition: number, totalTime: string): void 
  {
    this.showMessage(`Race Finished!<br>Position: ${finalPosition}<br>Time: ${totalTime}`, 5000, 'success');
  }
  
  // Button handlers (called from HUD buttons)
  public toggleDevelopmentMode(): void 
  {
    // TODO: Call RacerRenderer method when connected
    console.log('RACER-HUD: Toggle development mode (TODO)');
    
    const button = document.getElementById('toggleDevelopmentMode');
    if (button) 
    {
      const isCurrentlyOff = button.textContent?.includes('OFF');
      button.textContent = `Dev Mode: ${isCurrentlyOff ? 'ON' : 'OFF'}`;
      
      if (isCurrentlyOff) 
      {
        button.className = 'bg-green-600/80 backdrop-blur text-white px-4 py-2 rounded-lg hover:bg-green-700';
      } 
      else 
      {
        button.className = 'bg-blue-600/80 backdrop-blur text-white px-4 py-2 rounded-lg hover:bg-blue-700';
      }
    }
  }
  
  public resetCamera(): void 
  {
    // TODO: Call RacerRenderer method when connected
    console.log('RACER-HUD: Reset camera (TODO)');
    this.showMessage('Camera Reset', 1000, 'info');
  }
  
  public goBack(): void 
  {
    if ((window as any).podRacerPage && (window as any).podRacerPage.goBack) 
    {
      (window as any).podRacerPage.goBack();
    } 
    else 
    {
      console.warn('RACER-HUD: PodRacerPage not found for goBack');
    }
  }
  
  // Performance monitoring updates
  public updatePerformanceInfo(fps: number, meshCount: number): void 
  {
    const fpsEl = document.getElementById('fpsCounter');
    const meshEl = document.getElementById('meshCounter');
    
    if (fpsEl) 
    {
      fpsEl.textContent = Math.round(fps).toString();
    }
    if (meshEl) 
    {
      meshEl.textContent = meshCount.toString();
    }
  }
  
  public updateCameraMode(mode: string): void 
  {
    const cameraEl = document.getElementById('cameraMode');
    if (cameraEl) 
    {
      const modeNames = 
      {
        'racing': 'Racing',
        'free': 'Free',
        'player': 'Player'
      };
      cameraEl.textContent = modeNames[mode as keyof typeof modeNames] || mode;
    }
  }
  
  // Cleanup
  public dispose(): void 
  {
    if (this.container) 
    {
      this.container.remove();
      this.container = null;
    }
    
    // Remove global reference
    if ((window as any).racerHUD === this) 
    {
      delete (window as any).racerHUD;
    }
    
    this.isVisible = false;
    console.log('RACER-HUD: Disposed');
  }
}