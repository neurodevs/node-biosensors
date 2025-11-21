import { FakeStreamInlet, FakeStreamTransportBridge } from '@neurodevs/node-lsl'
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
    protected static async createsLslWebSocketBridgeForEachStream() {
        assert.isEqualDeep(
            FakeStreamInlet.callsToConstructor.map((c) => c.options),
            this.expectedBridgeOptions,
            'Did not create expected bridges!'
        )
    }

    @test()
    protected static async startCallsActivateOnAllBridges() {
        this.instance.start()

        assert.isEqualDeep(
            FakeStreamTransportBridge.numCallsToActivate,
            4,
            'Did not activate bridges!'
        )
    }

    @test()
    protected static async stopCallsDeactivateOnAllBridges() {
        this.instance.stop()

        assert.isEqualDeep(
            FakeStreamTransportBridge.numCallsToDeactivate,
            4,
            'Did not deactivate bridges!'
        )
    }

    @test()
    protected static async destroyCallsDestroyOnAllBridges() {
        this.instance.destroy()

        assert.isEqualDeep(
            FakeStreamTransportBridge.numCallsToDestroy,
            4,
            'Did not destroy bridges!'
        )
    }

    private static devices = [
        this.FakeDeviceStreamer(),
        this.FakeDeviceStreamer(),
    ]

    private static expectedBridgeOptions = this.devices.flatMap((device) => {
        return device.outlets.map((outlet) => {
            return {
                sampleRateHz: outlet.sampleRateHz,
                channelNames: outlet.channelNames,
                channelFormat: outlet.channelFormat,
                chunkSize: outlet.chunkSize,
                maxBufferedMs: outlet.maxBufferedMs,
            }
        })
    })

    private static BiosensorArrayMonitor() {
        return BiosensorArrayMonitor.Create(this.devices)
    }
}
