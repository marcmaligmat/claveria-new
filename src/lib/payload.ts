import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

export async function getPayloadClient(): Promise<Payload> {
  return getPayload({ config: await config })
}
