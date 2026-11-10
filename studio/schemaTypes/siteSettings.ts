import {CogIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {instagramHandle} from './shared'

// everything here has a sensible default on the site, so nothing but the email is required.
// one tab per place on the site, so each field is where you'd look for it.
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'footer', title: 'Footer (every page)', default: true},
    {name: 'webstore', title: 'Webstore'},
    {name: 'letters', title: 'Letters'},
    {name: 'contact', title: 'Contact'},
  ],
  fields: [
    defineField({
      name: 'email',
      group: 'footer',
      type: 'string',
      description: 'In the footer, and where the contact form says to write.',
      validation: (r) => r.required().email(),
    }),
    defineField({
      name: 'instagram',
      group: 'footer',
      type: 'string',
      description: 'The handle, with or without the @.',
      validation: (r) => r.custom(instagramHandle),
    }),
    defineField({
      name: 'description',
      group: 'footer',
      type: 'text',
      rows: 2,
      description: 'The footer line, and what search engines show.',
      validation: (r) => r.max(200).warning('Search engines cut it off after about 160 characters.'),
    }),
    defineField({name: 'shortDescription', type: 'text', rows: 2, group: 'footer', description: 'The footer line on phones.'}),
    defineField({name: 'storeIntro', type: 'text', rows: 2, group: 'webstore', title: 'Webstore intro', description: 'Under "webstore" at the top of the webstore.'}),
    defineField({name: 'shipsFrom', type: 'string', group: 'webstore', title: 'Ships from', description: 'Under the buy button on every item: "ships from lorem, in two weeks."'}),
    defineField({name: 'moneySplit', type: 'richText', group: 'webstore', title: 'Where the money goes', description: 'On every item, under what you’re buying.'}),
    defineField({name: 'shipping', type: 'richText', group: 'webstore', title: 'Shipping and returns', description: 'On every item, last.'}),
    defineField({name: 'journalIntro', type: 'text', rows: 2, group: 'letters', title: 'Letters intro', description: 'Under "letters" at the top of the letters page.'}),
    defineField({name: 'contactAside', type: 'richText', group: 'contact', title: 'Beside the contact form'}),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})
