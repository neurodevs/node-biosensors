import { randomInt } from 'node:crypto'

import { FakeEventMarkerOutlet } from '@neurodevs/node-lsl'
import { test, assert } from '@neurodevs/node-tdd'
import { FakeXdfRecorder } from '@neurodevs/node-xdf'

import { DeviceSpecification } from '../../impl/BiosensorDeviceFactory.js'
import { DeviceName } from '../../types.js'
import BiosensorStreamingOrchestrator, {
    StreamingOrchestrator,
    StreamingOrchestratorConstructorOptions,
} from '../../impl/BiosensorStreamingOrchestrator.js'
import FakeDeviceFactory from '../../testDoubles/DeviceFactory/FakeDeviceFactory.js'
import FakeDeviceController from '../../testDoubles/DeviceController/FakeDeviceController.js'
import FakeWebSocketGateway from '../../testDoubles/WebSocketGateway/FakeWebSocketGateway.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class BiosensorStreamingOrchestratorTest extends AbstractPackageTest {
    private static instance: StreamingOrchestrator

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeDevices()
        this.setFakeDeviceFactory()
        this.setFakeWebSocketGateway()
        this.setFakeLslEmitter()

        this.instance = await this.BiosensorStreamingOrchestrator()
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
    protected static async startCreatesDevicesWithExpectedOptions() {
        await this.start()

        assert.isEqualDeep(
            FakeDeviceFactory.callsToCreateDevices[0],
            {
                deviceSpecifications: this.expectedDeviceSpecifications,
                sessionOptions: {
                    xdfRecordPath: this.xdfRecordPath,
                    webSocketPortStart: this.webSocketPortStart,
                    createEventMarkerEmitter: false,
                },
            },
            'Did not create devices with expected options!'
        )
    }

    @test()
    protected static async startCallsStartOnXdfStreamRecorderIfExists() {
        await this.start()

        assert.isEqual(
            FakeXdfRecorder.numCallsToStart,
            1,
            'Did not start XDF recorder!'
        )
    }

    @test()
    protected static async startCallsOpenOnWebSocketGateway() {
        await this.start()

        assert.isEqual(
            FakeWebSocketGateway.numCallsToOpen,
            1,
            'Did not open WebSocket gateway!'
        )
    }

    @test()
    protected static async startCallsConnectOnAllDevices() {
        await this.start()

        assert.isEqual(
            FakeDeviceController.numCallsToConnect,
            this.devices.length,
            'Did not connect all devices!'
        )
    }

    @test()
    protected static async connectsDevicesAfterOpeningGatewayAndBeforeStreaming() {
        const device = FakeDeviceFactory.fakeDevice
        const connect = device.connect

        const whenConnecting: unknown[] = []

        device.connect = async () => {
            whenConnecting.push({
                numCallsToOpen: FakeWebSocketGateway.numCallsToOpen,
                numCallsToStartStreaming:
                    FakeDeviceController.numCallsToStartStreaming,
            })
        }

        try {
            await this.start()
        } finally {
            device.connect = connect
        }

        assert.isEqualDeep(
            whenConnecting,
            this.devices.map(() => ({
                numCallsToOpen: 1,
                numCallsToStartStreaming: 0,
            })),
            'Did not connect devices after opening gateway and before streaming!'
        )
    }

    @test()
    protected static async startingAgainConnectsWithoutCreatingDevicesAgain() {
        await this.start()
        await this.start()

        assert.isEqualDeep(
            {
                numCallsToCreateDevices:
                    FakeDeviceFactory.callsToCreateDevices.length,
                numCallsToOpen: FakeWebSocketGateway.numCallsToOpen,
                numCallsToStartRecorder: FakeXdfRecorder.numCallsToStart,
                numCallsToConnect: FakeDeviceController.numCallsToConnect,
            },
            {
                numCallsToCreateDevices: 1,
                numCallsToOpen: 1,
                numCallsToStartRecorder: 1,
                numCallsToConnect: this.devices.length * 2,
            },
            'Did not connect again without creating devices again!'
        )
    }

    @test()
    protected static async startingAfterStopCreatesDevicesAgain() {
        await this.startThenStop()
        await this.start()

        assert.isEqual(
            FakeDeviceFactory.callsToCreateDevices.length,
            2,
            'Did not create devices again when starting after stop!'
        )
    }

    @test()
    protected static async startCallsStartStreamingOnAllDevices() {
        await this.start()

        assert.isEqual(
            FakeDeviceController.numCallsToStartStreaming,
            this.devices.length,
            'Did not start streaming on all devices!'
        )
    }

    @test()
    protected static async doesNotStartRecorderIfNotGivenXdfRecordPath() {
        FakeXdfRecorder.resetTestDouble()

        const instance = await this.BiosensorStreamingOrchestrator({
            xdfRecordPath: undefined,
        })

        await instance.start()

        assert.isEqual(
            FakeXdfRecorder.numCallsToStart,
            0,
            'Should not have started XDF recorder!'
        )
    }

    @test()
    protected static async stopCallsDisconnectOnAllDevices() {
        await this.startThenStop()

        assert.isEqual(
            FakeDeviceController.numCallsToDisconnect,
            this.devices.length,
            'Did not disconnect all devices!'
        )
    }

    @test()
    protected static async stopCleansUpEverythingEvenWhenDeviceFailsToDisconnect() {
        const instance = await this.createWithEventMarkerEmitter()
        await instance.start()

        await this.stopWithFailingDisconnects(instance, ['first'])

        assert.isEqualDeep(
            {
                numCallsToDisconnect: this.numFailingDisconnectCalls,
                numGatewaysDestroyed: FakeWebSocketGateway.numCallsToDestroy,
                numEmittersDestroyed: FakeEventMarkerOutlet.numCallsToDestroy,
                numRecordersFinished: FakeXdfRecorder.numCallsToFinish,
            },
            {
                numCallsToDisconnect: this.devices.length,
                numGatewaysDestroyed: 1,
                numEmittersDestroyed: 1,
                numRecordersFinished: 1,
            },
            'Did not clean up everything when a device failed to disconnect!'
        )
    }

    @test()
    protected static async stopThrowsErrorFromDeviceThatFailedToDisconnect() {
        await this.start()

        const err = await this.stopWithFailingDisconnects(this.instance, [
            'only failure',
        ])

        assert.isEqual(
            err?.message,
            'only failure',
            'Did not throw error from device that failed to disconnect!'
        )
    }

    @test()
    protected static async stopThrowsEveryErrorWhenSeveralDevicesFailToDisconnect() {
        await this.start()

        const err = await this.stopWithFailingDisconnects(this.instance, [
            'first failure',
            'second failure',
        ])

        assert.isEqual(
            err?.message,
            'first failure\nsecond failure',
            'Did not throw every error when several devices failed!'
        )
    }

    @test()
    protected static async startingAfterFailedStopCreatesDevicesAgain() {
        await this.start()
        await this.stopWithFailingDisconnects(this.instance, ['failure'])
        await this.start()

        assert.isEqual(
            FakeDeviceFactory.callsToCreateDevices.length,
            2,
            'Did not create devices again when starting after failed stop!'
        )
    }

    @test()
    protected static async stopCallsDestroyOnWebSocketGatewayIfExists() {
        await this.startThenStop()

        assert.isEqual(
            FakeWebSocketGateway.numCallsToDestroy,
            1,
            'Did not destroy WebSocket gateway!'
        )
    }

    @test()
    protected static async stopCallsStopOnXdfRecorderIfExists() {
        await this.startThenStop()

        assert.isEqual(
            FakeXdfRecorder.numCallsToFinish,
            1,
            'Did not stop XDF recorder!'
        )
    }

    @test()
    protected static async createsEventMarkerEmitterIfRequested() {
        const instance = await this.createWithEventMarkerEmitter()

        await instance.start()

        const call = FakeDeviceFactory.callsToCreateDevices[0]

        assert.isTrue(
            call.sessionOptions?.createEventMarkerEmitter,
            'Did not create event marker outlet!'
        )
    }

    @test()
    protected static async stopCallsDestroyOnEventMarkerEmitter() {
        const instance = await this.createWithEventMarkerEmitter()

        await instance.start()
        await instance.stop()

        assert.isEqual(
            FakeEventMarkerOutlet.numCallsToDestroy,
            1,
            'Did not destroy event marker emitter!'
        )
    }

    @test()
    protected static async stopDoesNotThrowIfStartWasNeverCalled() {
        await this.stop()

        assert.isEqual(
            FakeDeviceController.numCallsToDisconnect,
            0,
            'Should not have disconnected any devices!'
        )
    }

    private static numFailingDisconnectCalls = 0

    private static async stopWithFailingDisconnects(
        instance: StreamingOrchestrator,
        errorMessages: string[]
    ) {
        const device = FakeDeviceFactory.fakeDevice
        const disconnect = device.disconnect
        const remainingMessages = [...errorMessages]

        this.numFailingDisconnectCalls = 0

        device.disconnect = async () => {
            this.numFailingDisconnectCalls++
            const message = remainingMessages.shift()

            if (message) {
                throw new Error(message)
            }
        }

        try {
            await instance.stop()
            return undefined
        } catch (err) {
            return err as Error
        } finally {
            device.disconnect = disconnect
        }
    }

    private static async startThenStop() {
        await this.start()
        await this.stop()
    }

    private static async start() {
        await this.instance.start()
    }

    private static async stop() {
        await this.instance.stop()
    }

    private static readonly xdfRecordPath = this.generateId()
    private static readonly webSocketPortStart = randomInt(1000, 5000)

    private static readonly museBleUuid = this.generateId()

    private static readonly devices: (DeviceName | DeviceSpecification)[] = [
        'Cognionics Quick-20r',
        { deviceName: 'Muse S Gen 2', bleUuid: this.museBleUuid },
        'Zephyr BioHarness 3',
    ]

    private static readonly expectedDeviceSpecifications: DeviceSpecification[] =
        [
            { deviceName: 'Cognionics Quick-20r' },
            { deviceName: 'Muse S Gen 2', bleUuid: this.museBleUuid },
            { deviceName: 'Zephyr BioHarness 3' },
        ]

    private static async createWithEventMarkerEmitter() {
        return await this.BiosensorStreamingOrchestrator({
            eventMarkers: [],
        })
    }

    private static async BiosensorStreamingOrchestrator(
        options?: Partial<StreamingOrchestratorConstructorOptions>
    ) {
        return await BiosensorStreamingOrchestrator.Create({
            devices: this.devices,
            xdfRecordPath: this.xdfRecordPath,
            webSocketPortStart: this.webSocketPortStart,
            ...options,
        })
    }
}
