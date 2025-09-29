import 
{ 
  Scene, 
  Mesh, 
  Vector3, 
  Quaternion,
  AbstractMesh,
  Ray,
  VertexBuffer,
} from '@babylonjs/core';
import Ammo from 'ammojs-typed';
import { RacerPod } from './RacerPods';

export class RacerPhysics 
{
  private scene: Scene;
  private physicsWorld: any = null;
  private ammoInstance: any = null;
  private isInitialized: boolean = false;
  private tempTransform: any = null;
  private trackRigidBodies: any[] = [];
  
  private lastFrameTime: number = 0;
  private deltaTime: number = 0.016;
  private targetFPS: number = 60;
  private maxDeltaTime: number = 0.033; 
  private minDeltaTime: number = 1/120;
  
  private pods: Map<string, { 
    rigidBody: any,
    mesh: Mesh,
    hoverPoints: Vector3[],
    pod: RacerPod,
    lastPosition: Vector3,
    stuckTimer: number 
  }> = new Map();
  
  private readonly GRAVITY = new Vector3(0, -100, 0);
  private readonly POD_MASS = 2000;
  private readonly THRUST_FORCE = 85;
  private readonly MAX_VELOCITY = 400;
  private readonly HOVER_FORCE = 1000;
  private readonly HOVER_HEIGHT = 3;

  private readonly THRUST_MULTIPLIER_PER_SECOND = 1.5;
  private readonly HOVER_MULTIPLIER_PER_SECOND = 2.5; 
  private readonly STUCK_TIMER_INCREMENT_PER_SECOND = 1.0;

  constructor(scene: Scene) 
  {
    this.scene = scene;
    this.lastFrameTime = performance.now();
  }

  public async initialize(): Promise<void> 
  {
    if (this.isInitialized) 
    {
      return;
    }

    try 
    {
      const ammoInstance = await Ammo.bind(window)();
      const physicsPlugin = new (await import('@babylonjs/core')).AmmoJSPlugin(true, ammoInstance);
      
      this.scene.enablePhysics(this.GRAVITY, physicsPlugin);
      
      const physicsEngine = this.scene.getPhysicsEngine();
      const plugin = physicsEngine?.getPhysicsPlugin();
      if (!plugin) 
      {
        throw new Error('Physics plugin not available');
      }
      
      this.physicsWorld = plugin.world;
      this.ammoInstance = ammoInstance;
      this.tempTransform = new ammoInstance.btTransform();
      
      this.scene.registerBeforeRender(() => 
      {
        this.updateDeltaTime();
        this.updatePhysics();
      });
      
      this.isInitialized = true;
    } 
    catch (error) 
    {
      throw error;
    }
  }

  private updateDeltaTime(): void 
  {
    const currentTime = performance.now();
    let rawDeltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;
    
    this.deltaTime = Math.max(this.minDeltaTime, Math.min(rawDeltaTime, this.maxDeltaTime));
    
    if (rawDeltaTime < 0.001) 
    {
      this.deltaTime = 1 / this.targetFPS;
    }
  }

public createPod(mesh: Mesh, podId: string, pod: RacerPod, initialPosition?: Vector3): void
{
    if (!this.isInitialized || !this.ammoInstance) 
    {
      throw new Error('RacerPhysics: Not initialized');
    }
    
    const Ammo = this.ammoInstance;
    const startPos = initialPosition || new Vector3(0, 10, 0);
    var transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(startPos.x, startPos.y, startPos.z));    const initialPhysicsRotation = new Ammo.btQuaternion(0, 0, 0, 1);
    transform.setRotation(initialPhysicsRotation);
    
    var motionState = new Ammo.btDefaultMotionState(transform);
    var localInertia = new Ammo.btVector3(0, 0, 0);
    
