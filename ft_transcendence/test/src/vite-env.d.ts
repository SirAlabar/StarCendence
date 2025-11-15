/// <reference types="vite/client" />

// Environment variables type definitions
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENVIRONMENT: 'development' | 'staging' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global build-time constants
declare const __APP_VERSION__: string
declare const __BUILD_TIME__: string

// Module declarations for assets
declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.jpeg' {
  const content: string
  export default content
}

declare module '*.gif' {
  const content: string
  export default content
}

declare module '*.webp' {
  const content: string
  export default content
}

// CSS modules
declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

// Audio files
declare module '*.mp3' {
  const content: string
  export default content
}

declare module '*.wav' {
  const content: string
  export default content
}

declare module '*.ogg' {
  const content: string
  export default content
}

// 3D model files
declare module '*.gltf' {
  const content: string
  export default content
}

declare module '*.glb' {
  const content: string
  export default content
}

declare module '*.obj' {
  const content: string
  export default content
}

declare module '*.fbx' {
  const content: string
  export default content
}