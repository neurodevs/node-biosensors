export default class CytonDeviceController implements CytonController {
    public static Class?: CytonControllerConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface CytonController {}

export type CytonControllerConstructor = new () => CytonController
