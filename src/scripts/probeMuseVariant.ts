import { writeFileSync } from 'node:fs'

import koffi from 'koffi'
import { BleDeviceController } from '@neurodevs/node-lsl'

/*
 * Muse variant auto-detection probe.
 *
 * The native BLE layer only exposes two things we can use to tell variants
 * apart: the advertised device NAME, and whatever the device replies with on
 * the CONTROL characteristic when we send it a status/version command. (There
 * is no GATT service/characteristic enumeration and no generic read exposed.)
 *
 * This script connects to each known headset, records the advertised name, and
 * sends a sequence of read-only control commands ('h', 'v1', 's', 'v6'),
 * capturing the JSON the device streams back on the CONTROL characteristic.
 *
 * Run it with all three headsets powered on and compare the output to decide
 * which field reliably establishes the model. Results are also written to
 * ./artifacts/muse_variant_probe.json for easy sharing.
 */

const CONTROL_UUID = '273E0001-4C4D-454D-96BE-F03BAC821358'

// Known headsets (from runMuseEnsemble.ts). The `expectedModel` label is only
// so we can line the probe output up against ground truth — it is NOT used for
// detection. Edit these UUIDs to match your devices.
const DEVICES = [
    {
        expectedModel: 'Muse S Gen 2',
        bleUuid: 'CA6A61B7-B7A8-AF24-3C9E-04A6A5012554',
    },
    {
        expectedModel: 'Muse S Athena',
        bleUuid: 'F57439F1-3287-71B4-2251-F15797949214',
    },
    {
        expectedModel: 'Muse 2',
        bleUuid: 'F868B42C-FA67-F9CA-BC95-76269D21C38F',
    },
]

// Read-only query commands. 'h' halts any streaming and nudges the device into
// control mode; 'v1'/'s'/'v6' ask for version/status/firmware info.
const PROBE_COMMANDS = ['h', 'v1', 's', 'v6']

// How long to wait for the fragmented CONTROL reply after each command.
const REPLY_WAIT_MS = 800

interface CommandResult {
    command: string
    raw: string
    parsed?: unknown
}

interface DeviceReport {
    expectedModel: string
    bleUuid: string
    advertisedName?: string
    commands: CommandResult[]
    error?: string
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// CONTROL replies arrive as a series of notifications. Each notification is a
// length-prefixed ASCII fragment: byte[0] = fragment length, followed by that
// many ASCII characters. Fragments concatenate into the JSON blob.
function decodeControlFragment(data: Buffer, length: number) {
    const bytes = Array.from<number>(koffi.decode(data, 'uint8', length))

    if (bytes.length === 0) {
        return ''
    }

    const fragmentLength = Math.min(bytes[0]!, bytes.length - 1)
    const asciiBytes = bytes.slice(1, 1 + fragmentLength)

    return String.fromCharCode(...asciiBytes)
}

function tryParseJson(raw: string) {
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')

    if (start === -1 || end === -1 || end < start) {
        return undefined
    }

    try {
        return JSON.parse(raw.slice(start, end + 1))
    } catch {
        return undefined
    }
}

async function probeDevice(device: {
    expectedModel: string
    bleUuid: string
}): Promise<DeviceReport> {
    const report: DeviceReport = {
        expectedModel: device.expectedModel,
        bleUuid: device.bleUuid,
        commands: [],
    }

    // Accumulates decoded CONTROL fragments for the command currently in flight.
    let controlBuffer = ''

    console.info(
        `\n=== Probing ${device.expectedModel} (${device.bleUuid}) ===`
    )

    let ble
    try {
        ble = await BleDeviceController.Create({
            deviceUuid: device.bleUuid,
            charCallbacks: [
                {
                    charUuid: CONTROL_UUID,
                    charName: 'CONTROL',
                    onData: (data: Buffer, length: number) => {
                        controlBuffer += decodeControlFragment(data, length)
                    },
                },
            ],
        })

        await ble.connect()

        report.advertisedName = ble.name
        console.info(`Advertised name: ${ble.name}`)
        console.info(`UUID: ${ble.uuid}`)

        for (const command of PROBE_COMMANDS) {
            controlBuffer = ''
            await ble.writeCharacteristic(CONTROL_UUID, command)
            await wait(REPLY_WAIT_MS)

            const raw = controlBuffer
            const parsed = tryParseJson(raw)

            report.commands.push({ command, raw, parsed })

            console.info(
                `  [${command}] -> ${
                    parsed ? JSON.stringify(parsed) : JSON.stringify(raw)
                }`
            )
        }
    } catch (error) {
        report.error = (error as Error).message
        console.error(`  Error probing device: ${report.error}`)
    } finally {
        try {
            await ble?.disconnect()
        } catch {
            // ignore disconnect errors during probing
        }
    }

    return report
}

const reports: DeviceReport[] = []

for (const device of DEVICES) {
    reports.push(await probeDevice(device))
}

const outputPath = './artifacts/muse_variant_probe.json'
writeFileSync(outputPath, JSON.stringify(reports, null, 2))

console.info('\n=== Summary (advertised name per model) ===')
for (const report of reports) {
    console.info(
        `${report.expectedModel.padEnd(14)} | name: ${
            report.advertisedName ?? '(none)'
        }`
    )
}

console.info(`\nFull probe written to ${outputPath}`)
console.info('Done!\n')
