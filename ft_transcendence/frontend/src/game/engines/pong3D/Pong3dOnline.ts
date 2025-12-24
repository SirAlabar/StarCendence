import { Engine, Scene, FreeCamera, HemisphericLight, Mesh, MeshBuilder, StandardMaterial, Vector3, Color3, Color4, KeyboardEventTypes, AbstractMesh } from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import { GameConfig, GameState, GameEvent, GameEngine } from "../../utils/GameTypes";
import { OGameEvent } from "@/game/utils/OnlineInterface";
import { Skybox } from "./entities/Skybox";
import { loadModel } from "./entities/ModelLoader";

// Define WebSocket connection interface
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
    private pauseUi: GUI.AdvancedDynamicTexture | null = null;
    private pausePanel: GUI.StackPanel | null = null;

    // Network
    private connection: WebSocketLikeConnection;
    private gameId: string;
    private playerId: string;
    private playerSide: 'left' | 'right';

    // SERVER DIMENSIONS - The backend uses these fixed dimensions for physics
    private readonly SERVER_WIDTH = 60;  // Match your FIELD_WIDTH
    private readonly SERVER_LENGTH = 50; // Match your FIELD_LENGTH
    private readonly GROUND_HEIGHT = 45;

    // Field dimensions (visual)
    private readonly FIELD_WIDTH = 60;
    private readonly FIELD_LENGTH = 50;

    // Configuration
    private config: GameConfig;

    // State
    private animationFrameId: number | null = null;
    private paused: boolean = false;
    private ended: boolean = false;
    private keys: Record<string, boolean> = {};
    private canChangeCamera: boolean = true;

    // Input throttling
    private lastInputSent: number = 0;
    private inputThrottle: number = 16; // Match 60 FPS (~16ms per frame)
    private lastDirection: 'up' | 'down' | 'none' = 'none';

    // Scores
    private player1Score: number = 0;
    private player2Score: number = 0;

    // Event callbacks
    private eventCallbacks: Array<(event: GameEvent) => void> = [];

    // Keybinds (will change based on camera)
    private keybinds = {
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
    ) {
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
        console.log(this.animationFrameId);

        // Setup game
        this.setupInput();
        this.createCamera();
        this.createLight();
        this.createEnvironment();
        this.createGameObjects();
        this.enableCollisions();
        this.initUi();

        // Setup network and game loop
        this.setupNetworkListeners();
        this.setupGameLoop();

        // Handle window resize
        window.addEventListener("resize", () => this.engine.resize());
    }

    // ============ NETWORK SETUP ============
    private setupNetworkListeners(): void {
        // Listen for state updates from server
        this.connection.on('game:state', (data: any) => {
            if (data && data.gameId === this.gameId) {
                this.applyServerState(data.state);
            }
        });

        // Listen for game events
        this.connection.on('game:event', (data: OGameEvent['payload']) => {
            if (data && data.gameId === this.gameId) {
                this.handleServerEvent(data.event);
            }
        });
    }

    private applyServerState(state: any): void {
        if (!state) return;

        
        const scaleX = this.FIELD_WIDTH / this.SERVER_WIDTH;
        const scaleZ = this.FIELD_LENGTH / this.SERVER_LENGTH;

        
        if (state.ball) {
            this.ball.position.x = state.ball.x * scaleX;
            this.ball.position.z = state.ball.y * scaleZ; 
            
        }

        
        if (state.paddle1) {
            this.paddle_left.position.z = state.paddle1.y * scaleZ; // Server 'y' maps to client 'z'
        }
        if (state.paddle2) {
            this.paddle_right.position.z = state.paddle2.y * scaleZ; // Server 'y' maps to client 'z'
        }

        // Update Scores
        if (state.scores) {
            const newP1 = state.scores.player1 || 0;
            const newP2 = state.scores.player2 || 0;

            // Only emit if changed to avoid spam
            if (newP1 !== this.player1Score || newP2 !== this.player2Score) {
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

    private handleServerEvent(event: OGameEvent['payload']['event']): void {
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

    // ============ INPUT HANDLING ============
    private sendInput(): void {
        const now = Date.now();

        
        let direction: 'up' | 'down' | 'none' = 'none';

        if (this.playerSide === 'left') {
            // Player 1 controls
            const leftKey = this.keys[this.keybinds.p1.left];
            const rightKey = this.keys[this.keybinds.p1.right];

            // Don't move if both opposing keys are pressed
            if (leftKey && rightKey) {
                direction = 'none';
            } else if (leftKey) {
                direction = 'up';
            } else if (rightKey) {
                direction = 'down';
            }
        } else {
            // Player 2 controls
            const leftKey = this.keys[this.keybinds.p2.left];
            const rightKey = this.keys[this.keybinds.p2.right];

            // Don't move if both opposing keys are pressed
            if (leftKey && rightKey) {
                direction = 'none';
            } else if (leftKey) {
                direction = 'up';
            } else if (rightKey) {
                direction = 'down';
            }
        }

        
        const shouldSend = direction !== this.lastDirection || 
                          (now - this.lastInputSent >= this.inputThrottle) || 
                          direction !== 'none';

        if (!shouldSend) {
            return;
        }

        // Send input to server
        const sent = this.connection.send('game:input', {
            gameId: this.gameId,
            playerId: this.playerId,
            input: {
                direction,
            }
        });

        if (sent) {
            this.lastInputSent = now;
            this.lastDirection = direction;
        }
    }

    private setupInput(): void {
        this.scene.onKeyboardObservable.add((kbInfo: any) => {
            // Ignore keyboard repeat events
            if ('repeat' in kbInfo.event && kbInfo.event.repeat) return;

            const key = kbInfo.event.key.toLowerCase();
            this.keys[key] = kbInfo.type === KeyboardEventTypes.KEYDOWN;

            // Handle camera switch
            if (key === 'c' && kbInfo.type === KeyboardEventTypes.KEYDOWN && this.canChangeCamera) {
                this.changeCamera();
                this.canChangeCamera = false;
                setTimeout(() => this.canChangeCamera = true, 500);
            }
        });

        // Clear all keys when window loses focus
        window.addEventListener('blur', () => {
            this.keys = {};
        });
    }

    // ============ GAME LOOP ============
    start(): void {
        if (this.paused) this.paused = false;

        console.log('[Online3DEngine] Sending Ready Signal');
        this.connection.send('game:ready', {
            gameId: this.gameId,
            playerId: this.playerId
        });

        // Start Babylon.js render loop
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

    pause(): void {
        this.paused = true;
        this.emitEvent({ type: 'game-paused' });
        if (this.pausePanel) {
            this.pausePanel.isVisible = true;
        }
    }

    resume(): void {
        this.paused = false;
        this.emitEvent({ type: 'game-resumed' });
        if (this.pausePanel) {
            this.pausePanel.isVisible = false;
        }
    }

    private setupGameLoop(): void {
        this.scene.onBeforeRenderObservable.add(() => {
            if (this.paused || this.ended) return;

            // Send input to server
            this.sendInput();
        });
    }

    // ============ SCENE SETUP ============
    private createCamera(): void {
        // Side view camera
        this.camera = new FreeCamera("camera", new Vector3(0, 0, 0), this.scene);
        this.camera.position = new Vector3(-110, 90, 0);
        this.camera.rotation = new Vector3(Math.PI / 11, Math.PI / 2, 0);

        // Top-down camera
        this.topCamera = new FreeCamera("topCamera", new Vector3(0, 102.50, 0), this.scene);
        this.topCamera.rotation = new Vector3(Math.PI / 2, 0, 0);

        this.scene.activeCamera = this.camera;
    }

    private createLight(): void {
        this.light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
        this.light.intensity = 0.2;
    }

    private async createEnvironment(): Promise<void> {
        const ground = MeshBuilder.CreateGround(
            "ground",
            { width: this.FIELD_WIDTH, height: this.FIELD_LENGTH },
            this.scene
        );
        ground.position.y = this.GROUND_HEIGHT;
        ground.visibility = 0;
        ground.checkCollisions = true;

        // Skybox
        Skybox.createFromGLB(this.scene, "assets/images/skybox2.glb");

        // Platform model
        this.platform = await loadModel(
            this.scene,
            "assets/models/pong/",
            "sci-fi_platform.glb",
            new Vector3(0, 0, 0)
        );
        this.platform[0].scaling = new Vector3(6.5, 6.5, 6.5);
        this.platform[0].position = new Vector3(0, -70, 0);
    }

    private createGameObjects(): void {
        // Create ball
        this.ball = MeshBuilder.CreateSphere("ball", { diameter: 2 }, this.scene);
        const ballMat = new StandardMaterial("ballMat", this.scene);
        ballMat.diffuseColor = new Color3(1, 1, 0);
        ballMat.emissiveColor = new Color3(0.2, 0.2, 0);
        this.ball.material = ballMat;
        this.ball.position = new Vector3(0, this.GROUND_HEIGHT + 1, 0);

        // Create left paddle (Player 1)
        const color1 = this.getPaddleColor(this.config.paddlecolor1 || 'default');
        const paddleMat1 = new StandardMaterial("paddleMat1", this.scene);
        paddleMat1.diffuseColor = color1.diffuse;
        paddleMat1.emissiveColor = color1.emissive;

        this.paddle_left = MeshBuilder.CreateBox(
            "left_paddle",
            { width: 1.5, height: 2, depth: 10 },
            this.scene
        );
        this.paddle_left.position = new Vector3(
            -this.FIELD_WIDTH / 2 + 5,
            this.GROUND_HEIGHT + 1,
            0
        );
        this.paddle_left.material = paddleMat1;

        // Create right paddle (Player 2)
        const color2 = this.getPaddleColor(this.config.paddlecolor2 || 'default');
        const paddleMat2 = new StandardMaterial("paddleMat2", this.scene);
        paddleMat2.diffuseColor = color2.diffuse;
        paddleMat2.emissiveColor = color2.emissive;

        this.paddle_right = MeshBuilder.CreateBox(
            "right_paddle",
            { width: 1.5, height: 2, depth: 10 },
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

    private enableCollisions(): void {
        this.scene.collisionsEnabled = true;
        this.ball.checkCollisions = true;
        this.paddle_left.checkCollisions = true;
        this.paddle_right.checkCollisions = true;

        this.paddle_left.ellipsoid = new Vector3(0.75, 1, 5);
        this.paddle_right.ellipsoid = new Vector3(0.75, 1, 5);
    }

    private changeCamera(): void {
        if (this.scene.activeCamera === this.camera) {
            this.scene.activeCamera = this.topCamera;
            this.keybinds.p1 = { left: "w", right: "s" };
            this.keybinds.p2 = { left: "arrowup", right: "arrowdown" };
        } else {
            this.scene.activeCamera = this.camera;
            this.keybinds.p1 = { left: "a", right: "d" };
            this.keybinds.p2 = { left: "arrowleft", right: "arrowright" };
        }
    }

    private initUi(): void {
        this.pauseUi = GUI.AdvancedDynamicTexture.CreateFullscreenUI("pause-ui", true, this.scene);
        const panel = new GUI.StackPanel();
        panel.isVisible = false;
        panel.width = "800px";
        panel.height = "400px";
        panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.pauseUi.addControl(panel);

        const title = new GUI.TextBlock();
        title.text = "Paused";
        title.fontSize = 42;
        title.color = 'white';
        title.height = "90px";
        title.outlineWidth = 4;
        title.outlineColor = 'black';
        panel.addControl(title);

        const controlsplayer1 = new GUI.TextBlock();
        controlsplayer1.text = "Player 1 - Move with A/D (or W/S in top view)";
        controlsplayer1.fontSize = 22;
        controlsplayer1.color = 'white';
        controlsplayer1.height = "80px";
        controlsplayer1.outlineWidth = 4;
        controlsplayer1.outlineColor = 'black';
        panel.addControl(controlsplayer1);

        const controlsplayer2 = new GUI.TextBlock();
        controlsplayer2.text = "Player 2 - Move with Arrow Keys";
        controlsplayer2.fontSize = 22;
        controlsplayer2.color = 'white';
        controlsplayer2.height = "70px";
        controlsplayer2.outlineWidth = 4;
        controlsplayer2.outlineColor = 'black';
        panel.addControl(controlsplayer2);

        const extra = new GUI.TextBlock();
        extra.text = "Pause (ESC) | Change Camera (C)";
        extra.fontSize = 22;
        extra.color = 'white';
        extra.height = "60px";
        extra.outlineWidth = 4;
        extra.outlineColor = 'black';
        panel.addControl(extra);

        this.pausePanel = panel;
    }

    // ============ INTERFACE IMPLEMENTATION ============
    getState(): GameState {
        return {
            ball: {
                x: this.ball.position.x,
                y: this.ball.position.z, // Map z to y for consistency
                dx: 0, // Velocities not used in online mode
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

        // Send leave message to server
        this.connection.send('game:leave', {
            gameId: this.gameId,
            playerId: this.playerId
        });

        // Cleanup
        this.scene.dispose();
        this.engine.dispose();
        this.eventCallbacks = [];
    }

    private emitEvent(event: GameEvent): void {
        this.eventCallbacks.forEach(callback => callback(event));
    }
}