import { FakeStreamInlet } from '@neurodevs/node-lsl'
import { test, assert } from '@neurodevs/node-tdd'

import BiosensorArrayMonitor, {
    ArrayMonitor,
} from '../../impl/BiosensorArrayMonitor.js'

import AbstractPackageTest from '../AbstractPackageTest.js'

export default class BiosensorArrayMonitorTest extends AbstractPackageTest {
    private static instance: ArrayMonitor

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.BiosensorArrayMonitor()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsLslInletsForEachStream() {
        assert.isEqualDeep(
            FakeStreamInlet.callsToConstructor.map((c) => c.options),
            this.expectedInletOptions,
            'Did not create expected inlets!'
        )
    }

    private static devices = [
        this.FakeDeviceStreamer(),
        this.FakeDeviceStreamer(),
    ]

    private static expectedInletOptions = this.devices.flatMap((device) => {
        return device.outlets.map((outlet) => {
            return {
                sampleRate: outlet.sampleRate,
                channelNames: outlet.channelNames,
                channelFormat: outlet.channelFormat,
                chunkSize: outlet.chunkSize,
                maxBuffered: outlet.maxBuffered,
            }
        })
    })

    private static BiosensorArrayMonitor() {
        return BiosensorArrayMonitor.Create(this.devices)
    }
}
