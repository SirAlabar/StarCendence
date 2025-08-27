
import { BaseComponent } from '../../../components/BaseComponent';
import { AVAILABLE_PODS, PodConfig, getPodById } from '../../utils/PodConfig';

export interface PodSelectionEvent {
  selectedPod: PodConfig;
  onConfirm: () => void;
}

// Map pod IDs to their corresponding MP4 video files
const POD_VIDEOS: { [podId: string]: string } = {
  'anakin_classic': 'assets/images/pods/anakin_pod1.mp4',    // Anakin's classic podracer
  'anakin_galaxies': 'assets/images/pods/anakin_pod2.mp4',   // Star Wars Galaxies Anakin
  'ben_quadinaros': 'assets/images/pods/ben_pod.mp4',        // Ben Quadinaros podracer
  'ebe_endecotts': 'assets/images/pods/ebe_pod.mp4',          // Ebe Endocott podracer
  'red_menace': 'assets/images/pods/red_pod.mp4',              // Mars Guo red podracer
  'space_racer': 'assets/images/pods/space_pod.mp4'      // Teemto Pagalies space podracer
};

export class PodSelection extends BaseComponent 
{
  private selectedPodId: string = 'anakin_classic';
  private onPodSelected?: (event: PodSelectionEvent) => void;

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
    
        <div class="pod-selection-overlay fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 z-50 flex items-center justify-center">
        <div class="max-w-4xl w-full p-8">
          
          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-white mb-2">Choose Your Podracer</h1>
            <p class="text-gray-300">Select your racing machine</p>
          </div>

          <!-- Pod Grid -->
          <div class="grid grid-cols-3 gap-6 mb-8">
            ${this.renderPodCards()}
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-between items-center">
            <button 
              onclick="navigateTo('/games')"
              class="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            
            <button 
              onclick="podSelection.confirmSelection()"
              class="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-bold"
            >
              Start Racing!
            </button>
          </div>

        </div>
      </div>
    `;
  }

  private renderPodCards(): string 
  {
    return AVAILABLE_PODS.map(pod => 
    {
      const videoPath = POD_VIDEOS[pod.id];
      
      return `
        <div class="pod-card bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:bg-gray-700 hover:scale-105 ${
          this.selectedPodId === pod.id ? 'ring-4 ring-purple-500 bg-purple-900/30' : ''
        }" 
        onclick="podSelection.selectPod('${pod.id}')">
          
          <!-- Pod Video Preview -->
          <div class="relative h-32 bg-gray-900">
            <video 
              id="video-${pod.id}"
              class="w-full h-full object-cover"
              muted
              loop
              preload="metadata"
              ${this.selectedPodId === pod.id ? 'autoplay' : ''}
            >
            >
            >
              <source src="${videoPath}" type="video/mp4">
              <!-- Fallback for browsers that don't support video -->
              <div class="w-full h-full bg-gray-700 flex items-center justify-center">
                <div class="text-4xl">🏎️</div>
              </div>
            </video>
            
            <!-- Play indicator overlay -->
            <div class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div class="bg-black/50 rounded-full p-2">
                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 5v10l8-5-8-5z"/>
                </svg>
              </div>
            </div>

            <!-- Selection indicator -->
            ${this.selectedPodId === pod.id ? `
              <div class="absolute top-2 right-2">
                <div class="bg-purple-500 text-white rounded-full p-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                  </svg>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Pod Info -->
          <div class="p-4">
            <div class="text-center">
              <h3 class="text-white font-bold text-lg mb-1">${pod.name}</h3>
              <p class="text-gray-400 text-sm mb-2">${pod.pilot}</p>
              

            </div>

            <!-- Selection Status -->
            ${this.selectedPodId === pod.id ? `
              <div class="text-center mt-3">
                <span class="text-purple-400 text-sm font-bold">✓ SELECTED</span>
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
  }

  selectPod(podId: string): void 
  {
    // Stop video from previously selected pod
    if (this.selectedPodId && POD_VIDEOS[this.selectedPodId]) 
    {
      const oldVideo = document.getElementById(`video-${this.selectedPodId}`) as HTMLVideoElement;
      if (oldVideo) 
      {
        oldVideo.pause();
        oldVideo.currentTime = 0;
      }
    }
    
    // Update selected pod
    this.selectedPodId = podId;
    
    // Start video for newly selected pod
    if (POD_VIDEOS[podId]) 
    {
      const newVideo = document.getElementById(`video-${podId}`) as HTMLVideoElement;
      if (newVideo) 
      {
        newVideo.play().catch(() => {
          // Ignore autoplay restrictions
        });
      }
    }
    
    // Re-render the entire selection UI
    const container = document.querySelector('.pod-selection-overlay');
    if (container) 
    {
      container.innerHTML = this.render().replace('<div class="pod-selection-overlay fixed inset-0 bg-black/90 z-50 flex items-center justify-center">', '').slice(0, -6);
      this.mount();
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
    if ((window as any).podSelection === this) 
    {
      delete (window as any).podSelection;
    }
  }
}