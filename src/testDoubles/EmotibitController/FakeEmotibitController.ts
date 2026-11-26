import { EmotibitController } from '../../impl/emotibit/EmotibitDeviceController.js'

export default class FakeEmotibitController implements EmotibitController {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeEmotibitController.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeEmotibitController.numCallsToConstructor = 0
    }
}
