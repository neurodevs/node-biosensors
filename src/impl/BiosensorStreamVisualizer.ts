export default class BiosensorStreamVisualizer implements StreamVisualizer {
    public static Class?: StreamVisualizerConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface StreamVisualizer {}

export type StreamVisualizerConstructor = new () => StreamVisualizer
