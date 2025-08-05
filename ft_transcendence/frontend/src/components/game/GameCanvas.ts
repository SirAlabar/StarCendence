//  3D game rendering canvas

// frontend/src/components/game/GameCanvas.ts
// Basic Babylon.js Scene for Pod Racer

import { 
    Engine, 
    Scene, 
    ArcRotateCamera, 
    HemisphericLight, 
    DirectionalLight,
    Vector3, 
    Color3,
    AbstractMesh,
    ImportMeshAsync
  } from '@babylonjs/core';
  import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic';
  
  export class GameCanvas 
  {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;
    private camera!: ArcRotateCamera;
    private podRacer: AbstractMesh | null = null;
  
    constructor(canvasId: string) 
    {
      // Register modern Babylon.js loaders (dynamic imports)
      registerBuiltInLoaders();
  
      // Get canvas element
      this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!this.canvas) 
      {
        throw new Error(`Canvas with id '${canvasId}' not found`);
      }
  
      // Initialize Babylon.js
      this.engine = new Engine(this.canvas, true);
      this.scene = new Scene(this.engine);
      
      this.setupCamera();
      this.setupLighting();
      this.loadPodRacer();
      
      // Start render loop
      this.engine.runRenderLoop(() => 
      {
        this.scene.render();
      });
  
      // Handle window resize
      window.addEventListener('resize', () => 
      {
        this.engine.resize();
      });
    }
  
    private setupCamera(): void 
    {
      // Arc Rotate Camera (good for viewing models)
      this.camera = new ArcRotateCamera(
        'camera', 
        -Math.PI / 2,  // Alpha (horizontal rotation)
        Math.PI / 3,   // Beta (vertical rotation) 
        10,            // Radius (distance from target)
        Vector3.Zero(), // Target position
        this.scene
      );
  
      // Attach camera controls to canvas
      this.camera.attachControl(this.canvas, true);
      
      // Set camera limits
      this.camera.lowerRadiusLimit = 5;
      this.camera.upperRadiusLimit = 20;
      this.camera.lowerBetaLimit = 0.1;
      this.camera.upperBetaLimit = Math.PI / 2;
    }
  
    private setupLighting(): void 
    {
      // Hemisphere light (ambient lighting)
      const hemiLight = new HemisphericLight(
        'hemiLight', 
        new Vector3(0, 1, 0), 
        this.scene
      );
      hemiLight.intensity = 0.6;
      hemiLight.diffuse = new Color3(1, 1, 1);
  
      // Directional light (sun-like lighting)
      const dirLight = new DirectionalLight(
        'dirLight', 
        new Vector3(-1, -1, -1), 
        this.scene
      );
      dirLight.intensity = 0.8;
      dirLight.diffuse = new Color3(1, 0.95, 0.8); // Warm light
    }
  
    private async loadPodRacer(): Promise<void> 
    {
      try 
      {
        console.log('Loading Anakin pod racer...');
        
        // Load Anakin's pod racer using modern module-level function
        const result = await ImportMeshAsync(
          '/assets/models/racer/anakin_pod_racer.glb', 
          this.scene
        );
  
        if (result.meshes.length > 0) 
        {
          this.podRacer = result.meshes[0];
          
          // Center the model
          this.podRacer.position = Vector3.Zero();
          
          // Scale if needed (adjust as necessary)
          this.podRacer.scaling = new Vector3(1, 1, 1);
          
          console.log('Pod racer loaded successfully!');
          console.log(`Loaded ${result.meshes.length} meshes`);
          
          // Focus camera on the pod racer
          this.camera.setTarget(this.podRacer.position);
        } 
        else 
        {
          console.warn('No meshes found in pod racer model');
        }
  
      } 
      catch (error) 
      {
        console.error('Error loading pod racer:', error);
        
        // Fallback: Create a simple box as placeholder
        console.log('Creating placeholder box...');
        const { CreateBox } = await import('@babylonjs/core');
        this.podRacer = CreateBox('podRacerPlaceholder', { size: 2 }, this.scene);
        this.podRacer.position = Vector3.Zero();
      }
    }
  
    // Render method - called by component mounting
    public render(): string 
    {
      return `
        <div class="game-canvas-container">
          <canvas 
            id="gameCanvas" 
            class="w-full h-full"
            style="width: 100%; height: 100vh; display: block;"
          ></canvas>
          <div class="loading-overlay" id="loadingOverlay" style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            pointer-events: none;
          ">
            Loading Pod Racer...
          </div>
        </div>
      `;
    }
  
    // Mount method - initialize Babylon.js after DOM is ready
    public mount(_containerId?: string): void 
    {
      // Hide loading overlay after scene is ready
      setTimeout(() => 
      {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) 
        {
          overlay.style.display = 'none';
        }
      }, 2000);
    }
  
    // Cleanup method
    public dispose(): void 
    {
      if (this.scene) 
      {
        this.scene.dispose();
      }
      if (this.engine) 
      {
        this.engine.dispose();
      }
      window.removeEventListener('resize', () => 
      {
        this.engine.resize();
      });
    }
  
    // Get scene (for future extensions)
    public getScene(): Scene 
    {
      return this.scene;
    }
  
    // Get pod racer mesh (for future extensions)
    public getPodRacer(): AbstractMesh | null 
    {
      return this.podRacer;
    }
  }