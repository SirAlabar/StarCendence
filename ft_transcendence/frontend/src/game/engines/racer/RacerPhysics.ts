import 
{ 
  Scene, 
  Mesh, 
  Vector3, 
  Quaternion,
  AbstractMesh,
  Ray
} from '@babylonjs/core';
import Ammo from 'ammojs-typed';
import { CreateLines, Color3 } from '@babylonjs/core';
import { RacerPod } from './RacerPods';

export class RacerPhysics 
{
  private scene: Scene;
  private physicsWorld: any = null;
  private ammoInstance: any = null;
  private isInitialized: boolean = false;
  private tempTransform: any = null;
  
  private pods: Map<string, { 
    rigidBody: any, 
    mesh: Mesh,
    hoverPoints: Vector3[],
    hoverRays: Ray[],
    pod: RacerPod
  }> = new Map();
  
  private readonly GRAVITY = new Vector3(0, -25, 0);
  private readonly POD_MASS = 100;
  private readonly THRUST_FORCE = 3000;
  private readonly MAX_VELOCITY = 650;
  private readonly HOVER_FORCE = 1000;
  private readonly HOVER_HEIGHT = 3;
  private readonly HOVER_RAY_LENGTH = 10.0;

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

  public createPod(mesh: Mesh, podId: string, pod: RacerPod): void
  {
    if (!this.isInitialized || !this.ammoInstance)
    {
      throw new Error('RacerPhysics: Not initialized');
    }
    
    console.log(`Creating pod physics: ${podId}`);
    
    const Ammo = this.ammoInstance;
    const position = mesh.position;
    const quaternion = mesh.rotationQuaternion || Quaternion.Identity();
    
    // Get dimensions from pod class
    const dimensions = pod.getPhysicalDimensions();
    const podLength = dimensions.length;
    const podWidth = dimensions.width;
    const podHeight = dimensions.height;
    
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
    
    const motionState = new Ammo.btDefaultMotionState(transform);
    const localInertia = new Ammo.btVector3(0, 0, 0);
    
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
    
    // Calculate hover points from collision box corners
    const hoverPoints = this.calculateHoverPoints(podLength, podWidth, podHeight);
    const hoverRays = hoverPoints.map(() => new Ray(Vector3.Zero(), Vector3.Down()));
  
    this.pods.set(podId, { rigidBody, mesh, hoverPoints, hoverRays, pod });
    
    const initialUpwardVelocity = new Ammo.btVector3(0, 0, 0);
    rigidBody.setLinearVelocity(initialUpwardVelocity);
    rigidBody.activate();    
    
    this.showPodCollisionBox(podId, true);
    this.createHoverLines(podId);
    this.createPhysicsDebugHUD(podId);

    
    console.log(`Pod physics created: ${podId}`);
  }



