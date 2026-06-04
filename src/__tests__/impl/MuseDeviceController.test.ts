import { test, assert } from '@neurodevs/node-tdd'

import MuseDeviceController, {
    MUSE_CHAR_UUIDS,
    CONTROL_UUID,
    MuseControllerOptions,
} from '../../impl/MuseDeviceController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'
import { BleDeviceController, FakeBleController } from '@neurodevs/node-lsl'
import SpyMuseController from '../../testDoubles/MuseController/SpyMuseController.js'

export default class MuseDeviceControllerTest extends AbstractPackageTest {
    private static instance: SpyMuseController

    private static readonly deviceUuid = this.generateId()

    private static readonly charCallbacks = Object.entries(MUSE_CHAR_UUIDS).map(
        ([name, uuid]) => {
            return {
                charUuid: uuid,
                charName: name,
                onData: (
                    _data: Buffer,
                    _length: number,
                    _timestamp: number
                ) => {},
            }
        }
    )

    private static readonly logCalls: unknown[][] = []

    protected static async beforeEach() {
        await super.beforeEach()

        BleDeviceController.Class = FakeBleController
        FakeBleController.resetTestDouble()

        MuseDeviceController.Class = SpyMuseController

        MuseDeviceController.log = (...args: unknown[]) => {
            this.logCalls.push(args)
        }

        this.logCalls.length = 0

        this.instance = await this.MuseDeviceController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsBleDeviceController() {
        const call = FakeBleController.callsToConstructor[0]

        assert.isEqualDeep(
            {
                deviceUuid: call?.deviceUuid,
                charCallbacks: call?.charCallbacks?.map(
                    ({ charUuid, charName }) => ({ charUuid, charName })
                ),
            },
            {
                deviceUuid: this.deviceUuid,
                charCallbacks: this.charCallbacks.map(
                    ({ charUuid, charName }) => ({ charUuid, charName })
                ),
            }
        )

        call?.charCallbacks?.forEach(({ onData }) => {
            assert.isFunction(onData, 'onData should be a function')
        })
    }

    @test()
    protected static async startStreamingCallsConnectBle() {
        await this.startStreaming()

        assert.isEqual(
            FakeBleController.numCallsToConnect,
            1,
            'Did not connect to BLE device!'
        )
    }

    @test()
    protected static async startStreamingWritesCommandsToControlChar() {
        await this.startStreaming()

        assert.isEqualDeep(
            FakeBleController.callsToWriteCharacteristic,
            [
                this.generateCmd('h'),
                this.generateCmd('p50'),
                this.generateCmd('s'),
                this.generateCmd('d'),
            ],
            'Should not write any commands to control char when starting streaming!'
        )
    }

    @test()
    protected static async stopStreamingWritesHaltCommandToControlChar() {
        await this.startStreaming()
        await this.stopStreaming()

        assert.isEqualDeep(
            FakeBleController.callsToWriteCharacteristic[0],
            this.generateCmd('h'),
            'Did not write halt command to control char!'
        )
    }

    @test()
    protected static async disconnectCallsDisconnectBle() {
        await this.instance.disconnect()

        assert.isEqual(
            FakeBleController.numCallsToDisconnect,
            1,
            'Did not disconnect from BLE device!'
        )
    }

    @test()
    protected static async exposesUuidFromBleController() {
        await this.startStreaming()

        assert.isEqual(
            this.instance.bleUuid,
            this.deviceUuid,
            'Did not expose uuid from BLE controller!'
        )
    }

    @test()
    protected static async onDataDecodesAndLogsBytesToConsole() {
        const { timestamp, fakeBytes } = this.simulateOnData()

        assert.isEqualDeep(
            this.logCalls,
            [[`[${timestamp}]`, fakeBytes]],
            'Did not log expected data to console!'
        )
    }

    @test()
    protected static async doesNotLogIfPassedOption() {
        await this.MuseDeviceController({ enableLogs: false })

        this.simulateOnData()

        assert.isEqualDeep(
            this.logCalls,
            [],
            'Should not log any data to console!'
        )
    }

    @test()
    protected static async doesNotLogByDefault() {
        await MuseDeviceController.Create({ bleUuid: this.deviceUuid })

        this.simulateOnData()

        assert.isEqualDeep(
            this.logCalls,
            [],
            'Should not log any data to console by default!'
        )
    }

    @test()
    protected static async exposesNameFromBleController() {
        await this.startStreaming()

        assert.isEqual(
            this.instance.bleName,
            this.instance.getName(),
            'Did not expose name from BLE controller!'
        )
    }

    private static async startStreaming() {
        await this.instance.startStreaming()
    }

    private static async stopStreaming() {
        await this.instance.stopStreaming()
    }

    private static generateCmd(value: string) {
        return {
            characteristicUuid: CONTROL_UUID,
            value,
        }
    }

    private static simulateOnData() {
        const calls = FakeBleController.callsToConstructor
        const { charCallbacks } = calls[calls.length - 1]!
        const { onData } = charCallbacks![0]!

        const fakeBytes = [10, 20, 30]
        const fakeBuffer = Buffer.from(fakeBytes)
        const timestamp = 12345

        onData(fakeBuffer, fakeBytes.length, timestamp)

        return { timestamp, fakeBytes }
    }

    private static async MuseDeviceController(
        options?: Partial<MuseControllerOptions>
    ) {
        return (await MuseDeviceController.Create({
            bleUuid: this.deviceUuid,
            enableLogs: true,
            ...options,
        })) as SpyMuseController
    }
}
