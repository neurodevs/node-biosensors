export default class TimestampJitterGrapher implements JitterGrapher {
    public static Class?: JitterGrapherConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface JitterGrapher {}

export type JitterGrapherConstructor = new () => JitterGrapher
