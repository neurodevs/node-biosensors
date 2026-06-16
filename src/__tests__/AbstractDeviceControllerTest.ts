import { assert } from '@neurodevs/node-tdd'

import { FakeXdfRecorder } from '@neurodevs/node-xdf'
import AbstractPackageTest from './AbstractPackageTest.js'
import { DeviceController } from '../impl/BiosensorDeviceFactory.js'

export interface SpyDeviceController extends DeviceController {
    getIsConnected(): boolean
    getIsStreaming(): boolean
}

export default abstract class AbstractDeviceControllerTest extends AbstractPackageTest {
    protected static instance: SpyDeviceController

    protected static readonly xdfRecordPath = `${this.generateId()}.xdf`

    protected static async beforeEach() {
        await super.beforeEach()
    }

    protected static async assertCreatesInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    protected static async assertStartsWithIsConnectedFalse() {
        assert.isFalse(this.isConnected, 'Did not set isConnected false!')
    }

    protected static async assertStartsWithIsStreamingFalse() {
        assert.isFalse(this.isStreaming, 'Did not set isStreaming false!')
    }

    protected static async assertConnectSetsIsConnectedTrue() {
        await this.connect()

        assert.isTrue(this.isConnected, 'Did not set isConnected true!')
    }

    protected static async assertStartStreamingSetsIsStreamingTrue() {
        await this.startStreaming()

        assert.isTrue(this.isStreaming, 'Did not set isStreaming true!')
    }

    protected static async assertStopStreamingSetsIsStreamingFalse() {
        await this.startStreaming()
        await this.stopStreaming()

        assert.isFalse(this.isStreaming, 'Did not set isStreaming false!')
    }

    protected static async assertDisconnectSetsIsConnectedFalse() {
        await this.connect()
        await this.disconnect()

        assert.isFalse(this.isConnected, 'Did not set isConnected false!')
    }

    protected static async assertDisconnectCallsStopStreaming() {
        let wasHit = false

        this.instance.stopStreaming = async () => {
            wasHit = true
        }

        await this.connect()
        await this.startStreaming()
        await this.disconnect()

        assert.isTrue(wasHit, 'Should call stopStreaming on disconnect!')
    }

    protected static async assertDisconnectDoesNotCallStopStreamingIfNotStreaming() {
        let wasHit = false

        this.instance.stopStreaming = async () => {
            wasHit = true
        }

        await this.startStreaming()
        await this.disconnect()

        assert.isFalse(
            wasHit,
            'Should not call stopStreaming if not streaming!'
        )
    }

    protected static async assertCreatesXdfRecorderIfPassedPath() {
        assert.isEqual(
            FakeXdfRecorder.callsToConstructor[0]?.xdfRecordPath,
            this.xdfRecordPath,
            'Did not create XDF recorder with correct path!'
        )
    }

    protected static async assertConnectStartsXdfRecorder() {
        await this.connect()

        assert.isEqual(
            FakeXdfRecorder.numCallsToStart,
            1,
            'Did not start XDF recorder!'
        )
    }

    protected static async assertDisconnectFinishesXdfRecorder() {
        await this.connect()
        await this.disconnect()

        assert.isEqual(
            FakeXdfRecorder.numCallsToFinish,
            1,
            'Did not finish XDF recorder!'
        )
    }

    protected static async connect() {
        await this.instance.connect()
    }

    protected static async startStreaming() {
        await this.instance.startStreaming()
    }

    protected static async stopStreaming() {
        await this.instance.stopStreaming()
    }

    protected static async disconnect() {
        await this.instance.disconnect()
    }

    protected static get isConnected() {
        return this.instance.getIsConnected()
    }

    protected static get isStreaming() {
        return this.instance.getIsStreaming()
    }
}
