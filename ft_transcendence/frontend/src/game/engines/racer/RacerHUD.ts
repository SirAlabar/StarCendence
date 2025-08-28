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
            <!-- Enhanced Oval Speedometer Container -->
            <div class="w-64 h-32 bg-gradient-to-br from-purple-900/70 via-blue-900/60 to-indigo-900/60 backdrop-blur rounded-full border-4 border-gray-600 relative">

              <!-- Outer Glow Arc (Outside the oval) -->
              <div class="absolute -inset-4 pointer-events-none">
                <svg width="340" height="170" class="absolute inset-0">
                  
                  <!-- Background Arc (Full oval outline) -->
                  <path id="speedArcBackground" 
                          d="M 144 20 A 140 60 0 0 1 144 140" 
                          fill="none" 
                          stroke="rgba(75,85,99,0.3)" 
                          stroke-width="24" 
                          stroke-linecap="round"/>
                  
                  <!-- Dynamic Speed Arc (Progressive fill) -->
                  <path id="speedArcDynamic" 
                          d="M 144 20 A 140 60 0 0 1 144 140"  
                          fill="none" 
                          stroke="url(#dynamicSpeedGradient)" 
                          stroke-width="26" 
                          stroke-linecap="round"
                          stroke-dasharray="0 999"
                          stroke-dashoffset="0"
                          opacity="0.4"/>
                  
                  <!-- Glow Overlay Arc (Intense glow effect) -->
                  <path id="speedArcGlow" 
                          d="M 144 20 A 140 60 0 0 1 144 140" 
                          fill="none" 
                          stroke="url(#glowSpeedGradient)" 
                          stroke-width="28" 
                          stroke-linecap="round"
                          stroke-dasharray="0 999"
                          stroke-dashoffset="0"
                          opacity="0"
                          filter="url(#intensiveGlowFilter)"/>
                  
                  <!-- Gradient Definitions -->
                  <defs>
                    <!-- Dynamic Speed Gradient -->
                    <linearGradient id="dynamicSpeedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#22d3ee"/>
                      <stop offset="25%" stop-color="#3b82f6"/>
                      <stop offset="50%" stop-color="#8b5cf6"/>
                      <stop offset="75%" stop-color="#ec4899"/>
                      <stop offset="100%" stop-color="#f97316"/>
                    </linearGradient>

                    <!-- Glow Speed Gradient -->
                    <linearGradient id="glowSpeedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="white" stop-opacity="1"/>
                      <stop offset="30%" stop-color="#a5f3fc" stop-opacity="0.9"/>
                      <stop offset="60%" stop-color="#c084fc" stop-opacity="0.8"/>
                      <stop offset="100%" stop-color="#fb7185" stop-opacity="0.7"/>
                    </linearGradient>

                    <!-- Intensive Blur filter for glow -->
                    <filter id="intensiveGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="6" result="blur"/>
                      <feGaussianBlur stdDeviation="3" result="blur2"/>
                      <feMerge>
                        <feMergeNode in="blur"/>
                        <feMergeNode in="blur2"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                </svg>
              </div>
              
              <!-- Speed Value (Center) -->
              <div class="absolute inset-0 flex items-center justify-center" style="transform: translateY(-2px);">
                <div class="text-center relative">
                  
                  <!-- Dynamic Shadow (matches speed value) -->
                  <span id="speedShadow" 
                        class="absolute inset-0 text-5xl font-extrabold text-black translate-x-1 translate-y-1"
                        style="font-family: 'Arial Black', sans-serif;">
                    0
                  </span>

                  <!-- Main Speed Text -->
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
  
  // Update speed display with enhanced oval gauge
  private updateSpeed(speed: number, maxSpeed: number): void 
  {
    const speedValue = Math.round(speed);
    const speedValueEl = document.getElementById('speedValue');
    const speedShadowEl = document.getElementById('speedShadow');
    
    // Update both main text and shadow with same value
    if (speedValueEl) 
    {
      speedValueEl.textContent = speedValue.toString();
    }
    if (speedShadowEl) 
    {
      speedShadowEl.textContent = speedValue.toString();
    }
    
    // Update the enhanced arc
    this.updateEnhancedSpeedArc(speed, maxSpeed);
  }
  
  // Update enhanced oval arc that wraps around outside
  private updateEnhancedSpeedArc(speed: number, maxSpeed: number): void 
  {
    const speedArcDynamic = document.getElementById('speedArcDynamic');
    const speedArcGlow = document.getElementById('speedArcGlow');
    
    if (!speedArcDynamic || !speedArcGlow) 
    {
      return;
    }
    
    const percentage = Math.min((speed / maxSpeed) * 100, 100);
    
    // Calculate ellipse perimeter approximation
    const rx = 128; // Semi-major axis
    const ry = 64;  // Semi-minor axis
    const perimeter = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
    
    // Calculate dash array for progressive fill
    const filledLength = (percentage / 100) * perimeter;
    const emptyLength = perimeter - filledLength;
    
    // ALWAYS show full arc outline (even at speed 0)
    speedArcDynamic.setAttribute('stroke-dasharray', `${perimeter} 0`);
    
    // Update dynamic arc opacity based on speed (stronger as speed increases)
    const baseOpacity = 0.3; // Always visible base
    const dynamicOpacity = baseOpacity + (percentage / 100) * 0.5; // Increases to 0.8 max
    speedArcDynamic.setAttribute('opacity', dynamicOpacity.toString());
    
    // Update glow arc - this shows the "filled" portion
    const glowIntensity = Math.min(percentage / 100, 1);
    const glowOpacity = glowIntensity * 0.7; // Max 70% opacity for glow
    
    if (percentage > 0) // Start showing fill immediately
    {
      speedArcGlow.setAttribute('stroke-dasharray', `${filledLength} ${emptyLength}`);
      speedArcGlow.setAttribute('opacity', glowOpacity.toString());
      
      // Add pulsing effect for high speeds
      if (percentage > 80) 
      {
        speedArcGlow.style.animation = 'pulse 0.5s ease-in-out infinite alternate';
      } 
      else 
      {
        speedArcGlow.style.animation = '';
      }
    } 
    else 
    {
      speedArcGlow.setAttribute('stroke-dasharray', `0 ${perimeter}`);
      speedArcGlow.setAttribute('opacity', '0');
      speedArcGlow.style.animation = '';
    }
    
    // Dynamic color intensity based on speed
    this.updateSpeedColors(percentage);
  }
  
  // Update color intensity based on speed percentage
  private updateSpeedColors(percentage: number): void 
  {
    const speedValueEl = document.getElementById('speedValue');
    if (!speedValueEl) return;
    
    // Change text gradient based on speed
    if (percentage < 30) 
    {
      // Low speed - cyan tones
      speedValueEl.className = speedValueEl.className.replace(
        /bg-gradient-to-b from-\w+-\d+ via-\w+-\d+ to-\w+-\d+/,
        'bg-gradient-to-b from-cyan-200 via-cyan-400 to-cyan-600'
      );
    } 
    else if (percentage < 60) 
    {
      // Medium speed - blue/purple tones
      speedValueEl.className = speedValueEl.className.replace(
        /bg-gradient-to-b from-\w+-\d+ via-\w+-\d+ to-\w+-\d+/,
        'bg-gradient-to-b from-blue-200 via-purple-400 to-purple-600'
      );
    } 
    else if (percentage < 85) 
    {
      // High speed - purple/pink tones
      speedValueEl.className = speedValueEl.className.replace(
        /bg-gradient-to-b from-\w+-\d+ via-\w+-\d+ to-\w+-\d+/,
        'bg-gradient-to-b from-purple-200 via-pink-400 to-pink-600'
      );
    } 
    else 
    {
      // Maximum speed - orange/red tones
      speedValueEl.className = speedValueEl.className.replace(
        /bg-gradient-to-b from-\w+-\d+ via-\w+-\d+ to-\w+-\d+/,
        'bg-gradient-to-b from-orange-200 via-red-400 to-red-600'
      );
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
      <div id="${messageId}" class="bg-gradient-to-br from-purple-900/75 via-blue-900/65 to-indigo-900/65 backdrop-blur rounded-lg px-6 py-2 mb-2 border border-white/20">
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