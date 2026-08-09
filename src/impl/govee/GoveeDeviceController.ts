export default class GoveeDeviceController implements GoveeController {
    public static Class?: GoveeControllerConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface GoveeController {}

export type GoveeControllerConstructor = new () => GoveeController
