/// <reference types="vite/client" />

// Declare MP3 audio file imports
declare module "*.mp3" {
  const src: string;
  export default src;
}

// Declare other audio file types
declare module "*.wav" {
  const src: string;
  export default src;
}

declare module "*.ogg" {
  const src: string;
  export default src;
}
