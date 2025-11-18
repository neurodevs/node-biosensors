import { XdfFileLoader, XdfLoader } from '@neurodevs/node-xdf'

export default class TimestampJitterGrapher implements JitterGrapher {
    public static Class?: JitterGrapherConstructor

    private xdfInputPath: string
    private loader: XdfLoader

    protected constructor(options: JitterGrapherConstructorOptions) {
        const { xdfInputPath, loader } = options

        this.xdfInputPath = xdfInputPath
        this.loader = loader
    }

    public static async Create(options: JitterGrapherOptions) {
        const loader = await this.XdfFileLoader()
        return new (this.Class ?? this)({ ...options, loader })
    }

    public async run() {
        await this.loader.load(this.xdfInputPath)
    }

    private static async XdfFileLoader() {
        return XdfFileLoader.Create()
    }
}

export interface JitterGrapher {
    run(): Promise<void>
}

export type JitterGrapherConstructor = new (
    options: JitterGrapherConstructorOptions
) => JitterGrapher

export interface JitterGrapherOptions {
    xdfInputPath: string
    outputDir: string
    sampleRateHz: number
}

export interface JitterGrapherConstructorOptions extends JitterGrapherOptions {
    loader: XdfLoader
}
