import { test, assert } from '@neurodevs/node-tdd'

import MuseDeviceController, {
    MuseController,
    MUSE_CHAR_UUIDS,
} from '../../impl/MuseDeviceController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'
import { BleDeviceController, FakeBleController } from '@neurodevs/node-lsl'
import koffi from 'koffi'

export default class MuseDeviceControllerTest extends AbstractPackageTest {
    private static instance: MuseController

    private static readonly deviceUuid = this.generateId()

    private static readonly charCallbacks = Object.entries(MUSE_CHAR_UUIDS).map(
        ([name, uuid]) => {
            return {
                charUuid: uuid,
                charName: name,
                onData: (data: Buffer, length: number, timestamp: number) => {
                    const bytes = koffi.decode(
                        data,
                        'uint8',
                        length
                    ) as number[]
                    console.info(`[${timestamp}] length=${length}`, bytes)
                },
            }
        }
    )

    protected static async beforeEach() {
        await super.beforeEach()

        BleDeviceController.Class = FakeBleController
        FakeBleController.resetTestDouble()

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
        await this.instance.startStreaming()

        assert.isEqual(
            FakeBleController.numCallsToConnect,
            1,
            'Did not connect to BLE device!'
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

    private static MuseDeviceController() {
        return MuseDeviceController.Create({
            deviceUuid: this.deviceUuid,
        })
    }
}
