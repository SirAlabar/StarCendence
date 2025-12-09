import {Engine, Scene, FreeCamera, HemisphericLight, Mesh, MeshBuilder, StandardMaterial, Vector3, Color3, Color4, KeyboardEventTypes, AbstractMesh} from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import { GameConfig, GameState, GameEvent, GameEngine } from "../../utils/GameTypes";
import { Skybox } from "./entities/Skybox";
import { loadModel } from "./entities/ModelLoader";
import { AiDifficulty3D, Enemy3D } from "./entities/EnemyAi3D";

export class Pong3D implements GameEngine 
{
    private engine: Engine;
    private scene: Scene;
    private camera!: FreeCamera;
    private topCamera!: FreeCamera;
    private light!: HemisphericLight;
    private ball!: Mesh;
    private paddle_left!: Mesh;
    private paddle_right!: Mesh;
    private ballVelocity = new Vector3(0.2, 0, 0.1);
    private maxSpeed: number = 0.6;
    private gravity = -0.02;
    private canChangeCamera: boolean = true;
    private platform: AbstractMesh[] = [];
    private pauseUi: GUI.AdvancedDynamicTexture | null = null;
    private pausePanel: GUI.StackPanel | null = null;
    private gameStarted : boolean = false;
    private waitingSpace: boolean = false;
    
    // Configuration
    private config: GameConfig;
    
    // AI properties
    private enemy3D?: Enemy3D;
    
    // Score tracking
    private player1Score: number = 0;
    private player2Score: number = 0;
    private readonly WINNING_SCORE = 3;
    
    // Field dimensions
    private readonly FIELD_WIDTH = 60;
    private readonly FIELD_LENGTH = 50;
    private readonly GROUND_HEIGHT = 45;
    
    // Input and state
    private keys: Record<string, boolean> = {};
    private lastTime: number = 0;
    private goalScored: boolean = false;
    private paused: boolean = false;
    private ended: boolean = false;
    
    // Event callbacks
    private eventCallbacks: Array<(event: GameEvent) => void> = [];
    
    constructor(canvas: HTMLCanvasElement, config: GameConfig) 
    {
        this.config = config;
        
        // Initialize Babylon.js
        this.engine = new Engine(canvas, true);
        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(0, 0, 0, 1);
        
        // Setup game
        this.setupInput();
        this.createCamera();
        this.createLight();
        this.createEnvironment();
        this.createGameObjects();
        this.enableCollisions();
        this.initUi();
        
        // Initialize AI if in AI mode
        if (this.config.mode === 'ai') 
        {
            this.enemy3D = new Enemy3D(
                this.paddle_right, 
                this.ball, 
                (config.difficulty || 'easy') as AiDifficulty3D
            );
            
        }
        
        // Setup game loop
        this.setupGameLoop();
        
        // Handle window resize
        window.addEventListener("resize", () => this.engine.resize());

        
        
    }
    
    start(): void 
    {
        this.paused = false;
        this.ended = false;
        
        // Start render loop
        this.engine.runRenderLoop(() => {
                this.scene.render();
        });
        
        this.emitEvent({ type: 'game-started' });
        
    }
    
    stop(): void 
    {
        this.engine.stopRenderLoop();
        this.paused = true;
    }
    
    pause(): void 
    {
        this.paused = true;
        this.emitEvent({ type: 'game-paused' });
        if(this.pausePanel)
        {
            this.pausePanel.isVisible = true;
        }
        
    }
    

    resume(): void 
    {
        this.paused = false;

        this.emitEvent({ type: 'game-resumed' });

        if (this.pausePanel)
            this.pausePanel.isVisible = false;
    }
    
