// Pod Configuration - Visual selection only

export interface PodConfig 
{
  id: string;
  name: string;
  pilot: string;
  modelPath: string;
}


export const AVAILABLE_PODS: PodConfig[] = [
  {
    id: 'anakin_classic',
    name: "Anakin's Podracer",
    pilot: 'Anakin Skywalker',
    modelPath: '/assets/models/racer/anakin_pod_racer.glb'
  },
  {
    id: 'anakin_galaxies',
    name: "Anakin's Galaxies",
    pilot: 'Anakin Skywalker', 
    modelPath: '/assets/models/racer/star_wars_galaxies_-_anakins_podracer.glb'
  },
  {
    id: 'ben_quadinaros',
    name: "Ben's Racer",
    pilot: 'Ben Quadinaros',
    modelPath: '/assets/models/racer/ben_quadinaros_podracer.glb'
  },
  {
    id: 'ebe_endecotts',
    name: "Ebe's Racer", 
    pilot: 'Ebe E. Endecott',
    modelPath: '/assets/models/racer/ebe_e_endecotts_pod_racer.glb'
  },
  {
    id: 'red_menace',
    name: "Red Menace",
    pilot: 'Sebulba',
    modelPath: '/assets/models/racer/spaceship_clipper_v2_-_red_menace.glb'
  },
  {
    id: 'space_racer',
    name: "Space Racer",
    pilot: 'Dud Bolt',
    modelPath: '/assets/models/racer/racer_space_ship_model.glb'
  }
];

// Simple helper to get pod by ID
export function getPodById(id: string): PodConfig | undefined 
{
  return AVAILABLE_PODS.find(pod => pod.id === id);
}

// Default pod
export const DEFAULT_POD = AVAILABLE_PODS[0];