    var hull = [724.8979,1742.79126,-293.8619,1013.10107,1136.37292,-1947.64307,1052.83252,1183.11963,2029.03369,-724.8979,1742.79126,-293.8619,-1052.83252,1183.11963,2029.03369,-1013.10107,1136.37292,-1947.64307,477.1378,1157.46509,-2049.793,549.292,688.7122,-2033.02686,1013.10107,1136.37292,-1947.64307,-549.292,688.7122,-2033.02686,549.292,688.7122,-2033.02686,477.1378,1157.46509,-2049.793,-734.6597,1610.0752,700.9919,-1052.83252,1183.11963,2029.03369,-724.8979,1742.79126,-293.8619,-734.6597,1610.0752,700.9919,1052.83252,1183.11963,2029.03369,-1052.83252,1183.11963,2029.03369,734.6597,1610.0752,700.9919,724.8979,1742.79126,-293.8619,1052.83252,1183.11963,2029.03369,734.6597,1610.0752,700.9919,734.6597,1610.0752,700.9919,-734.6597,1610.0752,700.9919,0,1793.94617,-331.3796,482.0361,486.8974,-1960.24573,549.292,688.7122,-2033.02686,-549.292,688.7122,-2033.02686,482.0361,486.8974,-1960.24573,1053.79028,489.8413,-1858.3396,549.292,688.7122,-2033.02686,-477.1378,1157.46509,-2049.793,-1013.10107,1136.37292,-1947.64307,-549.292,688.7122,-2033.02686,-477.1378,1157.46509,-2049.793,-477.1378,1157.46509,-2049.793,477.1378,1157.46509,-2049.793,0,1418.503,-1807.88025,1077.55261,404.8475,-1583.72144,1053.79028,489.8413,-1858.3396,482.0361,486.8974,-1960.24573,1077.55261,404.8475,-1583.72144,-1029.84131,370.7491,-588.8345,1029.84131,370.7491,-588.8345,1077.55261,404.8475,-1583.72144,1029.84131,370.7491,-588.8345,1137.37439,384.7701,2006.43555,-1077.55261,404.8475,-1583.72144,1077.55261,404.8475,-1583.72144,482.0361,486.8974,-1960.24573,-1077.55261,404.8475,-1583.72144,-1077.55261,404.8475,-1583.72144,-1137.37439,384.7701,2006.43555,-1029.84131,370.7491,-588.8345,-482.0361,486.8974,-1960.24573,-1053.79028,489.8413,-1858.3396,-1077.55261,404.8475,-1583.72144,-482.0361,486.8974,-1960.24573,-482.0361,486.8974,-1960.24573,-549.292,688.7122,-2033.02686,-1053.79028,489.8413,-1858.3396,-482.0361,486.8974,-1960.24573,-244.5957,1412.99524,-1810.30493,-1013.10107,1136.37292,-1947.64307,-477.1378,1157.46509,-2049.793,-244.5957,1412.99524,-1810.30493,-477.1378,1157.46509,-2049.793,0,1418.503,-1807.88025,-244.5957,1412.99524,-1810.30493,-724.8979,1742.79126,-293.8619,-1013.10107,1136.37292,-1947.64307,-244.5957,1412.99524,-1810.30493,0,1418.503,-1807.88025,0,1793.94617,-331.3796,244.5957,1412.99524,-1810.30493,0,1418.503,-1807.88025,477.1378,1157.46509,-2049.793,244.5957,1412.99524,-1810.30493,477.1378,1157.46509,-2049.793,1013.10107,1136.37292,-1947.64307,244.5957,1412.99524,-1810.30493,0,1793.94617,-331.3796,0,1418.503,-1807.88025,244.5957,1412.99524,-1810.30493,1013.10107,1136.37292,-1947.64307,724.8979,1742.79126,-293.8619,-1013.8631,691.0133,-1930.07227,-549.292,688.7122,-2033.02686,-1013.10107,1136.37292,-1947.64307,1013.8631,691.0133,-1930.07227,1013.10107,1136.37292,-1947.64307,549.292,688.7122,-2033.02686,-1061.14771,646.3994,-1909.22253,-1053.79028,489.8413,-1858.3396,-549.292,688.7122,-2033.02686,-1061.14771,646.3994,-1909.22253,-549.292,688.7122,-2033.02686,-1013.8631,691.0133,-1930.07227,-1061.14771,646.3994,-1909.22253,-1013.8631,691.0133,-1930.07227,-1013.10107,1136.37292,-1947.64307,-1061.14771,646.3994,-1909.22253,-1077.55261,404.8475,-1583.72144,-1053.79028,489.8413,-1858.3396,1061.14771,646.3994,-1909.22253,549.292,688.7122,-2033.02686,1053.79028,489.8413,-1858.3396,1061.14771,646.3994,-1909.22253,1013.8631,691.0133,-1930.07227,549.292,688.7122,-2033.02686,1061.14771,646.3994,-1909.22253,1013.10107,1136.37292,-1947.64307,1013.8631,691.0133,-1930.07227,1061.14771,646.3994,-1909.22253,1053.79028,489.8413,-1858.3396,1077.55261,404.8475,-1583.72144,-475.1253,1774.70337,-320.6326,-724.8979,1742.79126,-293.8619,-244.5957,1412.99524,-1810.30493,-475.1253,1774.70337,-320.6326,-244.5957,1412.99524,-1810.30493,0,1793.94617,-331.3796,-475.1253,1774.70337,-320.6326,0,1793.94617,-331.3796,-734.6597,1610.0752,700.9919,-475.1253,1774.70337,-320.6326,-734.6597,1610.0752,700.9919,-724.8979,1742.79126,-293.8619,475.1253,1774.70337,-320.6326,0,1793.94617,-331.3796,244.5957,1412.99524,-1810.30493,475.1253,1774.70337,-320.6326,244.5957,1412.99524,-1810.30493,724.8979,1742.79126,-293.8619,475.1253,1774.70337,-320.6326,724.8979,1742.79126,-293.8619,734.6597,1610.0752,700.9919,475.1253,1774.70337,-320.6326,734.6597,1610.0752,700.9919,0,1793.94617,-331.3796,1043.00146,364.6063,791.3676,1137.37439,384.7701,2006.43555,1029.84131,370.7491,-588.8345,1043.00146,364.6063,791.3676,1029.84131,370.7491,-588.8345,-1029.84131,370.7491,-588.8345,1043.00146,364.6063,791.3676,-1137.37439,384.7701,2006.43555,1137.37439,384.7701,2006.43555,-1043.00146,364.6063,791.3676,-1029.84131,370.7491,-588.8345,-1137.37439,384.7701,2006.43555,-1043.00146,364.6063,791.3676,-1043.00146,364.6063,791.3676,0,396.2789,2017.64673,1137.37439,384.7701,2006.43555,-1137.37439,384.7701,2006.43555,0,1175.7417,2039.25269,-1137.37439,384.7701,2006.43555,-1052.83252,1183.11963,2029.03369,0,396.2789,2017.64673,0,1175.7417,2039.25269,1052.83252,1183.11963,2029.03369,1137.37439,384.7701,2006.43555,0,396.2789,2017.64673,0,1175.7417,2039.25269,-1052.83252,1183.11963,2029.03369,1052.83252,1183.11963,2029.03369,-1114.74915,977.62,422.8308,-1122.866,925.131,422.5171,-1092.156,800.1202,-1582.09863,-1114.74915,977.62,422.8308,-1092.156,800.1202,-1582.09863,-1013.10107,1136.37292,-1947.64307,-1114.74915,977.62,422.8308,-1013.10107,1136.37292,-1947.64307,-1052.83252,1183.11963,2029.03369,1114.74915,977.62,422.8308,1013.10107,1136.37292,-1947.64307,1092.156,800.1202,-1582.09863,1114.74915,977.62,422.8308,1092.156,800.1202,-1582.09863,1122.866,925.131,422.5171,1114.74915,977.62,422.8308,1052.83252,1183.11963,2029.03369,1013.10107,1136.37292,-1947.64307,-1060.57458,794.3555,-1872.05847,-1013.10107,1136.37292,-1947.64307,-1092.156,800.1202,-1582.09863,-1060.57458,794.3555,-1872.05847,-1092.156,800.1202,-1582.09863,-1061.14771,646.3994,-1909.22253,-1060.57458,794.3555,-1872.05847,-1061.14771,646.3994,-1909.22253,-1013.10107,1136.37292,-1947.64307,1060.57458,794.3555,-1872.05847,1092.156,800.1202,-1582.09863,1013.10107,1136.37292,-1947.64307,1060.57458,794.3555,-1872.05847,1013.10107,1136.37292,-1947.64307,1061.14771,646.3994,-1909.22253,1060.57458,794.3555,-1872.05847,1061.14771,646.3994,-1909.22253,1092.156,800.1202,-1582.09863,1093.08643,643.8445,-1582.8042,1092.156,800.1202,-1582.09863,1061.14771,646.3994,-1909.22253,1093.08643,643.8445,-1582.8042,1061.14771,646.3994,-1909.22253,1077.55261,404.8475,-1583.72144,1093.08643,643.8445,-1582.8042,1077.55261,404.8475,-1583.72144,1137.37439,384.7701,2006.43555,1093.08643,643.8445,-1582.8042,1137.37439,384.7701,2006.43555,1122.866,925.131,422.5171,1093.08643,643.8445,-1582.8042,1122.866,925.131,422.5171,1092.156,800.1202,-1582.09863,-1093.08643,643.8445,-1582.8042,-1077.55261,404.8475,-1583.72144,-1061.14771,646.3994,-1909.22253,-1093.08643,643.8445,-1582.8042,-1061.14771,646.3994,-1909.22253,-1092.156,800.1202,-1582.09863,-1093.08643,643.8445,-1582.8042,-1137.37439,384.7701,2006.43555,-1077.55261,404.8475,-1583.72144,-1093.08643,643.8445,-1582.8042,-1122.866,925.131,422.5171,-1137.37439,384.7701,2006.43555,-1093.08643,643.8445,-1582.8042,-1092.156,800.1202,-1582.09863,-1122.866,925.131,422.5171,-1124.65894,924.317,605.2404,-1122.866,925.131,422.5171,-1114.74915,977.62,422.8308,-1124.65894,924.317,605.2404,-1114.74915,977.62,422.8308,-1052.83252,1183.11963,2029.03369,-1124.65894,924.317,605.2404,-1052.83252,1183.11963,2029.03369,-1137.37439,384.7701,2006.43555,-1124.65894,924.317,605.2404,-1137.37439,384.7701,2006.43555,-1122.866,925.131,422.5171,1124.65894,924.317,605.2404,1052.83252,1183.11963,2029.03369,1114.74915,977.62,422.8308,1124.65894,924.317,605.2404,1114.74915,977.62,422.8308,1122.866,925.131,422.5171,1124.65894,924.317,605.2404,1137.37439,384.7701,2006.43555,1052.83252,1183.11963,2029.03369,1124.65894,924.317,605.2404,1122.866,925.131,422.5171,1137.37439,384.7701,2006.43555];
    
