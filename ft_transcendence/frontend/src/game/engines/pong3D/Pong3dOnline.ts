import { Engine, Scene, FreeCamera, HemisphericLight, Mesh, MeshBuilder, StandardMaterial, Vector3, Color3, Color4, KeyboardEventTypes, AbstractMesh } from "@babylonjs/core";
import { GameConfig, GameState, GameEvent, GameEngine } from "../../utils/GameTypes";
import { OGameEvent } from "@/game/utils/OnlineInterface";
import { Skybox } from "./entities/Skybox";
import { loadModel } from "./entities/ModelLoader";

interface WebSocketLikeConnection {
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    send(type: string, payload: any): boolean;
    isConnected(): boolean;
}

export class OnlinePong3D implements GameEngine 
{
    private engine: Engine;
    private scene: Scene;
    private camera!: FreeCamera;
    private topCamera!: FreeCamera;
    private light!: HemisphericLight;
    private ball!: Mesh;
    private paddle_left!: Mesh;
    private paddle_right!: Mesh;
    private platform: AbstractMesh[] = [];

    // Network
    private connection: WebSocketLikeConnection;
    private gameId: string;
    private playerId: string;
    private playerSide: 'left' | 'right';

    // CRITICAL: Backend sends coordinates in SCREEN SPACE (like 2D canvas)
    // We need to convert to CENTERED 3D SPACE
    private readonly SERVER_WIDTH = 958;
    private readonly SERVER_HEIGHT = 538;
    private readonly GROUND_HEIGHT = 45;

    // 3D Field dimensions (centered coordinates)
    private readonly FIELD_WIDTH = 60;
    private readonly FIELD_LENGTH = 33.7;
    private readonly PADDLE_DEPTH = 6.25; // (100 / 538) * 33.7
    private readonly BALL_DIAMETER = 1.0;

    // Configuration
    private config: GameConfig;

    // State
    private animationFrameId: number | null = null;
    private paused: boolean = false;
    private ended: boolean = false;
    private keys: Record<string, boolean> = {};
    private canChangeCamera: boolean = true;
    private lastBallPosition: Vector3 = new Vector3(0, 0, 0);
    private ballVelocity: Vector3 = new Vector3(0, 0, 0); // Track ball velocity for prediction

    // Input throttling
    private lastInputSent: number = 0;
    private inputThrottle: number = 16;
    private lastDirection: 'up' | 'down' | 'none' = 'none';

    // Scores
    private player1Score: number = 0;
    private player2Score: number = 0;

    // Event callbacks
    private eventCallbacks: Array<(event: GameEvent) => void> = [];

    // Collision tracking


    // Keybinds
    private keybinds = 
    {
        p1: { left: "a", right: "d" },
        p2: { left: "arrowleft", right: "arrowright" }
    };

    constructor(
        canvas: HTMLCanvasElement,
        config: GameConfig,
        connection: any,
        gameId: string,
        playerId: string,
        playerSide: 'left' | 'right'
    ) 
    {
        this.config = config;
        this.connection = connection;
        this.gameId = gameId;
        this.playerId = playerId;
        this.playerSide = playerSide;

        // Initialize Babylon.js
        this.engine = new Engine(canvas, true);
        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(0, 0, 0, 1);

        console.log(`[Online3DEngine] Init: gameId=${gameId}, playerId=${playerId}, side=${playerSide}`);
        console.log(`[Online3DEngine] Server dimensions: ${this.SERVER_WIDTH}x${this.SERVER_HEIGHT}`);
        console.log(`[Online3DEngine] 3D Field dimensions: ${this.FIELD_WIDTH}x${this.FIELD_LENGTH}`);
        console.log(this.animationFrameId, this.ballVelocity)

        // Setup game
        this.setupInput();
        this.createCamera();
        this.createLight();
        this.createEnvironment();
        this.createGameObjects();
        this.enableCollisions();

        // Setup network and game loop
        this.setupNetworkListeners();
        this.setupGameLoop();

        // Handle window resize
        window.addEventListener("resize", () => this.engine.resize());
    }

    private setupNetworkListeners(): void 
    {
        this.connection.on('game:state', (data: any) => {
            if (data && data.gameId === this.gameId) {
                this.applyServerState(data.state);
            }
        });

        this.connection.on('game:event', (data: OGameEvent['payload']) => {
            if (data && data.gameId === this.gameId) {
                this.handleServerEvent(data.event);
            }
        });
    }

