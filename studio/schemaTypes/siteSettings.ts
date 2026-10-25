import {defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'about',
      title: 'About',
      type: 'text',
      rows: 16,
      description: 'The statement on the homepage. Leave a blank line between paragraphs.',
    }),
    defineField({
      name: 'email',
      title: 'Contact email',
      type: 'string',
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram handle',
      type: 'string',
      description: 'Without the @.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {prepare: () => ({title: 'Site Settings'})},
})
