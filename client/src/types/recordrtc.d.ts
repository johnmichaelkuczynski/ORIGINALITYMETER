declare module 'recordrtc' {
  // Type for the internal recorder that has the requestData method
  interface InternalRecorder {
    requestData: (callback: (blob: Blob) => void) => void;
  }

  interface RecordRTCOptions {
    type?: 'video' | 'audio' | 'gif' | 'canvas';
    mimeType?: string;
    recorderType?: any;
    numberOfAudioChannels?: number;
    sampleRate?: number;
    desiredSampRate?: number;
    timeSlice?: number;
    disableLogs?: boolean;
    bufferSize?: number;
    frameRate?: number;
    workerPath?: string;
    ondataavailable?: (blob: Blob) => void;
  }

  class RecordRTC {
    constructor(stream: MediaStream, options?: RecordRTCOptions);
    startRecording(): void;
    stopRecording(callback?: (this: RecordRTC) => void): void;
    getBlob(): Promise<Blob>;
    toURL(): string;
    blob: Blob;
    reset(): void;
    destroy(): void;
    
    // Additional methods needed for our implementation
    getState(): 'recording' | 'paused' | 'stopped' | string;
    getInternalRecorder(): InternalRecorder;
    pause(): void;
    resume(): void;
    clearRecordedData(): void;
  }

  namespace RecordRTC {
    const StereoAudioRecorder: any;
    const MediaStreamRecorder: any;
    const WhammyRecorder: any;
    const GifRecorder: any;
    const CanvasRecorder: any;
  }

  export = RecordRTC;
}