    var geometry = new Ammo.btConvexHullShape();
    const hullScale = 0.004;
    
    for(let i=0; i < hull.length; i += 3) 
    {
      geometry.addPoint(new Ammo.btVector3(
        Math.fround(hull[i] * hullScale),
        Math.fround(hull[i+1] * hullScale),
        Math.fround(hull[i+2] * hullScale)));
    }
    
    geometry.calculateLocalInertia(this.POD_MASS, localInertia);
    
    const rigidBody = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(this.POD_MASS, motionState, geometry, localInertia));
    rigidBody.setActivationState(4);
    rigidBody.setDamping(0.3, 0.5);
    rigidBody.setFriction(0.8);
    rigidBody.setRestitution(0.1);
    
    this.physicsWorld.addRigidBody(rigidBody);
    
    const hoverPoints = this.calculateHoverPoints(11.4, 6.4, 5.0);
    
    this.pods.set(podId, { 
      rigidBody, 
      mesh, 
      hoverPoints, 
      pod,
      lastPosition: mesh.position.clone(),
      stuckTimer: 0
    });
    
    mesh.position.set(startPos.x, startPos.y, startPos.z);
    if (!mesh.rotationQuaternion) 
    {
      mesh.rotationQuaternion = new Quaternion();
    }
    mesh.rotationQuaternion.set(0, 0, 0, 1);
  }

  private calculateHoverPoints(podLength: number, podWidth: number, podHeight: number): Vector3[] 
  {
    const halfWidth = podWidth / 2;
    const halfLength = podLength / 2;
    const boxBottom = -podHeight / 2;
  
    return [
      new Vector3(-halfLength, boxBottom, -halfWidth),
      new Vector3(-halfLength, boxBottom, halfWidth),
      new Vector3(halfLength, boxBottom, -halfWidth),
      new Vector3(halfLength, boxBottom, halfWidth)
    ];
  }

  public movePod(podId: string, input: { x: number, z: number }): void 
  {
    const podData = this.pods.get(podId);
    if (!podData || !this.ammoInstance) 
    {
      return;
    }
   
    const Ammo = this.ammoInstance;
    const rigidBody = podData.rigidBody;
    const mesh = podData.mesh;
    const velocity = rigidBody.getLinearVelocity();
    const currentSpeed = Math.sqrt(velocity.x() * velocity.x() + velocity.z() * velocity.z());
    
    const speedPercentage = currentSpeed / this.MAX_VELOCITY;
    let thrustMultiplier = 1.0;
    
    if (speedPercentage < 0.08) 
    {
      thrustMultiplier = 3.0;
    } 
    else if (speedPercentage < 0.15) 
    {
      thrustMultiplier = 1.7;
    } 
    else if (speedPercentage < 0.25) 
    {
      thrustMultiplier = 1.3;
    } 
    else if (speedPercentage < 0.4) 
    {
      thrustMultiplier = 1.1;
    } 
    else if (speedPercentage < 0.8) 
    {
      thrustMultiplier = 1.0;
    } 
    else 
    {
      thrustMultiplier = 0.7;
    }
   
    if (currentSpeed < this.MAX_VELOCITY && input.z !== 0) 
    {
      const forwardDir = this.getForwardDirection(mesh);
      const thrustForce = new Ammo.btVector3(
        forwardDir.x * input.z * this.THRUST_FORCE * this.THRUST_MULTIPLIER_PER_SECOND * this.deltaTime * thrustMultiplier,
        0,
        forwardDir.z * input.z * this.THRUST_FORCE * this.THRUST_MULTIPLIER_PER_SECOND * this.deltaTime * thrustMultiplier
      );
     
      const newVelocity = new Ammo.btVector3(
        velocity.x() + thrustForce.x(),
        velocity.y(),
        velocity.z() + thrustForce.z()
      );
     
      rigidBody.setLinearVelocity(newVelocity);
    }
   
    if (input.x !== 0) 
    {
      const turnForce = new Ammo.btVector3(0, input.x * 3.0, 0);
      rigidBody.setAngularVelocity(turnForce);
    } 
    else 
    {
      const currentAngular = rigidBody.getAngularVelocity();
      const dampedAngular = new Ammo.btVector3(
        currentAngular.x() * 0.8,
        currentAngular.y() * 0.8,
        currentAngular.z() * 0.8
      );
      rigidBody.setAngularVelocity(dampedAngular);
    }
    
    const currentPos = mesh.position;
    const distanceMoved = Vector3.Distance(currentPos, podData.lastPosition);
    
    if ((Math.abs(input.x) > 0.1 || Math.abs(input.z) > 0.1) && distanceMoved < 0.1) 
    {
      podData.stuckTimer += this.STUCK_TIMER_INCREMENT_PER_SECOND * this.deltaTime;
     
      if (podData.stuckTimer > 1.0) 
      {
        const unstuckForce = new Ammo.btVector3(
          input.x * 2000,
          800,
          input.z * 2000
        );
       
        rigidBody.applyCentralImpulse(unstuckForce);
        podData.stuckTimer = 0;
      }
    } 
    else 
    {
      podData.stuckTimer = 0;
    }
    
    podData.lastPosition = currentPos.clone();
   
    this.applyHoverForce(rigidBody, mesh);
  }

  private getForwardDirection(mesh: Mesh): Vector3 
  {
    const forward = mesh.getDirection(new Vector3(-1, 0, 0));
    return forward.normalize();
  }

  private applyHoverForce(rigidBody: any, mesh: Mesh): void 
  {
    const Ammo = this.ammoInstance;
    const podId = this.findPodIdByMesh(mesh);
    if (!podId) 
    {
      return;
    }
    const podData = this.pods.get(podId);
    if (!podData) 
    {
      return;
    }
    const hoverPoints = podData.hoverPoints;

    for (let i = 0; i < hoverPoints.length; i++) 
    {
      const localHoverPoint = hoverPoints[i];
      const worldHoverPoint = Vector3.TransformCoordinates(localHoverPoint, mesh.getWorldMatrix());
      
      const rayOrigin = worldHoverPoint.add(new Vector3(0, 0.1, 0));
      const ray = new Ray(rayOrigin, Vector3.Down());
      
      const hit = this.scene.pickWithRay(ray, (mesh) => {
        return mesh.name !== podData.mesh.name;
      });

      let distanceFromGround = rayOrigin.y;

      if (hit?.hit && hit.distance < 12.0)
      {
        distanceFromGround = hit.distance - 0.1;
      }

      if (distanceFromGround < this.HOVER_HEIGHT) 
      {
        const hoverStrength = Math.max(0, (this.HOVER_HEIGHT - distanceFromGround) / this.HOVER_HEIGHT);
        
        const upwardForce = this.HOVER_FORCE * hoverStrength * this.HOVER_MULTIPLIER_PER_SECOND * this.deltaTime * 0.25;
        
        const forcePosition = new Ammo.btVector3(
          localHoverPoint.x, 
          localHoverPoint.y, 
          localHoverPoint.z
        );
        const upwardForceVector = new Ammo.btVector3(0, upwardForce, 0);
        
        rigidBody.applyForce(upwardForceVector, forcePosition);
      }
    }
  }

  private findPodIdByMesh(targetMesh: Mesh): string | null 
  {
    for (const [podId, podData] of this.pods.entries()) 
    {
      if (podData.mesh === targetMesh) 
      {
        return podId;
      }
    }
    return null;
  }

