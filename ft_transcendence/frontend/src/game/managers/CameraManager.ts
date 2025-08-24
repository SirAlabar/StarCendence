// CameraManager.ts - Simplified Camera Management with Physics Movement

import { GameCanvas } from '../engines/racer/GameCanvas';
import { Vector3, Scene, Camera, ArcRotateCamera, FreeCamera } from '@babylonjs/core';
import { RacerPod } from '../engines/racer/RacerPods';

export enum CameraMode 
{
  RACING = 'racing',
  FREE = 'free',
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
  private freeCamera: FreeCamera | null = null;
  private playerCamera: ArcRotateCamera | null = null;
  
  private playerPod: RacerPod | null = null;
  private beforeRenderObserver: any = null;

  constructor(gameCanvas: GameCanvas) 
  {
    this.gameCanvas = gameCanvas;
    this.scene = gameCanvas.getScene()!;
    this.currentMode = CameraMode.RACING;
    
    this.setupCameras();
    console.log('CameraManager initialized');
  }

  private setupCameras(): void 
  {
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

    this.freeCamera = new FreeCamera(
      "freeCamera", 
      new Vector3(0, 20, 30), 
      this.scene
    );
    this.freeCamera.setTarget(Vector3.Zero());

    this.playerCamera = new ArcRotateCamera(
      "playerCamera",
      -Math.PI / 2,
      Math.PI / 6,
      15,
      Vector3.Zero(),
      this.scene
    );
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
        this.racingCamera?.attachControl(this.gameCanvas.getCanvas()!, true);
        break;
      case CameraMode.FREE:
        this.scene.activeCamera = this.freeCamera;
        break;
      case CameraMode.PLAYER:
        this.scene.activeCamera = this.playerCamera;
        this.playerCamera?.attachControl(this.gameCanvas.getCanvas()!, true);
        this.setupPodFollowing();
        break;
    }

    console.log(`Switched to ${mode} camera`);
  }

  public cycleCameraMode(): void 
  {
    const modes = [CameraMode.RACING, CameraMode.FREE, CameraMode.PLAYER];
    const currentIndex = modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.switchToMode(modes[nextIndex]);
  }

  public getCurrentMode(): CameraMode 
  {
    return this.currentMode;
  }

  public getActiveCamera(): Camera | null 
  {
    return this.scene.activeCamera;
  }

  public getFreeCamera(): FreeCamera | null 
  {
    return this.freeCamera;
  }

  public getCameraInfo(mode: CameraMode): CameraInfo | null 
  {
    const infoMap = {
      [CameraMode.RACING]: { mode, name: 'Racing Camera', description: 'Track overview' },
      [CameraMode.FREE]: { mode, name: 'Free Camera', description: 'Free movement' },
      [CameraMode.PLAYER]: { mode, name: 'Player Camera', description: 'Follow pod' }
    };
    
    return infoMap[mode] || null;
  }

  public setPlayerPod(pod: RacerPod | null): void 
  {
    this.playerPod = pod;
    
    if (this.currentMode === CameraMode.PLAYER && pod) 
    {
      this.setupPodFollowing();
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
  }

  private setupPodFollowing(): void 
  {
    if (!this.playerPod || !this.playerCamera || this.currentMode !== CameraMode.PLAYER) 
    {
      return;
    }

    const podPosition = this.playerPod.getPosition();
    this.playerCamera.setTarget(podPosition);

    this.beforeRenderObserver = this.scene.registerBeforeRender(() => {
      if (this.playerPod && this.playerCamera && this.currentMode === CameraMode.PLAYER) 
      {
        const currentPodPosition = this.playerPod.getPosition();
        this.playerCamera.setTarget(currentPodPosition);
      }
    });
  }

  private detachCurrentCamera(): void 
  {
    if (this.scene.activeCamera) 
    {
      this.scene.activeCamera.detachControl(this.gameCanvas.getCanvas()!);
    }

    if (this.beforeRenderObserver) 
    {
      this.scene.unregisterBeforeRender(this.beforeRenderObserver);
      this.beforeRenderObserver = null;
    }
  }

  public dispose(): void 
  {
    this.detachCurrentCamera();
    
    this.racingCamera?.dispose();
    this.freeCamera?.dispose();
    this.playerCamera?.dispose();
    
    this.racingCamera = null;
    this.freeCamera = null;
    this.playerCamera = null;
    this.playerPod = null;
  }
}