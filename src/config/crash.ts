/**
 * The crash pane's words and the report's limits: what a player sees when the game stops on an error, at start-up or
 * in play, and what the copied report holds (core/crashReport.ts).
 */
export const CRASH_TEXT = {
  /** In play: the game stopped on an error. */
  heading: 'Something went wrong',
  body: 'The game hit an error and stopped. Copy the report below and send it with what you were doing, then reload to play again.',
  /** At start-up: the game never got going. */
  bootHeading: "The game couldn't start",
  bootBody: 'Something stopped the game before it could start. Copy the report below if you report it, then reload to try again.',
  /** Added at start-up when the browser couldn't give the game a graphics context (neither WebGPU nor WebGL2). */
  bootGraphics:
    'Your browser could not start 3D graphics. Update your graphics driver, turn on "Use graphics acceleration when available" (Chrome, Edge) or "Use recommended performance settings" (Firefox) in the browser\'s settings, or try another browser.',
  copy: 'Copy Report',
  copied: 'Copied',
  /** When the clipboard refuses: the report is selected instead. */
  copyFailed: 'Selected: press Ctrl+C (Cmd+C) to copy',
  reload: 'Reload',
  /** The report box's accessible name. */
  reportLabel: 'Error report',
} as const;

/** A start-up error is the graphics context's when its message says so (three.js and the browsers word it so). */
export const GRAPHICS_ERROR = /webgl|webgpu|graphics context|gpu device|adapter/i;

/** The report keeps the error's first lines of stack: enough to place it, short enough to paste anywhere. */
export const CRASH_REPORT = { stackLines: 15 } as const;
