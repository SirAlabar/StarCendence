// Pod Selection UI

import { BaseComponent } from '../../../components/BaseComponent';
import { AVAILABLE_PODS, PodConfig, getPodById } from '../../utils/PodConfig';

export interface PodSelectionEvent 
{
  selectedPod: PodConfig;
  onConfirm: () => void;
}

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
      <div class="pod-selection-overlay fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <div class="max-w-4xl w-full p-8">
          
          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-white mb-2">🏎️ Choose Your Podracer</h1>
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
              Start Racing! 🏁
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
      return `
        <div class="pod-card bg-gray-800 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-gray-700 hover:scale-105 ${
          this.selectedPodId === pod.id ? 'ring-2 ring-purple-500 bg-purple-900/30' : ''
        }" onclick="podSelection.selectPod('${pod.id}')">
          
          <!-- Pod Visual -->
          <div class="h-24 bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
            <div class="text-4xl">🏎️</div>
          </div>

          <!-- Pod Info -->
          <div class="text-center">
            <h3 class="text-white font-bold mb-1">${pod.name}</h3>
            <p class="text-gray-400 text-sm">${pod.pilot}</p>
          </div>

          <!-- Selection Check -->
          ${this.selectedPodId === pod.id ? `
            <div class="text-center mt-2">
              <span class="text-purple-400 text-xl">✓ Selected</span>
            </div>
          ` : ''}
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
    this.selectedPodId = podId;
    
    // Re-render
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