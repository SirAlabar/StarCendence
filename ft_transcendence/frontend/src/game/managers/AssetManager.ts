// 3D assets loading

import { 
  Scene,
  AbstractMesh,
  Texture,
  AssetsManager as BabylonAssetsManager
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
  private babylonAssetsManager: BabylonAssetsManager;
  private loadedAssets: Map<string, any> = new Map();
  private callbacks: AssetLoadingCallbacks = {};
  private assetsToLoad: AssetConfig[] = [];

  constructor(scene: Scene) 
  {
    this.scene = scene;
    this.babylonAssetsManager = new BabylonAssetsManager(this.scene);
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

  // Load all assets using Babylon.js AssetsManager
  public async load(): Promise<Map<string, any>> 
  {
    if (this.assetsToLoad.length === 0) 
    {
      return this.loadedAssets;
    }
    
    return new Promise((resolve, reject) => 
    {
      const errors: string[] = [];
      
      this.assetsToLoad.forEach(config => 
      {
        if (config.type === 'mesh') 
        {
          const meshConfig = config as MeshAssetConfig;
          const meshTask = this.babylonAssetsManager.addMeshTask(
            config.id,
            meshConfig.meshNames || '',
            config.path,
            config.filename
          );

          meshTask.onSuccess = (task) => 
          {
            this.loadedAssets.set(config.id, {
              type: 'mesh',
              meshes: task.loadedMeshes,
              particleSystems: task.loadedParticleSystems,
              skeletons: task.loadedSkeletons,
              animationGroups: task.loadedAnimationGroups
            });
          };

          meshTask.onError = (_task, message, exception) => 
          {
            const error = `${config.id}: ${message || exception}`;
            errors.push(error);
          };
        }
        else if (config.type === 'texture') 
        {
          const textureTask = this.babylonAssetsManager.addTextureTask(
            config.id,
            config.path + config.filename
          );

          textureTask.onSuccess = (_task) => 
          {
            this.loadedAssets.set(config.id, {
              type: 'texture',
              texture: _task.texture
            });
          };

          textureTask.onError = (_task, message, exception) => 
          {
            const error = `${config.id}: ${message || exception}`;
            errors.push(error);
          };
        }
      });

      // Progress tracking
      this.babylonAssetsManager.onProgress = (remainingCount, totalCount, lastFinishedTask) => 
      {
        const loaded = totalCount - remainingCount;
        const progress: LoadingProgress = {
          loaded,
          total: totalCount,
          percentage: Math.round((loaded / totalCount) * 100),
          currentAsset: lastFinishedTask?.name || 'Unknown'
        };

        if (this.callbacks.onProgress) 
        {
          this.callbacks.onProgress(progress);
        }
      };

      // Finish callback
      this.babylonAssetsManager.onFinish = () => 
      {
        const successful = this.loadedAssets.size;
        const failed = errors.length;

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
          this.callbacks.onFinish(successful, failed);
        }

        // Reject only if ALL assets failed to load
        if (successful === 0 && failed > 0) 
        {
          reject(new Error(`All ${failed} assets failed to load: ${errors.join('; ')}`));
        } 
        else 
        {
          // Resolve with partial or complete success
          resolve(this.loadedAssets);
        }
      };

      // Start loading
      this.babylonAssetsManager.load();
    });
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

  public getBabylonAssetsManager(): BabylonAssetsManager 
  {
    return this.babylonAssetsManager;
  }
}