    getState(): GameState 
    {
        
        return {
            ball: {
                x: this.ball.position.x,
                y: this.ball.position.z, 
                dx: this.ballVelocity.x,
                dy: this.ballVelocity.z,
                
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
    
    onEvent(callback: (event: GameEvent) => void): void 
    {
        this.eventCallbacks.push(callback);
    }
    
    destroy(): void 
    {
        this.stop();
        this.scene.dispose();
        this.engine.dispose();
        this.eventCallbacks = [];
        
    }
    
    private keybinds = {
        p1: {left: "a",  right: "d"},
        p2: {left: "arrowleft", right: "arrowright"}
    };
 
    private setupInput(): void 
    {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            const key = kbInfo.event.key.toLowerCase();
            this.keys[key] = kbInfo.type === KeyboardEventTypes.KEYDOWN;
        });
    }
    
    private createCamera(): void 
    {
        // Side view camera
        this.camera = new FreeCamera("camera", new Vector3(0, 0, 0), this.scene);
        this.camera.position = new Vector3(-110, 90, 0);
        this.camera.rotation = new Vector3(Math.PI / 11, Math.PI / 2, 0);
        
        // Top-down camera
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
    
    private createGameObjects(): void 
    {
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
        
        // Create right paddle (Player 2 / AI)
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
    
    private getPaddleColor(colorName: string): { diffuse: Color3, emissive: Color3 } 
    {
        const colors: Record<string, { diffuse: Color3, emissive: Color3 }> = 
        {
            'default': 
            {
                diffuse: new Color3(0.9, 0.1, 0.1),
                emissive: new Color3(0.3, 0.05, 0.05)
            },
            'neon': 
            {
                diffuse: new Color3(0, 1, 1),
                emissive: new Color3(0, 0.5, 0.5)
            },
            'fire': 
            {
                diffuse: new Color3(1, 0.3, 0),
                emissive: new Color3(0.5, 0.1, 0)
            },
            'ice': 
            {
                diffuse: new Color3(0.5, 0.8, 1),
                emissive: new Color3(0.2, 0.4, 0.5)
            },
            'rainbow': 
            {
                diffuse: new Color3(1, 0, 1),
                emissive: new Color3(0.5, 0, 0.5)
            },
            'matrix': 
            {
                diffuse: new Color3(0, 1, 0),
                emissive: new Color3(0, 0.5, 0)
            },
            'gold': 
            {
                diffuse: new Color3(1, 0.84, 0),
                emissive: new Color3(0.5, 0.42, 0)
            },
            'shadow': 
            {
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
        
        this.paddle_left.ellipsoid = new Vector3(0.75, 1, 5);
        this.paddle_right.ellipsoid = new Vector3(0.75, 1, 5);
    }
    
 
    
    private setupGameLoop(): void 
    {
        this.lastTime = performance.now();
        this.scene.onBeforeRenderObservable.add(() => 
        {
            if (this.paused || this.ended) 
                return;
            
            const currentTime = performance.now();
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            this.handleKeys();
            // Ball physics
            if(this.gameStarted && this.waitingSpace == false)
            {
                this.updateBall();
                
                // Paddle collisions
                this.checkPaddleCollision();
                
                // Speed limit
                this.limitBallSpeed();
                
                // Goal detection
                this.checkGoals();
        
                // Update AI
                if (this.config.mode === 'ai' && this.enemy3D && this.ballVelocity.x > 0) 
                {
                    this.enemy3D.update(deltaTime);
                }
                
                // Handle player input
                this.handleKeys();

            }
            else
            {
                setTimeout(() => {
                    this.gameStarted = true;
                }, 3000);
            }
        });
    }
    
    

    private updateBall(): void 
    {
        // Apply gravity
        this.ballVelocity.y += this.gravity;
        
        // Move ball
        this.ball.position.addInPlace(this.ballVelocity);
        
        // Ground collision
        const ballRadius = 1;
        if (this.ball.position.y <= this.GROUND_HEIGHT + ballRadius) 
        {
            this.ball.position.y = this.GROUND_HEIGHT + ballRadius;
            this.ballVelocity.y *= -0.8;
        }
        
        // Wall collisions (Z-axis)
        const wallBoundary = this.FIELD_LENGTH / 2 - 1;
        if (Math.abs(this.ball.position.z) >= wallBoundary) {
            this.ballWallCollision();
        }
    }
    
    private ballWallCollision(): void 
    {
        this.ballVelocity.z *= -1;
        
        const wallBoundary = this.FIELD_LENGTH / 2 - 1;
        
        if (this.ball.position.z > wallBoundary) 
        {
            this.ball.position.z = wallBoundary;
            this.flashWallHit(new Vector3(
                this.ball.position.x, 
                this.ball.position.y, 
                wallBoundary
            ));
        }
        
        if (this.ball.position.z < -wallBoundary) 
        {
            this.ball.position.z = -wallBoundary;
            this.flashWallHit(new Vector3(
                this.ball.position.x, 
                this.ball.position.y, 
                -wallBoundary
            ));
        }
        
        // Ensure minimum X speed
        const minSpeedX = 0.2;
        if (Math.abs(this.ballVelocity.x) < minSpeedX) 
        {
            const direction = this.ballVelocity.x >= 0 ? 1 : -1;
            this.ballVelocity.x = direction * minSpeedX;
        }
        
        this.emitEvent({ type: 'wall-hit' });
    }
    
    private checkPaddleCollision(): void 
    {
        // Left paddle collision
        if (this.ball.intersectsMesh(this.paddle_left, false)) 
        {
            this.repositionPaddles();
            this.ballVelocity.x = Math.abs(this.ballVelocity.x) * 1.05;
            
            const hitOffset = this.ball.position.z - this.paddle_left.position.z;
            this.ballVelocity.z += hitOffset * 0.02;
            
            this.emitEvent({ type: 'paddle-hit', paddle: 'left' });
        }
        
        // Right paddle collision
        if (this.ball.intersectsMesh(this.paddle_right, false)) 
        {
            this.repositionPaddles();
            this.ballVelocity.x = -Math.abs(this.ballVelocity.x) * 1.05;
            
            const hitOffset = this.ball.position.z - this.paddle_right.position.z;
            this.ballVelocity.z += hitOffset * 0.02;
            
            this.emitEvent({ type: 'paddle-hit', paddle: 'right' });
        }
    }
    
    private repositionPaddles(): void 
    {
        this.paddle_left.position.y = this.GROUND_HEIGHT + 1;
        this.paddle_right.position.y = this.GROUND_HEIGHT + 1;
        this.paddle_left.position.x = -this.FIELD_WIDTH / 2 + 5;
        this.paddle_right.position.x = this.FIELD_WIDTH / 2 - 5;
    }
    
    private limitBallSpeed(): void 
    {
        const speed = this.ballVelocity.length();
        if (speed > this.maxSpeed) {
            this.ballVelocity.normalize().scaleInPlace(this.maxSpeed);
        }
    }
    
    private checkGoals(): void 
    {
        if (this.goalScored) return;
        
        const goalBoundary = this.FIELD_WIDTH / 2;
        
        // Right goal (Player 1 scores)
        if (this.ball.position.x > goalBoundary) 
        {
            this.goalScored = true;
            this.player1Score++;
            console.log(`Player 1 scored! Score: ${this.player1Score} - ${this.player2Score}`);
            this.emitEvent({type: 'score-updated', player1Score: this.player1Score, player2Score : this.player2Score})
            this.resetBall(-1);
            this.waitingSpace = true;
            
            this.checkWinCondition();
        }
        
        // Left goal (Player 2/AI scores)
        else if (this.ball.position.x < -goalBoundary) 
        {
            this.goalScored = true;
            this.player2Score++;
            const opponent = this.config.mode === 'ai' ? 'AI' : 'Player 2';
            console.log(`${opponent} scored! Score: ${this.player1Score} - ${this.player2Score}`);
            this.emitEvent({type: 'score-updated', player1Score: this.player1Score, player2Score : this.player2Score})
            this.resetBall(1);
            this.waitingSpace = true;
            
            this.checkWinCondition();
        }
    }
    
    private checkWinCondition(): void 
    {
        if (this.player1Score >= this.WINNING_SCORE) 
        {
          
            this.handleGameEnd('player1');
        } 
        else if (this.player2Score >= this.WINNING_SCORE) 
        {
            const winner = this.config.mode === 'ai' ? 'AI' : 'Player 2';
            console.log(`${winner} wins!`);
            this.handleGameEnd('player2');
        }
    }
    
    private handleGameEnd(winner: 'player1' | 'player2'): void 
    {
        this.ended = true;
        this.stop();
        this.emitEvent({ type: 'game-ended', winner });
    }
    
    private async resetBall(direction: number = 1): Promise<void> 
    {
        this.ball.isVisible = false;
        await this.delay(2000);
        
        this.ballVelocity.set(0, 0, 0);
        this.ball.position.set(0, this.GROUND_HEIGHT + 1, 0);
        
        this.ball.isVisible = true;
        this.ballVelocity = new Vector3(0.2 * direction, 0, 0.1);
        this.goalScored = false;
    }
    
    private delay(ms: number): Promise<void> 
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    
    private handleKeys(): void 
    {
        const paddleSpeed = 0.5;
        const moveBoundary = this.FIELD_LENGTH / 2 - 6;
        
        // Player 1 (left paddle) - A/D keys
        const moveVector1 = new Vector3(0, 0, 0);
        if (this.keys[this.keybinds.p1.left] && this.paddle_left.position.z < moveBoundary) 
            moveVector1.z += paddleSpeed;
        if (this.keys[this.keybinds.p1.right] && this.paddle_left.position.z > -moveBoundary) 
            moveVector1.z -= paddleSpeed;
        this.paddle_left.moveWithCollisions(moveVector1);
            
        
        // Player 2 (right paddle) - only in multiplayer mode
        if (this.config.mode === 'local-multiplayer') 
        {
            const moveVector2 = new Vector3(0, 0, 0);
            if (this.keys[this.keybinds.p2.left] && this.paddle_right.position.z < moveBoundary) 
                moveVector2.z += paddleSpeed;
            
            if (this.keys[this.keybinds.p2.right] && this.paddle_right.position.z > -moveBoundary) 
                moveVector2.z -= paddleSpeed;
            
            this.paddle_right.moveWithCollisions(moveVector2);
        }
        
        // Camera switch - C key
        if (this.keys["c"] && this.canChangeCamera) 
        {
            this.changeCamera();
            this.canChangeCamera = false;
            setTimeout(() => this.canChangeCamera = true, 500);
        }
        if(this.keys[" "])
        {
            this.waitingSpace = false;
        }
    }
    
    private changeCamera(): void 
    {
        if (this.scene.activeCamera === this.camera) 
        {
            this.scene.activeCamera = this.topCamera;
            this.keybinds.p1 = { left: "w", right: "s" };
            this.keybinds.p2 = { left: "arrowup", right: "arrowdown" };
            //this.topCamera.attachControl(this.scene.getEngine().getRenderingCanvas()!, true); //for free camera if needed
        } 
        else 
        {
            this.scene.activeCamera = this.camera;
            this.keybinds.p1 = { left: "a", right: "d" };
            this.keybinds.p2 = { left: "arrowleft", right: "arrowright" };
        }
    }

    
    private flashWallHit(position: Vector3): void 
    {
        const goalBoundary = this.FIELD_WIDTH / 2;
        if (this.ball.position.x > goalBoundary || this.ball.position.x < -goalBoundary) 
            return;
        
        
        const size = 4;
        const flash = MeshBuilder.CreatePlane("flash", { size }, this.scene);
        
        const mat = new StandardMaterial("flashMat", this.scene);
        mat.diffuseColor = new Color3(1, 0, 0);
        mat.emissiveColor = new Color3(1, 0, 0);
        mat.alpha = 0.8;
        mat.backFaceCulling = false;
        flash.material = mat;
        
        flash.position.copyFrom(position);
        
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
 
    initUi() 
    {
        this.pauseUi = GUI.AdvancedDynamicTexture.CreateFullscreenUI("pause-ui", true, this.scene); //start pauseui 
        const panel = new GUI.StackPanel;
        panel.isVisible = false;
        panel.width = "800px";     // <-- required!
        panel.height = "400px";
        panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.pauseUi.addControl(panel);                         //create the menu panel and pass it to this.pauseUi

        
        const title = new GUI.TextBlock();
        title.text = "Paused";
        title.fontSize = 42;
        title.color = 'white';
        title.height = "90px";  
        title.outlineWidth = 4;
        title.outlineColor = 'black';
        panel.addControl(title);
        
        const controlsplayer1 = new GUI.TextBlock();
        controlsplayer1.text = "Player 1 - UP (W) Down (S)";
        controlsplayer1.fontSize = 22;
        controlsplayer1.color = 'white';
        controlsplayer1.height = "80px";  
        controlsplayer1.outlineWidth = 4;
        controlsplayer1.outlineColor = 'black';
        panel.addControl(controlsplayer1);
        this.pausePanel = panel;

        const controlsplayer2 = new GUI.TextBlock();
        controlsplayer2.text = "Player 2 - UP (↑) Down(↓)";
        controlsplayer2.fontSize = 22;
        controlsplayer2.color = 'white';
        controlsplayer2.height = "70px";  
        controlsplayer2.outlineWidth = 4;
        controlsplayer2.outlineColor = 'black';
        panel.addControl(controlsplayer2);
        this.pausePanel = panel;

        const extra = new GUI.TextBlock();
        extra.text = "Start Ball (SPACEBAR) | Pause (ESC) | Change Camera (C)";
        extra.fontSize = 22;
        extra.color = 'white';
        extra.height = "60px";  
        extra.outlineWidth = 4;
        extra.outlineColor = 'black';
        panel.addControl(extra);
        this.pausePanel = panel;
    }
    
    private emitEvent(event: GameEvent): void 
    {
        this.eventCallbacks.forEach(callback => callback(event));
    }
}