    private applyServerState(state: any): void 
    {
        if (!state) return;

        // Calculate scale factors once
        const scaleX = this.FIELD_WIDTH / this.SERVER_WIDTH;
        const scaleZ = this.FIELD_LENGTH / this.SERVER_HEIGHT;

        if (state.ball) 
        {
            this.lastBallPosition.copyFrom(this.ball.position);
            
            // Map 2D X/Y to 3D X/Z
            // Center (0,0,0) is in middle of field, Backend (0,0) is top-left
            const newX = (state.ball.x * scaleX) - (this.FIELD_WIDTH / 2);
            const newZ = (state.ball.y * scaleZ) - (this.FIELD_LENGTH / 2);
            
            // Simple interpolation to smooth out network jitter
            this.ball.position.x = this.lerp(this.ball.position.x, newX, 0.3);
            this.ball.position.z = this.lerp(this.ball.position.z, newZ, 0.3);
        }

        if (state.paddle1) 
        {
            // Backend sends Top-Left Y. 3D needs Center Z.
            // Formula: (Y * scale) - (Field/2) + (PaddleHeight/2)
            const z = (state.paddle1.y * scaleZ) - (this.FIELD_LENGTH / 2) + (this.PADDLE_DEPTH / 2);
            this.paddle_left.position.z = this.lerp(this.paddle_left.position.z, z, 0.5);
        }
        
        if (state.paddle2) 
        {
            const z = (state.paddle2.y * scaleZ) - (this.FIELD_LENGTH / 2) + (this.PADDLE_DEPTH / 2);
            this.paddle_right.position.z = this.lerp(this.paddle_right.position.z, z, 0.5);
        }

        if (state.scores) 
        {
            const newP1 = state.scores.player1 || 0;
            const newP2 = state.scores.player2 || 0;

            if (newP1 !== this.player1Score || newP2 !== this.player2Score) 
            {
                this.player1Score = newP1;
                this.player2Score = newP2;

                console.log('[Online3DEngine] Score updated:', newP1, '-', newP2);

                this.emitEvent({
                    type: 'score-updated',
                    player1Score: this.player1Score,
                    player2Score: this.player2Score
                });
            }
        }
    }

    private lerp(start: number, end: number, amt: number): number {
        return (1 - amt) * start + amt * end;
    }

    private handleServerEvent(event: OGameEvent['payload']['event']): void 
    {
        switch (event.type) {
            case 'goal':
                this.emitEvent({
                    type: 'goal-scored',
                    scorer: event.data?.scorer || 'player1'
                });
                break;

            case 'paddle-hit':
                this.emitEvent({
                    type: 'paddle-hit',
                    paddle: event.data?.paddle || 'left'
                });
                break;

            case 'wall-hit':
                this.emitEvent({ type: 'wall-hit' });
                break;

            case 'game-end':
                this.ended = true;
                this.emitEvent({
                    type: 'game-ended',
                    winner: event.data?.winner || 'player1'
                });
                break;
        }
    }

    private sendInput(): void 
    {
        const now = Date.now();
        let direction: 'up' | 'down' | 'none' = 'none';

        if (this.playerSide === 'left') 
        {
            const leftKey = this.keys[this.keybinds.p1.left];
            const rightKey = this.keys[this.keybinds.p1.right];

            if (leftKey && rightKey) 
                direction = 'none';
            else if (leftKey) 
                direction = 'up';  // Changed from 'down'
            else if (rightKey)
                direction = 'down'; // Changed from 'up'
        } 
        else 
        {
            const leftKey = this.keys[this.keybinds.p2.left];
            const rightKey = this.keys[this.keybinds.p2.right];

            if (leftKey && rightKey) 
                direction = 'none';
            else if (leftKey) 
                direction = 'up';
            else if (rightKey) 
                direction = 'down';
        }

        const shouldSend = direction !== this.lastDirection || 
                          (now - this.lastInputSent >= this.inputThrottle) || 
                          direction !== 'none';

        if (!shouldSend) 
            return;

        const sent = this.connection.send('game:input', {
            gameId: this.gameId,
            playerId: this.playerId,
            input: {
                direction,
            }
        });

        if (sent) 
        {
            this.lastInputSent = now;
            this.lastDirection = direction;
        }
    }

