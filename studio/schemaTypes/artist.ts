import {UserIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {instagramHandle} from './shared'

export const artist = defineType({
  name: 'artist',
  title: 'Artist',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      description: 'As the artist writes it.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'For the index. Press "Generate".',
      options: {source: 'name', maxLength: 80},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'bio',
      type: 'richText',
      title: 'Bio (beside the name)',
      description:
        'One or two lines beside the artist’s name at the start of their chapter: "lorem, 1991. lives in ipsum." The links to their website and instagram follow it.',
    }),
    defineField({
      name: 'about',
      type: 'richText',
      title: 'About (after their works)',
      description: 'Optional. A short paragraph after the last of their works, in their own words or ours.',
    }),
    defineField({
      name: 'website',
      type: 'url',
      description: 'Optional. The full address: https://…',
      validation: (r) => r.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'instagram',
      type: 'string',
      description: 'Optional. The handle ("loremipsum") or the profile’s address; either works.',
      validation: (r) => r.custom(instagramHandle),
    }),
  ],
  orderings: [{title: 'Name', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]}],
  preview: {select: {title: 'name'}},
})
