import 
{ 
  Scene, 
  Mesh, 
  Vector3, 
  Quaternion
} from '@babylonjs/core';
import Ammo from 'ammojs-typed';

export class RacerPhysics 
{
  private scene: Scene;
  private physicsWorld: any = null;
  private ammoInstance: any = null;
  private isInitialized: boolean = false;
  private tempTransform: any = null;
  
  private pods: Map<string, { rigidBody: any, mesh: Mesh }> = new Map();
  
  private readonly GRAVITY = new Vector3(0, -9.81, 0);
  private readonly POD_MASS = 100;
  private readonly THRUST_FORCE = 2000;
  private readonly MAX_VELOCITY = 50;
  private readonly HOVER_FORCE = 1500;
  private readonly HOVER_HEIGHT = 3;

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

    try 
    {
      console.log('RacerPhysics: Attempt 1/1');
      
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
        this.updatePhysics();
      });
      
      this.isInitialized = true;
      console.log('RacerPhysics: Ready with AmmoJSPlugin');
    } 
    catch (error) 
    {
      console.error('RacerPhysics: Failed to initialize:', error);
      throw error;
    }
  }

    public createPod(mesh: Mesh, podId: string): void 
    {
        if (!this.isInitialized || !this.ammoInstance) 
        {
            console.error('RacerPhysics: Not initialized');
            return;
        }

        console.log(`🏎️ [POD-PHYSICS] Creating pod collision for: ${podId}`);

        const Ammo = this.ammoInstance;
        const position = mesh.position;
        const quaternion = mesh.rotationQuaternion || Quaternion.Identity();
        
        console.log(`🏎️ [POD-PHYSICS] Pod position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
        transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));

        const motionState = new Ammo.btDefaultMotionState(transform);
        const localInertia = new Ammo.btVector3(0, 0, 0);

        const podLength = 2.0;
        const podWidth = 0.8;
        const podHeight = 0.6;

        const compoundShape = new Ammo.btCompoundShape();
        
        const mainShape = new Ammo.btBoxShape(new Ammo.btVector3(podLength/2, podHeight/2, podWidth/2));
        const mainTransform = new Ammo.btTransform();
        mainTransform.setIdentity();
        compoundShape.addChildShape(mainTransform, mainShape);
        
        const frontShape = new Ammo.btBoxShape(new Ammo.btVector3(0.3, podHeight/3, podWidth/3));
        const frontTransform = new Ammo.btTransform();
        frontTransform.setIdentity();
        frontTransform.setOrigin(new Ammo.btVector3(podLength/2 + 0.3, 0, 0));
        compoundShape.addChildShape(frontTransform, frontShape);

        compoundShape.setMargin(0.05);
        compoundShape.calculateLocalInertia(this.POD_MASS, localInertia);

        console.log(`🏎️ [POD-PHYSICS] Pod collision shape: ${podLength}×${podHeight}×${podWidth}`);

        const rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(this.POD_MASS, motionState, compoundShape, localInertia);
        const rigidBody = new Ammo.btRigidBody(rigidBodyInfo);
        
        rigidBody.setDamping(0.3, 0.5);
        rigidBody.setFriction(0.8);
        rigidBody.setRestitution(0.1);
        rigidBody.setActivationState(4);
        rigidBody.forceActivationState(4);
        
        this.physicsWorld.addRigidBody(rigidBody);
        this.pods.set(podId, { rigidBody, mesh });
        
        console.log(`🏎️ [POD-PHYSICS] Pod collision body created and added to physics world`);
        console.log(`🏎️ [POD-PHYSICS] Pod mass: ${this.POD_MASS}, damping: 0.3/0.5, friction: 0.8`);
    }

    public createTrack(trackMesh: Mesh): void 
    {
        if (!this.isInitialized || !this.ammoInstance) 
        {
            console.error('RacerPhysics: Cannot create track - not initialized');
            return;
        }

        console.log(`🏁 [TRACK-PHYSICS] Creating track collision for: ${trackMesh.name}`);
        console.log(`🏁 [TRACK-PHYSICS] Track position: (${trackMesh.position.x}, ${trackMesh.position.y}, ${trackMesh.position.z})`);
        console.log(`🏁 [TRACK-PHYSICS] Track scaling: (${trackMesh.scaling.x}, ${trackMesh.scaling.y}, ${trackMesh.scaling.z})`);

        const Ammo = this.ammoInstance;

        try 
        {
            const geometry = trackMesh.geometry;
            if (!geometry) 
            {
                console.error('🏁 [TRACK-PHYSICS] No geometry found in track mesh');
                return;
            }

            const positions = geometry.getVerticesData('position');
            if (!positions) 
            {
                console.error('🏁 [TRACK-PHYSICS] No vertex positions found in track geometry');
                return;
            }

            console.log(`🏁 [TRACK-PHYSICS] Track vertices count: ${positions.length / 3}`);

            const triangleMesh = new Ammo.btTriangleMesh(true, true);
            
            const vectA = new Ammo.btVector3(0, 0, 0);
            const vectB = new Ammo.btVector3(0, 0, 0);
            const vectC = new Ammo.btVector3(0, 0, 0);

            const scaleX = trackMesh.scaling.x;
            const scaleY = trackMesh.scaling.y;
            const scaleZ = trackMesh.scaling.z;

            for (let i = 0; i < positions.length; i += 9) 
            {
                vectA.setValue(positions[i] * scaleX, positions[i + 1] * scaleY, positions[i + 2] * scaleZ);
                vectB.setValue(positions[i + 3] * scaleX, positions[i + 4] * scaleY, positions[i + 5] * scaleZ);
                vectC.setValue(positions[i + 6] * scaleX, positions[i + 7] * scaleY, positions[i + 8] * scaleZ);

                triangleMesh.addTriangle(vectA, vectB, vectC, true);
            }

            console.log(`🏁 [TRACK-PHYSICS] Triangle mesh created with ${positions.length / 9} triangles`);

            Ammo.destroy(vectA);
            Ammo.destroy(vectB);
            Ammo.destroy(vectC);

            const shape = new Ammo.btBvhTriangleMeshShape(triangleMesh, true, true);
            shape.setMargin(0.05);

            const transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(trackMesh.position.x, trackMesh.position.y, trackMesh.position.z));
            transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));

            const motionState = new Ammo.btDefaultMotionState(transform);
            const localInertia = new Ammo.btVector3(0, 0, 0);

            const rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, shape, localInertia);
            const rigidBody = new Ammo.btRigidBody(rigidBodyInfo);
            
            rigidBody.setFriction(0.8);
            rigidBody.setRestitution(0.2);
            
            this.physicsWorld.addRigidBody(rigidBody);
            
            console.log(`🏁 [TRACK-PHYSICS] Track collision created from real geometry!`);
        } 
        catch (error) 
        {
            console.error('🏁 [TRACK-PHYSICS] Failed to create track collision:', error);
        }
    }

  public movePod(podId: string, input: { x: number, z: number }): void 
  {
    const podData = this.pods.get(podId);
    if (!podData || !this.ammoInstance) 
    {
      console.warn(`RacerPhysics: Pod ${podId} not found or Ammo not ready`);
      return;
    }

    const Ammo = this.ammoInstance;
    const rigidBody = podData.rigidBody;
    const mesh = podData.mesh;

    console.log(`Moving pod ${podId}: input(${input.x.toFixed(2)}, ${input.z.toFixed(2)})`);

    const velocity = rigidBody.getLinearVelocity();
    const currentSpeed = Math.sqrt(velocity.x() * velocity.x() + velocity.z() * velocity.z());
    
    console.log(`Current speed: ${currentSpeed.toFixed(2)}, position: (${mesh.position.x.toFixed(2)}, ${mesh.position.y.toFixed(2)}, ${mesh.position.z.toFixed(2)})`);

    const MAX_DISTANCE_FROM_ORIGIN = 200;
    const currentDistance = Math.sqrt(mesh.position.x * mesh.position.x + mesh.position.z * mesh.position.z);
    
    if (currentDistance > MAX_DISTANCE_FROM_ORIGIN) 
    {
      console.warn(`Pod ${podId} too far from origin (${currentDistance.toFixed(2)}), resetting to origin`);
      this.reset(podId, new Vector3(0, 5, 0));
      return;
    }

    const REDUCED_THRUST = this.THRUST_FORCE * 0.1;
    const REDUCED_MAX_VELOCITY = this.MAX_VELOCITY * 0.3;
    
    if (currentSpeed < REDUCED_MAX_VELOCITY && input.z !== 0) 
    {
      const forwardDir = this.getForwardDirection(mesh);
      console.log(`Forward direction: (${forwardDir.x.toFixed(2)}, ${forwardDir.z.toFixed(2)})`);
      
      const thrustForce = new Ammo.btVector3(
        forwardDir.x * input.z * REDUCED_THRUST * 0.016,
        0,
        forwardDir.z * input.z * REDUCED_THRUST * 0.016
      );
      
      console.log(`Applying thrust: (${thrustForce.x().toFixed(2)}, ${thrustForce.z().toFixed(2)})`);
      
      const newVelocity = new Ammo.btVector3(
        velocity.x() + thrustForce.x(),
        velocity.y(),
        velocity.z() + thrustForce.z()
      );
      
      rigidBody.setLinearVelocity(newVelocity);
    }
    
    const REDUCED_TURN_FORCE = 1.0;
    if (input.x !== 0) 
    {
      const turnForce = new Ammo.btVector3(0, -input.x * REDUCED_TURN_FORCE, 0);
      console.log(`Applying turn: ${turnForce.y().toFixed(2)}`);
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

    this.applyHoverForce(rigidBody, mesh);
  }

  private applyHoverForce(rigidBody: any, mesh: Mesh): void 
  {
    const Ammo = this.ammoInstance;
    const distanceFromGround = mesh.position.y;
    
    if (distanceFromGround < this.HOVER_HEIGHT) 
    {
      const hoverStrength = (this.HOVER_HEIGHT - distanceFromGround) / this.HOVER_HEIGHT;
      const REDUCED_HOVER_FORCE = this.HOVER_FORCE * 0.3;
      const upwardForce = REDUCED_HOVER_FORCE * hoverStrength * 0.016;
      
      const velocity = rigidBody.getLinearVelocity();
      const newVelocity = new Ammo.btVector3(
        velocity.x(),
        velocity.y() + upwardForce,
        velocity.z()
      );
      
      rigidBody.setLinearVelocity(newVelocity);
      console.log(`Hover force applied: ${upwardForce.toFixed(2)}, height: ${distanceFromGround.toFixed(2)}`);
    }

    if (mesh.position.y < 0) 
    {
      console.warn(`Pod below ground level, resetting position`);
      const podId = this.findPodIdByMesh(mesh);
      if (podId) 
      {
        const resetPos = new Vector3(mesh.position.x, this.HOVER_HEIGHT + 2, mesh.position.z);
        this.reset(podId, resetPos);
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

  private getForwardDirection(mesh: Mesh): Vector3 
  {
    const forward = mesh.getDirection(new Vector3(0, 0, -1));
    return forward.normalize();
  }

  private updatePhysics(): void 
  {
    if (!this.physicsWorld) 
    {
      return;
    }

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
        
        const oldPosition = mesh.position.clone();
        
        mesh.position.set(position.x(), position.y(), position.z());
        
        if (!mesh.rotationQuaternion) 
        {
          mesh.rotationQuaternion = new Quaternion();
        }
        
        mesh.rotationQuaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        
        const positionChange = mesh.position.subtract(oldPosition).length();
        if (positionChange > 0.1) 
        {
          console.log(`Pod ${podId} moved: ${positionChange.toFixed(2)} units, new pos: (${mesh.position.x.toFixed(2)}, ${mesh.position.y.toFixed(2)}, ${mesh.position.z.toFixed(2)})`);
        }
      }
    });
  }

  public getSpeed(podId: string): number 
  {
    const podData = this.pods.get(podId);
    if (!podData) 
    {
      return 0;
    }
    
    const velocity = podData.rigidBody.getLinearVelocity();
    return Math.sqrt(velocity.x() * velocity.x() + velocity.y() * velocity.y() + velocity.z() * velocity.z());
  }

  public reset(podId: string, position: Vector3, rotation?: Vector3): void 
  {
    const podData = this.pods.get(podId);
    if (!podData || !this.ammoInstance) 
    {
      return;
    }

    const Ammo = this.ammoInstance;
    const rigidBody = podData.rigidBody;
    
    rigidBody.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
    rigidBody.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
    
    this.tempTransform.setIdentity();
    this.tempTransform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    
    if (rotation) 
    {
      const quat = Quaternion.FromEulerAngles(rotation.x, rotation.y, rotation.z);
      this.tempTransform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    }
    
    rigidBody.setWorldTransform(this.tempTransform);
    rigidBody.activate();
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

  public dispose(): void 
  {
    this.pods.forEach((podData) => 
    {
      this.physicsWorld.removeRigidBody(podData.rigidBody);
    });
    
    this.pods.clear();
    
    if (this.scene.getPhysicsEngine()) 
    {
      this.scene.disablePhysicsEngine();
    }
    
    this.physicsWorld = null;
    this.ammoInstance = null;
    this.tempTransform = null;
    this.isInitialized = false;
    
    console.log('RacerPhysics: Disposed');
  }
  
  public isPhysicsReady(): boolean 
  {
    return this.isInitialized && this.physicsWorld !== null;
  }
}