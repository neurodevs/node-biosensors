import { MuseDetector } from '../../impl/muse/MuseModelDetector.js'

export default class FakeMuseDetector implements MuseDetector {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeMuseDetector.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeMuseDetector.numCallsToConstructor = 0
    }
}
