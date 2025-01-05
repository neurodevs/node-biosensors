export default class EmpaticaE4Adapter implements E4Adapter {
    public static Class?: E4AdapterConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface E4Adapter {}

export type E4AdapterConstructor = new () => E4Adapter
