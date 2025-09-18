import 
{ 
  Scene, 
  Mesh, 
  Vector3, 
  Quaternion,
  AbstractMesh,
  Ray,
  Color3,
  VertexBuffer,
  CreateRibbon,
  Vector2
} from '@babylonjs/core';
import Ammo from 'ammojs-typed';
import { CreateLines, CreateSphere, StandardMaterial } from '@babylonjs/core';
import { RacerPod } from './RacerPods';

export class RacerPhysics 
{
  private scene: Scene;
  private physicsWorld: any = null;
  private ammoInstance: any = null;
  private isInitialized: boolean = false;
  private tempTransform: any = null;
  private racerScene: any = null;
  private trackRigidBodies: any[] = [];
  
  // Player tracking - EXATO do exemplo
  private player: any = null;
  private controls: any = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    vehicleSteering: 0,
    steeringClamp: 0.5,
    steeringIncrement: 0.005
  };
  
  private pods: Map<string, { 
    rigidBody: any,
    vehicle: any,
    mesh: Mesh,
    pod: RacerPod,
    chassisMesh?: Mesh
  }> = new Map();
  
  private readonly GRAVITY = new Vector3(0, -49, 0); // EXATO do exemplo

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
      console.log('RacerPhysics: Initializing physics engine');
      
      const ammoInstance = await Ammo.bind(window)();
      const physicsPlugin = new (await import('@babylonjs/core')).AmmoJSPlugin(true, ammoInstance);
      
      // EXATO do exemplo - gravidade -49
      this.scene.enablePhysics(new Vector3(0, -49, 0), physicsPlugin);
      
      const physicsEngine = this.scene.getPhysicsEngine();
      const plugin = physicsEngine?.getPhysicsPlugin();
      if (!plugin) 
      {
        throw new Error('Physics plugin not available');
      }
      
      this.physicsWorld = plugin.world;
      this.ammoInstance = ammoInstance;
      this.tempTransform = new ammoInstance.btTransform();
      
      // Register update ANTES de criar objetos - EXATO do exemplo
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

  // MÉTODO CREATEPOD - RÉPLICA EXATA DO createAmmoVehicle do exemplo
  public createPod(mesh: Mesh, podId: string, pod: RacerPod): void {
    if (!this.isInitialized || !this.ammoInstance) {
      throw new Error('RacerPhysics: Not initialized');
    }
    
    console.log("=== VEHICLE POSITIONING DEBUG ===");
    const Ammo = this.ammoInstance;
    
    // PARÂMETROS EXATOS do exemplo
    var chassisWidth = 5;
    var chassisHeight = 2;
    var chassisLength = 12;
    var massVehicle = 2000;

    var wheelAxisPositionBack = -3.2;
    var wheelRadiusBack = .8;
    var wheelWidthBack = .3;
    var wheelHalfTrackBack = 2.6;
    var wheelAxisHeightBack = 0.6;

    var wheelAxisFrontPosition = 3.2;
    var wheelHalfTrackFront = 2.6;
    var wheelAxisHeightFront = 0.6;
    var wheelRadiusFront = .8;
    var wheelWidthFront = .3;

    var friction = 5;
    var suspensionStiffness = 50;
    var suspensionDamping = 2;
    var suspensionCompression = 4;
    var suspensionRestLength = 1.9;
    var rollInfluence = 0.0;

    var steeringIncrement = .01;
    var steeringClamp = 0.2;
    var maxEngineForce = 500;
    var maxBreakingForce = 10;
    var incEngine = 10.0;
    
    // HULL EXATO do exemplo
    var hull = [724.8979,1742.79126,-293.8619,1013.10107,1136.37292,-1947.64307,1052.83252,1183.11963,2029.03369,-724.8979,1742.79126,-293.8619,-1052.83252,1183.11963,2029.03369,-1013.10107,1136.37292,-1947.64307,477.1378,1157.46509,-2049.793,549.292,688.7122,-2033.02686,1013.10107,1136.37292,-1947.64307,-549.292,688.7122,-2033.02686,549.292,688.7122,-2033.02686,477.1378,1157.46509,-2049.793,-734.6597,1610.0752,700.9919,-1052.83252,1183.11963,2029.03369,-724.8979,1742.79126,-293.8619,-734.6597,1610.0752,700.9919,1052.83252,1183.11963,2029.03369,-1052.83252,1183.11963,2029.03369,734.6597,1610.0752,700.9919,724.8979,1742.79126,-293.8619,1052.83252,1183.11963,2029.03369,734.6597,1610.0752,700.9919,734.6597,1610.0752,700.9919,-734.6597,1610.0752,700.9919,0,1793.94617,-331.3796,482.0361,486.8974,-1960.24573,549.292,688.7122,-2033.02686,-549.292,688.7122,-2033.02686,482.0361,486.8974,-1960.24573,1053.79028,489.8413,-1858.3396,549.292,688.7122,-2033.02686,-477.1378,1157.46509,-2049.793,-1013.10107,1136.37292,-1947.64307,-549.292,688.7122,-2033.02686,-477.1378,1157.46509,-2049.793,-477.1378,1157.46509,-2049.793,477.1378,1157.46509,-2049.793,0,1418.503,-1807.88025,1077.55261,404.8475,-1583.72144,1053.79028,489.8413,-1858.3396,482.0361,486.8974,-1960.24573,1077.55261,404.8475,-1583.72144,-1029.84131,370.7491,-588.8345,1029.84131,370.7491,-588.8345,1077.55261,404.8475,-1583.72144,1029.84131,370.7491,-588.8345,1137.37439,384.7701,2006.43555,-1077.55261,404.8475,-1583.72144,1077.55261,404.8475,-1583.72144,482.0361,486.8974,-1960.24573,-1077.55261,404.8475,-1583.72144,-1077.55261,404.8475,-1583.72144,-1137.37439,384.7701,2006.43555,-1029.84131,370.7491,-588.8345,-482.0361,486.8974,-1960.24573,-1053.79028,489.8413,-1858.3396,-1077.55261,404.8475,-1583.72144,-482.0361,486.8974,-1960.24573,-482.0361,486.8974,-1960.24573,-549.292,688.7122,-2033.02686,-1053.79028,489.8413,-1858.3396,-482.0361,486.8974,-1960.24573,-244.5957,1412.99524,-1810.30493,-1013.10107,1136.37292,-1947.64307,-477.1378,1157.46509,-2049.793,-244.5957,1412.99524,-1810.30493,-477.1378,1157.46509,-2049.793,0,1418.503,-1807.88025,-244.5957,1412.99524,-1810.30493,-724.8979,1742.79126,-293.8619,-1013.10107,1136.37292,-1947.64307,-244.5957,1412.99524,-1810.30493,0,1418.503,-1807.88025,0,1793.94617,-331.3796,244.5957,1412.99524,-1810.30493,0,1418.503,-1807.88025,477.1378,1157.46509,-2049.793,244.5957,1412.99524,-1810.30493,477.1378,1157.46509,-2049.793,1013.10107,1136.37292,-1947.64307,244.5957,1412.99524,-1810.30493,0,1793.94617,-331.3796,0,1418.503,-1807.88025,244.5957,1412.99524,-1810.30493,1013.10107,1136.37292,-1947.64307,724.8979,1742.79126,-293.8619,-1013.8631,691.0133,-1930.07227,-549.292,688.7122,-2033.02686,-1013.10107,1136.37292,-1947.64307,1013.8631,691.0133,-1930.07227,1013.10107,1136.37292,-1947.64307,549.292,688.7122,-2033.02686,-1061.14771,646.3994,-1909.22253,-1053.79028,489.8413,-1858.3396,-549.292,688.7122,-2033.02686,-1061.14771,646.3994,-1909.22253,-549.292,688.7122,-2033.02686,-1013.8631,691.0133,-1930.07227,-1061.14771,646.3994,-1909.22253,-1013.8631,691.0133,-1930.07227,-1013.10107,1136.37292,-1947.64307,-1061.14771,646.3994,-1909.22253,-1077.55261,404.8475,-1583.72144,-1053.79028,489.8413,-1858.3396,1061.14771,646.3994,-1909.22253,549.292,688.7122,-2033.02686,1053.79028,489.8413,-1858.3396,1061.14771,646.3994,-1909.22253,1013.8631,691.0133,-1930.07227,549.292,688.7122,-2033.02686,1061.14771,646.3994,-1909.22253,1013.10107,1136.37292,-1947.64307,1013.8631,691.0133,-1930.07227,1061.14771,646.3994,-1909.22253,1053.79028,489.8413,-1858.3396,1077.55261,404.8475,-1583.72144,-475.1253,1774.70337,-320.6326,-724.8979,1742.79126,-293.8619,-244.5957,1412.99524,-1810.30493,-475.1253,1774.70337,-320.6326,-244.5957,1412.99524,-1810.30493,0,1793.94617,-331.3796,-475.1253,1774.70337,-320.6326,0,1793.94617,-331.3796,-734.6597,1610.0752,700.9919,-475.1253,1774.70337,-320.6326,-734.6597,1610.0752,700.9919,-724.8979,1742.79126,-293.8619,475.1253,1774.70337,-320.6326,0,1793.94617,-331.3796,244.5957,1412.99524,-1810.30493,475.1253,1774.70337,-320.6326,244.5957,1412.99524,-1810.30493,724.8979,1742.79126,-293.8619,475.1253,1774.70337,-320.6326,724.8979,1742.79126,-293.8619,734.6597,1610.0752,700.9919,475.1253,1774.70337,-320.6326,734.6597,1610.0752,700.9919,0,1793.94617,-331.3796,1043.00146,364.6063,791.3676,1137.37439,384.7701,2006.43555,1029.84131,370.7491,-588.8345,1043.00146,364.6063,791.3676,1029.84131,370.7491,-588.8345,-1029.84131,370.7491,-588.8345,1043.00146,364.6063,791.3676,-1137.37439,384.7701,2006.43555,1137.37439,384.7701,2006.43555,-1043.00146,364.6063,791.3676,-1029.84131,370.7491,-588.8345,-1137.37439,384.7701,2006.43555,-1043.00146,364.6063,791.3676,-1043.00146,364.6063,791.3676,0,396.2789,2017.64673,1137.37439,384.7701,2006.43555,-1137.37439,384.7701,2006.43555,0,1175.7417,2039.25269,-1137.37439,384.7701,2006.43555,-1052.83252,1183.11963,2029.03369,0,396.2789,2017.64673,0,1175.7417,2039.25269,1052.83252,1183.11963,2029.03369,1137.37439,384.7701,2006.43555,0,396.2789,2017.64673,0,1175.7417,2039.25269,-1052.83252,1183.11963,2029.03369,1052.83252,1183.11963,2029.03369,-1114.74915,977.62,422.8308,-1122.866,925.131,422.5171,-1092.156,800.1202,-1582.09863,-1114.74915,977.62,422.8308,-1092.156,800.1202,-1582.09863,-1013.10107,1136.37292,-1947.64307,-1114.74915,977.62,422.8308,-1013.10107,1136.37292,-1947.64307,-1052.83252,1183.11963,2029.03369,1114.74915,977.62,422.8308,1013.10107,1136.37292,-1947.64307,1092.156,800.1202,-1582.09863,1114.74915,977.62,422.8308,1092.156,800.1202,-1582.09863,1122.866,925.131,422.5171,1114.74915,977.62,422.8308,1052.83252,1183.11963,2029.03369,1013.10107,1136.37292,-1947.64307,-1060.57458,794.3555,-1872.05847,-1013.10107,1136.37292,-1947.64307,-1092.156,800.1202,-1582.09863,-1060.57458,794.3555,-1872.05847,-1092.156,800.1202,-1582.09863,-1061.14771,646.3994,-1909.22253,-1060.57458,794.3555,-1872.05847,-1061.14771,646.3994,-1909.22253,-1013.10107,1136.37292,-1947.64307,1060.57458,794.3555,-1872.05847,1092.156,800.1202,-1582.09863,1013.10107,1136.37292,-1947.64307,1060.57458,794.3555,-1872.05847,1013.10107,1136.37292,-1947.64307,1061.14771,646.3994,-1909.22253,1060.57458,794.3555,-1872.05847,1061.14771,646.3994,-1909.22253,1092.156,800.1202,-1582.09863,1093.08643,643.8445,-1582.8042,1092.156,800.1202,-1582.09863,1061.14771,646.3994,-1909.22253,1093.08643,643.8445,-1582.8042,1061.14771,646.3994,-1909.22253,1077.55261,404.8475,-1583.72144,1093.08643,643.8445,-1582.8042,1077.55261,404.8475,-1583.72144,1137.37439,384.7701,2006.43555,1093.08643,643.8445,-1582.8042,1137.37439,384.7701,2006.43555,1122.866,925.131,422.5171,1093.08643,643.8445,-1582.8042,1122.866,925.131,422.5171,1092.156,800.1202,-1582.09863,-1093.08643,643.8445,-1582.8042,-1077.55261,404.8475,-1583.72144,-1061.14771,646.3994,-1909.22253,-1093.08643,643.8445,-1582.8042,-1061.14771,646.3994,-1909.22253,-1092.156,800.1202,-1582.09863,-1093.08643,643.8445,-1582.8042,-1137.37439,384.7701,2006.43555,-1077.55261,404.8475,-1583.72144,-1093.08643,643.8445,-1582.8042,-1122.866,925.131,422.5171,-1137.37439,384.7701,2006.43555,-1093.08643,643.8445,-1582.8042,-1092.156,800.1202,-1582.09863,-1122.866,925.131,422.5171,-1124.65894,924.317,605.2404,-1122.866,925.131,422.5171,-1114.74915,977.62,422.8308,-1124.65894,924.317,605.2404,-1114.74915,977.62,422.8308,-1052.83252,1183.11963,2029.03369,-1124.65894,924.317,605.2404,-1052.83252,1183.11963,2029.03369,-1137.37439,384.7701,2006.43555,-1124.65894,924.317,605.2404,-1137.37439,384.7701,2006.43555,-1122.866,925.131,422.5171,1124.65894,924.317,605.2404,1052.83252,1183.11963,2029.03369,1114.74915,977.62,422.8308,1124.65894,924.317,605.2404,1114.74915,977.62,422.8308,1122.866,925.131,422.5171,1124.65894,924.317,605.2404,1137.37439,384.7701,2006.43555,1052.83252,1183.11963,2029.03369,1124.65894,924.317,605.2404,1122.866,925.131,422.5171,1137.37439,384.7701,2006.43555];
    
    console.log("=== VEHICLE HULL ANALYSIS ===");
    console.log(`Hull vertices count: ${hull.length/3}`);
    
    // Geometria EXATA do exemplo
    var geometry = new Ammo.btConvexHullShape();
    
    for(let i=0; i < hull.length; i += 3) {
      geometry.addPoint(new Ammo.btVector3(
        hull[i]*0.0028,
        hull[i+1]*0.0028,
        hull[i+2]*0.0028));
    }
    
    // Transform EXATO do exemplo
    var transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(109, -192, 627));
    console.log("Vehicle spawn position: (109, -192, 627)");
    
    var motionState = new Ammo.btDefaultMotionState(transform);
    var localInertia = new Ammo.btVector3(0, 0, 0);
    geometry.calculateLocalInertia(massVehicle, localInertia);
    
    // NÃO usar compound shape - exemplo não usa
    const chassisBody = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massVehicle, motionState, geometry, localInertia));
    chassisBody.setActivationState(4);
    chassisBody.isPlayer = true;
    chassisBody.player = pod; // Referência ao pod em vez de this
    
    this.physicsWorld.addRigidBody(chassisBody);
    
    // Raycast Vehicle - EXATO do exemplo
    var tuning = new Ammo.btVehicleTuning();
    var rayCaster = new Ammo.btDefaultVehicleRaycaster(this.physicsWorld);
    
    const vehicle = new Ammo.btRaycastVehicle(tuning, chassisBody, rayCaster);
    vehicle.setCoordinateSystem(0, 1, 2);
    this.physicsWorld.addAction(vehicle);
    
    // Wheels - EXATO do exemplo
    var FRONT_LEFT = 0;
    var FRONT_RIGHT = 1;
    var BACK_LEFT = 2;
    var BACK_RIGHT = 3;
    var wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
    var wheelAxleCS = new Ammo.btVector3(-1, 0, 0);
    
    chassisBody.player = pod;
    vehicle.player = pod;
    vehicle.isPlayer = true;
    
    const addWheel = (isFront: boolean, pos: any, radius: number, width: number, index: number) => {
      console.log(isFront);
      
      var wheelInfo = vehicle.addWheel(
        pos,
        wheelDirectionCS0,
        wheelAxleCS,
        suspensionRestLength,
        radius,
        tuning,
        isFront);

      wheelInfo.set_m_suspensionStiffness(suspensionStiffness);
      wheelInfo.set_m_wheelsDampingRelaxation(suspensionDamping);
      wheelInfo.set_m_wheelsDampingCompression(suspensionCompression);
      wheelInfo.set_m_maxSuspensionForce(600000);
      
      if(isFront){
        wheelInfo.set_m_frictionSlip(56);
      } else {
        wheelInfo.set_m_frictionSlip(38);
      }
      
      wheelInfo.set_m_rollInfluence(rollInfluence);
    };

    addWheel(true, new Ammo.btVector3(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, wheelWidthFront, FRONT_LEFT);
    addWheel(true, new Ammo.btVector3(-wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, wheelWidthFront, FRONT_RIGHT);
    addWheel(false, new Ammo.btVector3(-wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_LEFT);
    addWheel(false, new Ammo.btVector3(wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_RIGHT);
    
    console.log("thus far");
    
    // Armazenar referência
    this.pods.set(podId, { rigidBody: chassisBody, vehicle, mesh, pod });
    this.player = { vehicle, mesh, pod }; // Para compatibilidade com movimento
    
    // Posicionar mesh na posição inicial
    mesh.position.set(109, -192, 627);
    if (!mesh.rotationQuaternion) {
      mesh.rotationQuaternion = new Quaternion();
    }
    mesh.visibility = 0.0; // Como no exemplo - mesh invisível, só physics
    
    console.log(`Pod vehicle created with EXACT example parameters`);
  }

  // Movimento EXATO do exemplo (dentro do registerBeforeRender)
  public movePod(podId: string, input: { x: number, z: number }): void {
    const podData = this.pods.get(podId);
    if (!podData) return;
    
    // Mapear input para controles do exemplo
    this.controls.forward = input.z > 0;
    this.controls.backward = input.z < 0;
    this.controls.left = input.x < 0;
    this.controls.right = input.x > 0;
  }

  private updatePhysics(): void {
    if (!this.physicsWorld) return;
    
    // Para cada pod, aplicar física EXATA do exemplo
    this.pods.forEach((podData) => {
      const vehicle = podData.vehicle;
      
      // LÓGICA EXATA do exemplo
      var maxSpeed = 20000;
      var maxSteerVal = -0.20;
      
      var speedkmh = (vehicle.getCurrentSpeedKmHour() === 0) ? 1 : vehicle.getCurrentSpeedKmHour();
      var speed = maxSpeed - (speedkmh * 30);
      
      vehicle.setBrake(0, 0);
      vehicle.setBrake(0, 1);
      vehicle.setBrake(0, 2);
      vehicle.setBrake(0, 3);
      
      if(this.controls.forward){
        if(speedkmh < -50){
          vehicle.setBrake(300, 0);
          vehicle.setBrake(300, 1);
          vehicle.setBrake(300, 2);
          vehicle.setBrake(300, 3);
        } else {
          vehicle.applyEngineForce(speed, 2);
          vehicle.applyEngineForce(speed, 3);
        }
      } else if(this.controls.backward){
        if(speedkmh > 50){
          vehicle.setBrake(300, 0);
          vehicle.setBrake(300, 1);
          vehicle.setBrake(300, 2);
          vehicle.setBrake(300, 3);
        } else {
          vehicle.applyEngineForce(-speed, 2);
          vehicle.applyEngineForce(-speed, 3);
        }
      } else {
        vehicle.applyEngineForce(0, 2);
        vehicle.applyEngineForce(0, 3);
      }
      
      // Steering com incremento suave EXATO do exemplo
      if(this.controls.left){
        if (this.controls.vehicleSteering > -this.controls.steeringClamp){
          this.controls.vehicleSteering -= this.controls.steeringIncrement;
        }
      } else if(this.controls.right){
        if (this.controls.vehicleSteering < this.controls.steeringClamp){
          this.controls.vehicleSteering += this.controls.steeringIncrement;
        }
      } else {
        this.controls.vehicleSteering = 0;
      }
      
      vehicle.setSteeringValue(this.controls.vehicleSteering, 0);
      vehicle.setSteeringValue(this.controls.vehicleSteering, 1);
      
      // Sync transform EXATO do exemplo
      let tm = vehicle.getChassisWorldTransform();
      let p = tm.getOrigin();
      let q = tm.getRotation();
      
      podData.mesh.position.set(p.x(), p.y(), p.z());
      podData.mesh.rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
      podData.mesh.addRotation(0, Math.PI, 0);
    });
  }

  // Setup do track EXATO do exemplo
  public async setupTrackCollision(trackMesh: AbstractMesh, racerScene: any = null): Promise<void> {
    if (!this.isInitialized || !this.ammoInstance) {
      throw new Error('RacerPhysics: Cannot setup track - not initialized');
    }
    
    const Ammo = this.ammoInstance;
    const mesh = trackMesh as Mesh;
    
    console.log("=== CANYON MESH ANALYSIS ===");
    console.log(`Main mesh: ${mesh.name}`);
    
    // NÃO ajustar posição aqui - já foi feita no RacerScene
    // mesh.position.y -= 2.5; // REMOVIDO - já feito no carregamento
    
    // Obter dados EXATOS como o exemplo
    let positions = mesh.getVerticesData(VertexBuffer.PositionKind);
    let indices = mesh.getIndices();
    
    if (!positions || !indices) {
      console.error("No geometry data");
      return;
    }
    
    console.log(`Vertices: ${positions.length/3}`);
    console.log(`Triangles: ${indices.length/3}`);
    
    mesh.updateFacetData();
    var localPositions = mesh.getFacetLocalPositions();
    var triangleCount = localPositions.length;
    
    // Criar triangle mesh EXATO do exemplo
    let mTriMesh = new Ammo.btTriangleMesh();
    let removeDuplicateVertices = true;
    
    var _g = 0;
    while(_g < triangleCount) {
      var i = _g++;
      var index0 = indices[i * 3];
      var index1 = indices[i * 3 + 1];
      var index2 = indices[i * 3 + 2];
      var vertex0 = new Ammo.btVector3(positions[index0 * 3], positions[index0 * 3 + 1], positions[index0 * 3 + 2]);
      var vertex1 = new Ammo.btVector3(positions[index1 * 3], positions[index1 * 3 + 1], positions[index1 * 3 + 2]);
      var vertex2 = new Ammo.btVector3(positions[index2 * 3], positions[index2 * 3 + 1], positions[index2 * 3 + 2]);
      mTriMesh.addTriangle(vertex0, vertex1, vertex2);
    }
    
    let shape = new Ammo.btBvhTriangleMeshShape(mTriMesh, true, true);
    let localInertia = new Ammo.btVector3(0, 0, 0);
    let transform = new Ammo.btTransform();
    
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(mesh.position.x, mesh.position.y, mesh.position.z));
    console.log("Canyon physics position:", mesh.position.x, mesh.position.y, mesh.position.z);
    
    if (mesh.rotationQuaternion) {
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
    
    console.log("Canyon rigid body created");
  }

  public getSpeed(podId: string): number {
    const podData = this.pods.get(podId);
    if (!podData) return 0;
    return Math.abs(podData.vehicle.getCurrentSpeedKmHour());
  }

  public removePod(podId: string): void {
    const podData = this.pods.get(podId);
    if (podData) {
      this.physicsWorld.removeRigidBody(podData.rigidBody);
      this.physicsWorld.removeAction(podData.vehicle);
      this.pods.delete(podId);
    }
  }

  public isPhysicsReady(): boolean {
    return this.isInitialized && this.physicsWorld !== null;
  }

  public dispose(): void {
    this.pods.forEach((podData) => {
      this.physicsWorld.removeRigidBody(podData.rigidBody);
      this.physicsWorld.removeAction(podData.vehicle);
    });
    
    this.trackRigidBodies.forEach((rigidBody) => {
      this.physicsWorld.removeRigidBody(rigidBody);
    });
    
    this.pods.clear();
    this.trackRigidBodies = [];
    
    if (this.scene.getPhysicsEngine()) {
      this.scene.disablePhysicsEngine();
    }
    
    this.physicsWorld = null;
    this.ammoInstance = null;
    this.tempTransform = null;
    this.isInitialized = false;
    
    console.log('RacerPhysics: Disposed');
  }
}