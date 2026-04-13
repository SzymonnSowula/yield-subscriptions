/// <reference types="vite/client" />

declare module "*.toml?raw" {
  const value: string;
  export default value;
}
