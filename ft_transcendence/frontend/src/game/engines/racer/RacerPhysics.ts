// RacerPhysics.ts - Simple Racing Physics for Pod Racing Game

import 
{ 
  Scene, 
  Mesh, 
  Vector3, 
  PhysicsImpostor,
  AmmoJSPlugin
} from '@babylonjs/core';
import Ammo from 'ammojs-typed';

export class RacerPhysics 
{
  private scene: Scene;
  private physicsPlugin: AmmoJSPlugin | null = null;
  private isInitialized: boolean = false;
  
  private pods: Map<string, PhysicsImpostor> = new Map();
  
  private readonly GRAVITY = new Vector3(0, -9.81, 0);
  private readonly POD_MASS = 100;
  private readonly THRUST_FORCE = 2000;
  private readonly MAX_VELOCITY = 50;
  private readonly HOVER_FORCE = 1500;
  private readonly HOVER_HEIGHT = 3;
  private readonly DAMPING_LINEAR = 0.4;
  private readonly DAMPING_ANGULAR = 0.6;
  private readonly RETRY_INTERVAL = 500;
  private readonly MAX_RETRIES = 20;

  constructor(scene: Scene) 
  {
    this.scene = scene;
    console.log('RacerPhysics: Initializing');
  }

  public async initialize(): Promise<void> 
  {
    if (this.isInitialized) 
    {
      return;
    }

    let retries = 0;
    
    while (retries < this.MAX_RETRIES)
    {
      try 
      {
        console.log(`RacerPhysics: Attempt ${retries + 1}/${this.MAX_RETRIES}`);
        
        const ammoInstance = await Ammo.bind(window)()
        this.physicsPlugin = new AmmoJSPlugin(true, ammoInstance);
        this.scene.enablePhysics(this.GRAVITY, this.physicsPlugin);
        
        this.isInitialized = true;
        console.log('RacerPhysics: Ready with AmmoJSPlugin');
        return;
      } 
      catch (error) 
      {
        retries++;
        console.warn(`RacerPhysics: Attempt ${retries} failed:`, error);
        
        if (retries >= this.MAX_RETRIES)
        {
          console.error('RacerPhysics: All attempts failed');
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, this.RETRY_INTERVAL));
      }
    }
  }

  public createPod(mesh: Mesh, podId: string): void 
  {
    if (!this.isInitialized) 
    {
      console.error('RacerPhysics: Not initialized');
      return;
    }

    const impostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.BoxImpostor,
      { 
        mass: this.POD_MASS,
        friction: 0.3,
        restitution: 0.2
      },
      this.scene
    );

    const body = impostor.physicsBody;
    if (body && body.setDamping) 
    {
      body.setDamping(this.DAMPING_LINEAR, this.DAMPING_ANGULAR);
    }

    if (body && body.setActivationState) 
    {
      body.setActivationState(4);
    }

    this.pods.set(podId, impostor);
    console.log(`RacerPhysics: Pod created - ${podId}`);
  }

  public createTrack(trackMesh: Mesh): void 
  {
    if (!this.isInitialized) 
    {
      return;
    }

    new PhysicsImpostor(
      trackMesh,
      PhysicsImpostor.MeshImpostor,
      { 
        mass: 0,
        friction: 0.8,
        restitution: 0.1
      },
      this.scene
    );

    console.log('RacerPhysics: Track collision created');
  }

  public movePod(podId: string, input: { x: number, z: number }): void 
  {
    const impostor = this.pods.get(podId);
    if (!impostor) 
    {
      return;
    }

    const currentVel = impostor.getLinearVelocity();
    if (!currentVel) 
    {
      return;
    }

    const currentSpeed = Math.sqrt(currentVel.x * currentVel.x + currentVel.z * currentVel.z);
    
    if (currentSpeed < this.MAX_VELOCITY && input.z !== 0) 
    {
      const forwardDir = this.getForwardDirection(impostor);
      const thrustForce = forwardDir.scale(input.z * this.THRUST_FORCE * 0.016);
      const newVelocity = currentVel.add(thrustForce);
      impostor.setLinearVelocity(newVelocity);
    }
    
    if (input.x !== 0) 
    {
      const turnForce = new Vector3(0, -input.x * 3, 0);
      impostor.setAngularVelocity(turnForce);
    } 
    else 
    {
      const currentAngular = impostor.getAngularVelocity();
      if (currentAngular) 
      {
        impostor.setAngularVelocity(currentAngular.scale(0.9));
      }
    }

    this.applyHoverForce(impostor);
  }

  private applyHoverForce(impostor: PhysicsImpostor): void 
  {
    const currentVel = impostor.getLinearVelocity();
    const mesh = impostor.object as Mesh;
    
    if (!currentVel) 
    {
      return;
    }

    const distanceFromGround = mesh.position.y;
    
    if (distanceFromGround < this.HOVER_HEIGHT) 
    {
      const hoverStrength = (this.HOVER_HEIGHT - distanceFromGround) / this.HOVER_HEIGHT;
      const upwardForce = this.HOVER_FORCE * hoverStrength * 0.016;
      const newVelocity = currentVel.add(new Vector3(0, upwardForce, 0));
      impostor.setLinearVelocity(newVelocity);
    }
  }

  private getForwardDirection(impostor: PhysicsImpostor): Vector3 
  {
    const mesh = impostor.object as Mesh;
    const forward = mesh.getDirection(new Vector3(0, 0, -1));
    return forward.normalize();
  }

  public getSpeed(podId: string): number 
  {
    const impostor = this.pods.get(podId);
    if (!impostor) 
    {
      return 0;
    }
    
    const velocity = impostor.getLinearVelocity();
    if (!velocity) 
    {
      return 0;
    }
    
    return Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);
  }

  public reset(podId: string, position: Vector3, rotation?: Vector3): void 
  {
    const impostor = this.pods.get(podId);
    if (!impostor) 
    {
      return;
    }
    
    impostor.setLinearVelocity(Vector3.Zero());
    impostor.setAngularVelocity(Vector3.Zero());
    
    const mesh = impostor.object as Mesh;
    mesh.position = position.clone();
    
    if (rotation) 
    {
      mesh.rotation = rotation.clone();
    }
    
    impostor.wakeUp();
  }

  public removePod(podId: string): void 
  {
    const impostor = this.pods.get(podId);
    if (impostor) 
    {
      impostor.dispose();
      this.pods.delete(podId);
    }
  }

  public dispose(): void 
  {
    this.pods.forEach(impostor => impostor.dispose());
    this.pods.clear();
    
    if (this.scene.getPhysicsEngine()) 
    {
      this.scene.disablePhysicsEngine();
    }
    
    this.physicsPlugin = null;
    this.isInitialized = false;
    console.log('RacerPhysics: Disposed');
  }
  
  public isPhysicsReady(): boolean 
  {
    return this.isInitialized && this.scene.getPhysicsEngine() !== null;
  }
}