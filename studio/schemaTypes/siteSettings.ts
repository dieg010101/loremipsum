import {CogIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {instagramHandle} from './shared'

// everything here has a sensible default on the site, so nothing but the email is required.
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'email',
      type: 'string',
      description: 'In the footer, and where the contact form says to write.',
      validation: (r) => r.required().email(),
    }),
    defineField({
      name: 'instagram',
      type: 'string',
      description: 'The handle, with or without the @.',
      validation: (r) => r.custom(instagramHandle),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 2,
      description: 'The footer line, and what search engines show.',
      validation: (r) => r.max(200).warning('Search engines cut it off after about 160 characters.'),
    }),
    defineField({name: 'shortDescription', type: 'text', rows: 2, description: 'The footer line on phones.'}),
    defineField({name: 'storeIntro', type: 'text', rows: 2, title: 'Webstore intro'}),
    defineField({name: 'shipsFrom', type: 'string', title: 'Ships from', description: '"ships from lorem, in two weeks."'}),
    defineField({name: 'shipping', type: 'richText', title: 'Shipping and returns'}),
    defineField({name: 'moneySplit', type: 'richText', title: 'Where the money goes'}),
    defineField({name: 'journalIntro', type: 'text', rows: 2}),
    defineField({name: 'contactAside', type: 'richText', title: 'Contact page aside'}),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})
