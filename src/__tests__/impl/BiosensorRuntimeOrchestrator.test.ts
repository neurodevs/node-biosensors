import { randomInt } from 'crypto'
import { test, assert } from '@neurodevs/node-tdd'

import { FakeXdfRecorder } from '@neurodevs/node-xdf'
import { DeviceName } from '../../impl/BiosensorDeviceFactory.js'
import BiosensorRuntimeOrchestrator, {
    RuntimeOrchestrator,
    RuntimeOrchestratorOptions,
} from '../../impl/BiosensorRuntimeOrchestrator.js'
import FakeDeviceFactory from '../../testDoubles/DeviceFactory/FakeDeviceFactory.js'
import FakeDeviceStreamer from '../../testDoubles/DeviceStreamer/FakeDeviceStreamer.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class BiosensorRuntimeOrchestratorTest extends AbstractPackageTest {
    private static instance: RuntimeOrchestrator

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeDevices()
        this.setFakeDeviceFactory()

        this.instance = await this.BiosensorRuntimeOrchestrator()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsBiosensorDeviceFactory() {
        assert.isEqual(
            FakeDeviceFactory.numCallsToConstructor,
            1,
            'Did not create device factory!'
        )
    }

    @test()
    protected static async createsDevicesWithExpectedOptions() {
        assert.isEqualDeep(
            FakeDeviceFactory.callsToCreateDevices[0],
            {
                deviceSpecifications: this.deviceNames.map((deviceName) => ({
                    deviceName,
                })),
                sessionOptions: {
                    xdfRecordPath: this.xdfRecordPath,
                    wssPortStart: this.wssPortStart,
                },
            },
            'Did not create devices with expected options!'
        )
    }

    @test()
    protected static async doesNotCreateDevicesOnCreateIfPassedFlag() {
        FakeDeviceFactory.resetTestDouble()

        await this.BiosensorRuntimeOrchestrator({
            initializeOnCreate: false,
        })

        assert.isEqual(
            FakeDeviceFactory.callsToCreateDevices.length,
            0,
            'Should not have created devices!'
        )
    }

    @test()
    protected static async startCallsStartOnXdfStreamRecorder() {
        await this.instance.start()

        assert.isEqual(
            FakeXdfRecorder.numCallsToStart,
            1,
            'Did not start XDF recorder!'
        )
    }

    @test()
    protected static async startCallsStartStreamingOnAllDevices() {
        await this.instance.start()

        assert.isEqual(
            FakeDeviceStreamer.numCallsToStartStreaming,
            this.deviceNames.length,
            'Did not start streaming on all devices!'
        )
    }

    private static readonly xdfRecordPath = this.generateId()
    private static readonly wssPortStart = randomInt(1000, 5000)

    private static readonly deviceNames: DeviceName[] = [
        'Cognionics Quick-20r',
        'Muse S Gen 2',
        'Zephyr BioHarness 3',
    ]

    private static async BiosensorRuntimeOrchestrator(
        options?: Partial<RuntimeOrchestratorOptions>
    ) {
        return await BiosensorRuntimeOrchestrator.Create({
            deviceNames: this.deviceNames,
            xdfRecordPath: this.xdfRecordPath,
            wssPortStart: this.wssPortStart,
            ...options,
        })
    }
}
