import { RacerPhysics } from '../engines/racer/RacerPhysics';
import { webSocketService } from '@/services/websocket/WebSocketService';

export enum CameraMode 
{
  RACING = 'racing',
  PLAYER = 'player'
}

export interface InputState 
{
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  
  mouseWheel: number;
  
  cameraSwitchPressed: boolean;
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
  
  private movementSpeed: number = 1.0;
  
  private racerPhysics: RacerPhysics | null = null;
  private playerPodId: string | null = null;
  private allowPodMovement: boolean = true;
  
  // Multiplayer mode
  private multiplayerMode: boolean = false;
  private gameId: string | null = null;
  private positionBroadcastInterval: number | null = null;
  
  constructor() 
  {
    this.inputState = 
    {
      forward: false,
      backward: false,
      left: false,
      right: false,
      mouseWheel: 0,
      cameraSwitchPressed: false,
      mouseX: 0,
      mouseY: 0
    };
    
    this.callbacks = {};
  }

  public initialize(canvas: HTMLCanvasElement, callbacks: InputCallbacks): void 
  {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.setupEventListeners();
    this.isActive = true;
  }

  public setPhysicsSystem(physics: RacerPhysics | null, podId: string | null): void 
  {
    this.racerPhysics = physics;
    this.playerPodId = podId;
  }

  /**
   * Enable multiplayer mode - inputs go to local physics + broadcast position
   */
  public setMultiplayerMode(gameId: string): void 
  {
    this.multiplayerMode = true;
    this.gameId = gameId;
    
    // Start broadcasting position at 20 Hz (every 50ms)
    this.startPositionBroadcast();
    
    console.log(`[InputManager] 🌐 Multiplayer mode enabled for game ${gameId}`);
  }

  /**
   * Disable multiplayer mode - inputs go to local physics only
   */
  public setSinglePlayerMode(): void 
  {
    this.multiplayerMode = false;
    this.gameId = null;
    this.stopPositionBroadcast();
    console.log('[InputManager] 🖥️ Single-player mode enabled');
  }

  /**
   * Start broadcasting player position to server
   */
  private startPositionBroadcast(): void 
  {
    if (this.positionBroadcastInterval) 
    {
      return;
    }
    
    // Broadcast position 20 times per second
    this.positionBroadcastInterval = setInterval(() => 
    {
      this.broadcastPlayerPosition();
    }, 50) as unknown as number;
    
    console.log('[InputManager] 📡 Position broadcast started (20 Hz)');
  }

  /**
   * Stop broadcasting player position
   */
  private stopPositionBroadcast(): void 
  {
    if (this.positionBroadcastInterval) 
    {
      clearInterval(this.positionBroadcastInterval);
      this.positionBroadcastInterval = null;
      console.log('[InputManager] 📡 Position broadcast stopped');
    }
  }

  /**
   * Broadcast current player position to server
   */
  private broadcastPlayerPosition(): void 
  {
    if (!this.multiplayerMode || !this.gameId || !this.racerPhysics || !this.playerPodId) 
    {
      return;
    }
    
    // Get current position and rotation from physics
    const position = this.racerPhysics.getPosition(this.playerPodId);
    const rotation = this.racerPhysics.getRotation(this.playerPodId);
    const velocity = this.racerPhysics.getVelocity(this.playerPodId);
    
    if (!position || !rotation) 
    {
      return;
    }
    
    // Send to server
    webSocketService.send('racer:position', {
      gameId: this.gameId,
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w },
      velocity: velocity ? { x: velocity.x, y: velocity.y, z: velocity.z } : { x: 0, y: 0, z: 0 }
    });
  }

  private setupEventListeners(): void 
  {
    if (!this.canvas) 
    {
      return;
    }

    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    
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
      case 'ArrowUp':
        this.inputState.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.inputState.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.inputState.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.inputState.right = true;
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
      case 'ArrowUp':
        this.inputState.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.inputState.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.inputState.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.inputState.right = false;
        break;
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
    
    this.callbacks.onMouseWheel?.(delta);
    
    event.preventDefault();
  }

  public update(): void 
  {
    if (!this.isActive) 
    {
      return;
    }
    
    const direction = { x: 0, z: 0 };
    
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
    
    if (direction.x !== 0 || direction.z !== 0) 
    {
      this.handleMovement(direction);
    }
  }

  private handleMovement(direction: { x: number; z: number }): void 
  {
    // ✅ ALWAYS move local pod with physics (client-authoritative)
    if (this.shouldSendToPhysics()) 
    {
      const physicsInput = 
      {
        x: direction.x,
        z: direction.z
      };

      if (this.racerPhysics && this.playerPodId) 
      {
        this.racerPhysics.movePod(this.playerPodId, physicsInput);
      }
    }
    
    // Note: Position broadcast happens separately at 20 Hz (see startPositionBroadcast)
  }

  private shouldSendToPhysics(): boolean 
  {
    return this.allowPodMovement &&
           this.racerPhysics !== null && 
           this.playerPodId !== null;
  }

  public setAllowPodMovement(allow: boolean): void 
  {
    this.allowPodMovement = allow;
  }
  
  public setActive(active: boolean): void 
  {
    this.isActive = active;
    
    if (!active) 
    {
      this.resetInputState();
    }
  }

  private resetInputState(): void 
  {
    this.inputState.forward = false;
    this.inputState.backward = false;
    this.inputState.left = false;
    this.inputState.right = false;
    this.inputState.cameraSwitchPressed = false;
  }

  public dispose(): void 
  {
    this.isActive = false;
    this.stopPositionBroadcast();
    
    if (this.canvas) 
    {
      document.removeEventListener('keydown', this.onKeyDown.bind(this));
      document.removeEventListener('keyup', this.onKeyUp.bind(this));
      
      this.canvas.removeEventListener('wheel', this.onMouseWheel.bind(this));
    }
    
    this.canvas = null;
    this.racerPhysics = null;
    this.playerPodId = null;
    this.multiplayerMode = false;
    this.gameId = null;
    this.resetInputState();
  }
}