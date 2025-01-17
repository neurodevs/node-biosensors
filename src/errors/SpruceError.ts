import BaseSpruceError from '@sprucelabs/error'
import ErrorOptions from '#spruce/errors/options.types'

export default class SpruceError extends BaseSpruceError<ErrorOptions> {
    /** an easy to understand version of the errors */
    public friendlyMessage(): string {
        const { options } = this
        let message
        switch (options?.code) {
            case 'CGX_FTDI_DEVICE_NOT_FOUND':
                message = `
                    \n FTDI device not found for the CGX headset!
                    \n Please make sure the Bluetooth dongle is connected and FTDI D2XX drivers are installed: 
                    \n - https://ftdichip.com/drivers/d2xx-drivers/
                    \n
                `
                break
            default:
                message = super.friendlyMessage()
        }

        const fullMessage = options.friendlyMessage
            ? options.friendlyMessage
            : message

        return fullMessage
    }
}
