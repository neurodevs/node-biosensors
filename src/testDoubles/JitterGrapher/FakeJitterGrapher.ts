import { JitterGrapher } from '../../impl/TimestampJitterGrapher.js'

export default class FakeJitterGrapher implements JitterGrapher {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeJitterGrapher.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeJitterGrapher.numCallsToConstructor = 0
    }
}
