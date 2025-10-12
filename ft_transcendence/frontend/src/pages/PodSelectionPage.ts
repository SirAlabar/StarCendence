import { BaseComponent } from '../components/BaseComponent';
import { AVAILABLE_PODS, SECRET_POD, PodConfig, getPodById } from '../game/utils/PodConfig';

export interface PodSelectionEvent {
  selectedPod: PodConfig;
  onConfirm: () => void;
}

// Map pod IDs to their corresponding MP4 video files or PNG images
const POD_VIDEOS: { [podId: string]: string } = {
  'anakin_classic': 'assets/images/pods/anakin_pod1.mp4',
  'anakin_galaxies': 'assets/images/pods/anakin_pod2.mp4',
  'ben_quadinaros': 'assets/images/pods/ben_pod.mp4',
  'ebe_endecotts': 'assets/images/pods/ebe_pod.mp4',
  'red_menace': 'assets/images/pods/red_pod.mp4',
  'space_racer': 'assets/images/pods/space_pod.mp4',
  'ph-qw-4l-ec-ro-nx': 'assets/images/pods/ph-qw-4l-ec-ro-nx.png'
};

export class PodSelection extends BaseComponent 
{
  private selectedPodId: string = 'anakin_classic';
  private onPodSelected?: (event: PodSelectionEvent) => void;
  
  // Secret unlock system
  private clickedPods: Set<string> = new Set();
  private secretSequence: string[] = ['d', 's', 't', 'a', 'r', 'ArrowUp', 'ArrowDown'];
  private currentSequence: string[] = [];
  private secretUnlocked: boolean = false;
  private sequenceTimeout: number | null = null;

  constructor(onPodSelected?: (event: PodSelectionEvent) => void) 
  {
    super();
    this.onPodSelected = onPodSelected;
  }

  getSelectedPod(): PodConfig | undefined 
  {
    return getPodById(this.selectedPodId);
  }

