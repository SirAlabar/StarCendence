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
import { CreateBox, CreateLines, StandardMaterial } from '@babylonjs/core';
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
    pod: RacerPod
  }> = new Map();
  
  private readonly GRAVITY = new Vector3(0, -49, 0);
  private readonly POD_MASS = 2000;
  private readonly THRUST_FORCE = 10000; // AUMENTADO de 800 para 5000
  private readonly MAX_VELOCITY = 400;   // REDUZIDO de 650 para 80
  private readonly HOVER_FORCE = 1000;
  private readonly HOVER_HEIGHT = 3;
private debugMeshes: Mesh[] = [];
private isDebugMode: boolean = false;

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

  public createPod(mesh: Mesh, podId: string, pod: RacerPod): void {
    if (!this.isInitialized || !this.ammoInstance) {
      throw new Error('RacerPhysics: Not initialized');
    }
    
    console.log(`Creating btRaycastVehicle pod: ${podId}`);
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
    var suspensionRestLength = 3;
    var rollInfluence = 0.0;
    
    // HULL EXATO do exemplo
    var hull = [724.8979,1742.79126,-293.8619,1013.10107,1136.37292,-1947.64307,1052.83252,1183.11963,2029.03369,-724.8979,1742.79126,-293.8619,-1052.83252,1183.11963,2029.03369,-1013.10107,1136.37292,-1947.64307,477.1378,1157.46509,-2049.793,549.292,688.7122,-2033.02686,1013.10107,1136.37292,-1947.64307,-549.292,688.7122,-2033.02686,549.292,688.7122,-2033.02686,477.1378,1157.46509,-2049.793,-734.6597,1610.0752,700.9919,-1052.83252,1183.11963,2029.03369,-724.8979,1742.79126,-293.8619,-734.6597,1610.0752,700.9919,1052.83252,1183.11963,2029.03369,-1052.83252,1183.11963,2029.03369,734.6597,1610.0752,700.9919,724.8979,1742.79126,-293.8619,1052.83252,1183.11963,2029.03369,734.6597,1610.0752,700.9919,734.6597,1610.0752,700.9919,-734.6597,1610.0752,700.9919,0,1793.94617,-331.3796,482.0361,486.8974,-1960.24573,549.292,688.7122,-2033.02686,-549.292,688.7122,-2033.02686,482.0361,486.8974,-1960.24573,1053.79028,489.8413,-1858.3396,549.292,688.7122,-2033.02686,-477.1378,1157.46509,-2049.793,-1013.10107,1136.37292,-1947.64307,-549.292,688.7122,-2033.02686,-477.1378,1157.46509,-2049.793,-477.1378,1157.46509,-2049.793,477.1378,1157.46509,-2049.793,0,1418.503,-1807.88025,1077.55261,404.8475,-1583.72144,1053.79028,489.8413,-1858.3396,482.0361,486.8974,-1960.24573,1077.55261,404.8475,-1583.72144,-1029.84131,370.7491,-588.8345,1029.84131,370.7491,-588.8345,1077.55261,404.8475,-1583.72144,1029.84131,370.7491,-588.8345,1137.37439,384.7701,2006.43555,-1077.55261,404.8475,-1583.72144,1077.55261,404.8475,-1583.72144,482.0361,486.8974,-1960.24573,-1077.55261,404.8475,-1583.72144,-1077.55261,404.8475,-1583.72144,-1137.37439,384.7701,2006.43555,-1029.84131,370.7491,-588.8345,-482.0361,486.8974,-1960.24573,-1053.79028,489.8413,-1858.3396,-1077.55261,404.8475,-1583.72144,-482.0361,486.8974,-1960.24573,-482.0361,486.8974,-1960.24573,-549.292,688.7122,-2033.02686,-1053.79028,489.8413,-1858.3396,-482.0361,486.8974,-1960.24573,-244.5957,1412.99524,-1810.30493,-1013.10107,1136.37292,-1947.64307,-477.1378,1157.46509,-2049.793,-244.5957,1412.99524,-1810.30493,-477.1378,1157.46509,-2049.793,0,1418.503,-1807.88025,-244.5957,1412.99524,-1810.30493,-724.8979,1742.79126,-293.8619,-1013.10107,1136.37292,-1947.64307,-244.5957,1412.99524,-1810.30493,0,1418.503,-1807.88025,0,1793.94617,-331.3796,244.5957,1412.99524,-1810.30493,0,1418.503,-1807.88025,477.1378,1157.46509,-2049.793,244.5957,1412.99524,-1810.30493,477.1378,1157.46509,-2049.793,1013.10107,1136.37292,-1947.64307,244.5957,1412.99524,-1810.30493,0,1793.94617,-331.3796,0,1418.503,-1807.88025,244.5957,1412.99524,-1810.30493,1013.10107,1136.37292,-1947.64307,724.8979,1742.79126,-293.8619,-1013.8631,691.0133,-1930.07227,-549.292,688.7122,-2033.02686,-1013.10107,1136.37292,-1947.64307,1013.8631,691.0133,-1930.07227,1013.10107,1136.37292,-1947.64307,549.292,688.7122,-2033.02686,-1061.14771,646.3994,-1909.22253,-1053.79028,489.8413,-1858.3396,-549.292,688.7122,-2033.02686,-1061.14771,646.3994,-1909.22253,-549.292,688.7122,-2033.02686,-1013.8631,691.0133,-1930.07227,-1061.14771,646.3994,-1909.22253,-1013.8631,691.0133,-1930.07227,-1013.10107,1136.37292,-1947.64307,-1061.14771,646.3994,-1909.22253,-1077.55261,404.8475,-1583.72144,-1053.79028,489.8413,-1858.3396,1061.14771,646.3994,-1909.22253,549.292,688.7122,-2033.02686,1053.79028,489.8413,-1858.3396,1061.14771,646.3994,-1909.22253,1013.8631,691.0133,-1930.07227,549.292,688.7122,-2033.02686,1061.14771,646.3994,-1909.22253,1013.10107,1136.37292,-1947.64307,1013.8631,691.0133,-1930.07227,1061.14771,646.3994,-1909.22253,1053.79028,489.8413,-1858.3396,1077.55261,404.8475,-1583.72144,-475.1253,1774.70337,-320.6326,-724.8979,1742.79126,-293.8619,-244.5957,1412.99524,-1810.30493,-475.1253,1774.70337,-320.6326,-244.5957,1412.99524,-1810.30493,0,1793.94617,-331.3796,-475.1253,1774.70337,-320.6326,0,1793.94617,-331.3796,-734.6597,1610.0752,700.9919,-475.1253,1774.70337,-320.6326,-734.6597,1610.0752,700.9919,-724.8979,1742.79126,-293.8619,475.1253,1774.70337,-320.6326,0,1793.94617,-331.3796,244.5957,1412.99524,-1810.30493,475.1253,1774.70337,-320.6326,244.5957,1412.99524,-1810.30493,724.8979,1742.79126,-293.8619,475.1253,1774.70337,-320.6326,724.8979,1742.79126,-293.8619,734.6597,1610.0752,700.9919,475.1253,1774.70337,-320.6326,734.6597,1610.0752,700.9919,0,1793.94617,-331.3796,1043.00146,364.6063,791.3676,1137.37439,384.7701,2006.43555,1029.84131,370.7491,-588.8345,1043.00146,364.6063,791.3676,1029.84131,370.7491,-588.8345,-1029.84131,370.7491,-588.8345,1043.00146,364.6063,791.3676,-1137.37439,384.7701,2006.43555,1137.37439,384.7701,2006.43555,-1043.00146,364.6063,791.3676,-1029.84131,370.7491,-588.8345,-1137.37439,384.7701,2006.43555,-1043.00146,364.6063,791.3676,-1043.00146,364.6063,791.3676,0,396.2789,2017.64673,1137.37439,384.7701,2006.43555,-1137.37439,384.7701,2006.43555,0,1175.7417,2039.25269,-1137.37439,384.7701,2006.43555,-1052.83252,1183.11963,2029.03369,0,396.2789,2017.64673,0,1175.7417,2039.25269,1052.83252,1183.11963,2029.03369,1137.37439,384.7701,2006.43555,0,396.2789,2017.64673,0,1175.7417,2039.25269,-1052.83252,1183.11963,2029.03369,1052.83252,1183.11963,2029.03369,-1114.74915,977.62,422.8308,-1122.866,925.131,422.5171,-1092.156,800.1202,-1582.09863,-1114.74915,977.62,422.8308,-1092.156,800.1202,-1582.09863,-1013.10107,1136.37292,-1947.64307,-1114.74915,977.62,422.8308,-1013.10107,1136.37292,-1947.64307,-1052.83252,1183.11963,2029.03369,1114.74915,977.62,422.8308,1013.10107,1136.37292,-1947.64307,1092.156,800.1202,-1582.09863,1114.74915,977.62,422.8308,1092.156,800.1202,-1582.09863,1122.866,925.131,422.5171,1114.74915,977.62,422.8308,1052.83252,1183.11963,2029.03369,1013.10107,1136.37292,-1947.64307,-1060.57458,794.3555,-1872.05847,-1013.10107,1136.37292,-1947.64307,-1092.156,800.1202,-1582.09863,-1060.57458,794.3555,-1872.05847,-1092.156,800.1202,-1582.09863,-1061.14771,646.3994,-1909.22253,-1060.57458,794.3555,-1872.05847,-1061.14771,646.3994,-1909.22253,-1013.10107,1136.37292,-1947.64307,1060.57458,794.3555,-1872.05847,1092.156,800.1202,-1582.09863,1013.10107,1136.37292,-1947.64307,1060.57458,794.3555,-1872.05847,1013.10107,1136.37292,-1947.64307,1061.14771,646.3994,-1909.22253,1060.57458,794.3555,-1872.05847,1061.14771,646.3994,-1909.22253,1092.156,800.1202,-1582.09863,1093.08643,643.8445,-1582.8042,1092.156,800.1202,-1582.09863,1061.14771,646.3994,-1909.22253,1093.08643,643.8445,-1582.8042,1061.14771,646.3994,-1909.22253,1077.55261,404.8475,-1583.72144,1093.08643,643.8445,-1582.8042,1077.55261,404.8475,-1583.72144,1137.37439,384.7701,2006.43555,1093.08643,643.8445,-1582.8042,1137.37439,384.7701,2006.43555,1122.866,925.131,422.5171,1093.08643,643.8445,-1582.8042,1122.866,925.131,422.5171,1092.156,800.1202,-1582.09863,-1093.08643,643.8445,-1582.8042,-1077.55261,404.8475,-1583.72144,-1061.14771,646.3994,-1909.22253,-1093.08643,643.8445,-1582.8042,-1061.14771,646.3994,-1909.22253,-1092.156,800.1202,-1582.09863,-1093.08643,643.8445,-1582.8042,-1137.37439,384.7701,2006.43555,-1077.55261,404.8475,-1583.72144,-1093.08643,643.8445,-1582.8042,-1122.866,925.131,422.5171,-1137.37439,384.7701,2006.43555,-1093.08643,643.8445,-1582.8042,-1092.156,800.1202,-1582.09863,-1122.866,925.131,422.5171,-1124.65894,924.317,605.2404,-1122.866,925.131,422.5171,-1114.74915,977.62,422.8308,-1124.65894,924.317,605.2404,-1114.74915,977.62,422.8308,-1052.83252,1183.11963,2029.03369,-1124.65894,924.317,605.2404,-1052.83252,1183.11963,2029.03369,-1137.37439,384.7701,2006.43555,-1124.65894,924.317,605.2404,-1137.37439,384.7701,2006.43555,-1122.866,925.131,422.5171,1124.65894,924.317,605.2404,1052.83252,1183.11963,2029.03369,1114.74915,977.62,422.8308,1124.65894,924.317,605.2404,1114.74915,977.62,422.8308,1122.866,925.131,422.5171,1124.65894,924.317,605.2404,1137.37439,384.7701,2006.43555,1052.83252,1183.11963,2029.03369,1124.65894,924.317,605.2404,1122.866,925.131,422.5171,1137.37439,384.7701,2006.43555];
    
    // Criar hull convexo
    var geometry = new Ammo.btConvexHullShape();
    for(let i=0; i < hull.length; i += 3) {
      geometry.addPoint(new Ammo.btVector3(
        hull[i]*0.0028,
        hull[i+1]*0.0028,
        hull[i+2]*0.0028));
    }
    
    // Transform inicial - VOLTAR À POSIÇÃO ORIGINAL 
    const position = mesh.position;
    console.log("=== POD CREATION POSITION PHYSICS ===");
    console.log(`x=${position.x}, y=${position.y}, z=${position.z}`);
    var transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    
    var motionState = new Ammo.btDefaultMotionState(transform);
    var localInertia = new Ammo.btVector3(0, 0, 0);
    geometry.calculateLocalInertia(massVehicle, localInertia);
    
    // CRIAR btRaycastVehicle
    const chassisBody = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massVehicle, motionState, geometry, localInertia));
    chassisBody.setActivationState(4);
    
    this.physicsWorld.addRigidBody(chassisBody);
    
    // Raycast Vehicle
    var tuning = new Ammo.btVehicleTuning();
    var rayCaster = new Ammo.btDefaultVehicleRaycaster(this.physicsWorld);
    
    const vehicle = new Ammo.btRaycastVehicle(tuning, chassisBody, rayCaster);
    vehicle.setCoordinateSystem(0, 1, 2);
    this.physicsWorld.addAction(vehicle);
    
    // Wheels EXATO do exemplo
    var FRONT_LEFT = 0;
    var FRONT_RIGHT = 1;
    var BACK_LEFT = 2;
    var BACK_RIGHT = 3;
    var wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
    var wheelAxleCS = new Ammo.btVector3(-1, 0, 0);
    
    const addWheel = (isFront: boolean, pos: any, radius: number, width: number, index: number) => {
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
        wheelInfo.set_m_frictionSlip(6);
      } else {
        wheelInfo.set_m_frictionSlip(10);
      }
      
      wheelInfo.set_m_rollInfluence(rollInfluence);
    };

    addWheel(true, new Ammo.btVector3(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, wheelWidthFront, FRONT_LEFT);
    addWheel(true, new Ammo.btVector3(-wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, wheelWidthFront, FRONT_RIGHT);
    addWheel(false, new Ammo.btVector3(-wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_LEFT);
    addWheel(false, new Ammo.btVector3(wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_RIGHT);
    
    // Armazenar referência
    this.pods.set(podId, { rigidBody: chassisBody, vehicle, mesh, pod });
    
    // Posicionar mesh - VOLTAR POSIÇÃO ORIGINAL
    mesh.position.set(position.x, position.y, position.z);
    if (!mesh.rotationQuaternion) {
      mesh.rotationQuaternion = new Quaternion();
    }
    mesh.visibility = 0.0;
    console.log("=== POD CREATION POSITION ===");
    console.log(`x=${position.x}, y=${position.y}, z=${position.z}`);

    
    console.log(`btRaycastVehicle pod created: ${podId}`);
  }

  public movePod(podId: string, input: { x: number, z: number }): void {
    const podData = this.pods.get(podId);
    if (!podData || !this.ammoInstance) {
      return;
    }
    
    const vehicle = podData.vehicle;
    const mesh = podData.mesh;
    
    console.log(`=== MOVE INPUT DEBUG ===`);
    console.log(`Input received: x=${input.x.toFixed(3)}, z=${input.z.toFixed(3)}`);
    console.log(`Pod found: ${podData ? 'YES' : 'NO'}`);

    const currentSpeed = Math.abs(vehicle.getCurrentSpeedKmHour());
    const speedPercentage = currentSpeed / this.MAX_VELOCITY;
    
    let thrustMultiplier = 1.0;
    if (speedPercentage < 0.08) {
      thrustMultiplier = 3.0;
    } else if (speedPercentage < 0.15) {
      thrustMultiplier = 2.2;
    } else if (speedPercentage < 0.25) {
      thrustMultiplier = 1.6;
    } else if (speedPercentage < 0.4) {
      thrustMultiplier = 1.2;
    } else if (speedPercentage < 0.8) {
      thrustMultiplier = 1.0;
    } else {
      thrustMultiplier = 0.7;
    }

    // USAR a constante da classe diretamente
    const REDUCED_THRUST = this.THRUST_FORCE * thrustMultiplier;

    
    // console.log(`Pod speed: ${currentSpeed.toFixed(1)} km/h, multiplier: ${thrustMultiplier.toFixed(2)}, thrust: ${REDUCED_THRUST.toFixed(0)}`);

    // FORWARD/BACKWARD com força muito menor
    if (currentSpeed < this.MAX_VELOCITY && Math.abs(input.z) > 0.05) {
      const engineForce = input.z * REDUCED_THRUST;
      // console.log(`Applying engine force: ${engineForce.toFixed(0)}`);
      
      // Aplicar nas rodas traseiras (2 e 3)
      vehicle.applyEngineForce(engineForce, 2);
      vehicle.applyEngineForce(engineForce, 3);
    } else {
      // MOTOR DESLIGADO quando sem input OU velocidade alta
      vehicle.applyEngineForce(0, 2);
      vehicle.applyEngineForce(0, 3);
    }

    // STEERING - TENTAR INVERTER DIREÇÕES
    const STEERING_SENSITIVITY = 0.4; 
    if (Math.abs(input.x) > 0.05) {
      const steeringValue = input.x * STEERING_SENSITIVITY;
      // console.log(`Applying steering: ${steeringValue.toFixed(2)}`);
      
      // Aplicar nas rodas dianteiras (0 e 1)
      vehicle.setSteeringValue(steeringValue, 0);
      vehicle.setSteeringValue(steeringValue, 1);
    } else {
      // VOLANTE CENTRALIZADO
      vehicle.setSteeringValue(0, 0);
      vehicle.setSteeringValue(0, 1);
    }

    // SISTEMA DE FREIOS EFICAZ
    if (Math.abs(input.z) < 0.05) {
      // SEM INPUT = FREIOS PROPORCIONAIS À VELOCIDADE
      if (currentSpeed > 1.0) {
        const strongBrake = Math.min(currentSpeed * 8, 200); // Freio mais forte
        vehicle.setBrake(strongBrake, 0);
        vehicle.setBrake(strongBrake, 1);
        vehicle.setBrake(strongBrake, 2);
        vehicle.setBrake(strongBrake, 3);
        // console.log(`Strong braking: ${strongBrake.toFixed(1)} (speed: ${currentSpeed.toFixed(1)})`);
      } else {
        // Velocidade muito baixa - freio máximo para parar completamente
        vehicle.setBrake(100, 0);
        vehicle.setBrake(100, 1);
        vehicle.setBrake(100, 2);
        vehicle.setBrake(100, 3);
      }
    } else {
      // COM INPUT = SOLTAR FREIOS
      vehicle.setBrake(0, 0);
      vehicle.setBrake(0, 1);
      vehicle.setBrake(0, 2);
      vehicle.setBrake(0, 3);
    }

    // FREIO DE EMERGÊNCIA para impedir velocidades muito altas
    if (currentSpeed > this.MAX_VELOCITY) {
      console.log(`Emergency brake - speed too high: ${currentSpeed.toFixed(1)}`);
      vehicle.setBrake(300, 0);
      vehicle.setBrake(300, 1);
      vehicle.setBrake(300, 2);
      vehicle.setBrake(300, 3);
    }
  }

  private updatePhysics(): void {
    if (!this.physicsWorld) return;
    
    // Para cada pod, sincronizar transform do btRaycastVehicle
    this.pods.forEach((podData, podId) => {
      const vehicle = podData.vehicle;
      const mesh = podData.mesh;
      
        //   if (Math.random() < 0.01) { // Log occasionally (1% of frames)
        //   console.log(`=== WHEEL CONTACT DEBUG ===`);
        //   for (let i = 0; i < 4; i++) {
        //     const wheelInfo = vehicle.getWheelInfo(i);
        //     const isInContact = wheelInfo.get_m_raycastInfo().get_m_isInContact();
        //     console.log(`Wheel ${i}: contact=${isInContact}`);
        //   }
          
        //   const speed = vehicle.getCurrentSpeedKmHour();
        //   console.log(`Current speed: ${speed.toFixed(1)} km/h`);
        // }

      // Sincronizar transform do chassis
      let tm = vehicle.getChassisWorldTransform();
      let p = tm.getOrigin();
      let q = tm.getRotation();

      mesh.position.set(p.x(), p.y(), p.z());
      mesh.rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
      mesh.addRotation(0, Math.PI/2, 0); // Correção de orientação
      // console.log("=== POD CREATION POSITION ===");
      // console.log(`x=${mesh.position.x}, y=${mesh.position.y}, z=${mesh.position.z}`);
    });
  }

  // Setup do track EXATO do exemplo
  // public async setupTrackCollision(trackMesh: AbstractMesh, racerScene: any = null): Promise<void> {
public async setupMultiMeshCollision(racerScene: any): Promise<void> {
  if (!this.isInitialized || !this.ammoInstance) {
    throw new Error('RacerPhysics: Cannot setup track - not initialized');
  }
  
  const Ammo = this.ammoInstance;
  
  // Get all physics meshes from RacerScene
  const allPhysicsMeshes = racerScene.getAllPhysicsMeshes();
  console.log(`Setting up physics for ${allPhysicsMeshes.length} meshes`);
  
  for (const {mesh, surfaceType} of allPhysicsMeshes) {
    // Skip void meshes - no collision
    if (surfaceType === 'void') {
      console.log(`Skipping void mesh: ${mesh.name}`);
      continue;
    }
    
    // Create physics body for this mesh
    await this.createMeshPhysicsBody(mesh, surfaceType);
  }
  
  console.log(`Physics setup complete for ${this.trackRigidBodies.length} collision meshes`);
}

private async createMeshPhysicsBody(mesh: Mesh, surfaceType: string): Promise<void> {
  const Ammo = this.ammoInstance;
  
  console.log(`Creating physics for: ${mesh.name} (${surfaceType})`);
  
  // Get mesh data (same as your current code)
  let positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  let indices = mesh.getIndices();
  
  if (!positions || !indices) {
    console.warn(`No geometry data for ${mesh.name}`);
    return;
  }
  
  console.log(`  Vertices: ${positions.length/3}, Triangles: ${indices.length/3}`);
  
  // APPLY SCALING TO VERTEX DATA
  const scale = mesh.scaling;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] *= scale.x;     // Scale X
    positions[i + 1] *= scale.y; // Scale Y  
    positions[i + 2] *= scale.z; // Scale Z
  }
  
  console.log(`After scaling vertices by ${scale.x}x`);
  // Create triangle mesh (same as your current code)
  let mTriMesh = new Ammo.btTriangleMesh();
  let triangleCount = indices.length / 3;
  console.log(`=== TRACK SURFACE DEBUG ===`);
  console.log(`Mesh: ${mesh.name}`);
  console.log(`Mesh position: y=${mesh.position.y}`);
  console.log(`Mesh bounds: min_y=${mesh.getBoundingInfo().boundingBox.minimum.y}, max_y=${mesh.getBoundingInfo().boundingBox.maximum.y}`);

  for (let i = 0; i < triangleCount; i++) {
    const index0 = indices[i * 3];
    const index1 = indices[i * 3 + 1]; 
    const index2 = indices[i * 3 + 2];
    const vertex0 = new Ammo.btVector3(positions[index0 * 3], positions[index0 * 3 + 1], positions[index0 * 3 + 2]);
    const vertex1 = new Ammo.btVector3(positions[index1 * 3], positions[index1 * 3 + 1], positions[index1 * 3 + 2]);
    const vertex2 = new Ammo.btVector3(positions[index2 * 3], positions[index2 * 3 + 1], positions[index2 * 3 + 2]);
    mTriMesh.addTriangle(vertex0, vertex1, vertex2);
  }
  
  let shape = new Ammo.btBvhTriangleMeshShape(mTriMesh, true, true);
  let localInertia = new Ammo.btVector3(0, 0, 0);
  let transform = new Ammo.btTransform();
  
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(mesh.position.x, mesh.position.y, mesh.position.z));
  
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
  
  // Set surface properties based on type
  this.setSurfaceProperties(body, surfaceType);
  
  this.physicsWorld.addRigidBody(body);
  this.trackRigidBodies.push(body);
    this.createDebugForPhysicsBody(mesh, body, this.trackRigidBodies.length - 1);
  if (mesh.name.includes('track_surface')) {
  const surface_y = mesh.getBoundingInfo().boundingBox.maximum.y;
  console.log(`*** TRACK SURFACE LEVEL: ${surface_y} ***`);
}
  console.log(`Physics body created for: ${mesh.name}`);
}
private setSurfaceProperties(rigidBody: any, surfaceType: string): void {
  switch (surfaceType) {
    case 'ice':
      rigidBody.setFriction(0.1); // Very slippery
      rigidBody.setRestitution(0.1);
      console.log('  Applied ICE properties (low friction)');
      break;
    case 'boost':
      rigidBody.setFriction(1.5); // High grip for boost pads
      rigidBody.setRestitution(0.0);
      console.log('  Applied BOOST properties');
      break;
    case 'start_finish':
      rigidBody.setFriction(1.0);
      rigidBody.setRestitution(0.0);
      console.log('  Applied START/FINISH properties');
      break;
    default: // 'solid'
      rigidBody.setFriction(1.0);
      rigidBody.setRestitution(0.0);
      console.log('  Applied SOLID track properties');
      break;
  }
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
      this.physicsWorld.removeAction(podData.vehicle); // Remove vehicle também
      this.pods.delete(podId);
    }
  }

  private resetPodPosition(podId: string): void {
    const podData = this.pods.get(podId);
    if (!podData) return;
    
    const Ammo = this.ammoInstance;
    const rigidBody = podData.rigidBody;
    
    // Parar movimento
    rigidBody.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
    rigidBody.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
    
    // Reposicionar em local seguro
    const resetTransform = new Ammo.btTransform();
    resetTransform.setIdentity();
    // resetTransform.setOrigin(new Ammo.btVector3(109, -180, 627));
    
    rigidBody.setWorldTransform(resetTransform);
    rigidBody.activate(true);
    
    console.log("Pod reset to safe position");
  }

  public isPhysicsReady(): boolean {
    return this.isInitialized && this.physicsWorld !== null;
  }
