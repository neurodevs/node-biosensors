import { test, assert } from '@sprucelabs/test-utils'
import { FakeLslInlet } from '@neurodevs/node-lsl'
import BiosensorArrayMonitor, {
    ArrayMonitor,
    setViewerComponent,
} from '../../modules/BiosensorArrayMonitor'
import FakeStreamViewer, {
    passedFakeStreamViewerProps,
    resetFakeStreamViewer,
} from '../../testDoubles/StreamViewer/FakeStreamViewer'
import AbstractPackageTest from '../AbstractPackageTest'

export default class BiosensorArrayMonitorTest extends AbstractPackageTest {
    private static instance: ArrayMonitor

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeStreamViewer()

        this.instance = this.BiosensorArrayMonitor()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsLslInletsForEachStream() {
        assert.isEqualDeep(
            FakeLslInlet.callsToConstructor.map((c) => c.options),
            this.expectedInletOptions,
            'Did not create expected inlets!'
        )
    }

    @test()
    protected static async createsBiosensorStreamViewer() {
        assert.isEqualDeep(
            passedFakeStreamViewerProps.length,
            1,
            'Incorrect number of stream viewers created!'
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

    private static setFakeStreamViewer() {
        setViewerComponent(FakeStreamViewer)
        resetFakeStreamViewer()
    }

    private static BiosensorArrayMonitor() {
        return BiosensorArrayMonitor.Create(this.devices)
    }
}
