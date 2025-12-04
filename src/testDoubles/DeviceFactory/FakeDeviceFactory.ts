import { FakeXdfRecorder } from '@neurodevs/node-xdf'

import {
    DeviceFactory,
    DeviceName,
    PerDeviceOptions,
    DeviceSpecification,
    SessionOptions,
    SingleDeviceBundle,
    MultipleDeviceBundle,
} from '../../impl/BiosensorDeviceFactory.js'
import FakeDeviceStreamer from '../DeviceStreamer/FakeDeviceStreamer.js'
import FakeWebSocketGateway from '../WebSocketGateway/FakeWebSocketGateway.js'

export default class FakeDeviceFactory implements DeviceFactory {
    public static numCallsToConstructor = 0

    public static callsToCreateDevice: {
        deviceName: DeviceName
        deviceOptions?: PerDeviceOptions
    }[] = []

    public static callsToCreateDevices: {
        deviceSpecifications: DeviceSpecification[]
        sessionOptions?: SessionOptions
    }[] = []

    public static fakeDevice = new FakeDeviceStreamer()
    public static fakeRecorder = new FakeXdfRecorder()
    public static fakeGateway = new FakeWebSocketGateway()

    public constructor() {
        FakeDeviceFactory.numCallsToConstructor++
    }

    public async createDevice(
        deviceName: DeviceName,
        deviceOptions?: PerDeviceOptions
    ) {
        FakeDeviceFactory.callsToCreateDevice.push({
            deviceName,
            deviceOptions,
        })

        const { xdfRecordPath, webSocketPortStart } = deviceOptions ?? {}

        const bundle: SingleDeviceBundle = { device: this.fakeDevice }

        if (xdfRecordPath) {
            bundle.recorder = this.fakeRecorder
        }

        if (webSocketPortStart) {
            bundle.gateway = this.fakeGateway
        }

        return bundle
    }

    public async createDevices(
        deviceSpecifications: DeviceSpecification[],
        sessionOptions?: SessionOptions
    ) {
        FakeDeviceFactory.callsToCreateDevices.push({
            deviceSpecifications,
            sessionOptions,
        })

        const { xdfRecordPath, webSocketPortStart } = sessionOptions ?? {}

        const createdBundles = await Promise.all(
            deviceSpecifications.map((device) =>
                this.createDevice(device.deviceName)
            )
        )

        const createdDevices = createdBundles.map(({ device }) => device)

        const bundle: MultipleDeviceBundle = { devices: createdDevices }

        if (xdfRecordPath) {
            bundle.recorder = this.fakeRecorder
        }

        if (webSocketPortStart) {
            bundle.gateway = this.fakeGateway
        }

        return bundle
    }

    public get fakeDevice() {
        return FakeDeviceFactory.fakeDevice
    }

    public get fakeRecorder() {
        return FakeDeviceFactory.fakeRecorder
    }

    public get fakeGateway() {
        return FakeDeviceFactory.fakeGateway
    }

    public static resetTestDouble() {
        FakeDeviceFactory.numCallsToConstructor = 0
        FakeDeviceFactory.callsToCreateDevice = []
        FakeDeviceFactory.callsToCreateDevices = []
    }
}
