import 
{ 
  Scene, 
  Mesh, 
  Vector3, 
  Quaternion,
  AbstractMesh
} from '@babylonjs/core';
import Ammo from 'ammojs-typed';
import { CreateLines, Color3 } from '@babylonjs/core';

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

  private debugCollisionVisualization: AbstractMesh[] = [];

  constructor(scene: Scene) 
  {
    this.scene = scene;
    console.log('RacerPhysics: Initializing');
  }

  // ===== Debug Visualization =====

  public createCollisionVisualization(meshes: AbstractMesh[], scaleFactor: number = 8): void 
  {
    console.log('RacerPhysics: Creating collision visualization');
    
    this.clearCollisionVisualization();
    
    meshes.forEach((mesh, index) => 
    {
      if (!(mesh instanceof Mesh)) 
      {
        return;
      }

      const babylonMesh = mesh as Mesh;
      const vertices = babylonMesh.getVerticesData('position');
      const indices = babylonMesh.getIndices();

      if (!vertices || !indices) 
      {
        return;
      }

      const linePoints: Vector3[] = [];
      
      for (let i = 0; i < indices.length; i += 3) 
      {
        const i1 = indices[i] * 3;
        const i2 = indices[i + 1] * 3;
        const i3 = indices[i + 2] * 3;

        const v1 = new Vector3(
          vertices[i1] * scaleFactor,
          vertices[i1 + 1] * scaleFactor,
          vertices[i1 + 2] * scaleFactor
        );
        const v2 = new Vector3(
          vertices[i2] * scaleFactor,
          vertices[i2 + 1] * scaleFactor,
          vertices[i2 + 2] * scaleFactor
        );
        const v3 = new Vector3(
          vertices[i3] * scaleFactor,
          vertices[i3 + 1] * scaleFactor,
          vertices[i3 + 2] * scaleFactor
        );

        if (i % 1 === 0) 
        {
          linePoints.push(v1, v2, v2, v3, v3, v1);
        }
      }

      if (linePoints.length > 0) 
      {
        const collisionLines = CreateLines(`collisionWireframe_${index}`, { points: linePoints }, this.scene);
        collisionLines.color = new Color3(1, 0, 0);
        collisionLines.alpha = 0.6;
        
        this.debugCollisionVisualization.push(collisionLines);
      }
    });
    
    console.log(`RacerPhysics: Collision visualization created for ${meshes.length} meshes`);
  }

  public clearCollisionVisualization(): void 
  {
    this.debugCollisionVisualization.forEach(mesh => mesh.dispose());
    this.debugCollisionVisualization = [];
  }

  public toggleCollisionVisualization(): boolean 
  {
    const isVisible = this.debugCollisionVisualization.length > 0 && this.debugCollisionVisualization[0].isVisible;
    
    this.debugCollisionVisualization.forEach(mesh => 
    {
      mesh.isVisible = !isVisible;
    });
    
    return !isVisible;
  }

  // ===== Physics Initialization =====

  public async initialize(): Promise<void> 
  {
    if (this.isInitialized) 
    {
      return;
    }

    try 
    {
      console.log('RacerPhysics: Initializing physics engine');
      
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
      console.log('RacerPhysics: Ready');
    } 
    catch (error) 
    {
      console.error('RacerPhysics: Failed to initialize:', error);
      throw error;
    }
  }

  // ===== Pod Physics Creation =====

  public createPod(mesh: Mesh, podId: string): void 
  {
    if (!this.isInitialized || !this.ammoInstance) 
    {
      throw new Error('RacerPhysics: Not initialized');
    }

    console.log(`Creating pod physics: ${podId}`);

    const Ammo = this.ammoInstance;
    const position = mesh.position;
    const quaternion = mesh.rotationQuaternion || Quaternion.Identity();

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

    const rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(this.POD_MASS, motionState, compoundShape, localInertia);
    const rigidBody = new Ammo.btRigidBody(rigidBodyInfo);
    
    rigidBody.setDamping(0.3, 0.5);
    rigidBody.setFriction(0.8);
    rigidBody.setRestitution(0.1);
    rigidBody.setActivationState(4);
    rigidBody.forceActivationState(4);
    
    this.physicsWorld.addRigidBody(rigidBody);
    this.pods.set(podId, { rigidBody, mesh });

    const initialUpwardVelocity = new Ammo.btVector3(0, 0, 0);
    rigidBody.setLinearVelocity(initialUpwardVelocity);
    rigidBody.activate();

    console.log(`Pod physics created: ${podId}`);
  }

  // ===== Track Physics Setup =====

  public async setupTrackCollision(trackMesh: AbstractMesh, showVisualization: boolean = false, scaleFactor: number = 8): Promise<void> 
  {
    if (!this.isInitialized || !this.ammoInstance) 
    {
      throw new Error('RacerPhysics: Cannot setup track - not initialized');
    }

    console.log('RacerPhysics: Setting up track collision');
    
    await this.waitForGeometryReady(trackMesh);
    
    const meshesWithGeometry = this.findMeshesWithGeometry(trackMesh);
    
    if (meshesWithGeometry.length > 0) 
    {
      this.createTrackFromMultipleMeshes(meshesWithGeometry, scaleFactor);
      
      if (showVisualization) 
      {
        this.createCollisionVisualization(meshesWithGeometry, scaleFactor);
        console.log('RacerPhysics: Collision visualization enabled');
      }
      
      console.log('RacerPhysics: Track collision setup complete');
    }
    else 
    {
      throw new Error('RacerPhysics: No meshes with geometry found');
    }
  }

  private async waitForGeometryReady(trackMesh: AbstractMesh, maxWaitMs: number = 3000): Promise<void> 
  {
    const startTime = Date.now();
    
    return new Promise((resolve) => 
    {
      const checkGeometry = () => 
      {
        if (trackMesh instanceof Mesh) 
        {
          const vertices = trackMesh.getVerticesData('position');
          if (vertices && vertices.length > 0) 
          {
            resolve();
            return;
          }
        }
        
        const children = trackMesh.getChildMeshes();
        for (const child of children) 
        {
          if (child instanceof Mesh) 
          {
            const vertices = child.getVerticesData('position');
            if (vertices && vertices.length > 0) 
            {
              resolve();
              return;
            }
          }
        }
        
        if (Date.now() - startTime > maxWaitMs) 
        {
          console.warn('RacerPhysics: Timeout waiting for geometry data');
          resolve();
          return;
        }
        
        setTimeout(checkGeometry, 16);
      };
      
      checkGeometry();
    });
  }

  private findMeshesWithGeometry(trackMesh: AbstractMesh): Mesh[] 
  {
    const meshesWithGeometry: Mesh[] = [];
    
    if (trackMesh instanceof Mesh) 
    {
      const vertices = trackMesh.getVerticesData('position');
      const indices = trackMesh.getIndices();
      
      if (vertices && indices && vertices.length > 0) 
      {
        meshesWithGeometry.push(trackMesh);
      }
    }
    
    const children = trackMesh.getChildMeshes();
    children.forEach((child) => 
    {
      if (child instanceof Mesh) 
      {
        const vertices = child.getVerticesData('position');
        const indices = child.getIndices();
        
        if (vertices && indices && vertices.length > 0) 
        {
          meshesWithGeometry.push(child);
        }
      }
    });
    
    console.log(`RacerPhysics: Found ${meshesWithGeometry.length} meshes with geometry`);
    return meshesWithGeometry;
  }

  public createTrackFromMultipleMeshes(meshes: AbstractMesh[], scaleFactor: number = 8): void 
  {
    if (!this.isInitialized || !this.ammoInstance) 
    {
      throw new Error('RacerPhysics: Cannot create track - not initialized');
    }

    const Ammo = this.ammoInstance;
    const triangleMesh = new Ammo.btTriangleMesh(true, true);
    let totalTriangles = 0;

    meshes.forEach((mesh) => 
    {
      if (!(mesh instanceof Mesh)) 
      {
        return;
      }

      const babylonMesh = mesh as Mesh;
      const vertices = babylonMesh.getVerticesData('position');
      const indices = babylonMesh.getIndices();

      if (!vertices || !indices) 
      {
        return;
      }

      for (let i = 0; i < indices.length; i += 3) 
      {
        const i1 = indices[i] * 3;
        const i2 = indices[i + 1] * 3;
        const i3 = indices[i + 2] * 3;

        const v1 = new Ammo.btVector3(
          vertices[i1] * scaleFactor,
          vertices[i1 + 1] * scaleFactor,
          vertices[i1 + 2] * scaleFactor
        );
        const v2 = new Ammo.btVector3(
          vertices[i2] * scaleFactor,
          vertices[i2 + 1] * scaleFactor,
          vertices[i2 + 2] * scaleFactor
        );
        const v3 = new Ammo.btVector3(
          vertices[i3] * scaleFactor,
          vertices[i3 + 1] * scaleFactor,
          vertices[i3 + 2] * scaleFactor
        );

        triangleMesh.addTriangle(v1, v2, v3, false);
        totalTriangles++;
      }
    });

    if (totalTriangles === 0) 
    {
      throw new Error('RacerPhysics: No triangles found in meshes');
    }

    const trackShape = new Ammo.btBvhTriangleMeshShape(triangleMesh, true);
    trackShape.setMargin(0.05);

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(0, 0, 0));
    transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));

    const motionState = new Ammo.btDefaultMotionState(transform);
    const localInertia = new Ammo.btVector3(0, 0, 0);
    
    const rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(
      0, 
      motionState, 
      trackShape, 
      localInertia
    );
    
    const trackRigidBody = new Ammo.btRigidBody(rigidBodyInfo);
    trackRigidBody.setFriction(0.8);
    trackRigidBody.setRestitution(0.1);
    trackRigidBody.setCollisionFlags(1);

    this.physicsWorld.addRigidBody(trackRigidBody);
    
    console.log(`RacerPhysics: Track collision created - ${totalTriangles} triangles`);
  }

  // ===== Pod Movement =====

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

    const REDUCED_THRUST = this.THRUST_FORCE * 0.1;
    const REDUCED_MAX_VELOCITY = this.MAX_VELOCITY * 0.3;
    
    if (currentSpeed < REDUCED_MAX_VELOCITY && input.z !== 0) 
    {
      const forwardDir = this.getForwardDirection(mesh);
      
      const thrustForce = new Ammo.btVector3(
        forwardDir.x * input.z * REDUCED_THRUST * 0.016,
        0,
        forwardDir.z * input.z * REDUCED_THRUST * 0.016
      );
      
      const newVelocity = new Ammo.btVector3(
        velocity.x() + thrustForce.x(),
        velocity.y(),
        velocity.z() + thrustForce.z()
      );
      
      rigidBody.setLinearVelocity(newVelocity);
    }
    
    const REDUCED_TURN_FORCE = 8.0;
    if (input.x !== 0) 
    {
      const turnForce = new Ammo.btVector3(0, +input.x * REDUCED_TURN_FORCE, 0);
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
    }

    if (mesh.position.y < 0) 
    {
      console.warn(`Pod below ground, resetting position`);
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
    const forward = mesh.getDirection(new Vector3(-1, 0, 0));
    return forward.normalize();
  }

  // ===== Physics Update =====

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
        
        mesh.position.set(position.x(), position.y(), position.z());
        
        if (!mesh.rotationQuaternion) 
        {
          mesh.rotationQuaternion = new Quaternion();
        }
        
        mesh.rotationQuaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
      }
    });
  }

  // ===== Data Access =====

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

  // ===== Status =====

  public isPhysicsReady(): boolean 
  {
    return this.isInitialized && this.physicsWorld !== null;
  }

  // ===== Cleanup =====

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
}