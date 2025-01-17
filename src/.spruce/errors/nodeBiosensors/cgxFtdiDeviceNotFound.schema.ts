import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const cgxFtdiDeviceNotFoundSchema: SpruceErrors.NodeBiosensors.CgxFtdiDeviceNotFoundSchema  = {
	id: 'cgxFtdiDeviceNotFound',
	namespace: 'NodeBiosensors',
	name: 'CGX_FTDI_DEVICE_NOT_FOUND',
	    fields: {
	    }
}

SchemaRegistry.getInstance().trackSchema(cgxFtdiDeviceNotFoundSchema)

export default cgxFtdiDeviceNotFoundSchema