public enablePhysicsDebug(): void {
  this.isDebugMode = true;
  // this.createPhysicsDebugVisualization();
}

public disablePhysicsDebug(): void {
  this.isDebugMode = false;
  this.debugMeshes.forEach(mesh => mesh.dispose());
  this.debugMeshes = [];
}

private createDebugForPhysicsBody(mesh: Mesh, rigidBody: any, index: number): void {
  // Create debug material for collision boxes
  const debugMaterial = new StandardMaterial(`physicsDebugMaterial_${index}`, this.scene);
  debugMaterial.wireframe = true;
  debugMaterial.diffuseColor = new Color3(1, 0, 0); // Red wireframe
  debugMaterial.alpha = 0.6;
  
  // Get the mesh bounds to create proper debug box size
  const bounds = mesh.getBoundingInfo().boundingBox;
  const size = bounds.maximum.subtract(bounds.minimum);
  
  // Create debug box matching the mesh size
  const debugBox = CreateBox(`physicsDebug_${mesh.name}_${index}`, {
    width: size.x,
    height: size.y, 
    depth: size.z
  }, this.scene);
  
  // Position and orient like the mesh
  debugBox.position = mesh.position.clone();
  debugBox.rotation = mesh.rotation.clone();
  debugBox.scaling = mesh.scaling.clone();
  debugBox.material = debugMaterial;
  
  this.debugMeshes.push(debugBox);
  
  console.log(`🔴 Debug Box Created: ${mesh.name} at (${mesh.position.x.toFixed(1)}, ${mesh.position.y.toFixed(1)}, ${mesh.position.z.toFixed(1)})`);
}

