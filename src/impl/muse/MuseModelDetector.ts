export default class MuseModelDetector implements MuseDetector {
    public static Class?: MuseDetectorConstructor

    protected constructor() {}

    public static async Create() {
        return new (this.Class ?? this)()
    }
}

export interface MuseDetector {}

export type MuseDetectorConstructor = new () => MuseDetector
