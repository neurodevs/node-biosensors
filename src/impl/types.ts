import { WriteStream } from 'node:fs'

import { BleGatt, LslOutlet, UsbDevice } from '@neurodevs/node-lsl'
import { XdfRecorder } from '@neurodevs/node-xdf'

export const DEVICE_NAMES = [
    'Cognionics Quick-20r',
    'Govee Thermohygrometer H5074',
    'Muse S Athena',
    'Muse S Gen 2',
    'Muse S Gen 1',
    'Muse 2',
    'Muse 1 Gen 2',
    'OpenBCI Cyton',
    'Zephyr BioHarness 3',
] as const

export type DeviceName = (typeof DEVICE_NAMES)[number]

export interface DeviceController {
    connect(): Promise<void>
    startStreaming(): Promise<void>
    stopStreaming(): Promise<void>
    disconnect(): Promise<void>
    readonly outlets: readonly LslOutlet[]
    readonly streamQueries: readonly string[]
}

export interface DeviceControllerBle extends DeviceController {
    readonly bleUuid: string
    readonly bleName: string
}

export type DeviceControllerOptions<DeviceStream extends string = never> =
    Resolve<{
        xdfRecordPath?: string
        txtRecordPath?: string
        logLevel?: LogLevel
        disableStreams?: readonly DeviceStream[]
    }>

export type DeviceControllerBleOptions<DeviceStream extends string = never> =
    Resolve<
        DeviceControllerOptions<DeviceStream> & {
            bleUuid?: string
            rssiIntervalMs?: number
        }
    >

export interface DeviceControllerConstructorOptions {
    recorder?: XdfRecorder
    txtStream?: WriteStream
    logLevel?: LogLevel
}

export interface DeviceControllerBleConstructorOptions extends DeviceControllerConstructorOptions {
    ble: BleGatt
}

export interface DeviceControllerUsbConstructorOptions extends Omit<
    DeviceControllerConstructorOptions,
    'txtStream'
> {
    usb: UsbDevice
}

export type DeviceControllerConstructor = new (
    options: DeviceControllerConstructorOptions
) => DeviceController

export type DeviceControllerBleConstructor = new (
    options: DeviceControllerBleConstructorOptions
) => DeviceControllerBle

export type Resolve<T> = { [K in keyof T]: T[K] } & {}

export type DeviceState = 'disconnected' | 'connected' | 'streaming'

export type LogLevel = 'silent' | 'warn' | 'info'

export const DEFAULT_LOG_LEVEL = 'warn' satisfies LogLevel
