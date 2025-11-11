import potrace from 'potrace';
import fs from 'fs/promises';
import { promisify } from 'util';
import type { ConversionParams } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

const trace = promisify(potrace.trace);
const posterize = promisify(potrace.posterize);

interface RasterToSvgOptions {
  inputPath: string;
  outputPath: string;
  params: ConversionParams;
}

export async function rasterToSvg({
  inputPath,
  outputPath,
  params,
}: RasterToSvgOptions): Promise<void> {
  try {
    logger.info('Converting raster image to SVG');

    const options: any = {
      color: 'auto',
      background: params.backgroundColor || 'transparent',
    };

    // Handle color count for posterization
    if (params.colors && params.colors > 1) {
      // Use posterize for multi-color SVG
      options.steps = params.colors;
      options.fill = 'dominant';

      const svg = await posterize(inputPath, options);
      await fs.writeFile(outputPath, svg);
    } else {
      // Use trace for simple black/white SVG
      if (params.smoothing !== undefined) {
        options.threshold = Math.floor((1 - params.smoothing) * 255);
      }

      const svg = await trace(inputPath, options);
      await fs.writeFile(outputPath, svg);
    }

    logger.info(`Raster to SVG conversion completed: ${outputPath}`);
  } catch (error) {
    logger.error('Raster to SVG conversion failed:', error);
    throw new Error(`Raster to SVG conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
