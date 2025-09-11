/**
 * This file serves as the public API for the audiobook-reader module.
 * It re-exports the main `reader` instance and all relevant types,
 * providing a single, consistent entry point for other parts of the application.
 */

export { reader } from './core/audiobook-reader';

// Re-export all types for convenient access
export * from './types';
