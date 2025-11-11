import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import sharp from 'sharp';
import type { ConversionParams } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

interface ToPdfOptions {
  inputPath: string;
  outputPath: string;
  params: ConversionParams;
}

export async function toPdf({
  inputPath,
  outputPath,
  params,
}: ToPdfOptions): Promise<void> {
  try {
    logger.info('Converting to PDF');

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Read input file and convert to PNG if needed
    const imageBuffer = await fs.readFile(inputPath);
    let pngBuffer: Buffer;

    // Check if input is SVG or raster
    const inputStr = imageBuffer.toString('utf8', 0, 100);
    if (inputStr.includes('<svg') || inputStr.includes('<?xml')) {
      // SVG input - convert to PNG first
      const { svgToRaster } = await import('./svgToRaster.js');
      const tempPngPath = inputPath.replace(/\.[^.]+$/, '_temp.png');

      await svgToRaster({
        inputPath,
        outputPath: tempPngPath,
        params: {
          ...params,
          outputFormat: 'png',
        },
      });

      pngBuffer = await fs.readFile(tempPngPath);
      await fs.unlink(tempPngPath); // Clean up temp file
    } else {
      // Raster input - ensure it's PNG
      pngBuffer = await sharp(imageBuffer).png().toBuffer();
    }

    // Get image dimensions
    const metadata = await sharp(pngBuffer).metadata();
    const width = metadata.width || 595;
    const height = metadata.height || 842;

    // Embed the PNG image
    const pngImage = await pdfDoc.embedPng(pngBuffer);

    // Add a page with the image dimensions
    const page = pdfDoc.addPage([width, height]);

    // Draw the image on the page
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width,
      height,
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);

    logger.info(`PDF conversion completed: ${outputPath}`);
  } catch (error) {
    logger.error('PDF conversion failed:', error);
    throw new Error(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
