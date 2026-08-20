import { ChannelFormat } from '@neurodevs/ndx-native'
import {
    BleAdvertisement,
    BleObserver,
    BleObserverController,
    LslOutlet,
    LslStreamOutlet,
} from '@neurodevs/node-lsl'
import { WriteStream } from 'node:fs'

import { XdfRecorder } from '@neurodevs/node-xdf'

import { DeviceControllerBle, DeviceControllerOptions } from '../types.js'
import AbstractDeviceController from '../abstract/AbstractDeviceController.js'
import { LogLevel } from '../types.js'

export default class GoveeDeviceController
    extends AbstractDeviceController
    implements DeviceControllerBle
{
    public static Class?: GoveeControllerConstructor

    private static readonly streamQueries = [
        'type="Temperature"',
        'type="Humidity"',
        'type="Battery"',
    ]

    private static readonly sharedOutletOptions = {
        sampleRateHz: 0,
        channelFormat: 'float32' as ChannelFormat,
        manufacturer: 'Govee',
        chunkSize: 1,
    }

    protected observer!: BleObserver

    protected readonly deviceUuid: string
    protected readonly temperatureUnits: TemperatureUnits
    protected readonly temperatureOutlet: LslOutlet
    protected readonly humidityOutlet: LslOutlet
    protected readonly batteryOutlet: LslOutlet

    private readonly goveeCompanyId = 60552

    private readonly degreesSymbols: Record<TemperatureUnits, string> = {
        Celsius: '°C',
        Fahrenheit: '°F',
        Kelvin: 'K',
    }

    private localName?: string

    protected constructor(options: GoveeControllerConstructorOptions) {
        const {
            deviceUuid,
            recorder,
            txtStream,
            logLevel,
            temperatureUnits,
            temperatureOutlet,
            humidityOutlet,
            batteryOutlet,
        } = options

        super(recorder, txtStream, logLevel)

        this.deviceUuid = deviceUuid
        this.temperatureUnits = temperatureUnits
        this.temperatureOutlet = temperatureOutlet
        this.humidityOutlet = humidityOutlet
        this.batteryOutlet = batteryOutlet
    }

    public static async Create(options: GoveeControllerOptions) {
        const {
            deviceUuid,
            xdfRecordPath,
            txtRecordPath,
            logLevel,
            temperatureUnits = 'Celsius',
        } = options

        const temperatureOutlet = await this.TemperatureOutlet(temperatureUnits)
        const humidityOutlet = await this.HumidityOutlet()
        const batteryOutlet = await this.BatteryOutlet()

        const recorder = await this.XdfStreamRecorder(
            xdfRecordPath,
            this.streamQueries
        )

        const txtStream = this.TxtRecordStream(txtRecordPath)

        return new (this.Class ?? this)({
            deviceUuid,
            recorder,
            txtStream,
            logLevel,
            temperatureUnits,
            temperatureOutlet,
            humidityOutlet,
            batteryOutlet,
        })
    }

    protected async handleConnect() {
        this.observer = this.BleObserverController()
        await this.observer.startObserving()
    }

    protected async handleDisconnect() {
        await this.observer.stopObserving()
    }

    protected async handleStartStreaming() {}

    protected async handleStopStreaming() {}

    public get outlets() {
        return [this.temperatureOutlet, this.humidityOutlet, this.batteryOutlet]
    }

    public get streamQueries() {
        return GoveeDeviceController.streamQueries
    }

    protected get deviceId() {
        return this.deviceUuid
    }

    public get bleUuid() {
        return this.deviceUuid
    }

    public get bleName() {
        return this.localName ?? 'N/A'
    }

    protected handleAdvertisement(advertisement: BleAdvertisement) {
        if (!this.isStreaming) {
            return
        }

        const { companyId } = advertisement

        if (companyId !== this.goveeCompanyId) {
            return
        }

        const { manufacturerData, timestampSec, localName } = advertisement
        const { temperature, humidity, battery } = this.decode(manufacturerData)

        this.localName ??= localName

        this.temperatureOutlet.pushSample([temperature], timestampSec)
        this.humidityOutlet.pushSample([humidity], timestampSec)
        this.batteryOutlet.pushSample([battery], timestampSec)

        const message = `[${timestampSec}] temperature: ${temperature}${this.degreesSymbol}, humidity: ${humidity}%, battery: ${battery}%`

        this.writeTxt(message)
        this.logInfo(message)
    }

    private decode(manufacturerData: string) {
        const bytes = Buffer.from(manufacturerData, 'hex')

        return {
            temperature: this.toTemperatureUnits(bytes.readInt16LE(3) / 100),
            humidity: bytes.readUInt16LE(5) / 100,
            battery: bytes.readUInt8(7),
        }
    }

    private toTemperatureUnits(celsius: number): number {
        if (this.temperatureUnits === 'Fahrenheit') {
            return this.round(celsius * (9 / 5) + 32)
        }
        if (this.temperatureUnits === 'Kelvin') {
            return this.round(celsius + 273.15)
        }
        return celsius
    }

    private round(temperature: number) {
        return Math.round(temperature * 100) / 100
    }

    private get degreesSymbol() {
        return this.degreesSymbols[this.temperatureUnits]
    }

    private BleObserverController() {
        return BleObserverController.Create({
            deviceUuid: this.deviceUuid,
            onAdvertisement: (advertisement: BleAdvertisement) => {
                this.handleAdvertisement(advertisement)
            },
        })
    }

    private static async TemperatureOutlet(units: TemperatureUnits) {
        return await LslStreamOutlet.Create({
            ...this.sharedOutletOptions,
            sourceId: 'govee-temperature',
            name: 'Govee Temperature',
            type: 'Temperature',
            channelNames: ['Temperature'],
            units,
        })
    }

    private static async HumidityOutlet() {
        return await LslStreamOutlet.Create({
            ...this.sharedOutletOptions,
            sourceId: 'govee-humidity',
            name: 'Govee Humidity',
            type: 'Humidity',
            channelNames: ['Humidity'],
            units: 'percent',
        })
    }

    private static async BatteryOutlet() {
        return await LslStreamOutlet.Create({
            ...this.sharedOutletOptions,
            sourceId: 'govee-battery',
            name: 'Govee Battery',
            type: 'Battery',
            channelNames: ['Battery'],
            units: 'percent',
        })
    }
}

export interface GoveeControllerOptions extends DeviceControllerOptions {
    deviceUuid: string
    temperatureUnits?: TemperatureUnits
}

export type GoveeControllerConstructor = new (
    options: GoveeControllerConstructorOptions
) => DeviceControllerBle

export interface GoveeControllerConstructorOptions {
    deviceUuid: string
    temperatureUnits: TemperatureUnits
    temperatureOutlet: LslOutlet
    humidityOutlet: LslOutlet
    batteryOutlet: LslOutlet
    recorder?: XdfRecorder
    logLevel?: LogLevel
    txtStream?: WriteStream
}

export type TemperatureUnits = 'Celsius' | 'Fahrenheit' | 'Kelvin'
