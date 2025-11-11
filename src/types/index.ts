export type ConversionFormat = 'png' | 'jpg' | 'jpeg' | 'svg' | 'pdf';

export type TaskStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';

export interface ConversionParams {
  outputFormat: ConversionFormat;
  width?: number;
  height?: number;
  quality?: number; // 1-100 for JPG
  backgroundColor?: string; // hex color or 'transparent'
  maintainAspectRatio?: boolean;
  // For bitmap to SVG conversion
  colors?: number;
  smoothing?: number;
}

export interface Task {
  taskId: string;
  status: TaskStatus;
  inputFile: string;
  outputFile?: string;
  inputFormat: ConversionFormat;
  outputFormat: ConversionFormat;
  params: ConversionParams;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface UploadResponse {
  taskId: string;
  status: TaskStatus;
  message: string;
}

export interface StatusResponse {
  taskId: string;
  status: TaskStatus;
  progress?: number;
  error?: string;
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
}
