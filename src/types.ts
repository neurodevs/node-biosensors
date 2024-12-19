export interface StreamGenerator {}

export type StreamGeneratorConstructor = new () => StreamGenerator

export interface StreamRecorder {}

export type StreamRecorderConstructor = new () => StreamRecorder
