import { randomInt } from 'node:crypto'

import { assert } from '@neurodevs/node-tdd'
import { FakeBleController } from '@neurodevs/node-lsl'

import AbstractDeviceControllerTest from './AbstractDeviceControllerTest.js'
import { DeviceControllerBle } from '../impl/BiosensorDeviceFactory.js'

export interface SpyDeviceControllerBle extends DeviceControllerBle {
    getIsConnected(): boolean
    getIsStreaming(): boolean
    getDeviceId(): string
}

export default abstract class AbstractDeviceControllerBleTest extends AbstractDeviceControllerTest {
    protected static instance: SpyDeviceControllerBle

    protected static readonly deviceUuid = this.deviceId
    protected static readonly shortUuid = this.deviceUuid.slice(0, 6)
    protected static readonly deviceName = this.generateId()
    protected static readonly rssiIntervalMs = randomInt(1, 10)

    protected static async beforeEach() {
        await super.beforeEach()

        FakeBleController.fakeName = this.deviceName
    }

    protected static async assertConnectCallsBleControllerConnect() {
        await this.connect()

        assert.isEqual(
            FakeBleController.numCallsToConnect,
            1,
            'Did not connect to BLE device!'
        )
    }

    protected static async assertConnectDoesNotCallBleControllerIfConnected() {
        await this.connect()
        await this.connect()

        assert.isEqual(
            FakeBleController.numCallsToConnect,
            1,
            'Should only connect to BLE device once!'
        )
    }

    protected static async assertDisconnectCallsDisconnectBle() {
        await this.connect()
        await this.disconnect()

        assert.isEqual(
            FakeBleController.numCallsToDisconnect,
            1,
            'Did not disconnect from BLE device!'
        )
    }

    protected static async assertDisconnectDoesNotCallBleControllerIfNotConnected() {
        await this.disconnect()

        assert.isEqual(
            FakeBleController.numCallsToDisconnect,
            0,
            'Should not disconnect from BLE device if not connected!'
        )
    }

    protected static async assertPassesRssiIntervalMsToBleController() {
        assert.isEqual(
            FakeBleController.callsToConstructor[0]?.rssiIntervalMs,
            this.rssiIntervalMs,
            'Did not pass rssiIntervalMs to BLE controller!'
        )
    }

    protected static async assertExposesUuidFromBleController() {
        await this.startStreaming()

        assert.isEqual(
            this.instance.bleUuid,
            this.deviceUuid,
            'Did not expose uuid from BLE controller!'
        )
    }

    protected static async assertExposesNameFromBleController() {
        await this.startStreaming()

        assert.isEqual(
            this.instance.bleName,
            this.deviceName,
            'Did not expose name from BLE controller!'
        )
    }
}
