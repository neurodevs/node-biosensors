import { SpruceErrors } from "#spruce/errors/errors.types"
import { ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"

export interface CgxFtdiDeviceNotFoundErrorOptions extends SpruceErrors.NodeBiosensors.CgxFtdiDeviceNotFound, ISpruceErrorOptions {
	code: 'CGX_FTDI_DEVICE_NOT_FOUND'
}

type ErrorOptions =  | CgxFtdiDeviceNotFoundErrorOptions 

export default ErrorOptions