  render(): string 
  {
    return `
      <div class="pod-selection-overlay fixed inset-0 z-50 flex items-center justify-center neon-background">
        <div class="max-w-4xl w-full p-8">
          
          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-white mb-2 glow-text">Choose Your Podracer</h1>
            <p class="text-gray-300">Select your racing machine</p>
          </div>

          <!-- Pod Grid Container com Scroll -->
          <div class="flex-1 mb-8 px-4 overflow-visible">
            <div class="grid grid-cols-2 md:grid-cols-3 gap-8 mx-auto w-full max-w-6xl overflow-visible">
              ${this.renderPodCards()}
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-between items-center flex-shrink-0 px-4 max-w-4xl mx-auto w-full">
            <button 
              onclick="navigateTo('/games')"
              class="neon-button-secondary px-6 py-3 rounded-lg transition-all duration-300"
            >
              Cancel
            </button>
            
            <!-- Secret Pod Container (initially hidden) -->
            <div id="secretPodContainer" class="secret-pod-container" style="display: none;">
            </div>
            
            <button 
              onclick="podSelection.confirmSelection()"
              class="neon-button-primary px-8 py-3 rounded-lg font-bold transition-all duration-300"
            >
              Start Racing!
            </button>
          </div>

        </div>

        <style>
          /* Secret Pod Container */
          .secret-pod-container {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
          }

          /* Custom Scrollbar */
          .overflow-y-auto::-webkit-scrollbar {
            width: 8px;
          }

          .overflow-y-auto::-webkit-scrollbar-track {
            background: rgba(31, 41, 55, 0.5);
            border-radius: 4px;
          }

          .overflow-y-auto::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
            border-radius: 4px;
          }

          .overflow-y-auto::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #9333ea 0%, #db2777 100%);
          }

          /* Secret Pod Reveal Animation */
          @keyframes secretReveal {
            0% {
              opacity: 0;
              transform: scale(0.3) translateY(100px);
            }
            50% {
              opacity: 1;
              transform: scale(1.1) translateY(0);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          .secret-reveal-animation {
            animation: secretReveal 1s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          /* Secret Pod Card Styling */
          .secret-pod-card {
            background: linear-gradient(145deg, 
              rgba(168, 85, 247, 0.2) 0%, 
              rgba(59, 130, 246, 0.2) 100%);
            border: 2px solid transparent;
            background-clip: padding-box;
            position: relative;
            box-shadow: 
              0 0 30px rgba(168, 85, 247, 0.6),
              0 0 60px rgba(99, 234, 254, 0.4),
              inset 0 0 30px rgba(168, 85, 247, 0.2);
          }

          .secret-pod-card::before {
            content: '';
            position: absolute;
            inset: -2px;
            background: linear-gradient(45deg, 
              #a855f7, #63eafe, #ec4899, #a855f7);
            border-radius: inherit;
            z-index: -1;
            animation: secretBorderRotate 3s linear infinite;
          }

          @keyframes secretBorderRotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .secret-pod-card:hover {
            transform: scale(1.05);
            box-shadow: 
              0 0 40px rgba(168, 85, 247, 0.8),
              0 0 80px rgba(99, 234, 254, 0.6),
              inset 0 0 40px rgba(168, 85, 247, 0.3);
          }

          /* Neon background  */
          .pod-selection-overlay {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 50;
          }

          .neon-background {
            background: linear-gradient(135deg, 
              #0a0a1a 0%, 
              #0d1326 25%, 
              #0b0f24 50%, 
              #141233 75%, 
              #1b1760 100%);
            position: relative;
            overflow: hidden;
            flex: 1;
          }

          .neon-background::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image: var(--star-gradients), var(--star-gradients);
            background-repeat: repeat-x;
            background-size: 200vw 100vh, 200vw 100vh;
            background-position: 0% 0%, 200% 0%;
            animation: stars-scroll 25s linear infinite,
            stars-pulse 3s ease-in-out infinite alternate;
            z-index: -10;
          }

          @keyframes stars-scroll {
            0% {
              background-position: 0% 0%, 200% 0%;
            }
            100% {
              background-position: -200% 0%, 0% 0%;
            }
          }

          @keyframes stars-pulse {
            0%   { opacity: 0.5; }
            100% { opacity: 1; }
          }

          /* Glowing text effect */
          .glow-text {
            text-shadow: 0 0 20px #63eafe, 0 0 40px #63eafe, 0 0 60px #63eafe;
            animation: text-glow 3s ease-in-out infinite alternate;
          }

          @keyframes text-glow {
            0% { text-shadow: 0 0 20px #63eafe, 0 0 40px #63eafe, 0 0 60px #63eafe; }
            100% { text-shadow: 0 0 30px #a855f7, 0 0 60px #a855f7, 0 0 90px #a855f7; }
          }

          /* Enhanced pod cards */
          .pod-card {
            background: linear-gradient(145deg, 
              rgba(55, 65, 81, 0.9) 0%, 
              rgba(31, 41, 55, 0.9) 100%);
            border: 1px solid rgba(168, 85, 247, 0.3);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
          }

          .pod-card:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 
              0 10px 30px rgba(168, 85, 247, 0.3),
              0 0 20px rgba(99, 234, 254, 0.2);
            border-color: rgba(168, 85, 247, 0.6);
          }

          /* Orbital glow effect for selected pod */
          .pod-card.selected {
            border: 1px solid rgba(59, 130, 246, 0.3);
            background: linear-gradient(145deg, 
              rgba(55, 65, 81, 0.9) 0%, 
              rgba(31, 41, 55, 0.9) 100%);
            animation: orbital-glow-shadow 3s linear infinite;
          }

          @keyframes orbital-glow-shadow {
            0% { box-shadow: 0 0 5px #3b82f6, 0 0 10px #3b82f6, 0 0 15px #3b82f6, inset 0 0 5px rgba(59, 130, 246, 0.1); }
            20% { box-shadow: 0 0 5px #63eafe, 0 0 10px #63eafe, 0 0 15px #63eafe, inset 0 0 5px rgba(99, 234, 254, 0.1); }
            40% { box-shadow: 0 0 5px #1d4ed8, 0 0 10px #1d4ed8, 0 0 15px #1d4ed8, inset 0 0 5px rgba(29, 78, 216, 0.1); }
            60% { box-shadow: 0 0 5px #0ea5e9, 0 0 10px #0ea5e9, 0 0 15px #0ea5e9, inset 0 0 5px rgba(14, 165, 233, 0.1); }
            80% { box-shadow: 0 0 5px #a855f7, 0 0 10px #a855f7, 0 0 15px #a855f7, inset 0 0 5px rgba(168, 85, 247, 0.1); }
            100% { box-shadow: 0 0 5px #3b82f6, 0 0 10px #3b82f6, 0 0 15px #3b82f6, inset 0 0 5px rgba(59, 130, 246, 0.1); }
          }

          /* Enhanced buttons */
          .neon-button-primary {
            background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
            color: white;
            border: none;
            box-shadow: 
              0 0 20px rgba(168, 85, 247, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }

          .neon-button-primary:hover {
            background: linear-gradient(135deg, #9333ea 0%, #db2777 100%);
            box-shadow: 
              0 0 30px rgba(168, 85, 247, 0.6),
              0 0 50px rgba(236, 72, 153, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }

          .neon-button-secondary {
            background: linear-gradient(135deg, 
              rgba(55, 65, 81, 0.8) 0%, 
              rgba(31, 41, 55, 0.8) 100%);
            color: #d1d5db;
            border: 1px solid rgba(99, 234, 254, 0.3);
            backdrop-filter: blur(10px);
          }

          .neon-button-secondary:hover {
            background: linear-gradient(135deg, 
              rgba(99, 234, 254, 0.1) 0%, 
              rgba(59, 130, 246, 0.1) 100%);
            border-color: rgba(99, 234, 254, 0.6);
            color: white;
            box-shadow: 0 0 20px rgba(99, 234, 254, 0.3);
            transform: translateY(-2px);
          }

          /* Video container enhancements */
          .video-container {
            position: relative;
            background: linear-gradient(45deg, 
              rgba(99, 234, 254, 0.1) 0%, 
              rgba(168, 85, 247, 0.1) 100%);
          }

          .video-container::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
            transform: translateX(-100%);
            animation: shimmer 3s infinite;
          }

          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          /* Selection indicator glow */
          .selection-indicator {
            animation: indicator-color-sync 3s linear infinite;
          }

          @keyframes indicator-color-sync {
            0% { background: #3b82f6; box-shadow: 0 0 20px #3b82f6, 0 0 40px #3b82f6; }
            20% { background: #63eafe; box-shadow: 0 0 20px #63eafe, 0 0 40px #63eafe; }
            40% { background: #1d4ed8; box-shadow: 0 0 20px #1d4ed8, 0 0 40px #1d4ed8; }
            60% { background: #0ea5e9; box-shadow: 0 0 20px #0ea5e9, 0 0 40px #0ea5e9; }
            80% { background: #a855f7; box-shadow: 0 0 20px #a855f7, 0 0 40px #a855f7; }
            100% { background: #3b82f6; box-shadow: 0 0 20px #3b82f6, 0 0 40px #3b82f6; }
          }

          .selected-status {
            font-weight: bold;
            animation: status-color-sync 3s linear infinite;
          }

          @keyframes status-color-sync {
            0% { 
              color: #3b82f6;
              text-shadow: 0 0 10px #3b82f6, 0 0 20px #3b82f6;
            }
            20% { 
              color: #63eafe;
              text-shadow: 0 0 10px #63eafe, 0 0 20px #63eafe;
            }
            40% { 
              color: #1d4ed8;
              text-shadow: 0 0 10px #1d4ed8, 0 0 20px #1d4ed8;
            }
            60% { 
              color: #0ea5e9;
              text-shadow: 0 0 10px #0ea5e9, 0 0 20px #0ea5e9;
            }
            80% { 
              color: #a855f7;
              text-shadow: 0 0 10px #a855f7, 0 0 20px #a855f7;
            }
            100% { 
              color: #3b82f6;
              text-shadow: 0 0 10px #3b82f6, 0 0 20px #3b82f6;
            }
          }
        </style>
      </div>
    `;
  }

