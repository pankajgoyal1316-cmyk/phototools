/// <reference types="vite/client" />

declare module 'onnxruntime-web' {
  export interface Tensor {
    dims: readonly number[];
    type: string;
    data: Float32Array | Uint8Array | Int8Array;
    location: string;
  }
  export interface InferenceSession {
    run(feeds: Record<string, unknown>, options?: Record<string, unknown>): Promise<Record<string, Tensor>>;
    inputNames: string[];
    outputNames: string[];
    release(): void;
  }
  export namespace InferenceSession {
    function create(model: Uint8Array | ArrayBuffer, options?: Record<string, unknown>): Promise<InferenceSession>;
  }
  export const Tensor: new (type: string, data: ArrayLike<number>, dims: readonly number[]) => Tensor;
  export const env: {
    wasm: {
      numThreads?: number;
      proxy?: boolean;
      wasmPaths?: Record<string, string> | string;
    };
    webgpu?: Record<string, unknown>;
  };
}

declare module 'onnxruntime-web/webgpu' {
  export * from 'onnxruntime-web';
}
