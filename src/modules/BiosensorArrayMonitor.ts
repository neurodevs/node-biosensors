import { LslInletOptions, LslStreamInlet } from '@neurodevs/node-lsl'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { DeviceStreamer } from '../types'
import BiosensorStreamViewer from '../ui/BiosensorStreamViewer'

export default class BiosensorArrayMonitor implements ArrayMonitor {
    public static Class?: ArrayMonitorConstructor

    protected constructor() {}

    public static Create(devices: DeviceStreamer[]) {
        this.createLslInlets(devices)
        this.renderStreamViewer()

        return new (this.Class ?? this)()
    }

    private static createLslInlets(devices: DeviceStreamer[]) {
        devices.flatMap((device) => {
            return device.outlets.map((outlet) => {
                return this.LslStreamInlet({
                    sampleRate: outlet.sampleRate,
                    channelNames: outlet.channelNames,
                    channelFormat: outlet.channelFormat,
                    chunkSize: outlet.chunkSize,
                    maxBuffered: outlet.maxBuffered,
                })
            })
        })
    }

    private static renderStreamViewer() {
        ReactDOMServer.renderToStaticMarkup(
            React.createElement(ViewerComponent)
        )
    }

    private static LslStreamInlet(options: LslInletOptions) {
        return LslStreamInlet.Create(options)
    }
}

export interface ArrayMonitor {}

export type ArrayMonitorConstructor = new () => ArrayMonitor

// For test doubles

export let ViewerComponent = BiosensorStreamViewer

export function setViewerComponent(component: React.FC) {
    ViewerComponent = component
}
