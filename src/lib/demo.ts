// Vite replaces DEV with false in every production build, even when built
// with --mode development or with the demo flag set in the environment.
export const DEMO_MODE = import.meta.env.DEV && import.meta.env.VITE_XHAKINHA_DEMO === "true";
