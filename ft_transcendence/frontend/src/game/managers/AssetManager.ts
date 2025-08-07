// 3D assets loading

import { 
  Scene,
  SceneLoader,
  AbstractMesh,
  Texture
} from '@babylonjs/core';

// Asset configuration interfaces
export interface AssetConfig 
{
  id: string;
  type: 'mesh' | 'texture';
  path: string;
  filename: string;
}

export interface MeshAssetConfig extends AssetConfig 
{
  type: 'mesh';
  meshNames?: string | string[];
}

export interface TextureAssetConfig extends AssetConfig 
{
  type: 'texture';
}

// Loading progress callback
export interface LoadingProgress 
{
  loaded: number;
  total: number;
  percentage: number;
  currentAsset: string;
}

// Asset loading callbacks
export interface AssetLoadingCallbacks 
{
  onProgress?: (progress: LoadingProgress) => void;
  onSuccess?: (loadedAssets: Map<string, any>) => void;
  onError?: (errors: string[]) => void;
  onFinish?: (successful: number, failed: number) => void;
}

export class AssetManager 
{
  private scene: Scene;
  private loadedAssets: Map<string, any> = new Map();
  private callbacks: AssetLoadingCallbacks = {};
  private assetsToLoad: AssetConfig[] = [];

  constructor(scene: Scene) 
  {
    this.scene = scene;
    console.log('AssetManager initialized');
  }

  // Add assets to load
  public addMeshAsset(config: MeshAssetConfig): AssetManager 
  {
    this.assetsToLoad.push(config);
    return this;
  }

  public addTextureAsset(config: TextureAssetConfig): AssetManager 
  {
    this.assetsToLoad.push(config);
    return this;
  }

  public addAssets(configs: AssetConfig[]): AssetManager 
  {
    this.assetsToLoad.push(...configs);
    return this;
  }

  public setCallbacks(callbacks: AssetLoadingCallbacks): AssetManager 
  {
    this.callbacks = callbacks;
    return this;
  }

  // Load all assets
  public async load(): Promise<Map<string, any>> 
  {
    if (this.assetsToLoad.length === 0) 
    {
      console.warn('No assets to load');
      return this.loadedAssets;
    }

    console.log(`Loading ${this.assetsToLoad.length} assets...`);
    
    const errors: string[] = [];
    let completed = 0;

    for (const config of this.assetsToLoad) 
    {
      try 
      {
        this.reportProgress(completed, this.assetsToLoad.length, config.id);

        if (config.type === 'mesh') 
        {
          const meshConfig = config as MeshAssetConfig;
          const result = await SceneLoader.ImportMeshAsync(
            meshConfig.meshNames || '',
            config.path,
            config.filename,
            this.scene
          );

          this.loadedAssets.set(config.id, {
            type: 'mesh',
            meshes: result.meshes,
            particleSystems: result.particleSystems,
            skeletons: result.skeletons,
            animationGroups: result.animationGroups
          });
        }
        else if (config.type === 'texture') 
        {
          const texture = new Texture(config.path + config.filename, this.scene);
          
          // Wait for texture to load
          await new Promise<void>((resolve) => {
            if (texture.isReady()) 
            {
              resolve();
            } 
            else 
            {
              texture.onLoadObservable.add(() => resolve());
            }
          });

          this.loadedAssets.set(config.id, {
            type: 'texture',
            texture
          });
        }

        console.log(`✅ Loaded: ${config.id}`);
      } 
      catch (error) 
      {
        console.error(`❌ Failed: ${config.id}`, error);
        errors.push(`${config.id}: ${error}`);
      }

      completed++;
      this.reportProgress(completed, this.assetsToLoad.length, config.id);
    }

    // Call callbacks
    if (errors.length > 0 && this.callbacks.onError) 
    {
      this.callbacks.onError(errors);
    }

    if (this.callbacks.onSuccess) 
    {
      this.callbacks.onSuccess(this.loadedAssets);
    }

    if (this.callbacks.onFinish) 
    {
      this.callbacks.onFinish(this.assetsToLoad.length - errors.length, errors.length);
    }

    console.log(`Loading complete: ${this.assetsToLoad.length - errors.length} success, ${errors.length} failed`);
    return this.loadedAssets;
  }

  private reportProgress(completed: number, total: number, currentAsset: string): void 
  {
    const progress: LoadingProgress = {
      loaded: completed,
      total,
      percentage: Math.round((completed / total) * 100),
      currentAsset
    };

    if (this.callbacks.onProgress) 
    {
      this.callbacks.onProgress(progress);
    }
  }

  // Get loaded assets
  public getAsset<T = any>(id: string): T | null 
  {
    return this.loadedAssets.get(id) || null;
  }

  public getMesh(id: string): AbstractMesh[] | null 
  {
    const asset = this.getAsset(id);
    return asset?.type === 'mesh' ? asset.meshes : null;
  }

  public getFirstMesh(id: string): AbstractMesh | null 
  {
    const meshes = this.getMesh(id);
    return meshes && meshes.length > 0 ? meshes[0] : null;
  }

  public getTexture(id: string): Texture | null 
  {
    const asset = this.getAsset(id);
    return asset?.type === 'texture' ? asset.texture : null;
  }

  public isAssetLoaded(id: string): boolean 
  {
    return this.loadedAssets.has(id);
  }

  public getLoadedAssetIds(): string[] 
  {
    return Array.from(this.loadedAssets.keys());
  }

  public clear(): void 
  {
    this.assetsToLoad = [];
    this.loadedAssets.clear();
    this.callbacks = {};
  }

  public dispose(): void 
  {
    this.clear();
  }

  // Utility methods
  public static createMeshConfig(id: string, path: string, filename: string): MeshAssetConfig 
  {
    return {
      id,
      type: 'mesh',
      path: path.endsWith('/') ? path : path + '/',
      filename
    };
  }

  public static createTextureConfig(id: string, path: string, filename: string): TextureAssetConfig 
  {
    return {
      id,
      type: 'texture', 
      path: path.endsWith('/') ? path : path + '/',
      filename
    };
  }
}