import {defineField, defineType} from 'sanity'

export const work = defineType({
  name: 'work',
  title: 'Work',
  type: 'document',
  fields: [
    defineField({
      name: 'artist',
      title: 'Artist',
      type: 'reference',
      to: [{type: 'artist'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (rule) => rule.required().integer(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The page address: /works/artist-name-work-title.',
      options: {
        source: async (doc, {getClient}) => {
          const ref = (doc.artist as {_ref?: string} | undefined)?._ref
          const name = ref
            ? await getClient({apiVersion: '2025-02-19'}).fetch('*[_id == $ref][0].name', {ref})
            : ''
          return [name, doc.title].filter(Boolean).join(' ')
        },
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{type: 'captionedImage'}],
      description:
        'The first image is used on cards and the homepage. Add installation photos after the show.',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({name: 'medium', title: 'Medium', type: 'string'}),
    defineField({name: 'dimensions', title: 'Dimensions', type: 'string'}),
    defineField({name: 'credit', title: 'Credit', type: 'string'}),
    defineField({
      name: 'availability',
      title: 'Availability',
      type: 'string',
      initialValue: 'available',
      options: {
        layout: 'radio',
        list: [
          {title: 'Available (shows the inquire button)', value: 'available'},
          {title: 'Sold', value: 'sold'},
          {title: 'Not for sale', value: 'not for sale'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'description', title: 'Description', type: 'text', rows: 6}),
  ],
  preview: {
    select: {title: 'title', year: 'year', artist: 'artist.name', media: 'images.0.image'},
    prepare: ({title, year, artist, media}) => ({
      title: `${title ?? ''}${year ? ` (${year})` : ''}`,
      subtitle: artist,
      media,
    }),
  },
})
