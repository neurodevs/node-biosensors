import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'





export declare namespace SpruceErrors.NodeBiosensors {

	
	export interface CgxFtdiDeviceNotFound {
		
	}

	export interface CgxFtdiDeviceNotFoundSchema extends SpruceSchema.Schema {
		id: 'cgxFtdiDeviceNotFound',
		namespace: 'NodeBiosensors',
		name: 'CGX_FTDI_DEVICE_NOT_FOUND',
		    fields: {
		    }
	}

	export type CgxFtdiDeviceNotFoundEntity = SchemaEntity<SpruceErrors.NodeBiosensors.CgxFtdiDeviceNotFoundSchema>

}