// Add this method to check for missing physics on visual meshes
public debugTrackCoverage(racerScene: any): void {
  console.log("=== CHECKING TRACK PHYSICS COVERAGE ===");
  
  const allPhysicsMeshes = racerScene.getAllPhysicsMeshes();
  const solidMeshes = allPhysicsMeshes.filter(({surfaceType}) => surfaceType !== 'void');
  
  console.log(`Total physics meshes: ${allPhysicsMeshes.length}`);
  console.log(`Solid collision meshes: ${solidMeshes.length}`);
  console.log(`Physics bodies created: ${this.trackRigidBodies.length}`);
  
  // Check which meshes might be missing physics
  solidMeshes.forEach(({mesh, surfaceType}, index) => {
    const bounds = mesh.getBoundingInfo();
    console.log(`Mesh ${index}: ${mesh.name} (${surfaceType})`);
    console.log(`  Position: x=${mesh.position.x}, y=${mesh.position.y}, z=${mesh.position.z}`);
    console.log(`  Bounds: min_y=${bounds.boundingBox.minimum.y}, max_y=${bounds.boundingBox.maximum.y}`);
    console.log(`  Size: w=${bounds.boundingBox.maximum.x - bounds.boundingBox.minimum.x}`);
  });
}

// Add this method to perform raycast testing
// public debugRaycastTest(fromPos: Vector3, toPos: Vector3): void {
//   if (!this.physicsWorld || !this.ammoInstance) return;
  
