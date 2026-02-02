export default class FakeDeviceFTDI {
    public static callsToSetTimeouts: CallToSetTimeouts[] = []
    public static callsToPurge: number[] = []
    public static callsToSetFlowControl: CallToSetFlowControl[] = []
    public static callsToSetBaudRate: number[] = []
    public static callsToSetDataCharacteristics: CallToSetDataChars[] = []
    public static callsToSetLatencyTimer: number[] = []
    public static callsToRead: number[] = []
    public static callsToWrite: Uint8Array[] = []

    public static fakeReadPackets?: Uint8Array[]

    public currentIdx = 0

    public setTimeouts(txTimeoutMs: number, rxTimeoutMs: number) {
        FakeDeviceFTDI.callsToSetTimeouts.push({ txTimeoutMs, rxTimeoutMs })
    }

    public purge(mask: number) {
        FakeDeviceFTDI.callsToPurge.push(mask)
    }

    public setFlowControl(flowControl: number, xOn: number, xOff: number) {
        FakeDeviceFTDI.callsToSetFlowControl.push({ flowControl, xOn, xOff })
    }

    public setBaudRate(baudRate: number) {
        FakeDeviceFTDI.callsToSetBaudRate.push(baudRate)
    }

    public setDataCharacteristics(
        dataBits: number,
        stopBits: number,
        parity: number
    ) {
        FakeDeviceFTDI.callsToSetDataCharacteristics.push({
            dataBits,
            stopBits,
            parity,
        })
    }

    public setLatencyTimer(latencyTimerMs: number) {
        FakeDeviceFTDI.callsToSetLatencyTimer.push(latencyTimerMs)
    }

    public async read(numBytes: number) {
        if (FakeDeviceFTDI.fakeReadPackets?.[this.currentIdx]) {
            const packet = FakeDeviceFTDI.fakeReadPackets[this.currentIdx++]
            FakeDeviceFTDI.callsToRead.push(numBytes)
            return packet
        } else if (FakeDeviceFTDI.fakeReadPackets) {
            throw new Error('No more packets to read!')
        }

        if (this.currentIdx == 0) {
            FakeDeviceFTDI.callsToRead.push(numBytes)
            this.currentIdx++
            return new Uint8Array(numBytes)
        } else {
            throw new Error('Only sends one packet!')
        }
    }

    public async write(data: Uint8Array) {
        FakeDeviceFTDI.callsToWrite.push(data)
    }

    public static resetTestDouble() {
        FakeDeviceFTDI.callsToSetTimeouts = []
        FakeDeviceFTDI.callsToPurge = []
        FakeDeviceFTDI.callsToSetFlowControl = []
        FakeDeviceFTDI.callsToSetBaudRate = []
        FakeDeviceFTDI.callsToSetDataCharacteristics = []
        FakeDeviceFTDI.callsToSetLatencyTimer = []
        FakeDeviceFTDI.callsToRead = []
        FakeDeviceFTDI.callsToWrite = []
    }
}

export interface CallToSetTimeouts {
    txTimeoutMs: number
    rxTimeoutMs: number
}

export interface CallToSetFlowControl {
    flowControl: number
    xOn: number
    xOff: number
}

export interface CallToSetDataChars {
    dataBits: number
    stopBits: number
    parity: number
}
