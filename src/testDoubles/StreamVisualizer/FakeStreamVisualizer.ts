import { StreamVisualizer } from '../../impl/BiosensorStreamVisualizer.js'

export default class FakeStreamVisualizer implements StreamVisualizer {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeStreamVisualizer.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeStreamVisualizer.numCallsToConstructor = 0
    }
}