private updatePhysics(): void 
{
  if (!this.physicsWorld) return;
  
  this.pods.forEach((podData, podId) => 
  {
    const mesh = podData.mesh;
    const rigidBody = podData.rigidBody;
    
    const motionState = rigidBody.getMotionState();
    if (motionState) 
    {
      motionState.getWorldTransform(this.tempTransform);
      
      const position = this.tempTransform.getOrigin();
      const rotation = this.tempTransform.getRotation();
      
      const currentPos = new Vector3(position.x(), position.y(), position.z());
      
      // Check checkpoint collisions for progress tracking
      const passedCheckpoint = podData.pod.checkCheckpointCollision(currentPos);
      if (passedCheckpoint !== null) 
      {
        if ((window as any).racerUIManager) 
        {
          (window as any).racerUIManager.onCheckpointPassed(`${passedCheckpoint + 1}`);
        }
      }
            
      // Check if respawn is needed
      if (podData.pod.shouldRespawnPlayer(currentPos)) 
      {
        console.log(`Pod ${podId} needs respawn - Y position: ${currentPos.y}`);
        const respawnPos = podData.pod.getRespawnPosition();
        console.log(`Respawning pod ${podId} to:`, respawnPos);
        const checkpointInfo = podData.pod.getCheckpointInfo();
        console.log(`Pod ${podId} checkpoint info:`, checkpointInfo);
        
        this.resetPodPosition(podId);
        
        // Re-read transform after respawn to get updated position
        motionState.getWorldTransform(this.tempTransform);
        const newPosition = this.tempTransform.getOrigin();
        const newRotation = this.tempTransform.getRotation();
        
        // Update mesh to respawn position
        mesh.position.set(newPosition.x(), newPosition.y(), newPosition.z());
        
        if (!mesh.rotationQuaternion) 
        {
          mesh.rotationQuaternion = new Quaternion();
        }
        
        mesh.rotationQuaternion.set(newRotation.x(), newRotation.y(), newRotation.z(), newRotation.w());
        mesh.addRotation(0, Math.PI, 0);
        
        return; // Skip normal position update since we just respawned
      }
      
      // Normal position and rotation update
      mesh.position.set(currentPos.x, currentPos.y, currentPos.z);
      
      if (!mesh.rotationQuaternion) 
      {
        mesh.rotationQuaternion = new Quaternion();
      }
      
      mesh.rotationQuaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
      mesh.addRotation(0, Math.PI, 0);
    }
  });
}

  public getPerformanceInfo(): { deltaTime: number; fps: number; adjustedFPS: boolean } 
  {
    return {
      deltaTime: this.deltaTime,
      fps: Math.round(1 / this.deltaTime),
      adjustedFPS: this.deltaTime >= this.maxDeltaTime
    };
  }

  public async setupTrackCollision(racerScene: any = null): Promise<void> 
  {
    if (!this.isInitialized || !this.ammoInstance) 
    {
      throw new Error('RacerPhysics: Cannot setup track - not initialized');
    }
    
    let collisionMesh: AbstractMesh | null = null;
    
    if (racerScene && racerScene.findCollisionMesh) 
    {
      collisionMesh = racerScene.findCollisionMesh();
    }
    
    if (!collisionMesh) 
    {
      return;
    }
    
    const Ammo = this.ammoInstance;
    const mesh = collisionMesh as Mesh;
    
    let positions = mesh.getVerticesData(VertexBuffer.PositionKind);
    let indices = mesh.getIndices();
    
    if (!positions || !indices) 
    {
      return;
    }
    
    mesh.updateFacetData();
    var localPositions = mesh.getFacetLocalPositions();
    var triangleCount = localPositions.length;
    
    let mTriMesh = new Ammo.btTriangleMesh();
    
    const scale = mesh.scaling;
    const position = mesh.position;
    
    var _g = 0;
    while(_g < triangleCount) 
    {
      var i = _g++;
      var index0 = indices[i * 3];
      var index1 = indices[i * 3 + 1];
      var index2 = indices[i * 3 + 2];
      
      var vertex0 = new Ammo.btVector3(
        (positions[index0 * 3] * scale.x) + position.x, 
        (positions[index0 * 3 + 1] * scale.y) + position.y, 
        (positions[index0 * 3 + 2] * scale.z) + position.z
      );
      var vertex1 = new Ammo.btVector3(
        (positions[index1 * 3] * scale.x) + position.x, 
        (positions[index1 * 3 + 1] * scale.y) + position.y, 
        (positions[index1 * 3 + 2] * scale.z) + position.z
      );
      var vertex2 = new Ammo.btVector3(
        (positions[index2 * 3] * scale.x) + position.x, 
        (positions[index2 * 3 + 1] * scale.y) + position.y, 
        (positions[index2 * 3 + 2] * scale.z) + position.z
      );
      
      mTriMesh.addTriangle(vertex0, vertex1, vertex2);
    }
    
    let shape = new Ammo.btBvhTriangleMeshShape(mTriMesh, true, true);
    let localInertia = new Ammo.btVector3(0, 0, 0);
    let transform = new Ammo.btTransform();
    
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(0, 0, 0));
    
    if (mesh.rotationQuaternion) 
    {
      transform.setRotation(new Ammo.btQuaternion(
        mesh.rotationQuaternion.x, 
        mesh.rotationQuaternion.y, 
        mesh.rotationQuaternion.z, 
        mesh.rotationQuaternion.w
      ));
    }
    
    let motionState = new Ammo.btDefaultMotionState(transform);
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, shape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);
    this.physicsWorld.addRigidBody(body);
    this.trackRigidBodies.push(body);
  }

  public getSpeed(podId: string): number 
  {
    const podData = this.pods.get(podId);
    if (!podData)
    {
      return 0;
    }
    const velocity = podData.rigidBody.getLinearVelocity();
    return Math.sqrt(velocity.x() * velocity.x() + velocity.z() * velocity.z());
  }

  public removePod(podId: string): void 
  {
    const podData = this.pods.get(podId);
    if (podData) 
    {
      this.physicsWorld.removeRigidBody(podData.rigidBody);
      this.pods.delete(podId);
    }
  }

  private resetPodPosition(podId: string): void 
  {
    const podData = this.pods.get(podId);
    if (!podData) return;
    
    const Ammo = this.ammoInstance;
    const rigidBody = podData.rigidBody;
    
    // CHANGE THIS: Use checkpoint respawn instead of current position
    const respawnPos = podData.pod.getRespawnPosition();
    if (!respawnPos) return; // No valid respawn point
    
    rigidBody.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
    rigidBody.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
    
    const resetTransform = new Ammo.btTransform();
    resetTransform.setIdentity();
    resetTransform.setOrigin(new Ammo.btVector3(
      respawnPos.x,
      respawnPos.y, // Already includes +3 height from getRespawnPosition()
      respawnPos.z
    ));
    
    resetTransform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
    
    rigidBody.setWorldTransform(resetTransform);
    rigidBody.activate(true);
    
    console.log(`Respawned pod ${podId} to checkpoint`);
  }

  public isPhysicsReady(): boolean 
  {
    return this.isInitialized && this.physicsWorld !== null;
  }

  public dispose(): void 
  {
    this.pods.forEach((podData) => 
    {
      this.physicsWorld.removeRigidBody(podData.rigidBody);
    });
    
    this.trackRigidBodies.forEach((rigidBody) => 
    {
      this.physicsWorld.removeRigidBody(rigidBody);
    });
    
    this.pods.clear();
    this.trackRigidBodies = [];
    
    if (this.scene.getPhysicsEngine()) 
    {
      this.scene.disablePhysicsEngine();
    }
    
    this.physicsWorld = null;
    this.ammoInstance = null;
    this.tempTransform = null;
    this.isInitialized = false;
  }
}