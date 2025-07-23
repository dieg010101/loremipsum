import {defineField, defineType} from 'sanity'
export const portfolioImage = defineType({
  name: 'portfolioImage',
  title: 'Project image',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Image description (optional)',
      type: 'string',
    }),
  ],
})
export const portfolioPost = defineType({
  name: 'portfolioPost',
  title: 'Portfolio post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Project date',
      type: 'date',
      options: {dateFormat: 'YYYY'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Thumbnail / cover image',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Project images',
      type: 'array',
      of: [{type: 'portfolioImage'}],
      validation: (rule) => rule.min(1).required(),
    }),
    defineField({name: 'client', type: 'string'}),
    defineField({name: 'medium', type: 'string'}),
    defineField({name: 'dimensions', type: 'string'}),
    defineField({name: 'credit', type: 'string'}),
    defineField({
      name: 'description',
      title: 'Project description',
      type: 'text',
      rows: 5,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'coverImage',
      subtitle: 'date',
    },
    prepare({title, media, subtitle}) {
      return {title, media, subtitle}
    },
  },
})
