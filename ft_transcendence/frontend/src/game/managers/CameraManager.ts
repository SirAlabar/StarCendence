// Camera management system

import { GameCanvas, CameraConfig } from '../../components/game/GameCanvas';
import { Vector3 } from '@babylonjs/core';

export enum CameraMode 
{
  RACING = 'racing',        // ArcRotate camera for racing view
  FREE = 'free',           // Free camera for development/exploration
  PLAYER = 'player'        // Future: First-person pod racing camera
}

export interface CameraPreset 
{
  mode: CameraMode;
  config: CameraConfig;
  name: string;
  description: string;
}

export interface FreeCameraState 
{
  position: Vector3;
  rotation: Vector3;
  moveSpeed: number;
  rotationSpeed: number;
}

export class CameraManager 
{
  private gameCanvas: GameCanvas;
  private currentMode: CameraMode;
  private presets: Map<CameraMode, CameraPreset>;
  private freeCameraState: FreeCameraState;
  
  // Track bounds for camera limits
  private trackBounds: { min: Vector3; max: Vector3; size: Vector3 } | null = null;

  constructor(gameCanvas: GameCanvas) 
  {
    this.gameCanvas = gameCanvas;
    this.currentMode = CameraMode.RACING;
    this.presets = new Map();
    
    // Initialize free camera state
    this.freeCameraState = 
    {
      position: new Vector3(0, 20, 30),
      rotation: new Vector3(-0.3, 0, 0),
      moveSpeed: 0.8,
      rotationSpeed: 0.002
    };
    
    this.setupCameraPresets();
    console.log('📹 CameraManager initialized');
  }

  // Setup default camera presets
  private setupCameraPresets(): void 
  {
    // Racing camera preset (ArcRotate)
    this.presets.set(CameraMode.RACING, 
    {
      mode: CameraMode.RACING,
      name: 'Racing Camera',
      description: 'Overview camera for racing',
      config: 
      {
        type: 'arcRotate',
        target: Vector3.Zero(),
        radius: 50,
        alpha: -Math.PI / 2,
        beta: Math.PI / 4
      }
    });

    // Free camera preset (FreeCamera)
    this.presets.set(CameraMode.FREE, 
    {
      mode: CameraMode.FREE,
      name: 'Free Camera',
      description: 'WASD + Mouse exploration camera',
      config: 
      {
        type: 'free',
        position: this.freeCameraState.position,
        target: Vector3.Zero()
      }
    });

    // Player camera preset (Future implementation)
    this.presets.set(CameraMode.PLAYER, 
    {
      mode: CameraMode.PLAYER,
      name: 'Player Camera',
      description: 'First-person pod racing view',
      config: 
      {
        type: 'universal',
        position: new Vector3(0, 2, 0),
        target: new Vector3(0, 2, -10)
      }
    });
  }

  // Switch camera mode
  public switchToMode(mode: CameraMode): void 
  {
    if (this.currentMode === mode) 
    {
      console.log(`📹 Already in ${mode} camera mode`);
      return;
    }

    const preset = this.presets.get(mode);
    if (!preset) 
    {
      console.warn(`📹 Unknown camera mode: ${mode}`);
      return;
    }

    console.log(`📹 Switching from ${this.currentMode} to ${mode} camera`);
    
    // Save current free camera state if leaving free mode
    if (this.currentMode === CameraMode.FREE) 
    {
      this.saveFreeCameraState();
    }
    
    // Update preset config based on current state
    this.updatePresetForMode(mode);
    
    // Apply camera configuration
    this.gameCanvas.reconfigureCamera(preset.config);
    this.currentMode = mode;
    
    // Setup mode-specific behavior
    this.setupCameraMode(mode);
    
    console.log(`📹 ✅ Switched to ${preset.name} (${preset.description})`);
  }

  // Cycle through camera modes
  public cycleCameraMode(): void 
  {
    const modes = [CameraMode.RACING, CameraMode.FREE, CameraMode.PLAYER];
    const currentIndex = modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    
    this.switchToMode(modes[nextIndex]);
  }

  // Update preset configuration for specific modes
  private updatePresetForMode(mode: CameraMode): void 
  {
    const preset = this.presets.get(mode);
    if (!preset)
    {
      return;
    }
    
    switch (mode) 
    {
      case CameraMode.RACING:
        // Position racing camera based on track bounds
        if (this.trackBounds) 
        {
          const trackCenter = this.trackBounds.min.add(this.trackBounds.max).scale(0.5);
          const cameraDistance = Math.max(this.trackBounds.size.x, this.trackBounds.size.z) * 0.8;
          
          preset.config.target = trackCenter;
          preset.config.radius = cameraDistance;
        }
        break;
        
      case CameraMode.FREE:
        // Use saved free camera state
        preset.config.position = this.freeCameraState.position.clone();
        break;
        
      case CameraMode.PLAYER:
        // Future: Position at player pod location
        break;
    }
  }

  // Setup mode-specific camera behavior
  private setupCameraMode(mode: CameraMode): void 
  {
    switch (mode) 
    {
      case CameraMode.FREE:
        this.setupFreeCameraControls();
        break;
        
      case CameraMode.RACING:
        // Racing camera is handled by default Babylon.js ArcRotate controls
        break;
        
      case CameraMode.PLAYER:
        // Future: Setup first-person controls
        break;
    }
  }

  // Setup free camera controls
  private setupFreeCameraControls(): void 
  {
    
    const camera = this.gameCanvas.getActiveCamera();
    if (camera && camera.getClassName() === 'FreeCamera') 
    {
      // Set movement constraints if needed
      // camera.checkCollisions = true; // Future: collision detection
    }
  }

