// User input handling with Pod Movement Support

export interface InputState 
{
  // Movement keys
  forward: boolean;    // W
  backward: boolean;   // S
  left: boolean;       // A
  right: boolean;      // D
  up: boolean;         // Space
  down: boolean;       // Shift
  
  // Camera controls
  mouseDeltaX: number;
  mouseDeltaY: number;
  mouseWheel: number;
  
  // Camera switching
  cameraSwitchPressed: boolean; // F1 key
  
  // Mouse state
  isMouseDown: boolean;
  mouseX: number;
  mouseY: number;
}

export interface InputCallbacks 
{
  onMovement?: (direction: { x: number; y: number; z: number }) => void;
  onMouseLook?: (deltaX: number, deltaY: number) => void;
  onMouseWheel?: (delta: number) => void;
  onCameraSwitch?: () => void;
  onPodMovement?: (direction: { x: number; y: number; z: number }) => void;
}

export class InputManager 
{
  private inputState: InputState;
  private callbacks: InputCallbacks;
  private canvas: HTMLCanvasElement | null = null;
  private isActive: boolean = false;
  
  // Movement speed settings
  private movementSpeed: number = 0.5;
  private mouseSensitivity: number = 0.002;
  
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
  }

  // Initialize input system
  public initialize(canvas: HTMLCanvasElement, callbacks: InputCallbacks): void 
  {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.setupEventListeners();
    this.isActive = true;
    
    console.log('🎮 InputManager initialized with pod movement support');
  }

  // Setup all event listeners
  private setupEventListeners(): void 
  {
    if (!this.canvas) return;

    // Keyboard events
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    
    // Mouse events
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('wheel', this.onMouseWheel.bind(this));
    
    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Focus canvas for keyboard input
    this.canvas.tabIndex = 1;
    this.canvas.focus();
  }

  // Keyboard event handlers
  private onKeyDown(event: KeyboardEvent): void 
  {
    if (!this.isActive) return;
    
    switch (event.code) 
    {
      // Movement keys
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
        
      // Camera switch
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
    if (!this.isActive) return;
    
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

  // Mouse event handlers
  private onMouseDown(event: MouseEvent): void 
  {
    if (!this.isActive) return;
    
    this.inputState.isMouseDown = true;
    this.inputState.mouseX = event.clientX;
    this.inputState.mouseY = event.clientY;
    
    // Request pointer lock for better mouse control
    if (event.button === 0) 
    { // Left click
      this.canvas?.requestPointerLock();
    }
  }

  private onMouseUp(_event: MouseEvent): void 
  {
    if (!this.isActive) return;
    
    this.inputState.isMouseDown = false;
    
    // Exit pointer lock
    if (document.pointerLockElement === this.canvas) 
    {
      document.exitPointerLock();
    }
  }

  private onMouseMove(event: MouseEvent): void 
  {
    if (!this.isActive) return;
    
    let deltaX = 0;
    let deltaY = 0;
    
    // Use movementX/Y if in pointer lock, otherwise calculate delta
    if (document.pointerLockElement === this.canvas) 
    {
      deltaX = event.movementX || 0;
      deltaY = event.movementY || 0;
    } 
    else if (this.inputState.isMouseDown) 
    {
      deltaX = event.clientX - this.inputState.mouseX;
      deltaY = event.clientY - this.inputState.mouseY;
      this.inputState.mouseX = event.clientX;
      this.inputState.mouseY = event.clientY;
    }
    
    if (deltaX !== 0 || deltaY !== 0) 
    {
      this.inputState.mouseDeltaX = deltaX * this.mouseSensitivity;
      this.inputState.mouseDeltaY = deltaY * this.mouseSensitivity;
      
      this.callbacks.onMouseLook?.(this.inputState.mouseDeltaX, this.inputState.mouseDeltaY);
    }
  }

  private onMouseWheel(event: WheelEvent): void 
  {
    if (!this.isActive) return;
    
    const delta = event.deltaY > 0 ? 1 : -1;
    this.inputState.mouseWheel = delta;
    
    this.callbacks.onMouseWheel?.(delta);
    event.preventDefault();
  }

  // Update movement - now supports both camera and pod movement
  public update(): void 
  {
    if (!this.isActive) return;
    
    // Calculate movement direction
    const direction = { x: 0, y: 0, z: 0 };
    
    if (this.inputState.forward) direction.z += this.movementSpeed;
    if (this.inputState.backward) direction.z -= this.movementSpeed;
    if (this.inputState.left) direction.x -= this.movementSpeed;
    if (this.inputState.right) direction.x += this.movementSpeed;
    if (this.inputState.up) direction.y += this.movementSpeed;
    if (this.inputState.down) direction.y -= this.movementSpeed;
    
    // Send movement if any key is pressed
    if (direction.x !== 0 || direction.y !== 0 || direction.z !== 0) 
    {
      // Send to main movement callback (will be routed by CameraManager)
      this.callbacks.onMovement?.(direction);
    }
  }

  // Direct pod movement callback (alternative method - not currently used)
  public triggerPodMovement(direction: { x: number; y: number; z: number }): void 
  {
    this.callbacks.onPodMovement?.(direction);
  }

  // Get current input state
  public getInputState(): Readonly<InputState> 
  {
    return this.inputState;
  }

  // Check if movement keys are currently pressed
  public isMovementActive(): boolean 
  {
    return this.inputState.forward || this.inputState.backward || 
           this.inputState.left || this.inputState.right || 
           this.inputState.up || this.inputState.down;
  }

  // Get current movement direction
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

  // Settings
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

  // Enable/disable input handling
  public setActive(active: boolean): void 
  {
    this.isActive = active;
    
    if (!active) 
    {
      // Reset all input states
      this.resetInputState();
    }
  }

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

  // Cleanup
  public dispose(): void 
  {
    console.log('🎮 Disposing InputManager...');
    
    this.isActive = false;
    
    if (this.canvas) 
    {
      // Remove event listeners
      document.removeEventListener('keydown', this.onKeyDown.bind(this));
      document.removeEventListener('keyup', this.onKeyUp.bind(this));
      
      this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
      this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
      this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
      this.canvas.removeEventListener('wheel', this.onMouseWheel.bind(this));
    }
    
    // Exit pointer lock if active
    if (document.pointerLockElement === this.canvas) 
    {
      document.exitPointerLock();
    }
    
    this.canvas = null;
    this.resetInputState();
  }
}