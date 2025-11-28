import { randomInt } from 'crypto'
import {
    FakeStreamInlet,
    FakeWebSocketBridge,
    FakeWebSocketServer,
} from '@neurodevs/node-lsl'
import { test, assert } from '@neurodevs/node-tdd'

import BiosensorWebSocketGateway, {
    WebSocketGateway,
    WebSocketGatewayOptions,
} from '../../impl/BiosensorWebSocketGateway.js'

import AbstractPackageTest from '../AbstractPackageTest.js'

export default class BiosensorWebSocketGatewayTest extends AbstractPackageTest {
    private static instance: WebSocketGateway

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.BiosensorWebSocketGateway()
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
    protected static async acceptsOptionalWssPortStart() {
        FakeWebSocketServer.resetTestDouble()

        const wssPortStart = randomInt(1000, 10000)
        this.BiosensorWebSocketGateway({ wssPortStart })

        assert.isEqualDeep(
            FakeWebSocketServer.callsToConstructor.map((c) => c.port),
            [
                wssPortStart,
                wssPortStart + 1,
                wssPortStart + 2,
                wssPortStart + 3,
            ],
            'Did not set expected wssPortStart!'
        )
    }

    @test()
    protected static async openCallsActivateOnAllBridges() {
        this.open()

        assert.isEqualDeep(
            FakeWebSocketBridge.numCallsToActivate,
            4,
            'Did not activate bridges!'
        )
    }

    @test()
    protected static async closeCallsDeactivateOnAllBridges() {
        this.open()
        this.close()

        assert.isEqualDeep(
            FakeWebSocketBridge.numCallsToDeactivate,
            4,
            'Did not deactivate bridges!'
        )
    }

    @test()
    protected static async destroyCallsDestroyOnAllBridges() {
        this.destroy()

        assert.isEqualDeep(
            FakeWebSocketBridge.numCallsToDestroy,
            4,
            'Did not destroy bridges!'
        )
    }

    @test()
    protected static async doesNotActivateBridgesTwiceIfOpenCalledTwice() {
        this.open()
        this.open()

        assert.isEqualDeep(
            FakeWebSocketBridge.numCallsToActivate,
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
            FakeWebSocketBridge.numCallsToDeactivate,
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
            FakeWebSocketBridge.numCallsToActivate,
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
            FakeWebSocketBridge.numCallsToDeactivate,
            8,
            'Did not deactivate bridges again after opening twice!'
        )
    }

    @test()
    protected static async doesNotDestroyBridgesTwiceAfterDestroyingTwice() {
        this.destroy()
        this.destroy()

        assert.isEqualDeep(
            FakeWebSocketBridge.numCallsToDestroy,
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
            FakeWebSocketBridge.numCallsToDeactivate,
            4,
            'Did not close gateway on destroy!'
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

    private static devices = [
        this.FakeDeviceStreamer(),
        this.FakeDeviceStreamer(),
    ]

    private static currentWssPort = 8080

    private static expectedBridgeOptions = this.devices.flatMap((device) => {
        return device.outlets.map((outlet) => {
            return {
                sampleRateHz: outlet.sampleRateHz,
                channelNames: outlet.channelNames,
                channelFormat: outlet.channelFormat,
                chunkSize: outlet.chunkSize,
                wssPort: this.currentWssPort++,
            }
        })
    })

    private static BiosensorWebSocketGateway(
        options?: WebSocketGatewayOptions
    ) {
        return BiosensorWebSocketGateway.Create(this.devices, options)
    }
}
