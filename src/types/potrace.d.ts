declare module 'potrace' {
  interface TraceOptions {
    color?: string;
    background?: string;
    threshold?: number;
    steps?: number;
    fill?: string;
  }

  interface PotraceModule {
    trace: (path: string, options: TraceOptions, callback: (err: Error | null, svg: string) => void) => void;
    posterize: (path: string, options: TraceOptions, callback: (err: Error | null, svg: string) => void) => void;
  }

  const potrace: PotraceModule;
  export default potrace;
}


