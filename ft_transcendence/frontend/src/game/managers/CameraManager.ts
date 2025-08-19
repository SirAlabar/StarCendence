// Camera management system with Player Camera and Pod Following

import { GameCanvas } from '../../components/game/GameCanvas';
import { Vector3, Scene, Camera, ArcRotateCamera, FreeCamera } from '@babylonjs/core';
import { RacerPod } from '../../game/engines/racer/RacerPods';

export enum CameraMode 
{
  RACING = 'racing',        // ArcRotate camera for track overview
  FREE = 'free',           // FreeCamera for development/exploration
  PLAYER = 'player'        // ArcRotateCamera following the pod
}

export interface CameraInfo 
{
  mode: CameraMode;
  name: string;
  description: string;
}

export class CameraManager 
{
  private gameCanvas: GameCanvas;
  private scene: Scene;
  private currentMode: CameraMode;
  
  // Babylon.js cameras
  private racingCamera: ArcRotateCamera | null = null;
  private freeCamera: FreeCamera | null = null;
  private playerCamera: ArcRotateCamera | null = null;
  
  // Player pod reference
  private playerPod: RacerPod | null = null;
  
  // Track bounds for camera positioning
  private trackBounds: { min: Vector3; max: Vector3; size: Vector3 } | null = null;
  
  // Render loop registration
  private beforeRenderObserver: any = null;

  constructor(gameCanvas: GameCanvas) 
  {
    this.gameCanvas = gameCanvas;
    this.scene = gameCanvas.getScene()!;
    this.currentMode = CameraMode.RACING;
    
    this.setupCameras();
    console.log('📹 CameraManager initialized with Babylon.js cameras');
  }

  // Setup all Babylon.js cameras
  private setupCameras(): void 
  {
    // 1. Racing Camera (Overview of track)
    this.racingCamera = new ArcRotateCamera(
      "racingCamera",
      -Math.PI / 2,    // alpha
      Math.PI / 4,     // beta  
      50,              // radius
      Vector3.Zero(),  // target
      this.scene
    );
    this.racingCamera.lowerRadiusLimit = 10;
    this.racingCamera.upperRadiusLimit = 100;
    this.racingCamera.lowerBetaLimit = 0.1;
    this.racingCamera.upperBetaLimit = Math.PI / 2;

    // 2. Free Camera (Development/exploration)
    this.freeCamera = new FreeCamera(
      "freeCamera", 
      new Vector3(0, 20, 30), 
      this.scene
    );
    this.freeCamera.setTarget(Vector3.Zero());

    // 3. Player Camera (Following pod) - Created when pod is set
    this.createPlayerCamera();

    console.log('📹 All Babylon.js cameras created');
  }

  // Create player camera (follows pod)
  private createPlayerCamera(): void 
  {
    this.playerCamera = new ArcRotateCamera(
      "playerCamera",
      -Math.PI / 2,          // alpha (behind pod)
      Math.PI / 3,           // beta (above pod)
      10,                    // radius (distance from pod)
      Vector3.Zero(),        // target (will be pod position)
      this.scene
    );
    
    // Camera limits
    this.playerCamera.lowerRadiusLimit = 5;
    this.playerCamera.upperRadiusLimit = 25;
    this.playerCamera.lowerBetaLimit = 0.1;
    this.playerCamera.upperBetaLimit = Math.PI / 2;
    
    // Smooth camera movement
    this.playerCamera.inertia = 0.9;
    this.playerCamera.angularSensibilityX = 1000;
    this.playerCamera.angularSensibilityY = 1000;
  }

  // ===== CAMERA SWITCHING =====

  public switchToMode(mode: CameraMode): void 
  {
    if (this.currentMode === mode) 
    {
      console.log(`📹 Already in ${mode} camera mode`);
      return;
    }

    console.log(`📹 Switching from ${this.currentMode} to ${mode} camera`);

    // Detach current camera
    this.detachCurrentCamera();

    // Switch to new camera
    switch (mode) 
    {
      case CameraMode.RACING:
        this.activateRacingCamera();
        break;
      case CameraMode.FREE:
        this.activateFreeCamera();
        break;
      case CameraMode.PLAYER:
        this.activatePlayerCamera();
        break;
    }

    this.currentMode = mode;
    console.log(`📹 ✅ Switched to ${this.getCameraInfo(mode).name}`);
  }

  public cycleCameraMode(): void 
  {
    const modes = [CameraMode.RACING, CameraMode.FREE, CameraMode.PLAYER];
    const currentIndex = modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.switchToMode(modes[nextIndex]);
  }

  // ===== CAMERA ACTIVATION =====

  private activateRacingCamera(): void 
  {
    if (!this.racingCamera) return;

    // Position camera based on track bounds
    if (this.trackBounds) 
    {
      const trackCenter = this.trackBounds.min.add(this.trackBounds.max).scale(0.5);
      const cameraDistance = Math.max(this.trackBounds.size.x, this.trackBounds.size.z) * 0.8;
      
      this.racingCamera.setTarget(trackCenter);
      this.racingCamera.radius = cameraDistance;
    }

    // Set as active camera
    this.scene.activeCamera = this.racingCamera;
    this.racingCamera.attachControl(this.gameCanvas.getCanvas()!, true);
  }

  private activateFreeCamera(): void 
  {
    if (!this.freeCamera) return;

    // Set as active camera
    this.scene.activeCamera = this.freeCamera;
    this.freeCamera.attachControl(this.gameCanvas.getCanvas()!, true);
  }

