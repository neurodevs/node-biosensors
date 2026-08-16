import { assert } from '@neurodevs/node-tdd'

import { FakeXdfRecorder } from '@neurodevs/node-xdf'
import AbstractPackageTest from './AbstractPackageTest.js'
import { DeviceController } from '../impl/BiosensorDeviceFactory.js'
import AbstractDeviceController from '../impl/abstract/AbstractDeviceController.js'

export interface SpyDeviceController extends DeviceController {
    getIsConnected(): boolean
    getIsStreaming(): boolean
    getDeviceId(): string
}

export default abstract class AbstractDeviceControllerTest extends AbstractPackageTest {
    protected static instance: SpyDeviceController | any
    protected static lastWarn: string

    protected static readonly deviceId = this.generateId()
    protected static readonly xdfRecordPath = `${this.generateId()}.xdf`
    protected static readonly txtRecordPath = `${this.generateId()}.txt`

    protected static readonly callsToCreateWriteStream: unknown[] = []
    protected static readonly callsToWriteStream: unknown[] = []

    protected static async beforeEach() {
        await super.beforeEach()

        AbstractDeviceController.warn = (msg: string) => {
            this.lastWarn = msg
        }

        this.setFakeWriteStream()
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

    protected static async assertConnectWarnsWithDeviceId() {
        await this.connect()
        await this.connect()

        assert.isEqual(
            this.lastWarn,
            `Already connected to ${this.deviceId}.`,
            'Did not warn with deviceId!'
        )
    }

    protected static async assertStartStreamingWarnsWithDeviceId() {
        await this.startStreaming()
        await this.startStreaming()

        assert.isEqual(
            this.lastWarn,
            `Already streaming from ${this.deviceId}.`,
            'Did not warn with deviceId!'
        )
    }

    protected static async assertStopStreamingWarnsWithDeviceId() {
        await this.stopStreaming()

        assert.isEqual(
            this.lastWarn,
            `Already not streaming from ${this.deviceId}.`,
            'Did not warn with deviceId!'
        )
    }

    protected static async assertDisconnectWarnsWithDeviceId() {
        await this.disconnect()

        assert.isEqual(
            this.lastWarn,
            `Already disconnected from ${this.deviceId}.`,
            'Did not warn with deviceId!'
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

    protected static async assertCreatesWriteStreamIfPassedTxtRecordPath() {
        await this.simulateDataWithTxtRecordPath()

        assert.isEqualDeep(
            this.callsToCreateWriteStream,
            [{ path: this.txtRecordPath, options: { flags: 'a' } }],
            'Did not create write stream with expected options!'
        )
    }

    protected static async assertDoesNotCreateWriteStreamByDefault() {
        await this.simulateDataWithoutTxtRecordPath()

        assert.isEqualDeep(
            this.callsToCreateWriteStream,
            [],
            'Should not create a write stream without a txtRecordPath!'
        )
    }

    protected static async assertWritesNewlineTerminatedLinesToTxtRecord() {
        await this.simulateDataWithTxtRecordPath()

        assert.isTrue(
            this.callsToWriteStream.length > 0,
            'Did not write anything to the txt record!'
        )

        assert.isTrue(
            this.callsToWriteStream.every(
                (chunk) => typeof chunk === 'string' && chunk.endsWith('\n')
            ),
            'Did not write newline-terminated lines to the txt record!'
        )
    }

    protected static async simulateDataWithTxtRecordPath() {
        throw new Error(
            'Subclasses must implement simulateDataWithTxtRecordPath!'
        )
    }

    protected static async simulateDataWithoutTxtRecordPath() {
        throw new Error(
            'Subclasses must implement simulateDataWithoutTxtRecordPath!'
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

    protected static setFakeWriteStream() {
        AbstractDeviceController.createWriteStream = ((
            path: any,
            options?: any
        ) => {
            this.callsToCreateWriteStream.push({ path, options })

            return {
                write: (chunk: any) => {
                    this.callsToWriteStream.push(chunk)
                },
            }
        }) as typeof AbstractDeviceController.createWriteStream

        this.callsToCreateWriteStream.length = 0
        this.callsToWriteStream.length = 0
    }
}
