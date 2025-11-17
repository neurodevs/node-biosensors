import { XdfFileLoader } from '@neurodevs/node-xdf'

export default class TimestampJitterGrapher implements JitterGrapher {
    public static Class?: JitterGrapherConstructor

    protected constructor() {}

    public static async Create() {
        await this.XdfFileLoader()
        return new (this.Class ?? this)()
    }

    private static async XdfFileLoader() {
        return XdfFileLoader.Create()
    }
}

export interface JitterGrapher {}

export type JitterGrapherConstructor = new () => JitterGrapher
