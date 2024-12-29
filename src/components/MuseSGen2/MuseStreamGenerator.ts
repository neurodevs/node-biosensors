export default class MuseStreamGenerator implements StreamGenerator {
    public static Class?: StreamGeneratorConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface StreamGenerator {}

export type StreamGeneratorConstructor = new () => StreamGenerator
