import { randomInt } from 'node:crypto'

import { FakeLslWsBridge, FakeWebSocketServer } from '@neurodevs/node-lsl'
import { test, assert } from '@neurodevs/node-tdd'

import BiosensorWebSocketGateway, {
    WebSocketGateway,
    WebSocketGatewayOptions,
} from '../../impl/BiosensorWebSocketGateway.js'

import FakeDeviceController from '../../testDoubles/DeviceController/FakeDeviceController.js'
import FakeStatusServer from '../../testDoubles/WebSocketServer/FakeStatusServer.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class BiosensorWebSocketGatewayTest extends AbstractPackageTest {
    private static instance: WebSocketGateway

    protected static async beforeEach() {
        await super.beforeEach()

        this.devices = [
            this.FakeDeviceController(),
            this.FakeDeviceController(),
        ]
        this.instance = await this.BiosensorWebSocketGateway()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsLslWebSocketBridgeForEachStream() {
        const actual = FakeLslWsBridge.callsToConstructor.map((call) => ({
            sourceId: call?.sourceId,
            chunkSize: call?.chunkSize,
            listenPort: call?.listenPort,
        }))

        assert.isEqualDeep(
            actual,
            this.expectedBridgeOptions,
            'Did not create expected bridges!'
        )
    }

    @test()
    protected static async acceptsOptionalListenPortStart() {
        FakeWebSocketServer.resetTestDouble()

        const listenPortStart = randomInt(1000, 10000)
        await this.BiosensorWebSocketGateway({ listenPortStart })

        assert.isEqualDeep(
            FakeWebSocketServer.callsToConstructor.map((c) => c.port),
            [
                listenPortStart,
                listenPortStart + 1,
                listenPortStart + 2,
                listenPortStart + 3,
            ],
            'Did not set expected listenPortStart!'
        )
    }

    @test()
    protected static async openCallsActivateOnAllBridges() {
        this.open()

        assert.isEqualDeep(
            FakeLslWsBridge.numCallsToActivate,
            4,
            'Did not activate bridges!'
        )
    }

    @test()
    protected static async closeCallsDeactivateOnAllBridges() {
        this.open()
        this.close()

        assert.isEqualDeep(
            FakeLslWsBridge.numCallsToDeactivate,
            4,
            'Did not deactivate bridges!'
        )
    }

    @test()
    protected static async destroyCallsDestroyOnAllBridges() {
        this.destroy()

        assert.isEqualDeep(
            FakeLslWsBridge.numCallsToDestroy,
            4,
            'Did not destroy bridges!'
        )
    }

    @test()
    protected static async doesNotActivateBridgesTwiceIfOpenCalledTwice() {
        this.open()
        this.open()

        assert.isEqualDeep(
            FakeLslWsBridge.numCallsToActivate,
            4,
            'Activated bridges more than once!'
        )
    }

    @test()
    protected static async doesNotDeactivateBridgesTwiceIfCloseCalledTwice() {
        this.open()
        this.close()
        this.close()

        assert.isEqualDeep(
            FakeLslWsBridge.numCallsToDeactivate,
            4,
            'Deactivated bridges more than once!'
        )
    }

    @test()
    protected static async canOpenAgainAfterClosing() {
        this.open()
        this.close()
        this.open()

        assert.isEqualDeep(
            FakeLslWsBridge.numCallsToActivate,
            8,
            'Did not activate bridges again after closing!'
        )
    }

    @test()
    protected static async canCloseAgainAfterOpeningTwice() {
        this.open()
        this.close()
        this.open()
        this.close()

        assert.isEqualDeep(
            FakeLslWsBridge.numCallsToDeactivate,
            8,
            'Did not deactivate bridges again after opening twice!'
        )
    }

    @test()
    protected static async doesNotDestroyBridgesTwiceAfterDestroyingTwice() {
        this.destroy()
        this.destroy()

        assert.isEqualDeep(
            FakeLslWsBridge.numCallsToDestroy,
            4,
            'Destroyed bridges more than once!'
        )
    }

    @test()
    protected static async throwsIfOpenIsCalledAfterDestroy() {
        this.destroy()

        assert.doesThrow(() => {
            this.open()
        }, `\n\n Cannot open gateway after destroying it! \n\n Please create and open a new instance. \n`)
    }

    @test()
    protected static async throwsIfCloseIsCalledAfterDestroy() {
        this.open()
        this.destroy()

        assert.doesThrow(() => {
            this.close()
        }, `\n\n Cannot close gateway after destroying it! \n\n Please create a new instance. \n`)
    }

    @test()
    protected static async destroyCallsCloseIfGatewayIsOpen() {
        this.open()
        this.destroy()

        assert.isEqualDeep(
            FakeLslWsBridge.numCallsToDeactivate,
            4,
            'Did not close gateway on destroy!'
        )
    }

    @test()
    protected static async servesDeviceStatusOnePortBelowStreams() {
        assert.isEqualDeep(
            FakeStatusServer.callsToConstructor,
            [{ port: 8079 }],
            'Did not serve device status one port below streams!'
        )
    }

    @test()
    protected static async acceptsOptionalStatusPort() {
        FakeStatusServer.resetTestDouble()

        const statusPort = randomInt(1000, 10000)
        await this.BiosensorWebSocketGateway({ statusPort })

        assert.isEqualDeep(
            FakeStatusServer.callsToConstructor,
            [{ port: statusPort }],
            'Did not serve device status on given port!'
        )
    }

    @test()
    protected static async sendsEachDeviceStatusToNewClients() {
        const client = FakeStatusServer.latest.connect()

        assert.isEqualDeep(
            client.lastMessage.devices.map(
                ({ state, listenPorts }: Record<string, unknown>) => ({
                    state,
                    listenPorts,
                })
            ),
            [
                { state: 'disconnected', listenPorts: [8080, 8081] },
                { state: 'disconnected', listenPorts: [8082, 8083] },
            ],
            'Did not send each device status to new clients!'
        )
    }

    @test()
    protected static async reportsEachDeviceNameInStatus() {
        this.devices[1].deviceName = 'OpenBCI Cyton'

        const client = FakeStatusServer.latest.connect()

        assert.isEqualDeep(
            client.lastMessage.devices.map(
                (device: Record<string, unknown>) => device.deviceName
            ),
            ['Muse S Gen 2', 'OpenBCI Cyton'],
            'Did not report each device name in status!'
        )
    }

    @test()
    protected static async reportsEachStreamInStatus() {
        const client = FakeStatusServer.latest.connect()

        let listenPort = 8080

        assert.isEqualDeep(
            client.lastMessage.devices.map(
                (device: Record<string, unknown>) => device.streams
            ),
            this.devices.map((device) =>
                device.outlets.map((outlet) => ({
                    name: outlet.name,
                    type: outlet.type,
                    channelNames: outlet.channelNames,
                    sampleRateHz: outlet.sampleRateHz,
                    listenPort: listenPort++,
                }))
            ),
            'Did not report each stream in status!'
        )
    }

    @test()
    protected static async broadcastsEachStateChange() {
        const client = FakeStatusServer.latest.connect()

        await this.devices[0].connect()

        assert.isEqualDeep(
            client.sent
                .slice(1)
                .map((message) => JSON.parse(message).devices[0].state),
            ['connecting', 'connected'],
            'Did not broadcast each state change!'
        )
    }

    @test()
    protected static async stopsBroadcastingAfterDestroy() {
        const client = FakeStatusServer.latest.connect()

        this.destroy()
        await this.devices[0].connect()

        assert.isLength(
            client.sent,
            1,
            'Broadcast state changes after destroy!'
        )
    }

    @test()
    protected static async closesStatusServerOnDestroy() {
        this.destroy()

        assert.isEqual(
            FakeStatusServer.numCallsToClose,
            1,
            'Did not close status server on destroy!'
        )
    }

    private static open() {
        this.instance.open()
    }

    private static close() {
        this.instance.close()
    }

    private static destroy() {
        this.instance.destroy()
    }

    private static devices: FakeDeviceController[] = [
        this.FakeDeviceController(),
        this.FakeDeviceController(),
    ]

    private static currentListenPort = 8080

    private static expectedBridgeOptions = this.devices.flatMap((device) => {
        return device.outlets.map((outlet) => {
            const { sourceId, chunkSize } = outlet

            return {
                sourceId,
                chunkSize,
                listenPort: this.currentListenPort++,
            }
        })
    })

    private static async BiosensorWebSocketGateway(
        options?: WebSocketGatewayOptions
    ) {
        return BiosensorWebSocketGateway.Create(this.devices, options)
    }
}