//   const Ammo = this.ammoInstance;
  
//   const from = new Ammo.btVector3(fromPos.x, fromPos.y, fromPos.z);
//   const to = new Ammo.btVector3(toPos.x, toPos.y, toPos.z);
  
//   const rayCallback = new Ammo.ClosestRayResultCallback(from, to);
//   this.physicsWorld.rayTest(from, to, rayCallback);
  
//   if (rayCallback.hasHit()) {
//     const hitPoint = rayCallback.get_m_hitPointWorld();
//     console.log(`✅ RAYCAST HIT: (${hitPoint.x().toFixed(2)}, ${hitPoint.y().toFixed(2)}, ${hitPoint.z().toFixed(2)})`);
    
//     // Create visual indicator for hit point
//     const hitSphere = CreateSphere("raycast_hit", {diameter: 1}, this.scene);
//     hitSphere.position.set(hitPoint.x(), hitPoint.y(), hitPoint.z());
//     const hitMaterial = new StandardMaterial("hitMaterial", this.scene);
//     hitMaterial.diffuseColor = new Color3(0, 1, 0); // Green
//     hitSphere.material = hitMaterial;
    
//     this.debugMeshes.push(hitSphere);
    
//     setTimeout(() => {
//       hitSphere.dispose();
//       const index = this.debugMeshes.indexOf(hitSphere);
//       if (index > -1) this.debugMeshes.splice(index, 1);
//     }, 5000);
    
