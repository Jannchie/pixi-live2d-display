# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Live2D integration plugin for PixiJS v8. The project rewrite the official Live2D framework to provide unified APIs for both Cubism 2.1 and Cubism 4 models. It's written in TypeScript and uses Vite as the build tool.

## Common Commands

```bash
# Setup - Download Live2D core files (required first time)
pnpm run setup

# Development playground
pnpm playground

# Build the project (required before first test run)
pnpm build

# Testing
pnpm test                    # Run tests
pnpm test:u                  # Run tests and update snapshots

# Type checking and building
pnpm type                    # Generate type definitions
pnpm build                   # Build distribution files

# Linting
pnpm lint                    # Check code style
pnpm lint:fix                # Fix auto-fixable style issues

# Documentation
pnpm doc                     # Generate documentation
pnpm serve-docs              # Serve documentation locally
```

## Architecture

### Core Structure

- `src/index.ts` - Main entry point, exports all public APIs
- `src/Live2DModel.ts` - Main wrapper class extending PIXI.Container
- `src/Live2DTransform.ts` - Transform utilities for Live2D models

### Cubism Support

- `src/cubism2/` - Cubism 2.1 implementation (older Live2D models)  
- `src/cubism4/` - Cubism 4 implementation (newer Live2D models)
- `src/cubism-common/` - Shared functionality between Cubism versions

### Factory System

- `src/factory/` - Model loading and creation system
- `src/factory/Live2DFactory.ts` - Main factory for creating models
- Various loaders: `XHRLoader.ts`, `FileLoader.ts`, `ZipLoader.ts`

### Build Configuration

- Uses Vite for bundling with custom configuration in `vite.config.ts`
- Multiple output formats: ES modules, UMD, and separate Cubism 2/4 bundles
- Custom build script `scripts/build.js` handles multiple bundle generation

### Entry Points

The project provides multiple entry points for different use cases:

- `index.js` - Full bundle with both Cubism 2 and 4 support
- `cubism2.js` - Only Cubism 2.1 support
- `cubism4.js` - Only Cubism 4 support
- `extra.js` - Additional utilities

## Development Notes

- Requires Live2D core files to be downloaded via `pnpm run setup` before development
- Uses submodules for Cubism framework integration
- Tests run in browser environment using Vitest with Chrome
- Bundle tests run after other tests to avoid environment pollution
- Playground changes to `playground/index.ts` should not be committed

## Type System

- Full TypeScript support with strict type checking
- Type definitions are generated via `dts-bundle-generator`
- Custom type patches applied via `scripts/patch-types.js`
- Path aliases: `@/*` maps to `src/*`, `@cubism/*` maps to `cubism/src/*`

## Testing Requirements

- Must build project before running tests for the first time
- Uses browser-based testing with Chrome via Vitest
- Visual snapshot testing for UI components
- Bundle tests verify the built distributions work correctly
