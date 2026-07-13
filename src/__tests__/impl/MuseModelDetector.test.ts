import { test, assert } from '@neurodevs/node-tdd'
import { FakeBleController } from '@neurodevs/node-lsl'

import MuseModelDetector, {
    detectModel,
} from '../../impl/muse/MuseModelDetector.js'
import { CONTROL_UUID } from '../../impl/muse/MuseDeviceController.js'
import SpyMuseDetector from '../../testDoubles/MuseDetector/SpyMuseDetector.js'
import AbstractPackageTest from '../AbstractPackageTest.js'
import FakeMuseDetector from '../../testDoubles/MuseDetector/FakeMuseDetector.js'

export default class MuseModelDetectorTest extends AbstractPackageTest {
    private static instance: SpyMuseDetector

    private static readonly deviceUuid = this.generateId()

    private static readonly muse2ControlResponse =
        '{"ap":"headset","sp":"Blackcomb_revB","tp":"consumer","hw":"10.4","bn":2,"fw":"1.0.21","bl":"1.0.0","pv":1,"rc":0}'

    private static readonly gen2ControlResponse =
        '{"ap":"headset","sp":"Letto_revX","tp":"consumer","hw":"01.3","bn":2,"fi":"None","fw":"2.2.5","bl":"1.0.2","pv":2,"rc":0}'

    private static readonly athenaControlResponse =
        '{"fw":"3.1.19","bn":1,"tp":"consumer","hw":"01.1","pv":4,"ap":"headset","sp":"Athena_RevE","hb":"Athena_RevF_NW","bl":"1.0.1","be":"1.5.1","rc":0}'

    protected static async beforeEach() {
        await super.beforeEach()

        MuseModelDetector.detectModelWindowMs = 5
        MuseModelDetector.detectModelTimeoutMs = 50

        MuseModelDetector.Class = SpyMuseDetector

        this.instance = await this.MuseModelDetector()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async detectsMuse2FromControlResponse() {
        await this.assertDetectsModel(this.muse2ControlResponse, 'Muse 2')
    }

    @test()
    protected static async detectsMuseSGen2FromControlResponse() {
        await this.assertDetectsModel(this.gen2ControlResponse, 'Muse S Gen 2')
    }

    @test()
    protected static async detectsMuseSAthenaFromControlResponse() {
        await this.assertDetectsModel(
            this.athenaControlResponse,
            'Muse S Athena'
        )
    }

    @test()
    protected static async throwsOnUnknownControlResponse() {
        const codename = 'Nonexistent_revA'
        const response = `{"sp":"${codename}","rc":0}`

        this.fakeControlResponse(this.instance, response)

        await assert.doesThrowAsync(
            async () => await this.instance.detectModel(),
            `Could not resolve Muse model from unknown CONTROL hardware codename "${codename}" (sp field)! Response: ${response}.`
        )
    }

    @test()
    protected static async connectsBleDuringDetection() {
        this.fakeControlResponse(this.instance, this.gen2ControlResponse)

        await this.instance.detectModel()

        assert.isEqual(
            FakeBleController.numCallsToConnect,
            1,
            'Detection should connect the BLE device once!'
        )
    }

    @test()
    protected static async usesNamePrefixWhenNoBleUuidProvided() {
        const instance = (await MuseModelDetector.Create()) as SpyMuseDetector
        this.fakeControlResponse(instance, this.gen2ControlResponse)

        await instance.detectModel()

        const calls = FakeBleController.callsToConstructor
        const call = calls[calls.length - 1]

        assert.isEqualDeep(
            {
                deviceNamePrefix: call?.deviceNamePrefix,
                deviceUuid: call?.deviceUuid,
            },
            {
                deviceNamePrefix: 'Muse',
                deviceUuid: undefined,
            },
            'Should fall back to a Muse name prefix when no bleUuid is passed!'
        )
    }

    @test()
    protected static async readControlResponseWritesV6AndReturnsReply() {
        this.instance.getControlBuffer().text = this.gen2ControlResponse

        const response = await this.instance.callReadControlResponse()

        assert.isEqual(
            response,
            this.gen2ControlResponse,
            'Did not return the CONTROL reply!'
        )

        assert.isEqualDeep(
            FakeBleController.callsToWriteCharacteristic.find(
                (c) => c.value === 'v6'
            ),
            this.generateCmd('v6'),
            "Did not write the 'v6' identify command to the CONTROL char!"
        )
    }

    @test()
    protected static async readControlResponseResendsV6UntilReplyArrives() {
        const ble = this.instance.getBle() as FakeBleController
        const controlBuffer = this.instance.getControlBuffer()

        let v6Writes = 0
        ble.writeCharacteristic = async (_charUuid: string, value: string) => {
            if (value === 'v6') {
                v6Writes += 1
                if (v6Writes >= 3) {
                    controlBuffer.text = this.gen2ControlResponse
                }
            }
        }

        const response = await this.instance.callReadControlResponse()

        assert.isEqual(
            response,
            this.gen2ControlResponse,
            'Did not return the reply once it finally arrived!'
        )

        assert.isAbove(
            v6Writes,
            1,
            'Should re-send v6 when the device does not reply to the first attempt!'
        )
    }

    @test()
    protected static async readControlResponseGivesUpWhenDeviceNeverReplies() {
        const ble = this.instance.getBle() as FakeBleController

        let v6Writes = 0
        ble.writeCharacteristic = async (_charUuid: string, value: string) => {
            if (value === 'v6') {
                v6Writes += 1
            }
        }

        const response = await this.instance.callReadControlResponse()

        assert.isEqual(
            response,
            '',
            'Should return an empty reply when the device never responds!'
        )

        assert.isAbove(
            v6Writes,
            1,
            'Should re-send v6 several times before giving up!'
        )
    }

    @test()
    protected static async exposesDetectModelHelperFunction() {
        MuseModelDetector.Class = FakeMuseDetector

        await detectModel(this.deviceUuid)

        assert.isEqualDeep(
            FakeMuseDetector.callsToConstructor[0]?.ble.uuid,
            this.deviceUuid,
            'Did not create detector with correct uuid!'
        )

        assert.isEqual(
            FakeMuseDetector.numCallsToDetectModel,
            1,
            'Did not expose detectModel helper function!'
        )
    }

    private static async assertDetectsModel(
        controlResponse: string,
        expectedModel: string
    ) {
        this.fakeControlResponse(this.instance, controlResponse)

        const model = await this.instance.detectModel()

        assert.isEqual(
            model,
            expectedModel,
            `Did not detect ${expectedModel} from the CONTROL response!`
        )
    }

    private static fakeControlResponse(
        instance: SpyMuseDetector,
        response: string
    ) {
        instance.setReadControlResponse(async () => response)
    }

    private static generateCmd(value: string) {
        return {
            characteristicUuid: CONTROL_UUID,
            value,
        }
    }

    private static async MuseModelDetector() {
        return (await MuseModelDetector.Create(
            this.deviceUuid
        )) as SpyMuseDetector
    }
}
