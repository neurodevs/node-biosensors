export default class BiosensorStreamViewer implements StreamViewer {
    public static Class?: StreamViewerConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface StreamViewer {}

export type StreamViewerConstructor = new () => StreamViewer
