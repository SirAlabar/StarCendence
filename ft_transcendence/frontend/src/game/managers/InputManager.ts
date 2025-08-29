import { Vector3, FreeCamera } from '@babylonjs/core';
import { RacerPhysics } from '../engines/racer/RacerPhysics';

export enum CameraMode 
{
  RACING = 'racing',
  FREE = 'free', 
  PLAYER = 'player'
}

export interface InputState 
{
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  
  mouseDeltaX: number;
  mouseDeltaY: number;
  mouseWheel: number;
  
  cameraSwitchPressed: boolean;
  
  isMouseDown: boolean;
  mouseX: number;
  mouseY: number;
}

export interface InputCallbacks 
{
  onMouseWheel?: (delta: number) => void;
  onCameraSwitch?: () => void;
}

export class InputManager 
{
  private inputState: InputState;
  private callbacks: InputCallbacks;
  private canvas: HTMLCanvasElement | null = null;
  private isActive: boolean = false;
  
  private movementSpeed: number = 0.5;
  private mouseSensitivity: number = 0.002;
  
  private currentCameraMode: CameraMode = CameraMode.PLAYER;
  private freeCamera: FreeCamera | null = null;
  private racerPhysics: RacerPhysics | null = null;
  private playerPodId: string | null = null;
  private developmentMode: boolean = false;
  
  constructor() 
  {
    this.inputState = 
    {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
      mouseDeltaX: 0,
      mouseDeltaY: 0,
      mouseWheel: 0,
      cameraSwitchPressed: false,
      isMouseDown: false,
      mouseX: 0,
      mouseY: 0
    };
    
    this.callbacks = {};
    this.movementSpeed = 0.1;
  }

  // ===== Initialization =====

  public initialize(canvas: HTMLCanvasElement, callbacks: InputCallbacks): void 
  {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.setupEventListeners();
    this.isActive = true;
    
    console.log('InputManager initialized');
  }

  public setDevelopmentMode(enabled: boolean): void 
  {
    this.developmentMode = enabled;
    console.log(`Development mode: ${enabled ? 'ON' : 'OFF'}`);
  }

  // ===== Component References =====

  public setCameraMode(mode: CameraMode): void 
  {
    this.currentCameraMode = mode;
  }

  public setFreeCamera(camera: FreeCamera | null): void 
  {
    this.freeCamera = camera;
  }

  public setPhysicsSystem(physics: RacerPhysics | null, podId: string | null): void 
  {
    this.racerPhysics = physics;
    this.playerPodId = podId;
  }

  // ===== Event Listeners =====

  private setupEventListeners(): void 
  {
    if (!this.canvas) 
    {
      return;
    }

    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('wheel', this.onMouseWheel.bind(this));
    
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    this.canvas.tabIndex = 1;
    this.canvas.focus();
  }

  private onKeyDown(event: KeyboardEvent): void 
  {
    if (!this.isActive) 
    {
      return;
    }
    
    switch (event.code) 
    {
      case 'KeyW':
        this.inputState.forward = true;
        break;
      case 'KeyS':
        this.inputState.backward = true;
        break;
      case 'KeyA':
        this.inputState.left = true;
        break;
      case 'KeyD':
        this.inputState.right = true;
        break;
      case 'Space':
        this.inputState.up = true;
        event.preventDefault();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.inputState.down = true;
        break;
        
      case 'F1':
        if (!this.inputState.cameraSwitchPressed) 
        {
          this.inputState.cameraSwitchPressed = true;
          this.callbacks.onCameraSwitch?.();
        }
        event.preventDefault();
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void 
  {
    if (!this.isActive) 
    {
      return;
    }
    
    switch (event.code) 
    {
      case 'KeyW':
        this.inputState.forward = false;
        break;
      case 'KeyS':
        this.inputState.backward = false;
        break;
      case 'KeyA':
        this.inputState.left = false;
        break;
      case 'KeyD':
        this.inputState.right = false;
        break;
      case 'Space':
        this.inputState.up = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.inputState.down = false;
        break;
        
      case 'F1':
        this.inputState.cameraSwitchPressed = false;
        break;
    }
  }

  private onMouseDown(event: MouseEvent): void 
  {
    if (!this.isActive) 
    {
      return;
    }
    
    this.inputState.isMouseDown = true;
    this.inputState.mouseX = event.clientX;
    this.inputState.mouseY = event.clientY;
  }

  private onMouseUp(event: MouseEvent): void 
  {
    if (!this.isActive) 
    {
      return;
    }
    
    this.inputState.isMouseDown = false;
  }

  private onMouseMove(event: MouseEvent): void 
  {
    if (!this.isActive) 
    {
      return;
    }
    
    this.inputState.mouseDeltaX = event.movementX || (event.clientX - this.inputState.mouseX);
    this.inputState.mouseDeltaY = event.movementY || (event.clientY - this.inputState.mouseY);
    
    this.inputState.mouseX = event.clientX;
    this.inputState.mouseY = event.clientY;

    // ===== Mouse Look for Free Camera =====
    if (this.currentCameraMode === CameraMode.FREE && this.freeCamera && this.inputState.isMouseDown) 
    {
      this.freeCamera.rotation.y += this.inputState.mouseDeltaX * this.mouseSensitivity;
      this.freeCamera.rotation.x += this.inputState.mouseDeltaY * this.mouseSensitivity;
      
      this.freeCamera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.freeCamera.rotation.x));
    }
  }

