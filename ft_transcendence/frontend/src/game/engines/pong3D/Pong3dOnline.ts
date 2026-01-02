import { Engine, Scene, FreeCamera, HemisphericLight, Mesh, MeshBuilder, StandardMaterial, Vector3, Color3, Color4, KeyboardEventTypes, AbstractMesh } from "@babylonjs/core";
import { GameConfig, GameState, GameEvent, GameEngine } from "../../utils/GameTypes";
import { OGameEvent } from "@/game/utils/OnlineInterface";
import { Skybox } from "./entities/Skybox";
import { loadModel } from "./entities/ModelLoader";
import { PADDLE_COLORS } from "./entities/PaddleColor";

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
    
    // Game Objects
    private ball!: Mesh;
    private paddle_left!: Mesh;
    private paddle_right!: Mesh;
    private platform: AbstractMesh[] = [];

    // Network & ID
    private connection: WebSocketLikeConnection;
    private gameId: string;
    private playerId: string;
    private playerSide: 'left' | 'right';

    
    // DIMENSIONS & SCALING
    
    private readonly SERVER_WIDTH = 958;
    private readonly SERVER_HEIGHT = 538;
    private readonly GROUND_HEIGHT = 45;

    // 3D Field (Matches 16:9 Aspect Ratio of Server)
    private readonly FIELD_WIDTH = 60;
    private readonly FIELD_LENGTH = 33.7; 
    
    private readonly PADDLE_DEPTH = 6.25; 
    private readonly BALL_DIAMETER = 1.0; 

    // State
    private paused: boolean = false;
    private ended: boolean = false;
    private keys: Record<string, boolean> = {};
    private canChangeCamera: boolean = true;
    private config : GameConfig
    
    // Input Throttling
    private lastInputSent: number = 0;
    private lastDirection: 'up' | 'down' | 'none' = 'none';

    // Scores
    private player1Score: number = 0;
    private player2Score: number = 0;

    // Events
    private eventCallbacks: Array<(event: GameEvent) => void> = [];

    // Keybinds
    private keybinds = {
        p1: { left: "a", right: "d" },
        p2: { left: "a", right: "d" }
    };

    constructor(
        canvas: HTMLCanvasElement,
        config: GameConfig,
        connection: any,
        gameId: string,
        playerId: string,
        playerSide: 'left' | 'right'
    ) {
        this.connection = connection;
        this.gameId = gameId;
        this.playerId = playerId;
        this.playerSide = playerSide;
        this.config = config;

        // Init Engine
        this.engine = new Engine(canvas, true);
        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(0, 0, 0, 1);

        // Setup
        this.setupInput();
        this.createCamera();
        this.createLight();
        this.createEnvironment();
        this.createGameObjects();
        this.enableCollisions();
        this.setupNetworkListeners();

        // Handle resize
        window.addEventListener("resize", () => this.engine.resize());
        console.log(this.paused)
    }

   
    // NETWORK SYNC 
 
    private setupNetworkListeners(): void {
        this.connection.on('game:state', (data: any) => {
            if (data?.gameId === this.gameId) {
                this.applyServerState(data.state);
            }
        });

        this.connection.on('game:event', (data: OGameEvent['payload']) => {
            if (data?.gameId === this.gameId) {
                this.handleServerEvent(data.event);
            }
        });

        // Listen for lobby customization updates and apply paddle colors
        this.connection.on('lobby:player:update', (payload: any) => {
            try {
                if (!payload || !payload.paddle) return;
                const color = this.getPaddleColor((payload.paddle || '').toLowerCase());
                if (payload.userId === this.playerId) {
                    // local player
                    if (this.playerSide === 'left') {
                        (this.paddle_left.material as StandardMaterial).diffuseColor = color.diffuse;
                        (this.paddle_left.material as StandardMaterial).emissiveColor = color.emissive;
                    } else {
                        (this.paddle_right.material as StandardMaterial).diffuseColor = color.diffuse;
                        (this.paddle_right.material as StandardMaterial).emissiveColor = color.emissive;
                    }
                } else {
                    // opponent
                    if (this.playerSide === 'left') {
                        (this.paddle_right.material as StandardMaterial).diffuseColor = color.diffuse;
                        (this.paddle_right.material as StandardMaterial).emissiveColor = color.emissive;
                    } else {
                        (this.paddle_left.material as StandardMaterial).diffuseColor = color.diffuse;
                        (this.paddle_left.material as StandardMaterial).emissiveColor = color.emissive;
                    }
                }
            } catch (err) {
                // ignore
            }
        });
    }

    private applyServerState(state: any): void {
        if (!state) return;

        // Calc scale factors (Field / Server)
        const scaleX = this.FIELD_WIDTH / this.SERVER_WIDTH;
        const scaleZ = this.FIELD_LENGTH / this.SERVER_HEIGHT;

        if (state.ball) 
        { 
            const targetX = (state.ball.x * scaleX) - (this.FIELD_WIDTH / 2);
            const targetZ = (state.ball.y * scaleZ) - (this.FIELD_LENGTH / 2);
            const dist = Math.abs(this.ball.position.x - targetX);
            if (dist > 10) 
            {
                this.ball.position.x = targetX;
                this.ball.position.z = targetZ;
            } 
            else 
            {
                this.ball.position.x = this.lerp(this.ball.position.x, targetX, 0.3);
                this.ball.position.z = this.lerp(this.ball.position.z, targetZ, 0.3);
            }
        }

        if (state.paddle1) 
        {
            // Convert Top-Left Y to Center Z
            const z = (state.paddle1.y * scaleZ) - (this.FIELD_LENGTH / 2) + (this.PADDLE_DEPTH / 2);
            this.paddle_left.position.z = this.lerp(this.paddle_left.position.z, z, 0.5);
        }
        
        if (state.paddle2) 
        {
            const z = (state.paddle2.y * scaleZ) - (this.FIELD_LENGTH / 2) + (this.PADDLE_DEPTH / 2);
            this.paddle_right.position.z = this.lerp(this.paddle_right.position.z, z, 0.5);
        }

        // Score Sync
        if (state.scores) 
            this.updateScore(state.scores.player1 || 0, state.scores.player2 || 0);
        
    }

    private updateScore(p1: number, p2: number) {
        if (p1 !== this.player1Score || p2 !== this.player2Score) {
            this.player1Score = p1;
            this.player2Score = p2;
            this.emitEvent({
                type: 'score-updated',
                player1Score: p1,
                player2Score: p2
            });
        }
    }

    private lerp(start: number, end: number, amt: number): number 
    {
        return (1 - amt) * start + amt * end;
    }

    private handleServerEvent(event: OGameEvent['payload']['event']): void 
    {
        switch (event.type) 
        {
            case 'goal':
                this.emitEvent({ type: 'goal-scored', scorer: event.data?.scorer || 'player1' });
                break;
            case 'paddle-hit':
                this.emitEvent({ type: 'paddle-hit', paddle: event.data?.paddle || 'left' });
                break;
            case 'wall-hit':
                const wallBoundary = this.FIELD_LENGTH / 2;
                const hitZ = this.ball.position.z > 0 ? wallBoundary : -wallBoundary;
                this.flashWallHit(new Vector3(
                    this.ball.position.x, 
                    this.GROUND_HEIGHT + 2, 
                    hitZ
                ));
                this.emitEvent({ type: 'wall-hit' });
                break;
            case 'game-end':
                this.ended = true;
                this.emitEvent({ type: 'game-ended', winner: event.data?.winner });
                break;
        }
    }

    private flashWallHit(position: Vector3): void 
    {
        const size = 5; 
        const flash = MeshBuilder.CreatePlane("flash", { size }, this.scene);

        const mat = new StandardMaterial("flashMat", this.scene);
        mat.diffuseColor = new Color3(1, 0, 0);
        mat.emissiveColor = new Color3(1, 0, 0);
        mat.alpha = 0.6;
        mat.backFaceCulling = false;
        flash.material = mat;
        
        flash.position.copyFrom(position);
        flash.position.y += 1; 
        
        // Animation
        let alpha = 0.8;
        const interval = setInterval(() => {
            alpha -= 0.05;
            mat.alpha = alpha;
            if (alpha <= 0) {
                flash.dispose();
                clearInterval(interval);
            }
        }, 30);
    }

    
    // INPUT 
   
    private sendInput(): void {
        const now = Date.now();
        if (now - this.lastInputSent < 16) 
            return;

        let direction: 'up' | 'down' | 'none' = 'none';

        if (this.playerSide === 'left') 
        {
            const pressLeft = this.keys[this.keybinds.p1.left]; 
            const pressRight = this.keys[this.keybinds.p1.right]; 
            if (pressLeft && !pressRight) 
                direction = 'down';
            else if (pressRight && !pressLeft) 
                direction = 'up';   
        } 
        else 
        {
            const pressRight = this.keys[this.keybinds.p2.right]; 
            const pressLeft = this.keys[this.keybinds.p2.left]; 
            if (pressRight && !pressLeft) 
                direction = 'down'; 
            else if (pressLeft && !pressRight) 
                direction = 'up';   
        }

        if (direction !== this.lastDirection || direction !== 'none') 
        {
            this.connection.send('game:input', {
                gameId: this.gameId,
                playerId: this.playerId,
                input: { direction }
            });
            this.lastInputSent = now;
            this.lastDirection = direction;
        }
    }

  
    // SETUP
   
    private setupInput(): void {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            const key = kbInfo.event.key.toLowerCase();
            this.keys[key] = kbInfo.type === KeyboardEventTypes.KEYDOWN;

            // Camera toggle
            if (key === 'c' && kbInfo.type === KeyboardEventTypes.KEYDOWN && this.canChangeCamera) {
                this.changeCamera();
                this.canChangeCamera = false;
                setTimeout(() => this.canChangeCamera = true, 500);
            }
        });

        window.addEventListener('blur', () => { this.keys = {}; });
    }

    start(): void 
    {
        this.paused = false;
        this.connection.send('game:ready', { gameId: this.gameId, playerId: this.playerId });
        
        this.engine.runRenderLoop(() => 
        {
            if (!this.ended) 
            {
                this.scene.render();
                this.sendInput(); 
            }
        });
        
        this.emitEvent({ type: 'game-started' });
    }

    stop(): void {
        this.engine.stopRenderLoop();
        this.paused = true;
    }

    pause(): void { this.paused = true; }
    resume(): void { this.paused = false; }

    // Babylon Setup
    private createCamera(): void 
    {
        const xPos = this.playerSide === 'left' ? -110 : 110;                 //Player1 Camera
        const yRot = this.playerSide === 'left' ? Math.PI / 2 : -Math.PI / 2; //Player2 Camera
        
        this.camera = new FreeCamera("camera", new Vector3(xPos, 90, 0), this.scene);
        this.camera.rotation = new Vector3(Math.PI / 11, yRot, 0);
        
        this.topCamera = new FreeCamera("topCamera", new Vector3(0, 102.50, 0), this.scene);
        this.topCamera.rotation = new Vector3(Math.PI / 2, 0, 0);
        
        this.scene.activeCamera = this.camera;
    }

    private createLight(): void {
        this.light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
        this.light.intensity = 0.2;
    }

   private async createEnvironment(): Promise<void> 
    {
        //Invisible Ground 
        const ground = MeshBuilder.CreateGround(
            "ground", 
            { width: this.FIELD_WIDTH, height: this.FIELD_LENGTH }, 
            this.scene
        );
        ground.position.y = this.GROUND_HEIGHT;
        ground.visibility = 0; 
        ground.checkCollisions = true;

        //Skybox
        Skybox.createFromGLB(this.scene, "assets/images/skybox2.glb");

        //Floating Platform Model
        try {
            this.platform = await loadModel(
                this.scene, 
                "assets/models/pong/", 
                "sci-fi_platform.glb", 
                new Vector3(0, 0, 0) 
            );

            if (this.platform && this.platform[0]) 
            {
                this.platform[0].scaling = new Vector3(6.5, 6.5, 6.5);
                this.platform[0].position = new Vector3(0, -70, 0); 
                this.platform.forEach(mesh => mesh.isPickable = false);
            }
        } 
        catch (error) { console.error("FAILED to load Game Platform:", error); }

        
        
        const borderMat = new StandardMaterial("borderMat", this.scene);
        borderMat.diffuseColor = new Color3(0, 0, 0);
        borderMat.emissiveColor = new Color3(0, 0.8, 1); 
        borderMat.alpha = 0.5; 

        const lineThickness = 0.5; 
        
        // Top Boundary Line
        const topLine = MeshBuilder.CreateBox("topLine", { 
            width: this.FIELD_WIDTH, 
            height: 0.1, 
            depth: lineThickness 
        }, this.scene);
        
        
        topLine.position = new Vector3(0, this.GROUND_HEIGHT + 0.05, this.FIELD_LENGTH / 2);
        topLine.material = borderMat;

        // Bottom Boundary Line
        const bottomLine = MeshBuilder.CreateBox("bottomLine", { 
            width: this.FIELD_WIDTH, 
            height: 0.1, 
            depth: lineThickness 
        }, this.scene);

        
        bottomLine.position = new Vector3(0, this.GROUND_HEIGHT + 0.05, -this.FIELD_LENGTH / 2);
        bottomLine.material = borderMat;
    }

    private createGameObjects(): void 
    {
        // Ball
        this.ball = MeshBuilder.CreateSphere("ball", { diameter: this.BALL_DIAMETER }, this.scene);
        const ballMat = new StandardMaterial("ballMat", this.scene);
        ballMat.diffuseColor = new Color3(1, 1, 0);
        ballMat.emissiveColor = new Color3(0.2, 0.2, 0);
        this.ball.material = ballMat;
        this.ball.position = new Vector3(0, this.GROUND_HEIGHT + 1, 0);

        // Paddles
        const p1Color = this.getPaddleColor(this.config?.paddlecolor1 || 'default');
        this.paddle_left = this.createPaddle("left_paddle", -this.FIELD_WIDTH / 2 + 3, p1Color);

        const p2Color = this.getPaddleColor(this.config?.paddlecolor2 || 'default');
        this.paddle_right = this.createPaddle("right_paddle", this.FIELD_WIDTH / 2 - 3, p2Color);
    }

    private createPaddle(name: string, xPos: number, color: {diffuse: Color3, emissive: Color3}): Mesh 
    {
        const mat = new StandardMaterial(name + "Mat", this.scene);
        mat.diffuseColor = color.diffuse;
        mat.emissiveColor = color.emissive;
        
        const mesh = MeshBuilder.CreateBox(name, { width: 1.5, height: 2, depth: this.PADDLE_DEPTH }, this.scene);
        mesh.position = new Vector3(xPos, this.GROUND_HEIGHT + 1, 0);
        mesh.material = mat;
        return mesh;
    }

    private getPaddleColor(colorName: string) 
    {
        const key = (colorName || 'default').toLowerCase();
        const base = PADDLE_COLORS[key] || PADDLE_COLORS['default'];
        // Make a slightly dimmer emissive color
        const emissive = new Color3(base.r * 0.5, base.g * 0.5, base.b * 0.5);
        return { diffuse: base, emissive };
    }

    private enableCollisions(): void {
        this.scene.collisionsEnabled = true;
    }

    private changeCamera(): void {
        const isTop = this.scene.activeCamera === this.topCamera;
        this.scene.activeCamera = isTop ? this.camera : this.topCamera;
        
        if (!isTop) 
        { 
            this.keybinds.p1 = { left: "w", right: "s" };
            this.keybinds.p2 = { left: "arrowup", right: "arrowdown" };
        } 
        else 
        { 
            this.keybinds.p1 = { left: "a", right: "d" };
            this.keybinds.p2 = { left: "arrowleft", right: "arrowright" };
        }
    }

    getState(): GameState 
    {
        return {
            ball: { x: this.ball.position.x, y: this.ball.position.z, dx: 0, dy: 0 },
            paddle1: { y: this.paddle_left.position.z },
            paddle2: { y: this.paddle_right.position.z },
            timestamp: Date.now()
        };
    }

    onEvent(callback: (event: GameEvent) => void): void { this.eventCallbacks.push(callback); }
    
    private emitEvent(event: GameEvent): void { this.eventCallbacks.forEach(cb => cb(event)); }

    destroy(): void 
    {
        this.stop();
        this.connection.send('game:leave', { gameId: this.gameId, playerId: this.playerId });
        this.scene.dispose();
        this.engine.dispose();
        this.eventCallbacks = [];
        window.removeEventListener("resize", () => this.engine.resize());
    }
}