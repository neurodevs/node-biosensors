export default class BiosensorArrayMonitor implements ArrayMonitor {
    public static Class?: ArrayMonitorConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface ArrayMonitor {}

export type ArrayMonitorConstructor = new () => ArrayMonitor
