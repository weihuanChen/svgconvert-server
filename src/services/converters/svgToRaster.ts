import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs/promises';
import type { ConversionParams } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

interface SvgToRasterOptions {
  inputPath: string;
  outputPath: string;
  params: ConversionParams;
}

export async function svgToRaster({
  inputPath,
  outputPath,
  params,
}: SvgToRasterOptions): Promise<void> {
  try {
    logger.info(`Converting SVG to ${params.outputFormat.toUpperCase()}`);

    // Read SVG file
    const svgBuffer = await fs.readFile(inputPath);

    // Use Resvg to render SVG to PNG buffer
    const resvg = new Resvg(svgBuffer, {
      fitTo: {
        mode: 'width',
        value: params.width || 1024,
      },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Use Sharp for further processing
    let image = sharp(pngBuffer);

    // Handle resizing with aspect ratio
    if (params.width || params.height) {
      image = image.resize(params.width, params.height, {
        fit: params.maintainAspectRatio !== false ? 'inside' : 'fill',
        withoutEnlargement: false,
      });
    }

    // Handle background color
    if (params.backgroundColor && params.backgroundColor !== 'transparent') {
      image = image.flatten({
        background: params.backgroundColor,
      });
    }

    // Convert to target format
    if (params.outputFormat === 'jpg' || params.outputFormat === 'jpeg') {
      // JPG doesn't support transparency, ensure background
      if (!params.backgroundColor || params.backgroundColor === 'transparent') {
        image = image.flatten({ background: '#ffffff' });
      }

      image = image.jpeg({
        quality: params.quality || 85,
        mozjpeg: true,
      });
    } else if (params.outputFormat === 'png') {
      image = image.png({
        compressionLevel: 9,
        quality: params.quality || 90,
      });
    }

    // Save the output
    await image.toFile(outputPath);

    logger.info(`SVG conversion completed: ${outputPath}`);
  } catch (error) {
    logger.error('SVG to raster conversion failed:', error);
    throw new Error(`SVG conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