  // Handle movement input for free camera
  public handleMovement(direction: { x: number; y: number; z: number }): void 
  {
    if (this.currentMode !== CameraMode.FREE)
    {
      return;
    }
    
    const camera = this.gameCanvas.getActiveCamera();
    if (!camera || camera.getClassName() !== 'FreeCamera')
    {
      return;
    }
    
    // Apply movement relative to camera's local space
    const moveVector = new Vector3(direction.x, direction.y, direction.z);
    moveVector.scaleInPlace(this.freeCameraState.moveSpeed);
    
    // Transform movement to camera's local coordinate system
    const localMovement = Vector3.TransformCoordinates(moveVector, camera.getWorldMatrix());
    const worldMovement = localMovement.subtract(camera.position);
    
    // Apply movement
    camera.position.addInPlace(worldMovement);
    
    // Update saved state
    this.freeCameraState.position = camera.position.clone();
  }

  // Handle mouse look for free camera
  public handleMouseLook(deltaX: number, deltaY: number): void 
  {
    if (this.currentMode !== CameraMode.FREE)
    {
      return;
    }
    
    const camera = this.gameCanvas.getActiveCamera();
    if (!camera || camera.getClassName() !== 'FreeCamera')
    {
      return;
    }
    
    // Type assertion for FreeCamera to access rotation property
    const freeCamera = camera as any;
    
    // Apply rotation
    freeCamera.rotation.y += deltaX * this.freeCameraState.rotationSpeed;
    freeCamera.rotation.x += deltaY * this.freeCameraState.rotationSpeed;
    
    // Clamp vertical rotation
    freeCamera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, freeCamera.rotation.x));
    
    // Update saved state
    this.freeCameraState.rotation = freeCamera.rotation.clone();
  }

  // Handle mouse wheel for all camera modes
  public handleMouseWheel(delta: number): void 
  {
    const camera = this.gameCanvas.getActiveCamera();
    if (!camera)
    {
      return;
    }
    
    switch (this.currentMode) 
    {
      case CameraMode.RACING:
        // ArcRotate camera zoom
        if (camera.getClassName() === 'ArcRotateCamera') 
        {
          const arcCamera = camera as any; // Type assertion for ArcRotateCamera
          arcCamera.radius += delta * 2;
          arcCamera.radius = Math.max(arcCamera.lowerRadiusLimit, 
                                    Math.min(arcCamera.upperRadiusLimit, arcCamera.radius));
        }
        break;
        
      case CameraMode.FREE:
        // Adjust movement speed
        this.freeCameraState.moveSpeed += delta * 0.1;
        this.freeCameraState.moveSpeed = Math.max(0.1, Math.min(5.0, this.freeCameraState.moveSpeed));
        console.log(`📹 Free camera speed: ${this.freeCameraState.moveSpeed.toFixed(1)}`);
        break;
        
      case CameraMode.PLAYER:
        // Future: FOV adjustment or similar
        break;
    }
  }

  // Save current free camera state
  private saveFreeCameraState(): void 
  {
    const camera = this.gameCanvas.getActiveCamera();
    if (camera && camera.getClassName() === 'FreeCamera') 
    {
      // Type assertion for FreeCamera to access rotation property
      const freeCamera = camera as any;
      this.freeCameraState.position = camera.position.clone();
      this.freeCameraState.rotation = freeCamera.rotation.clone();
    }
  }

  // Set track bounds for camera positioning
  public setTrackBounds(bounds: { min: Vector3; max: Vector3; size: Vector3 }): void 
  {
    this.trackBounds = bounds;
    console.log('📹 Track bounds set for camera positioning');
    
    // Update racing camera preset with new bounds
    this.updatePresetForMode(CameraMode.RACING);
  }

  // Get current camera mode
  public getCurrentMode(): CameraMode 
  {
    return this.currentMode;
  }

  // Get available camera modes
  public getAvailableModes(): CameraMode[] 
  {
    return Array.from(this.presets.keys());
  }

  // Get camera mode info
  public getModeInfo(mode: CameraMode): { name: string; description: string } | null 
  {
    const preset = this.presets.get(mode);
    if (preset)
    {
      return { name: preset.name, description: preset.description };
    }
    return null;
  }

  // Camera settings
  public setFreeCameraSpeed(speed: number): void 
  {
    this.freeCameraState.moveSpeed = Math.max(0.1, Math.min(10.0, speed));
  }

  public setFreeCameraRotationSpeed(speed: number): void 
  {
    this.freeCameraState.rotationSpeed = Math.max(0.001, Math.min(0.01, speed));
  }

  // Reset camera to default position for current mode
  public resetCamera(): void 
  {
    console.log(`📹 Resetting ${this.currentMode} camera to default position`);
    
    switch (this.currentMode) 
    {
      case CameraMode.FREE:
        this.freeCameraState.position = new Vector3(0, 20, 30);
        this.freeCameraState.rotation = new Vector3(-0.3, 0, 0);
        this.switchToMode(CameraMode.FREE); // Reapply
        break;
        
      case CameraMode.RACING:
        this.switchToMode(CameraMode.RACING); // Reapply with track bounds
        break;
        
      case CameraMode.PLAYER:
        this.switchToMode(CameraMode.PLAYER); // Future implementation
        break;
    }
  }

  // Dispose resources
  public dispose(): void 
  {
    console.log('📹 Disposing CameraManager...');
    this.presets.clear();
    this.trackBounds = null;
  }
}