  private renderPodCards(): string 
  {
    return AVAILABLE_PODS.map(pod => 
    {
      const videoPath = POD_VIDEOS[pod.id];
      
      return `
          <div class="pod-card rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.04] ${
            this.selectedPodId === pod.id ? 'selected' : ''
          }" 
          onclick="podSelection.selectPod('${pod.id}')">

          <!-- Pod Video Preview -->
          <div class="video-container relative h-32 bg-gray-900">
            <video 
              id="video-${pod.id}"
              class="w-full h-full object-cover"
              muted
              loop
              preload="metadata"
              ${this.selectedPodId === pod.id ? 'autoplay' : ''}
            >
              <source src="${videoPath}" type="video/mp4">
              <div class="w-full h-full bg-gray-700 flex items-center justify-center">
                <div class="text-4xl">🎮</div>
              </div>
            </video>
            
            <div class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div class="bg-black/50 rounded-full p-2">
                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 5v10l8-5-8-5z"/>
                </svg>
              </div>
            </div>

            ${this.selectedPodId === pod.id ? `
              <div class="absolute top-2 right-2">
                <div class="selection-indicator text-white rounded-full p-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                  </svg>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="p-4">
            <div class="text-center">
              <h3 class="text-white font-bold text-lg mb-1">${pod.name}</h3>
              <p class="text-gray-400 text-sm mb-2">${pod.pilot}</p>
            </div>

            ${this.selectedPodId === pod.id ? `
              <div class="text-center mt-3">
                <span class="selected-status text-sm font-bold">✓ SELECTED</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  mount(_containerId?: string): void 
  {
    (window as any).podSelection = this;
    this.generateStars();
    this.initializeSecretUnlock();
  }

  private generateStars(): void 
  {
    const starColors = ['#ffffff', '#fffacd', '#87ceeb', '#ffb6c1'];
    const numStars = 120;
    const gradients: string[] = [];

    for (let i = 0; i < numStars; i++) 
    {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const size = Math.random() * 8 + 1;
      const color = starColors[Math.floor(Math.random() * starColors.length)];
      gradients.push(`radial-gradient(${size}px ${size}px at ${x}% ${y}%, ${color}, transparent)`);
    }

    document.documentElement.style.setProperty('--star-gradients', gradients.join(', '));
  }

  private initializeSecretUnlock(): void 
  {
    document.addEventListener('keydown', this.handleSecretKeyPress.bind(this));
  }

  private handleSecretKeyPress(e: KeyboardEvent): void 
  {
    if (this.secretUnlocked)
    {
      return;
    }

    // Check if all pods have been clicked
    if (this.clickedPods.size < AVAILABLE_PODS.length) 
    {
      return;
    }

    // Handle arrow keys differently
    const key = e.key.startsWith('Arrow') ? e.key : e.key.toLowerCase();
    
    // Add to current sequence
    this.currentSequence.push(key);

    if (this.currentSequence.length > this.secretSequence.length) 
    {
      this.currentSequence.shift();
    }

    // Check if the last N keys match the secret sequence
    if (this.currentSequence.length === this.secretSequence.length) 
    {
      const matches = this.currentSequence.every((key, index) => 
        key === this.secretSequence[index]
      );

      if (matches) 
      {
        this.unlockSecretPod();
      }
    }
  }

  private unlockSecretPod(): void 
  {
    if (this.secretUnlocked) 
    {
      return;
    }

    this.secretUnlocked = true;
    const container = document.getElementById('secretPodContainer');
    if (!container) 
    {
      return;
    }

    const imagePath = POD_VIDEOS[SECRET_POD.id];
    
    container.innerHTML = `
      <div class="secret-pod-card rounded-lg overflow-hidden cursor-pointer transition-all duration-300 w-64 secret-reveal-animation"
           onclick="podSelection.selectPod('${SECRET_POD.id}')">
        
        <div class="video-container relative h-40 bg-gray-900">
          <img 
            src="${imagePath}"
            class="w-full h-full object-cover"
            alt="${SECRET_POD.name}"
          />
          
          ${this.selectedPodId === SECRET_POD.id ? `
            <div class="absolute top-2 right-2">
              <div class="selection-indicator text-white rounded-full p-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                </svg>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="p-3">
          <div class="text-center">
            <h3 class="text-white font-bold text-base mb-1" style="text-shadow: 0 0 10px #63eafe, 0 0 20px #63eafe;">${SECRET_POD.name}</h3>
            <p class="text-yellow-400 text-sm mb-2 font-semibold" style="text-shadow: 0 0 10px #fbbf24, 0 0 20px #fbbf24;">${SECRET_POD.pilot}</p>
            <span class="text-white text-xs font-bold" style="text-shadow: 0 0 10px #63eafe, 0 0 20px #63eafe;">⭐ SECRET</span>
          </div>

          ${this.selectedPodId === SECRET_POD.id ? `
            <div class="text-center mt-2">
              <span class="selected-status text-xs font-bold">✓ SELECTED</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    container.style.display = 'block';
  }

  selectPod(podId: string): void 
  {
    // Track clicked pods for secret unlock
    if (!this.secretUnlocked && AVAILABLE_PODS.find(p => p.id === podId)) 
    {
      this.clickedPods.add(podId);
    }

    // Remove old selection
    if (this.selectedPodId) 
    {
      const oldCard = document.querySelector(`.pod-card.selected, .secret-pod-card.selected`);
      if (oldCard) 
      {
        oldCard.classList.remove('selected');

        const status = oldCard.querySelector('.selected-status');
        if (status) status.remove();

        const check = oldCard.querySelector('.selection-indicator');
        if (check && check.parentElement) check.parentElement.remove();
      }

      const oldVideo = document.getElementById(`video-${this.selectedPodId}`) as HTMLVideoElement;
      if (oldVideo) 
      {
        oldVideo.pause();
        oldVideo.currentTime = 0;
      }
    }

    // Set new selection
    this.selectedPodId = podId;
    
    // Handle secret pod selection
    if (podId === SECRET_POD.id) 
    {
      const secretCard = document.querySelector(`.secret-pod-card`);
      if (secretCard) 
      {
        secretCard.classList.add('selected');
        
        const info = secretCard.querySelector('.p-3 .text-center');
        if (info) 
        {
          const statusDiv = document.createElement('div');
          statusDiv.className = "text-center mt-2";
          statusDiv.innerHTML = `<span class="selected-status text-xs font-bold">✓ SELECTED</span>`;
          info.appendChild(statusDiv);
        }

        const videoContainer = secretCard.querySelector('.video-container');
        if (videoContainer) 
        {
          const checkDiv = document.createElement('div');
          checkDiv.className = "absolute top-2 right-2";
          checkDiv.innerHTML = `
            <div class="selection-indicator text-white rounded-full p-1">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
              </svg>
            </div>
          `;
          videoContainer.appendChild(checkDiv);
        }
      }
    } 
    else 
    {
      const newCard = document.querySelector(`.pod-card[onclick*="${podId}"]`);
      if (newCard) 
      {
        newCard.classList.add('selected');

        const info = newCard.querySelector('.p-4 .text-center');
        if (info) 
        {
          const statusDiv = document.createElement('div');
          statusDiv.className = "text-center mt-3";
          statusDiv.innerHTML = `<span class="selected-status text-sm font-bold">✓ SELECTED</span>`;
          info.appendChild(statusDiv);
        }

        const videoContainer = newCard.querySelector('.video-container');
        if (videoContainer) 
        {
          const checkDiv = document.createElement('div');
          checkDiv.className = "absolute top-2 right-2";
          checkDiv.innerHTML = `
            <div class="selection-indicator text-white rounded-full p-1">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
              </svg>
            </div>
          `;
          videoContainer.appendChild(checkDiv);
        }
      }

      const newVideo = document.getElementById(`video-${podId}`) as HTMLVideoElement;
      if (newVideo) 
      {
        newVideo.play().catch(() => { });
      }
    }
  }

  confirmSelection(): void 
  {
    const selectedPod = this.getSelectedPod();
    if (!selectedPod || !this.onPodSelected) 
    {
      return;
    }

    this.onPodSelected({
      selectedPod,
      onConfirm: () => 
      {
        const overlay = document.querySelector('.pod-selection-overlay') as HTMLElement;
        if (overlay) 
        {
          overlay.style.display = 'none';
        }
      }
    });
  }

  show(): void 
  {
    const overlay = document.querySelector('.pod-selection-overlay') as HTMLElement;
    if (overlay) 
    {
      overlay.style.display = 'flex';
    }
  }

  dispose(): void 
  {
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
    }
    
    document.removeEventListener('keydown', this.handleSecretKeyPress.bind(this));
    
    if ((window as any).podSelection === this) 
    {
      delete (window as any).podSelection;
    }
  }
}