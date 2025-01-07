import FTDI from 'ftdi-d2xx'

const chunkSize = 125
const bytesPerPacket = 75
const totalBytes = chunkSize * bytesPerPacket
const latencyTimerMs = 4

async function openDevice() {
    try {
        const devices = await FTDI.getDeviceInfoList()
        console.log('Devices:', devices)

        if (devices.length !== 1) {
            console.error(
                `Error: You must have ONE device plugged in. Number of devices: ${devices.length}`
            )
        }

        const serialNumber = devices[0].serial_number
        const device = await FTDI.openDevice(serialNumber)
        console.log(`Opened device: ${serialNumber}`)
        console.log('Devices:', devices)

        await setDevice(device, serialNumber)
    } catch (error: any) {
        console.error('Error opening device:', error.message)
    }
}

async function setDevice(device: FTDI.FTDI_Device, serialNumber: string) {
    try {
        const txTimeoutMs = 1000
        const rxTimeoutMs = 1000

        device.setTimeouts(txTimeoutMs, rxTimeoutMs)

        device.purge(FTDI.FT_PURGE_RX)
        console.log('Purged RX buffer to clear previous data')

        device.setFlowControl(FTDI.FT_FLOW_RTS_CTS, 0x11, 0x13)
        console.log(`Flow control (RTS/CTS) set for device: ${serialNumber}`)

        device.setBaudRate(1000000)
        console.log(`Baud rate set to 1,000,000 for device: ${serialNumber}`)

        device.setDataCharacteristics(
            FTDI.FT_BITS_8, // 8 data bits
            FTDI.FT_STOP_BITS_1, // 1 stop bit
            FTDI.FT_PARITY_NONE // No parity
        )
        console.log(`Data characteristics set for device: ${serialNumber}`)

        device.setLatencyTimer(latencyTimerMs)
        console.log(`Latency timer set to 4 ms for device: ${serialNumber}`)

        await readData(device)
    } catch (error: any) {
        console.error('Error setting device parameters:', error.message)
    }
}

async function readData(device: FTDI.FTDI_Device) {
    try {
        console.log('Reading data from device...')

        while (true) {
            const data = await device.read(totalBytes)

            if (data.byteLength > 0) {
                parsePacket(data)
            } else {
                console.log('No data received: timeout or empty buffer!')
            }
        }
    } catch (error: any) {
        console.error('Error reading data:', error.message)
    }
}

function parsePacket(data: Uint8Array) {
    const headerIndex = data.indexOf(0xff)
    if (headerIndex === -1) {
        console.error('No valid packet header found in the received data.')
        return
    }

    if (headerIndex + chunkSize > data.length) {
        console.error('Incomplete packet received.', headerIndex, data.length)
        return
    }

    const packet = data.slice(headerIndex, headerIndex + 75)
    console.log('Valid packet found:', data)

    const packetCounter = packet[1]
    console.log('Packet Counter:', packetCounter)

    const eegData = []

    for (let i = 0; i < 20; i++) {
        const msb = packet[2 + i * 3]
        const lsb2 = packet[3 + i * 3]
        const lsb1 = packet[4 + i * 3]
        const rawValue = (msb << 24) | (lsb2 << 17) | (lsb1 << 10)
        const eegValue = rawValue * (5.0 / 3.0) * (1.0 / Math.pow(2, 32)) // Convert to volts
        eegData.push(eegValue)
    }
    console.log('CGX Quick-20r EEG Data:', eegData)

    const accelData = []

    for (let i = 0; i < 3; i++) {
        const msb = packet[62 + i * 3]
        const lsb2 = packet[63 + i * 3]
        const lsb1 = packet[64 + i * 3]
        const rawValue = (msb << 24) | (lsb2 << 17) | (lsb1 << 10)
        const accValue = rawValue * 2.5 * (1.0 / Math.pow(2, 32)) // Convert to volts
        accelData.push(accValue)
    }
    console.log('Accelerometer Data:', accelData)

    const impedance = packet[69]
    console.log('Impedance Status:', impedance)

    const battery = packet[70] * (5.0 / 128.0)
    console.log('Battery Voltage:', battery)

    const trigger = (packet[71] << 8) | packet[72]
    console.log('Trigger Value:', trigger)
}

openDevice().catch(console.error)