    private setupInput(): void {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if ('repeat' in kbInfo.event && kbInfo.event.repeat) 
                return;

            const key = kbInfo.event.key.toLowerCase();
            this.keys[key] = kbInfo.type === KeyboardEventTypes.KEYDOWN;

            if (key === 'c' && kbInfo.type === KeyboardEventTypes.KEYDOWN && this.canChangeCamera) 
            {
                this.changeCamera();
                this.canChangeCamera = false;
                setTimeout(() => this.canChangeCamera = true, 500);
            }
        });

        window.addEventListener('blur', () => {
            this.keys = {};
        });
    }

    start(): void 
    {
        if (this.paused) 
            this.paused = false;

        console.log('[Online3DEngine] Sending Ready Signal');
        this.connection.send('game:ready', {
            gameId: this.gameId,
            playerId: this.playerId
        });

        this.engine.runRenderLoop(() => {
            if (!this.paused && !this.ended) {
                this.scene.render();
            }
        });

        this.emitEvent({ type: 'game-started' });
    }

    stop(): void {
        this.engine.stopRenderLoop();
        this.paused = true;
    }

    pause(): void 
    {
        this.paused = true;
    }

    resume(): void {
        this.paused = false;
    }

    private setupGameLoop(): void 
    {
        this.lastBallPosition.copyFrom(this.ball.position);
        
        this.scene.onBeforeRenderObservable.add(() => {
            if (this.paused || this.ended) 
                return;
            
            //this.checkPaddleCollision();
            this.sendInput();
        });
    }

    private createCamera(): void 
    {
        if (this.playerSide === 'left') 
        {
            this.camera = new FreeCamera("camera", new Vector3(-110, 90, 0), this.scene);
            this.camera.rotation = new Vector3(Math.PI / 11, Math.PI / 2, 0);
        }
        else 
        {
            this.camera = new FreeCamera("camera", new Vector3(110, 90, 0), this.scene);
            this.camera.rotation = new Vector3(Math.PI / 11, -Math.PI / 2, 0);
        }
        
        this.topCamera = new FreeCamera("topCamera", new Vector3(0, 102.50, 0), this.scene);
        this.topCamera.rotation = new Vector3(Math.PI / 2, 0, 0);
        
        this.scene.activeCamera = this.camera;
    }

    private createLight(): void 
    {
        this.light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
        this.light.intensity = 0.2;
    }

    private async createEnvironment(): Promise<void> 
    {
        const ground = MeshBuilder.CreateGround(
            "ground",
            { width: this.FIELD_WIDTH, height: this.FIELD_LENGTH },
            this.scene
        );
        ground.position.y = this.GROUND_HEIGHT;
        ground.visibility = 0;
        ground.checkCollisions = true;

        Skybox.createFromGLB(this.scene, "assets/images/skybox2.glb");

        this.platform = await loadModel(
            this.scene,
            "assets/models/pong/",
            "sci-fi_platform.glb",
            new Vector3(0, 0, 0)
        );
        this.platform[0].scaling = new Vector3(6.5, 6.5, 6.5);
        this.platform[0].position = new Vector3(0, -70, 0);
    }

    private createGameObjects(): void 
    {
        this.ball = MeshBuilder.CreateSphere("ball", { diameter: this.BALL_DIAMETER }, this.scene);
        const ballMat = new StandardMaterial("ballMat", this.scene);
        ballMat.diffuseColor = new Color3(1, 1, 0);
        ballMat.emissiveColor = new Color3(0.2, 0.2, 0);
        this.ball.material = ballMat;
        this.ball.position = new Vector3(0, this.GROUND_HEIGHT + 1, 0);

        const color1 = this.getPaddleColor(this.config.paddlecolor1 || 'default');
        const paddleMat1 = new StandardMaterial("paddleMat1", this.scene);
        paddleMat1.diffuseColor = color1.diffuse;
        paddleMat1.emissiveColor = color1.emissive;

        this.paddle_left = MeshBuilder.CreateBox(
            "left_paddle",
            { width: 1.5, height: 2, depth: this.PADDLE_DEPTH },
            this.scene
        );
        this.paddle_left.position = new Vector3(
            -this.FIELD_WIDTH / 2 + 5,
            this.GROUND_HEIGHT + 1,
            0
        );
        this.paddle_left.material = paddleMat1;

        const color2 = this.getPaddleColor(this.config.paddlecolor2 || 'default');
        const paddleMat2 = new StandardMaterial("paddleMat2", this.scene);
        paddleMat2.diffuseColor = color2.diffuse;
        paddleMat2.emissiveColor = color2.emissive;

        this.paddle_right = MeshBuilder.CreateBox(
            "right_paddle",
            { width: 1.5, height: 2, depth: this.PADDLE_DEPTH },
            this.scene
        );
        this.paddle_right.position = new Vector3(
            this.FIELD_WIDTH / 2 - 5,
            this.GROUND_HEIGHT + 1,
            0
        );
        this.paddle_right.material = paddleMat2;
    }

    private getPaddleColor(colorName: string): { diffuse: Color3, emissive: Color3 } {
        const colors: Record<string, { diffuse: Color3, emissive: Color3 }> = {
            'default': {
                diffuse: new Color3(0.9, 0.1, 0.1),
                emissive: new Color3(0.3, 0.05, 0.05)
            },
            'neon': {
                diffuse: new Color3(0, 1, 1),
                emissive: new Color3(0, 0.5, 0.5)
            },
            'fire': {
                diffuse: new Color3(1, 0.3, 0),
                emissive: new Color3(0.5, 0.1, 0)
            },
            'ice': {
                diffuse: new Color3(0.5, 0.8, 1),
                emissive: new Color3(0.2, 0.4, 0.5)
            },
            'rainbow': {
                diffuse: new Color3(1, 0, 1),
                emissive: new Color3(0.5, 0, 0.5)
            },
            'matrix': {
                diffuse: new Color3(0, 1, 0),
                emissive: new Color3(0, 0.5, 0)
            },
            'gold': {
                diffuse: new Color3(1, 0.84, 0),
                emissive: new Color3(0.5, 0.42, 0)
            },
            'shadow': {
                diffuse: new Color3(0.1, 0.1, 0.1),
                emissive: new Color3(0.05, 0.05, 0.05)
            }
        };

        return colors[colorName] || colors['default'];
    }

    private enableCollisions(): void 
    {
        this.scene.collisionsEnabled = true;
        this.ball.checkCollisions = true;
        this.paddle_left.checkCollisions = true;
        this.paddle_right.checkCollisions = true;

        this.paddle_left.ellipsoid = new Vector3(1.5, 1, 6);
        this.paddle_right.ellipsoid = new Vector3(1.5, 1, 6);
        this.ball.ellipsoid = new Vector3(1.2, 1.2, 1.2);
    }

    
  
    private changeCamera(): void 
    {
        if (this.scene.activeCamera === this.camera) 
        {
            this.scene.activeCamera = this.topCamera;
            this.keybinds.p1 = { left: "w", right: "s" };
            this.keybinds.p2 = { left: "arrowup", right: "arrowdown" };
        } 
        else 
        {
            this.scene.activeCamera = this.camera;
            this.keybinds.p1 = { left: "a", right: "d" };
            this.keybinds.p2 = { left: "arrowleft", right: "arrowright" };
        }
    }

    getState(): GameState {
        return {
            ball: {
                x: this.ball.position.x,
                y: this.ball.position.z,
                dx: 0,
                dy: 0,
            },
            paddle1: {
                y: this.paddle_left.position.z,
            },
            paddle2: {
                y: this.paddle_right.position.z,
            },
            timestamp: Date.now()
        };
    }

    onEvent(callback: (event: GameEvent) => void): void {
        this.eventCallbacks.push(callback);
    }

    destroy(): void {
        this.stop();

        this.connection.send('game:leave', {
            gameId: this.gameId,
            playerId: this.playerId
        });

        this.scene.dispose();
        this.engine.dispose();
        this.eventCallbacks = [];
    }

    private emitEvent(event: GameEvent): void {
        this.eventCallbacks.forEach(callback => callback(event));
    }
}



        // ========================================
        // COORDINATE CONVERSION: Screen Space → 3D Centered Space
        // ========================================
        //
        // SERVER (2D Canvas): Screen coordinates
        //   Origin: Top-left (0, 0)
        //   X range: 0 to SERVER_WIDTH (958)
        //   Y range: 0 to SERVER_HEIGHT (538)
        //   Center: (479, 269)
        //
        // CLIENT (3D World): Centered coordinates
        //   Origin: Center of field (0, GROUND_HEIGHT, 0)
        //   X range: -30 to +30 (FIELD_WIDTH = 60)
        //   Z range: -25 to +25 (FIELD_LENGTH = 50)
        //   Y: GROUND_HEIGHT (constant)
        //
        // CONVERSION FORMULA:
        //   client_x = (server_x / SERVER_WIDTH) * FIELD_WIDTH - (FIELD_WIDTH / 2)
        //   client_z = (server_y / SERVER_HEIGHT) * FIELD_LENGTH - (FIELD_LENGTH / 2)
        //   client_y = GROUND_HEIGHT + 1
        // ========================================