  private activatePlayerCamera(): void 
  {
    if (!this.playerCamera) return;

    // Set as active camera
    this.scene.activeCamera = this.playerCamera;
    this.playerCamera.attachControl(this.gameCanvas.getCanvas()!, true);

    // Setup pod following if pod exists
    if (this.playerPod) 
    {
      this.setupPodFollowing();
    }
  }

  private detachCurrentCamera(): void 
  {
    if (this.scene.activeCamera) 
    {
      this.scene.activeCamera.detachControl(this.gameCanvas.getCanvas()!);
    }

    // Remove any existing render observers
    if (this.beforeRenderObserver) 
    {
      this.scene.unregisterBeforeRender(this.beforeRenderObserver);
      this.beforeRenderObserver = null;
    }
  }

  // ===== PLAYER POD INTEGRATION =====

  public setPlayerPod(pod: RacerPod | null): void 
  {
    console.log('📹 Setting player pod:', pod?.getConfig().name || 'none');
    this.playerPod = pod;

    // If we're in player mode, setup following immediately
    if (this.currentMode === CameraMode.PLAYER && pod) 
    {
      this.setupPodFollowing();
    }
  }

  private setupPodFollowing(): void 
  {
    if (!this.playerPod || !this.playerCamera) return;

    console.log('📹 Setting up pod following camera');

    // Initial camera positioning
    const podPosition = this.playerPod.getPosition();
    this.playerCamera.setTarget(podPosition);

    // Register render loop for continuous following
    this.beforeRenderObserver = this.scene.registerBeforeRender(() => {
      if (this.playerPod && this.playerCamera && this.currentMode === CameraMode.PLAYER) 
      {
        // Update camera target to follow pod
        const currentPodPosition = this.playerPod.getPosition();
        this.playerCamera.setTarget(currentPodPosition);
      }
    });

    console.log('📹 ✅ Pod following camera setup complete');
  }

  // ===== INPUT HANDLING =====

  public handleMovement(direction: { x: number; y: number; z: number }): void 
  {
    // Only handle movement in PLAYER mode (move the pod, not camera)
    if (this.currentMode === CameraMode.PLAYER && this.playerPod) 
    {
      // Move the pod directly
      this.playerPod.move(direction);
      console.log('📹 Pod moved:', this.playerPod.getPosition());
    }
    // FREE camera movement is handled automatically by Babylon.js
    // RACING camera movement is handled automatically by Babylon.js
  }

  public handleMouseWheel(delta: number): void 
  {
    const activeCamera = this.scene.activeCamera;
    if (!activeCamera) return;

    // Handle zoom for ArcRotate cameras
    if (activeCamera instanceof ArcRotateCamera) 
    {
      const arcCamera = activeCamera as ArcRotateCamera;
      arcCamera.radius += delta * 2;
      
      // Safe null checks for limits
      const lowerLimit = arcCamera.lowerRadiusLimit ?? 1;
      const upperLimit = arcCamera.upperRadiusLimit ?? 100;
      
      arcCamera.radius = Math.max(lowerLimit, Math.min(upperLimit, arcCamera.radius));
    }
    // For FREE camera, adjust movement speed
    else if (activeCamera instanceof FreeCamera && this.currentMode === CameraMode.FREE) 
    {
      const freeCamera = activeCamera as any;
      const currentSpeed = freeCamera.speed || 1;
      const newSpeed = Math.max(0.1, Math.min(5.0, currentSpeed + (delta * 0.1)));
      freeCamera.speed = newSpeed;
      console.log(`📹 Free camera speed: ${newSpeed.toFixed(1)}`);
    }
  }

  // Get current active camera
  public getActiveCamera(): Camera | null 
  {
    return this.scene.activeCamera;
  }

  // Get specific camera by mode
  public getCamera(mode: CameraMode): Camera | null 
  {
    switch (mode) {
      case CameraMode.RACING: return this.racingCamera;
      case CameraMode.FREE: return this.freeCamera;
      case CameraMode.PLAYER: return this.playerCamera;
      default: return null;
    }
  }

  public getCurrentMode(): CameraMode 
  {
    return this.currentMode;
  }

  public getAvailableModes(): CameraMode[] 
  {
    return [CameraMode.RACING, CameraMode.FREE, CameraMode.PLAYER];
  }

  public getCameraInfo(mode: CameraMode): CameraInfo 
  {
    const cameraInfoMap = {
      [CameraMode.RACING]: { mode, name: 'Racing Camera', description: 'Track overview camera' },
      [CameraMode.FREE]: { mode, name: 'Free Camera', description: 'WASD exploration camera' },
      [CameraMode.PLAYER]: { mode, name: 'Player Camera', description: 'Third-person pod following camera' }
    };
    
    return cameraInfoMap[mode];
  }

  public setTrackBounds(bounds: { min: Vector3; max: Vector3; size: Vector3 }): void 
  {
    this.trackBounds = bounds;
    console.log('📹 Track bounds set for camera positioning');
    
    // Update racing camera if it's active
    if (this.currentMode === CameraMode.RACING) 
    {
      this.activateRacingCamera();
    }
  }

  public resetCamera(): void 
  {
    console.log(`📹 Resetting ${this.currentMode} camera`);
    
    // Simply reactivate current camera to reset it
    this.switchToMode(this.currentMode);
  }

  // ===== CLEANUP =====

  public dispose(): void 
  {
    console.log('📹 Disposing CameraManager...');
    
    // Detach current camera
    this.detachCurrentCamera();
    
    // Dispose all cameras
    this.racingCamera?.dispose();
    this.freeCamera?.dispose();
    this.playerCamera?.dispose();
    
    this.racingCamera = null;
    this.freeCamera = null;
    this.playerCamera = null;
    this.playerPod = null;
    this.trackBounds = null;
  }
}