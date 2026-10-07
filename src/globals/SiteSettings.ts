import type { GlobalAfterChangeHook, GlobalConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { revalidateLayout, revalidatePaths } from '@/lib/revalidate'

const afterChange: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  revalidatePaths(['/', '/sangguniang-bayan', '/transparency'], context, payload.logger)
  revalidateLayout(context, payload.logger)
  return doc
}

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: { group: 'Settings' },
  access: { read: anyone, update: authenticated },
  hooks: { afterChange: [afterChange] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [
            {
              name: 'heroSlides',
              type: 'array',
              maxRows: 5,
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                { name: 'heading', type: 'text', required: true, maxLength: 80 },
                { name: 'subheading', type: 'text', maxLength: 160 },
                { name: 'ctaLabel', type: 'text', maxLength: 30 },
                { name: 'ctaHref', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Mayor',
          name: 'mayor',
          fields: [
            { name: 'name', type: 'text' },
            { name: 'photo', type: 'upload', relationTo: 'media' },
            { name: 'message', type: 'richText' },
          ],
        },
        {
          label: 'Vision & Mission',
          name: 'visionMission',
          fields: [
            { name: 'vision', type: 'richText' },
            { name: 'mission', type: 'richText' },
          ],
        },
        {
          label: 'Hotlines',
          name: 'hotlines',
          fields: [
            { type: 'row', fields: [
              { name: 'pnp', type: 'text', label: 'PNP hotline' },
              { name: 'responder', type: 'text', label: 'Emergency responder' },
              { name: 'bfp', type: 'text', label: 'BFP hotline' },
            ] },
            {
              name: 'helplineGroups',
              type: 'array',
              labels: { singular: 'Helpline group', plural: 'Helpline groups' },
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'body', type: 'richText', required: true },
              ],
            },
          ],
        },
        {
          label: 'Facts',
          name: 'facts',
          fields: [
            { type: 'row', fields: [
              { name: 'population', type: 'text' },
              { name: 'areaKm2', type: 'text', label: 'Area (km²)' },
              { name: 'schools', type: 'text' },
              { name: 'hospitals', type: 'text' },
              { name: 'touristVisits', type: 'text' },
            ] },
          ],
        },
        {
          label: 'Links & Contact',
          name: 'links',
          fields: [
            { name: 'facebookUrl', type: 'text' },
            { name: 'email', type: 'email' },
            { name: 'phone', type: 'text' },
            { name: 'address', type: 'textarea' },
            {
              name: 'agencyLinks',
              type: 'array',
              labels: { singular: 'Agency link', plural: 'Agency links' },
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'url', type: 'text', required: true },
                { name: 'logo', type: 'upload', relationTo: 'media', required: true },
              ],
            },
          ],
        },
      ],
    },
  ],
}
