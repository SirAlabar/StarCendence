import { GameCanvas } from '../engines/racer/GameCanvas';
import { Vector3, Scene, Camera, ArcRotateCamera, FollowCamera } from '@babylonjs/core';
import { RacerPod } from '../engines/racer/RacerPods';

export enum CameraMode 
{
  RACING = 'racing',
  PLAYER = 'player'
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
  
  private racingCamera: ArcRotateCamera | null = null;
  private playerCamera: FollowCamera | null = null;
  
  private targetPod: RacerPod | null = null;

  constructor(gameCanvas: GameCanvas) 
  {
    this.gameCanvas = gameCanvas;
    this.scene = gameCanvas.getScene()!;
    this.currentMode = CameraMode.PLAYER;
    
    this.setupCameras();
  }

  private setupCameras(): void 
  {
    // Racing camera - overview of track
    this.racingCamera = new ArcRotateCamera(
      "racingCamera",
      -Math.PI / 2,
      Math.PI / 4,
      50,
      Vector3.Zero(),
      this.scene
    );
    this.racingCamera.lowerRadiusLimit = 10;
    this.racingCamera.upperRadiusLimit = 100;

    // Follow camera - automatically follows target
    this.playerCamera = new FollowCamera(
      "followCamera",
      new Vector3(0, 10, -15),
      this.scene
    );
    
    // Configure follow behavior
    this.playerCamera.radius = 15;
    this.playerCamera.heightOffset = 8;
    this.playerCamera.rotationOffset = 0;
    this.playerCamera.cameraAcceleration = 0.05;
    this.playerCamera.maxCameraSpeed = 20;
    this.playerCamera.lowerHeightOffsetLimit = 2;
    this.playerCamera.upperHeightOffsetLimit = 30;
    this.playerCamera.lowerRadiusLimit = 5;
    this.playerCamera.upperRadiusLimit = 50;

    this.switchToMode(this.currentMode);
  }

  public switchToMode(mode: CameraMode): void 
  {
    this.detachCurrentCamera();
    this.currentMode = mode;

    switch (mode) 
    {
      case CameraMode.RACING:
        this.scene.activeCamera = this.racingCamera;
        if (this.racingCamera) 
        {
          const canvas = this.gameCanvas.getCanvas();
          if (canvas) 
          {
            this.racingCamera.attachControl(canvas, true);
          }
        }
        break;
        
      case CameraMode.PLAYER:
        this.scene.activeCamera = this.playerCamera;
        if (this.playerCamera) 
        {
          const canvas = this.gameCanvas.getCanvas();
          if (canvas) 
          {
            (this.playerCamera as any).attachControl(canvas, true);
          }
          this.attachToTarget();
        }
        break;
    }

    this.notifyInputManager();
    this.updateCameraUI();
  }

  public cycleCameraMode(): void 
  {
    const availableModes: CameraMode[] = [CameraMode.RACING, CameraMode.PLAYER];
    
    const currentIndex = availableModes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % availableModes.length;
    this.switchToMode(availableModes[nextIndex]);
  }

  private notifyInputManager(): void 
  {
    const inputManager = (this.gameCanvas as any).inputManager;
    if (inputManager && typeof inputManager.setCameraMode === 'function') 
    {
      inputManager.setCameraMode(this.currentMode);
    }
  }

  public getCurrentMode(): CameraMode 
  {
    return this.currentMode;
  }

  public getActiveCamera(): Camera | null 
  {
    return this.scene.activeCamera;
  }

  public getCameraInfo(mode: CameraMode): CameraInfo | null 
  {
    const infoMap = 
    {
      [CameraMode.RACING]: { mode, name: 'Racing Camera', description: 'Track overview' },
      [CameraMode.PLAYER]: { mode, name: 'Follow Camera', description: 'Follow pod' }
    };
    
    return infoMap[mode] || null;
  }

  public setCameraTarget(pod: RacerPod | null): void 
  {
    this.targetPod = pod;
    
    if (this.playerCamera && pod) 
    {
      this.attachToTarget();
    }
    
    if (pod) 
    {
      this.switchToMode(CameraMode.PLAYER);
    }
  }

  private attachToTarget(): void 
  {
    if (!this.targetPod || !this.playerCamera) 
    {
      return;
    }

    // Get the pod's mesh for following
    const podMesh = this.targetPod.getMesh();
    if (podMesh) 
    {
      this.playerCamera.lockedTarget = podMesh;
    }
  }

  public setTrackBounds(bounds: { min: Vector3; max: Vector3; size: Vector3 }): void 
  {
    if (this.racingCamera && bounds) 
    {
      const trackCenter = bounds.min.add(bounds.max).scale(0.5);
      const cameraDistance = Math.max(bounds.size.x, bounds.size.z) * 0.8;
      
      this.racingCamera.setTarget(trackCenter);
      this.racingCamera.radius = cameraDistance;
    }
  }

  public handleMouseWheel(delta: number): void 
  {
    const activeCamera = this.scene.activeCamera;
    
    if (activeCamera instanceof ArcRotateCamera) 
    {
      const arcCamera = activeCamera as ArcRotateCamera;
      arcCamera.radius += delta * 2;
      
      const lowerLimit = arcCamera.lowerRadiusLimit ?? 1;
      const upperLimit = arcCamera.upperRadiusLimit ?? 1000;
      
      arcCamera.radius = Math.max(lowerLimit, Math.min(upperLimit, arcCamera.radius));
    }
    else if (activeCamera instanceof FollowCamera) 
    {
      const followCamera = activeCamera as FollowCamera;
      followCamera.radius += delta * 2;
      
      const lowerLimit = followCamera.lowerRadiusLimit ?? 1;
      const upperLimit = followCamera.upperRadiusLimit ?? 1000;
      
      followCamera.radius = Math.max(lowerLimit, Math.min(upperLimit, followCamera.radius));
    }
  }

  private detachCurrentCamera(): void 
  {
    if (this.scene.activeCamera) 
    {
      this.scene.activeCamera.detachControl(this.gameCanvas.getCanvas()!);
    }
  }

  private updateCameraUI(): void 
  {
    const modeInfo = this.getCameraInfo(this.currentMode);
    
    const cameraInfo = document.getElementById('cameraInfo');
    if (cameraInfo && modeInfo) 
    {
      cameraInfo.textContent = `Camera: ${modeInfo.name}`;
    }

    const trackInfo = document.getElementById('trackInfo');
    if (trackInfo) 
    {
      const currentText = trackInfo.textContent || '';
      if (!currentText.includes('F1')) 
      {
        const modeInfoName = modeInfo ? modeInfo.name : 'Unknown';
        const controlsText = this.getControlsText(this.currentMode);
        
        trackInfo.innerHTML = `
          ${currentText}<br>
          <span class="text-xs text-purple-300">F1: Switch Camera (${modeInfoName})</span><br>
          <span class="text-xs text-blue-300">${controlsText}</span>
        `;
      }
    }
  }

  private getControlsText(mode: CameraMode): string 
  {
    switch (mode) 
    {
      case CameraMode.RACING:
        return 'Mouse: Rotate View | Scroll: Zoom';
      case CameraMode.PLAYER:
        return 'WASD/Arrows: Move Pod | Scroll: Camera Distance';
      default:
        return '';
    }
  }

  public dispose(): void 
  {
    this.detachCurrentCamera();
    
    if (this.racingCamera) 
    {
      this.racingCamera.dispose();
      this.racingCamera = null;
    }
    
    if (this.playerCamera) 
    {
      this.playerCamera.dispose();
      this.playerCamera = null;
    }
    
    this.targetPod = null;
  }
}