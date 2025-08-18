// Camera management system with Player Camera and Pod Following

import { GameCanvas, CameraConfig } from '../../components/game/GameCanvas';
import { Vector3 } from '@babylonjs/core';
import { RacerPod } from '../../game/engines/racer/RacerPods';

export enum CameraMode 
{
  RACING = 'racing',        // ArcRotate camera for racing view
  FREE = 'free',           // Free camera for development/exploration
  PLAYER = 'player'        // Third-person pod racing camera
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
  
  // Player pod reference for camera following
  private playerPod: RacerPod | null = null;
  private cameraFollowOffset: Vector3 = new Vector3(0, 3, 8); // Behind and above
  private cameraLookOffset: Vector3 = new Vector3(0, 1, 2);   // Slightly ahead
  private cameraSmoothing: number = 0.1; // Camera smoothing factor

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

    // Player camera preset (Third-person following camera)
    this.presets.set(CameraMode.PLAYER, 
    {
      mode: CameraMode.PLAYER,
      name: 'Player Camera',
      description: 'Third-person pod racing view',
      config: 
      {
        type: 'universal',
        position: new Vector3(0, 3, 8),
        target: new Vector3(0, 1, 0)
      }
    });
  }

  // ===== PLAYER POD INTEGRATION =====

  // Set the player pod for camera following
  // public setPlayerPod(pod: RacerPod | null): void 
  // {
  //   this.playerPod = pod;
  //   console.log(`📹 Player pod set: ${pod ? pod.getConfig().name : 'none'}`);
    
  //   // If we're in player mode, update camera immediately
  //   if (this.currentMode === CameraMode.PLAYER && pod) 
  //   {
  //     this.updatePlayerCamera();
  //   }
  // }

  public setPlayerPod(pod: RacerPod | null): void 
{
  console.log('🔍 DEBUG CameraManager.setPlayerPod() called');
  console.log('  - Pod parameter:', !!pod);
  console.log('  - Pod config name:', pod?.getConfig().name);
  console.log('  - Pod ready state:', pod?.isReady());
  console.log('  - Current camera mode:', this.currentMode);
  
  this.playerPod = pod;
  console.log('  - Player pod stored in CameraManager:', !!this.playerPod);
  
  console.log(`📹 Player pod set: ${pod ? pod.getConfig().name : 'none'}`);
  
  // If we're in player mode, update camera immediately
  if (this.currentMode === CameraMode.PLAYER && pod) 
  {
    console.log('🔍 DEBUG: Already in PLAYER mode, updating camera immediately');
    this.updatePlayerCamera();
  } else {
    console.log('🔍 DEBUG: Not in PLAYER mode yet, camera will update when mode switches');
  }
}

  // Calculate camera target position based on player pod and offset
  private calculateCameraTargetPosition(): Vector3 
  {
    if (!this.playerPod) 
    {
      return Vector3.Zero();
    }

    // Get pod's forward direction and position
    const podPosition = this.playerPod.getPosition();
    const podForward = this.playerPod.getForwardDirection();
    const backward = podForward.scale(-1);
    
    // Use the cameraFollowOffset to position camera behind and above pod
    const cameraOffset = backward.scale(this.cameraFollowOffset.z)
      .add(new Vector3(0, this.cameraFollowOffset.y, 0));
    
    return podPosition.add(cameraOffset);
  }

  // FIXED: Calculate camera look-at position
  private calculateCameraLookAtPosition(): Vector3 
  {
    if (!this.playerPod) 
    {
      return Vector3.Zero();
    }

    const podPosition = this.playerPod.getPosition();
    const podForward = this.playerPod.getForwardDirection();
    
    // Look slightly ahead of the pod
    return podPosition.add(podForward.scale(this.cameraLookOffset.z))
                     .add(new Vector3(0, this.cameraLookOffset.y, 0));
  }

  // Update player camera to follow pod
  private updatePlayerCamera(): void 
  {
    if (!this.playerPod || this.currentMode !== CameraMode.PLAYER) 
    {
      return;
    }

    const camera = this.gameCanvas.getActiveCamera();
    if (!camera) return;

    // FIXED: Use our own calculation methods
    const targetPosition = this.calculateCameraTargetPosition();
    const lookAtPosition = this.calculateCameraLookAtPosition();

    // Smooth camera movement
    if (camera.position) 
    {
      // Lerp camera position for smooth following
      camera.position = Vector3.Lerp(camera.position, targetPosition, this.cameraSmoothing);
      
      // FIXED: Set camera to look at the pod with proper type checking
      if (camera.getClassName() === 'UniversalCamera' || camera.getClassName() === 'FreeCamera') 
      {
        (camera as any).setTarget(lookAtPosition);
      }
    }
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
    if (!preset) return;
    
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
        // FIXED: Position based on player pod if available
        if (this.playerPod) 
        {
          preset.config.position = this.calculateCameraTargetPosition();
          preset.config.target = this.calculateCameraLookAtPosition();
        }
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
        this.setupPlayerCameraControls();
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

  // Setup player camera controls
  private setupPlayerCameraControls(): void 
  {
    // Player camera doesn't need special setup - it follows the pod automatically
    console.log('📹 Player camera controls setup - automatic following enabled');
  }

  // ===== INPUT HANDLING =====

  // Handle movement input - routes to camera or pod based on mode
  // public handleMovement(direction: { x: number; y: number; z: number }): void 
  // {
  //   switch (this.currentMode) 
  //   {
  //     case CameraMode.FREE:
  //       this.handleFreeCameraMovement(direction);
  //       break;
        
  //     case CameraMode.PLAYER:
  //       this.handlePodMovement(direction);
  //       break;
        
  //     case CameraMode.RACING:
  //       // Racing mode doesn't handle WASD movement
  //       break;
  //   }
  // }

  public handleMovement(direction: { x: number; y: number; z: number }): void 
  {
    console.log('🔍 DEBUG CameraManager.handleMovement() called');
    console.log('  - Direction:', direction);
    console.log('  - Current mode:', this.currentMode);
    console.log('  - Player pod exists:', !!this.playerPod);
    
    switch (this.currentMode) 
    {
      case CameraMode.FREE:
        console.log('🔍 DEBUG: Routing to FREE camera movement');
        this.handleFreeCameraMovement(direction);
        break;
        
      case CameraMode.PLAYER:
        console.log('🔍 DEBUG: Routing to PLAYER pod movement');
        this.handlePodMovement(direction);
        break;
        
      case CameraMode.RACING:
        console.log('🔍 DEBUG: RACING mode - no WASD movement');
        break;
    }
  }

  // Handle free camera movement
  private handleFreeCameraMovement(direction: { x: number; y: number; z: number }): void 
  {
    const camera = this.gameCanvas.getActiveCamera();
    if (!camera || camera.getClassName() !== 'FreeCamera') return;
    
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

  // Handle pod movement
  // private handlePodMovement(direction: { x: number; y: number; z: number }): void 
  // {
  //   if (!this.playerPod) 
  //   {
  //     console.warn('📹 No player pod set for movement');
  //     return;
  //   }

  //   // Move the pod
  //   this.playerPod.move(direction);
    
  //   // Update camera to follow pod
  //   this.updatePlayerCamera();
  // }

  private handlePodMovement(direction: { x: number; y: number; z: number }): void 
  {
    console.log('🔍 DEBUG CameraManager.handlePodMovement() called');
    console.log('  - Player pod exists:', !!this.playerPod);
    console.log('  - Direction:', direction);
    
    if (!this.playerPod) 
    {
      console.warn('📹 No player pod set for movement');
      return;
    }

    console.log('🔍 DEBUG: Moving pod...');
    // Move the pod
    this.playerPod.move(direction);
    console.log('🔍 DEBUG: Pod moved, new position:', this.playerPod.getPosition());
    
    // Update camera to follow pod
    console.log('🔍 DEBUG: Updating camera to follow pod...');
    this.updatePlayerCamera();
  }

  public debugCameraState(): void 
  {
    console.log('🔍 DEBUG CameraManager State:');
    console.log('  - Current mode:', this.currentMode);
    console.log('  - Player pod exists:', !!this.playerPod);
    console.log('  - Player pod ready:', this.playerPod?.isReady());
    console.log('  - GameCanvas active camera:', !!this.gameCanvas.getActiveCamera());
    console.log('  - Available modes:', this.getAvailableModes());
    
    if (this.playerPod) {
      console.log('  - Pod position:', this.playerPod.getPosition());
      console.log('  - Pod forward direction:', this.playerPod.getForwardDirection());
      console.log('  - Pod camera target:', this.playerPod.getCameraTargetPosition());
    }
  }
  
  // Handle mouse look for free camera
  public handleMouseLook(deltaX: number, deltaY: number): void 
  {
    switch (this.currentMode) 
    {
      case CameraMode.FREE:
        this.handleFreeCameraLook(deltaX, deltaY);
        break;
        
      case CameraMode.PLAYER:
        this.handlePodRotation(deltaX, deltaY);
        break;
        
      case CameraMode.RACING:
        // Racing camera mouse look is handled by Babylon.js ArcRotate
        break;
    }
  }

  // Handle free camera mouse look
  private handleFreeCameraLook(deltaX: number, deltaY: number): void 
  {
    const camera = this.gameCanvas.getActiveCamera();
    if (!camera || camera.getClassName() !== 'FreeCamera') return;
    
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

  // Handle pod rotation via mouse
  private handlePodRotation(deltaX: number, deltaY: number): void 
  {
    if (!this.playerPod) return;

    // Rotate the pod
    this.playerPod.rotate(deltaX, deltaY);
    
    // Update camera to follow pod
    this.updatePlayerCamera();
  }

  // Handle mouse wheel for all camera modes
  public handleMouseWheel(delta: number): void 
  {
    const camera = this.gameCanvas.getActiveCamera();
    if (!camera) return;
    
    switch (this.currentMode) 
    {
      case CameraMode.RACING:
        // ArcRotate camera zoom
        if (camera.getClassName() === 'ArcRotateCamera') 
        {
          const arcCamera = camera as any;
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
        // Adjust pod movement speed
        if (this.playerPod) 
        {
          const currentSpeed = this.playerPod.getMoveSpeed();
          const newSpeed = currentSpeed + (delta * 0.1);
          this.playerPod.setMoveSpeed(newSpeed);
          console.log(`📹 Pod speed: ${newSpeed.toFixed(1)}`);
        }
        break;
    }
  }

  // ===== UPDATE LOOP =====

  // Update camera each frame (called from GameCanvas render loop)
  public update(): void 
  {
    if (this.currentMode === CameraMode.PLAYER && this.playerPod) 
    {
      this.updatePlayerCamera();
    }
  }

  // ===== EXISTING METHODS =====

  // Save current free camera state
  private saveFreeCameraState(): void 
  {
    const camera = this.gameCanvas.getActiveCamera();
    if (camera && camera.getClassName() === 'FreeCamera') 
    {
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

  // Player camera settings
  public setCameraFollowOffset(offset: Vector3): void 
  {
    this.cameraFollowOffset = offset.clone();
  }

  public setCameraSmoothing(smoothing: number): void 
  {
    this.cameraSmoothing = Math.max(0.01, Math.min(1.0, smoothing));
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
        this.switchToMode(CameraMode.FREE);
        break;
        
      case CameraMode.RACING:
        this.switchToMode(CameraMode.RACING);
        break;
        
      case CameraMode.PLAYER:
        this.switchToMode(CameraMode.PLAYER);
        break;
    }
  }

  // Dispose resources
  public dispose(): void 
  {
    console.log('📹 Disposing CameraManager...');
    this.presets.clear();
    this.trackBounds = null;
    this.playerPod = null;
  }
}