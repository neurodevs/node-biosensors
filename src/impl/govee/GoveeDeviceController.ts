import { ChannelFormat } from '@neurodevs/ndx-native'
import {
    BleAdvertisement,
    BleObserver,
    BleObserverController,
    LslOutlet,
    LslStreamOutlet,
} from '@neurodevs/node-lsl'
import { XdfRecorder, XdfStreamRecorder } from '@neurodevs/node-xdf'

import {
    DeviceControllerBle,
    DeviceControllerOptions,
} from '../BiosensorDeviceFactory.js'
import AbstractDeviceController from '../abstract/AbstractDeviceController.js'

export default class GoveeDeviceController
    extends AbstractDeviceController
    implements DeviceControllerBle
{
    public static Class?: GoveeControllerConstructor
    public static log = console

    protected readonly observer: BleObserver
    protected readonly deviceUuid: string
    protected readonly temperatureUnits: temperatureUnits
    protected readonly temperatureOutlet: LslOutlet
    protected readonly humidityOutlet: LslOutlet
    protected readonly batteryOutlet: LslOutlet

    private readonly goveeCompanyId = 60552

    private readonly degreesSymbols: Record<temperatureUnits, string> = {
        Celsius: '°C',
        Fahrenheit: '°F',
        Kelvin: 'K',
    }

    protected constructor(options: GoveeControllerConstructorOptions) {
        const {
            deviceUuid,
            recorder,
            temperatureUnits,
            temperatureOutlet,
            humidityOutlet,
            batteryOutlet,
        } = options

        super(recorder)

        this.deviceUuid = deviceUuid
        this.temperatureUnits = temperatureUnits ?? 'Celsius'
        this.temperatureOutlet = temperatureOutlet
        this.humidityOutlet = humidityOutlet
        this.batteryOutlet = batteryOutlet

        this.observer = this.BleObserverController()
    }

    public static async Create(options: GoveeControllerOptions) {
        const { deviceUuid, xdfRecordPath, temperatureUnits } = options

        const temperatureOutlet = await this.TemperatureOutlet(temperatureUnits)
        const humidityOutlet = await this.HumidityOutlet()
        const batteryOutlet = await this.BatteryOutlet()

        const recorder = xdfRecordPath
            ? await this.XdfStreamRecorder(xdfRecordPath)
            : undefined

        return new (this.Class ?? this)({
            deviceUuid,
            recorder,
            temperatureUnits,
            temperatureOutlet,
            humidityOutlet,
            batteryOutlet,
        })
    }

    protected async handleConnect() {
        await this.observer.startObserving()
    }

    protected async handleDisconnect() {
        await this.observer.stopObserving()
    }

    protected async handleStartStreaming() {}

    protected async handleStopStreaming() {}

    public get streamQueries() {
        return []
    }

    protected get deviceId() {
        return this.deviceUuid
    }

    public get bleUuid() {
        return this.deviceUuid
    }

    public get bleName() {
        return ''
    }

    private BleObserverController() {
        return BleObserverController.Create({
            deviceUuid: this.deviceUuid,
            onAdvertisement: (advertisement: BleAdvertisement) => {
                this.handleAdvertisement(advertisement)
            },
        })
    }

    protected handleAdvertisement(advertisement: BleAdvertisement) {
        if (!this.isStreaming) {
            return
        }

        const { companyId, manufacturerData, timestampSec } = advertisement

        if (companyId !== this.goveeCompanyId) {
            return
        }

        const { temperature, humidity, battery } = this.decode(manufacturerData)

        this.log.info(
            `[${timestampSec}] temperature: ${temperature}${this.degreesSymbol}, humidity: ${humidity}%, battery: ${battery}%`
        )
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

    private get log() {
        return GoveeDeviceController.log
    }

    private static async TemperatureOutlet(units?: temperatureUnits) {
        return await LslStreamOutlet.Create({
            ...this.sharedOutletOptions,
            sourceId: 'govee-temperature',
            name: 'Govee Temperature',
            type: 'Temperature',
            channelNames: ['Temperature'],
            units: units ?? 'Celsius',
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

    private static readonly sharedOutletOptions = {
        sampleRateHz: 0,
        channelFormat: 'float32' as ChannelFormat,
        manufacturer: 'Govee',
        chunkSize: 1,
    }

    public static async XdfStreamRecorder(xdfRecordPath: string) {
        return await XdfStreamRecorder.Create(xdfRecordPath, [])
    }
}

export type GoveeControllerConstructor = new (
    options: GoveeControllerConstructorOptions
) => DeviceControllerBle

export interface GoveeControllerConstructorOptions {
    deviceUuid: string
    recorder?: XdfRecorder
    temperatureUnits?: temperatureUnits
    temperatureOutlet: LslOutlet
    humidityOutlet: LslOutlet
    batteryOutlet: LslOutlet
}

export interface GoveeControllerOptions extends DeviceControllerOptions {
    deviceUuid: string
    temperatureUnits?: temperatureUnits
}

export type temperatureUnits = 'Celsius' | 'Fahrenheit' | 'Kelvin'
