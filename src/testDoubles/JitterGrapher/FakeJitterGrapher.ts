import { JitterGrapher } from '../../impl/TimestampJitterGrapher.js'

export default class FakeJitterGrapher implements JitterGrapher {
    public static numCallsToConstructor = 0
    public static numCallsToRun = 0

    public constructor() {
        FakeJitterGrapher.numCallsToConstructor++
    }

    public async run() {
        FakeJitterGrapher.numCallsToRun++
    }

    public static resetTestDouble() {
        FakeJitterGrapher.numCallsToConstructor = 0
        FakeJitterGrapher.numCallsToRun = 0
    }
}