//   } else {
//     console.log(`❌ RAYCAST MISS: No collision detected from (${fromPos.x}, ${fromPos.y}, ${fromPos.z}) to (${toPos.x}, ${toPos.y}, ${toPos.z})`);
    
//     // Create visual line showing the failed raycast
//     const points = [fromPos, toPos];
//     const line = CreateLines("raycast_miss", {points}, this.scene);
//     const lineMaterial = new StandardMaterial("missMaterial", this.scene);
//     lineMaterial.diffuseColor = new Color3(1, 0, 0); // Red
//     line.color = new Color3(1, 0, 0);
    
//     this.debugMeshes.push(line);
    
//     setTimeout(() => {
//       line.dispose();
//       const index = this.debugMeshes.indexOf(line);
//       if (index > -1) this.debugMeshes.splice(index, 1);
//     }, 3000);
//   }
  
//   Ammo.destroy(rayCallback);
//   Ammo.destroy(from);
//   Ammo.destroy(to);
// }

// Add this to updatePhysics method for continuous pod ground testing
private debugPodGroundContact(): void {
  if (!this.isDebugMode) return;
  
  this.pods.forEach((podData, podId) => {
    const vehicle = podData.vehicle;
    const mesh = podData.mesh;
    
    // Test raycast from pod downward
    const podPos = mesh.position;
    const testPos = new Vector3(podPos.x, podPos.y - 10, podPos.z);
    
    if (Math.random() < 0.05) { // Test occasionally
      this.debugRaycastTest(podPos, testPos);
    }
    
    // Check wheel contact
    let contactCount = 0;
    for (let i = 0; i < 4; i++) {
      const wheelInfo = vehicle.getWheelInfo(i);
      if (wheelInfo.get_m_raycastInfo().get_m_isInContact()) {
        contactCount++;
      }
    }
    
    if (contactCount === 0 && Math.random() < 0.01) {
      console.log(`⚠️  POD ${podId} HAS NO WHEEL CONTACT! Position: ${podPos.x.toFixed(2)}, ${podPos.y.toFixed(2)}, ${podPos.z.toFixed(2)}`);
    }
  });
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