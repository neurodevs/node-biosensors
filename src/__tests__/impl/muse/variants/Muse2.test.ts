import { test } from '@neurodevs/node-tdd'

import MuseBleVariantTest from '../../../MuseBlevVariantTest.js'
import { MuseDeviceModel } from '../../../../impl/muse/MuseDeviceController.js'

export default class Muse2Test extends MuseBleVariantTest {
    protected static readonly model: MuseDeviceModel = 'Muse 2'
    protected static readonly charUuids = this.charUuids4ChEeg
    protected static readonly eegCharNames = [
        'EEG_TP10',
        'EEG_AF8',
        'EEG_TP9',
        'EEG_AF7',
    ]
    protected static readonly startPreset = 'p51'

    @test()
    protected static async createsBleDeviceController() {
        await this.assertCreatesBleController()
    }

    @test()
    protected static async exposesStreamQueries() {
        await this.assertExposesStreamQueries()
    }

    @test()
    protected static async startStreamingWritesMuse2CommandsToControlChar() {
        await this.assertStartStreamingWritesStartCommands()
    }

    @test()
    protected static async startStreamingDoesNotWriteCharsIfStreaming() {
        await this.assertStartStreamingDoesNotWriteCharsIfStreaming()
    }

    @test()
    protected static async onDataPushesEegSamplesToOutlet() {
        await this.assertPushesEegSamplesToOutlet()
    }

    @test()
    protected static async onDataScalesEegSamplesToMicrovolts() {
        await this.assertScalesEegSamplesToMicrovolts()
    }

    @test()
    protected static async onDataLogsEegSamplesOnceChunkIsFormed() {
        await this.assertLogsEegSamplesOnceChunkIsFormed()
    }

    @test()
    protected static async onDataWritesEegSamplesToWriteStreamOnceChunkIsFormed() {
        await this.assertWritesEegSamplesToWriteStreamOnceChunkIsFormed()
    }

    @test()
    protected static async onDataPushesPpgSamplesToOutlet() {
        await this.assertPushesPpgSamplesToOutlet()
    }

    @test()
    protected static async onDataLogsPpgSamplesOnceChunkIsFormed() {
        await this.assertLogsPpgSamplesOnceChunkIsFormed()
    }

    @test()
    protected static async onDataWritesPpgSamplesToWriteStreamOnceChunkIsFormed() {
        await this.assertWritesPpgSamplesToWriteStreamOnceChunkIsFormed()
    }

    @test()
    protected static async onDataPushesGyroSamplesToOutlet() {
        await this.assertPushesGyroSamplesToOutlet()
    }

    @test()
    protected static async onDataScalesGyroSamples() {
        await this.assertScalesGyroSamples()
    }

    @test()
    protected static async onDataLogsGyroSamplesOncePacketIsReceived() {
        await this.assertLogsGyroSamplesOncePacketIsReceived()
    }

    @test()
    protected static async onDataWritesGyroSamplesToWriteStream() {
        await this.assertWritesGyroSamplesToWriteStream()
    }

    @test()
    protected static async onDataPushesAccelSamplesToOutlet() {
        await this.assertPushesAccelSamplesToOutlet()
    }

    @test()
    protected static async onDataScalesAccelSamples() {
        await this.assertScalesAccelSamples()
    }

    @test()
    protected static async onDataLogsAccelSamplesOncePacketIsReceived() {
        await this.assertLogsAccelSamplesOncePacketIsReceived()
    }

    @test()
    protected static async onDataWritesAccelSamplesToWriteStream() {
        await this.assertWritesAccelSamplesToWriteStream()
    }

    @test()
    protected static async createsEegLslOutlet() {
        await this.assertCreatesEegLslOutlet()
    }

    @test()
    protected static async doesNotCreateEegLslOutletWithFlag() {
        await this.assertDoesNotCreateEegLslOutletWithFlag()
    }

    @test()
    protected static async createsPpgLslOutlet() {
        await this.assertCreatesPpgLslOutlet()
    }

    @test()
    protected static async doesNotCreatePpgLslOutletWithFlag() {
        await this.assertDoesNotCreatePpgLslOutletWithFlag()
    }

    @test()
    protected static async createsGyroscopeLslOutlet() {
        await this.assertCreatesGyroscopeLslOutlet()
    }

    @test()
    protected static async doesNotCreateGyroscopeLslOutletWithFlag() {
        await this.assertDoesNotCreateGyroscopeLslOutletWithFlag()
    }

    @test()
    protected static async createsAccelerometerLslOutlet() {
        await this.assertCreatesAccelerometerLslOutlet()
    }

    @test()
    protected static async doesNotCreateAccelerometerLslOutletWithFlag() {
        await this.assertDoesNotCreateAccelerometerLslOutletWithFlag()
    }

    @test()
    protected static async createsEegClockRegressor() {
        await this.assertCreatesEegClockRegressor()
    }

    @test()
    protected static async createsPpgClockRegressor() {
        await this.assertCreatesPpgClockRegressor()
    }

    @test()
    protected static async createsGyroClockRegressor() {
        await this.assertCreatesGyroClockRegressor()
    }

    @test()
    protected static async createsAccelClockRegressor() {
        await this.assertCreatesAccelClockRegressor()
    }

    @test()
    protected static async onDataCallsEegClockRegressorDeriveTimestamps() {
        await this.assertCallsDeriveTimestampsOnEegRegressor()
    }

    @test()
    protected static async onDataCallsPpgClockRegressorDeriveTimestamps() {
        await this.assertCallsDeriveTimestampsOnPpgRegressor()
    }

    @test()
    protected static async onDataCallsGyroClockRegressorDeriveTimestamps() {
        await this.assertCallsDeriveTimestampsOnGyroRegressor()
    }

    @test()
    protected static async onDataCallsAccelClockRegressorDeriveTimestamps() {
        await this.assertCallsDeriveTimestampsOnAccelRegressor()
    }

    @test()
    protected static async disableEegIgnoresAllEegData() {
        await this.assertDisableEegIgnoresAllEegData()
    }

    @test()
    protected static async disablePpgIgnoresAllPpgData() {
        await this.assertDisablePpgIgnoresAllPpgData()
    }

    @test()
    protected static async disableGyroIgnoresAllGyroData() {
        await this.assertDisableGyroIgnoresAllGyroData()
    }

    @test()
    protected static async disableAccelIgnoresAllAccelData() {
        await this.assertDisableAccelIgnoresAllAccelData()
    }
}
