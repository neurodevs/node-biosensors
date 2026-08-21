import { WriteStream } from 'node:fs'

import { LslOutlet, BleGatt } from '@neurodevs/node-lsl'
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

export interface DeviceControllerOptions {
    xdfRecordPath?: string
    txtRecordPath?: string
    logLevel?: LogLevel
}

export interface DeviceControllerBleOptions extends DeviceControllerOptions {
    bleUuid?: string
    rssiIntervalMs?: number
}

export type DeviceControllerConstructor = new (
    options?: DeviceControllerOptions
) => DeviceController

export type DeviceControllerBleConstructor = new (
    ble: BleGatt,
    recorder?: XdfRecorder,
    txtStream?: WriteStream,
    logLevel?: LogLevel
) => DeviceControllerBle

export type DeviceState = 'disconnected' | 'connected' | 'streaming'

export type LogLevel = 'silent' | 'warn' | 'info'

export const DEFAULT_LOG_LEVEL = 'warn' satisfies LogLevel
