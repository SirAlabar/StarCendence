// ammo.d.ts

declare module 'ammo.js' {
  function Ammo(): Promise<any>;
  export default Ammo;
}

// Global Ammo declaration
declare global {
  interface Window {
    Ammo: any;
  }
}

export {};