  private onMouseWheel(event: WheelEvent): void 
  {
    if (!this.isActive) 
    {
      return;
    }
    
    const delta = event.deltaY > 0 ? 1 : -1;
    this.inputState.mouseWheel = delta;
    
    if (this.currentCameraMode === CameraMode.FREE && this.freeCamera) 
    {
      const forward = this.freeCamera.getDirection(new Vector3(0, 0, 1));
      const movement = forward.scale(-delta * 2);
      this.freeCamera.position.addInPlace(movement);
    } 
    else 
    {
      this.callbacks.onMouseWheel?.(delta);
    }
    
    event.preventDefault();
  }

  // ===== Input Processing =====

  public update(): void 
  {
    if (!this.isActive) 
    {
      return;
    }
    
    const direction = { x: 0, y: 0, z: 0 };
    
    if (this.inputState.forward) 
    {
      direction.z += this.movementSpeed;
    }
    if (this.inputState.backward) 
    {
      direction.z -= this.movementSpeed;
    }
    if (this.inputState.left) 
    {
      direction.x -= this.movementSpeed;
    }
    if (this.inputState.right) 
    {
      direction.x += this.movementSpeed;
    }
    if (this.inputState.up) 
    {
      direction.y += this.movementSpeed;
    }
    if (this.inputState.down) 
    {
      direction.y -= this.movementSpeed;
    }
    
    if (direction.x !== 0 || direction.y !== 0 || direction.z !== 0) 
    {
      this.handleMovement(direction);
    }
  }

  private handleMovement(direction: { x: number; y: number; z: number }): void 
  {
    if (this.currentCameraMode === CameraMode.FREE && this.freeCamera) 
    {
      // ===== Free Camera Movement =====
      const moveVector = new Vector3(direction.x, direction.y, direction.z);
      moveVector.scaleInPlace(0.5);
      
      const forward = this.freeCamera.getDirection(new Vector3(0, 0, 1));
      const right = this.freeCamera.getDirection(new Vector3(1, 0, 0));
      const up = Vector3.Up();
      
      const movement = forward.scale(moveVector.z)
        .add(right.scale(moveVector.x))
        .add(up.scale(moveVector.y));
      
      this.freeCamera.position.addInPlace(movement);
    }
    else if ((this.currentCameraMode === CameraMode.PLAYER || this.currentCameraMode === CameraMode.RACING) 
             && this.racerPhysics && this.playerPodId) 
    {
      // ===== Physics Movement (Direct) =====
      const physicsInput = 
      {
        x: direction.x,
        z: direction.z
      };

      this.racerPhysics.movePod(this.playerPodId, physicsInput);
    }
  }

  // ===== State Getters =====

  public getInputState(): Readonly<InputState> 
  {
    return this.inputState;
  }

  public isMovementActive(): boolean 
  {
    return this.inputState.forward || this.inputState.backward || 
           this.inputState.left || this.inputState.right || 
           this.inputState.up || this.inputState.down;
  }

  public getCurrentMovementDirection(): { x: number; y: number; z: number } 
  {
    const direction = { x: 0, y: 0, z: 0 };
    
    if (this.inputState.forward) direction.z += this.movementSpeed;
    if (this.inputState.backward) direction.z -= this.movementSpeed;
    if (this.inputState.left) direction.x -= this.movementSpeed;
    if (this.inputState.right) direction.x += this.movementSpeed;
    if (this.inputState.up) direction.y += this.movementSpeed;
    if (this.inputState.down) direction.y -= this.movementSpeed;
    
    return direction;
  }

  // ===== Configuration =====

  public setMovementSpeed(speed: number): void 
  {
    this.movementSpeed = speed;
  }

  public setMouseSensitivity(sensitivity: number): void 
  {
    this.mouseSensitivity = sensitivity;
  }

  public getMovementSpeed(): number 
  {
    return this.movementSpeed;
  }

  public getMouseSensitivity(): number 
  {
    return this.mouseSensitivity;
  }

  public setActive(active: boolean): void 
  {
    this.isActive = active;
    
    if (!active) 
    {
      this.resetInputState();
    }
  }

  // ===== Cleanup =====

  private resetInputState(): void 
  {
    this.inputState.forward = false;
    this.inputState.backward = false;
    this.inputState.left = false;
    this.inputState.right = false;
    this.inputState.up = false;
    this.inputState.down = false;
    this.inputState.isMouseDown = false;
    this.inputState.cameraSwitchPressed = false;
  }

  public dispose(): void 
  {
    console.log('Disposing InputManager');
    
    this.isActive = false;
    
    if (this.canvas) 
    {
      document.removeEventListener('keydown', this.onKeyDown.bind(this));
      document.removeEventListener('keyup', this.onKeyUp.bind(this));
      
      this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
      this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
      this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
      this.canvas.removeEventListener('wheel', this.onMouseWheel.bind(this));
    }
    
    if (document.pointerLockElement === this.canvas) 
    {
      document.exitPointerLock();
    }
    
    this.canvas = null;
    this.freeCamera = null;
    this.racerPhysics = null;
    this.playerPodId = null;
    this.resetInputState();
  }
}