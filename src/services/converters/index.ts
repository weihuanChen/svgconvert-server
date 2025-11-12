import { svgToRaster } from './svgToRaster.js';
import { rasterToSvg } from './rasterToSvg.js';
import { toPdf } from './toPdf.js';
import type { ConversionParams, ConversionFormat } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

interface ConversionOptions {
  inputPath: string;
  outputPath: string;
  inputFormat: ConversionFormat;
  params: ConversionParams;
}

export async function convertFile({
  inputPath,
  outputPath,
  inputFormat,
  params,
}: ConversionOptions): Promise<void> {
  const { outputFormat } = params;

  logger.info(
    `Converting ${inputFormat.toUpperCase()} to ${outputFormat.toUpperCase()}`
  );

  try {
    // SVG to raster (PNG/JPG/WebP/GIF)
    if (inputFormat === 'svg' && (outputFormat === 'png' || outputFormat === 'jpg' || outputFormat === 'webp' || outputFormat === 'gif')) {
      await svgToRaster({ inputPath, outputPath, params });
    }
    // Raster to SVG
    else if (
      (inputFormat === 'png' || inputFormat === 'jpg' || inputFormat === 'jpeg' || inputFormat === 'webp' || inputFormat === 'gif') &&
      outputFormat === 'svg'
    ) {
      await rasterToSvg({ inputPath, outputPath, params });
    }
    // Any format to PDF
    else if (outputFormat === 'pdf') {
      await toPdf({ inputPath, outputPath, params });
    }
    // Raster to raster (PNG/JPG/WebP/GIF)
    else if (
      (inputFormat === 'png' || inputFormat === 'jpg' || inputFormat === 'jpeg' || inputFormat === 'webp' || inputFormat === 'gif') &&
      (outputFormat === 'png' || outputFormat === 'jpg' || outputFormat === 'webp' || outputFormat === 'gif')
    ) {
      await svgToRaster({ inputPath, outputPath, params });
    }
    // Unsupported conversion
    else {
      throw new Error(
        `Unsupported conversion: ${inputFormat} to ${outputFormat}`
      );
    }

    logger.info('Conversion completed successfully');
  } catch (error) {
    logger.error('Conversion error:', error);
    throw error;
  }
}

export { svgToRaster, rasterToSvg, toPdf };