  private calculateHoverPoints(podLength: number, podWidth: number, podHeight: number): Vector3[]  
  {
    const halfWidth = podWidth / 2;
    const halfLength = podLength / 2;
    const boxBottom = -podHeight / 2;
  
    return [
      new Vector3(-halfLength, boxBottom, -halfWidth),  // Front Left corner
      new Vector3(-halfLength, boxBottom, halfWidth),   // Front Right corner
      new Vector3(halfLength, boxBottom, -halfWidth),   // Back Left corner
      new Vector3(halfLength, boxBottom, halfWidth)     // Back Right corner
    ];
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
    
    const speedPercentage = currentSpeed / this.MAX_VELOCITY;
    let thrustMultiplier = 1.0;

    if (speedPercentage < 0.08) 
    {
      thrustMultiplier = 3.0;
    }
    else if (speedPercentage < 0.15) 
    {
      thrustMultiplier = 2.2;
    }
    else if (speedPercentage < 0.25) 
    {
      thrustMultiplier = 1.6;
    }
    else if (speedPercentage < 0.4) 
    {
      thrustMultiplier = 1.2;
    }
    else if (speedPercentage < 0.8) 
    {
      thrustMultiplier = 1.0;
    }
    else 
    {
      thrustMultiplier = 0.7;
    }
  
    const REDUCED_THRUST = this.THRUST_FORCE * 0.3 * thrustMultiplier;
    const REDUCED_MAX_VELOCITY = this.MAX_VELOCITY * 0.9;
  
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
    this.preventUpsideDown(rigidBody, mesh);

    this.updatePhysicsDebugHUD(podId, {
      speed: currentSpeed * 3.6,
      thrust: REDUCED_THRUST * thrustMultiplier,
      maxSpeed: this.MAX_VELOCITY * 3.6,
      acceleration: thrustMultiplier * 100,
      slopeAngle: 0,
      position: mesh.position
    });
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

    // Apply hover force at each of the 4 points
    for (let i = 0; i < hoverPoints.length; i++) 
    {
      // Calculate world position of hover point
      const localHoverPoint = hoverPoints[i];
      const worldHoverPoint = Vector3.TransformCoordinates(localHoverPoint, mesh.getWorldMatrix());
      
      // Cast ray downward from this hover point
      const ray = new Ray(worldHoverPoint, Vector3.Down());
      const hit = this.scene.pickWithRay(ray);

      let distanceFromGround = worldHoverPoint.y; // Use hover point height, not mesh center

      if (hit?.hit && hit.distance < this.HOVER_RAY_LENGTH) 
      {
        distanceFromGround = hit.distance;
      }

      // Apply your original hover logic per point
      if (distanceFromGround < this.HOVER_HEIGHT) 
      {
        const hoverStrength = (this.HOVER_HEIGHT - distanceFromGround) / this.HOVER_HEIGHT;
        const REDUCED_HOVER_FORCE = this.HOVER_FORCE * 0.3;
        const upwardForce = REDUCED_HOVER_FORCE * hoverStrength * 0.016 * 0.25; // Divide by 4 points
        
        // Apply force at this specific hover point
        const forcePosition = new Ammo.btVector3(
          localHoverPoint.x, 
          localHoverPoint.y, 
          localHoverPoint.z
        );
        const upwardForceVector = new Ammo.btVector3(0, upwardForce, 0);
        
        rigidBody.applyForce(upwardForceVector, forcePosition);
      }
    }

    // Keep your original emergency recovery
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

  private preventUpsideDown(rigidBody: any, mesh: Mesh): void 
  {
    const Ammo = this.ammoInstance;
    
    // Check if pod is tilted too much
    const upVector = mesh.up;
    const dotProduct = Vector3.Dot(upVector, Vector3.Up());
    
    // If pod is tilted more than 45 degrees (dotProduct < 0.7)
    if (dotProduct < 0.7) 
    {
      console.warn('Pod tilted too much, applying stabilization');
      
      // Apply strong upright torque
      const stabilizationTorque = new Ammo.btVector3(
        -mesh.rotation.x * 1000,  // Counter roll
        0,                        // Don't affect yaw (steering)
        -mesh.rotation.z * 1000   // Counter pitch
      );
      
      rigidBody.applyTorque(stabilizationTorque);
      
      // If completely upside down, reset pod
      if (dotProduct < 0) 
      {
        const podId = this.findPodIdByMesh(mesh);
        if (podId) 
        {
          const resetPos = new Vector3(mesh.position.x, mesh.position.y + 3, mesh.position.z);
          this.reset(podId, resetPos);
        }
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

    this.pods.forEach((podData, _podId) => 
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

        this.showHoverLines(_podId);
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

  // ===== Debug Visualization Methods =====

  public createHoverLines(podId: string): void 
  {
    const podData = this.pods.get(podId);
    if (!podData) 
    {
      return;
    }

    const { mesh, pod } = podData;
    
    // Remove any existing hover lines first
    this.scene.meshes.filter(meshItem => 
      meshItem.name.startsWith(`hoverLine_${podId}`)
    ).forEach(meshItem => meshItem.dispose());

    // Get current collision box dimensions
    const dimensions = pod.getPhysicalDimensions();
    const hoverPoints = this.calculateHoverPoints(dimensions.length, dimensions.width, dimensions.height);
    
    // Create initial hover lines for each hover point
    hoverPoints.forEach((hoverPoint, index) => 
    {
      const worldHoverPoint = Vector3.TransformCoordinates(hoverPoint, mesh.getWorldMatrix());
      
      // Cast ray downward from hover point
      const ray = new Ray(worldHoverPoint, Vector3.Down());
      const hit = this.scene.pickWithRay(ray);
      
      // Create line from hover point to ground or max distance
      const rayEnd = hit?.hit ? 
        hit.pickedPoint! : 
        worldHoverPoint.add(Vector3.Down().scale(this.HOVER_RAY_LENGTH));
      
      const linePoints = [worldHoverPoint, rayEnd];
      const hoverLine = CreateLines(`hoverLine_${podId}_${index}`, { points: linePoints }, this.scene);
      hoverLine.color = new Color3(0, 1, 0); // Green lines
      hoverLine.alpha = 0.8;
      
      console.log(`Created hover line ${index} for pod ${podId}`);
    });
  }

  private showHoverLines(podId: string): void 
  {
    const podData = this.pods.get(podId);
    if (!podData) 
    {
      return;
    }

    const { mesh, pod } = podData;
    
    // Check if hover lines exist
    const existingLines = this.scene.meshes.filter(meshItem => 
      meshItem.name.startsWith(`hoverLine_${podId}`)
    );
    
    // If no lines exist, create them
    if (existingLines.length === 0) 
    {
      this.createHoverLines(podId);
      return;
    }

    // Get current collision box dimensions
    const dimensions = pod.getPhysicalDimensions();
    const currentHoverPoints = this.calculateHoverPoints(dimensions.length, dimensions.width, dimensions.height);
    
    // Remove old hit spheres
    this.scene.meshes.filter(meshItem => 
      meshItem.name.startsWith(`hitSphere_${podId}`)
    ).forEach(meshItem => meshItem.dispose());
    
    currentHoverPoints.forEach((hoverPoint, index) => 
    {
      const worldHoverPoint = Vector3.TransformCoordinates(hoverPoint, mesh.getWorldMatrix());
      
      // Cast ray and check hit
      const ray = new Ray(worldHoverPoint, Vector3.Down());
      const hit = this.scene.pickWithRay(ray);
      
      // Update existing line
      const existingLine = existingLines[index];
      if (existingLine) 
      {
        const rayEnd = hit?.hit ? 
          hit.pickedPoint! : 
          worldHoverPoint.add(Vector3.Down().scale(this.HOVER_RAY_LENGTH));
        
        const newPoints = [worldHoverPoint, rayEnd];
        existingLine.dispose();
        
        const newRayLine = CreateLines(`hoverLine_${podId}_${index}`, { points: newPoints }, this.scene);
        newRayLine.color = hit?.hit ? new Color3(0, 1, 0) : new Color3(1, 1, 0); // Green if hitting, yellow if not
        newRayLine.alpha = 0.8;
      }
      
      // Create new hit sphere if ray hits
      if (hit?.hit && hit.pickedPoint) 
      {
        import('@babylonjs/core').then(({ CreateSphere, StandardMaterial }) => 
        {
          const hitSphere = CreateSphere(`hitSphere_${podId}_${index}`, { diameter: 0.3 }, this.scene);
          hitSphere.position = hit.pickedPoint!.clone();
          
          const hitMaterial = new StandardMaterial(`hitMat_${podId}_${index}`, this.scene);
          hitMaterial.diffuseColor = new Color3(1, 1, 0); // Yellow hit spheres
          hitMaterial.emissiveColor = new Color3(0.3, 0.3, 0);
          hitSphere.material = hitMaterial;
        });
      }
    });
  }

  public showPodCollisionBox(podId: string, show: boolean): void 
  {
    const podData = this.pods.get(podId);
    if (!podData) 
    {
      return;
    }

    const { mesh, pod } = podData;
    
    // Remove existing collision box visualization
    this.scene.meshes.filter(meshItem => meshItem.name.startsWith(`collisionBox_${podId}`))
      .forEach(meshItem => meshItem.dispose());
    
    if (show) 
    {
      // Get dimensions from pod class
      const dimensions = pod.getPhysicalDimensions();
      const podLength = dimensions.length;
      const podWidth = dimensions.width;
      const podHeight = dimensions.height;
      
      // Create wireframe box matching the collision shape
      const boxCorners = [
        // Bottom face
        new Vector3(-podLength/2, -podHeight/2, -podWidth/2),
        new Vector3(podLength/2, -podHeight/2, -podWidth/2),
        new Vector3(podLength/2, -podHeight/2, podWidth/2),
        new Vector3(-podLength/2, -podHeight/2, podWidth/2),
        
        // Top face  
        new Vector3(-podLength/2, podHeight/2, -podWidth/2),
        new Vector3(podLength/2, podHeight/2, -podWidth/2),
        new Vector3(podLength/2, podHeight/2, podWidth/2),
        new Vector3(-podLength/2, podHeight/2, podWidth/2)
      ];
      
      // Create wireframe lines for collision box
      const boxLines: Vector3[] = [];
      
      // Bottom face edges
      boxLines.push(boxCorners[0], boxCorners[1], boxCorners[1], boxCorners[2], 
                    boxCorners[2], boxCorners[3], boxCorners[3], boxCorners[0]);
      
      // Top face edges
      boxLines.push(boxCorners[4], boxCorners[5], boxCorners[5], boxCorners[6], 
                    boxCorners[6], boxCorners[7], boxCorners[7], boxCorners[4]);
      
      // Vertical edges connecting top and bottom
      boxLines.push(boxCorners[0], boxCorners[4], boxCorners[1], boxCorners[5],
                    boxCorners[2], boxCorners[6], boxCorners[3], boxCorners[7]);
      
      const collisionBoxWireframe = CreateLines(`collisionBox_${podId}`, { points: boxLines }, this.scene);
      collisionBoxWireframe.color = new Color3(1, 1, 0); // Yellow collision box
      collisionBoxWireframe.alpha = 0.7;
      
      // Make the wireframe follow the pod
      collisionBoxWireframe.parent = mesh;
      
      console.log(`Collision box visible for pod: ${podId}`);
    }
    else 
    {
      console.log(`Collision box hidden for pod: ${podId}`);
    }
  }

  // ===== Toggle Debug Visualization =====

  public togglePodDebugVisualization(podId: string): void 
  {
    const hoverLinesVisible = this.scene.meshes.some(mesh => 
      mesh.name.startsWith(`hoverLine_${podId}`) && mesh.isVisible
    );
    
    const collisionBoxVisible = this.scene.meshes.some(mesh => 
      mesh.name.startsWith(`collisionBox_${podId}`) && mesh.isVisible
    );
    
    // Toggle both hover lines and collision box
    const newVisibility = !(hoverLinesVisible || collisionBoxVisible);
    
    this.showPodCollisionBox(podId, newVisibility);
    
    console.log(`Pod debug visualization ${newVisibility ? 'enabled' : 'disabled'} for: ${podId}`);
  }

  public createPhysicsDebugHUD(podId: string): void 
  {
    // Remove existing debug HUD
    const existingHUD = document.getElementById('physicsDebugHUD');
    if (existingHUD) 
    {
      existingHUD.remove();
    }

    const debugHTML = `
      <div id="physicsDebugHUD" class="absolute top-20 left-4 bg-black/80 text-white p-4 rounded-lg text-sm font-mono" style="z-index: 1001;">
        <h3 class="text-green-400 font-bold mb-2">Physics Debug - ${podId}</h3>
        
        <div class="grid grid-cols-2 gap-4">
          <!-- Movement Forces -->
          <div>
            <div class="text-yellow-400 font-bold">Movement</div>
            <div>Speed: <span id="debugSpeed">0</span> km/h</div>
            <div>Thrust: <span id="debugThrust">0</span> N</div>
            <div>Max Speed: <span id="debugMaxSpeed">0</span> km/h</div>
            <div>Acceleration: <span id="debugAcceleration">0</span>%</div>
          </div>
          
          <!-- Hover System -->
          <div>
            <div class="text-blue-400 font-bold">Hover System</div>
            <div>Height: <span id="debugHeight">0</span> m</div>
            <div>Hover Force: <span id="debugHoverForce">0</span> N</div>
            <div>Ground Contact: <span id="debugGroundContact">0</span>/4</div>
            <div>Slope Angle: <span id="debugSlopeAngle">0</span>°</div>
          </div>
          
          <!-- Physics Forces -->
          <div>
            <div class="text-red-400 font-bold">Forces</div>
            <div>Gravity: <span id="debugGravity">0</span> N</div>
            <div>Velocity X: <span id="debugVelX">0</span></div>
            <div>Velocity Y: <span id="debugVelY">0</span></div>
            <div>Velocity Z: <span id="debugVelZ">0</span></div>
          </div>
          
          <!-- Position -->
          <div>
            <div class="text-purple-400 font-bold">Position</div>
            <div>X: <span id="debugPosX">0</span></div>
            <div>Y: <span id="debugPosY">0</span></div>
            <div>Z: <span id="debugPosZ">0</span></div>
            <div>On Track: <span id="debugOnTrack">Unknown</span></div>
          </div>
        </div>
        
        <div class="mt-4 border-t border-gray-600 pt-2">
          <div class="text-gray-400 text-xs">
            Press 'P' to toggle physics debug | 'H' to toggle hover lines
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', debugHTML);
  }

    private updatePhysicsDebugHUD(_podId: string, data: {
    speed: number,
    thrust: number,
    maxSpeed: number,
    acceleration: number,
    slopeAngle: number,
    position: Vector3
  }): void 
  {
    document.getElementById('debugSpeed')!.textContent = Math.round(data.speed).toString();
    document.getElementById('debugThrust')!.textContent = Math.round(data.thrust).toString();
    document.getElementById('debugMaxSpeed')!.textContent = Math.round(data.maxSpeed).toString();
    document.getElementById('debugAcceleration')!.textContent = Math.round(data.acceleration).toString();
    document.getElementById('debugSlopeAngle')!.textContent = Math.round(data.slopeAngle).toString();
    document.getElementById('debugPosX')!.textContent = data.position.x.toFixed(1);
    document.getElementById('debugPosY')!.textContent = data.position.y.toFixed(1);
    document.getElementById('debugPosZ')!.textContent = data.position.z.toFixed(1);
    document.getElementById('debugGravity')!.textContent = Math.abs(this.GRAVITY.y * this.POD_MASS).toString();
  }

  // ===== Cleanup =====

  public clearPhysicsDebugHUD(): void 
  {
    const existingHUD = document.getElementById('physicsDebugHUD');
    if (existingHUD) 
    {
      existingHUD.remove();
    }
    
    this.pods.forEach((_, podId) => {
      this.scene.meshes.filter(mesh => 
        mesh.name.startsWith(`hoverLine_${podId}`) || 
        mesh.name.startsWith(`hitSphere_${podId}`) ||
        mesh.name.startsWith(`collisionBox_${podId}`)
      ).forEach(mesh => mesh.dispose());
    });
    
    this.clearCollisionVisualization();
  }

  public setupPageCleanup(): void 
  {
    window.addEventListener('beforeunload', () => {
      this.clearPhysicsDebugHUD();
    });
    
    window.addEventListener('popstate', () => {
      this.clearPhysicsDebugHUD();
    });
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
}