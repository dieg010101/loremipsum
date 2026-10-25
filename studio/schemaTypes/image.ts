import {defineField, defineType} from 'sanity'

// an image with its caption, shared by works and exhibitions.
export const captionedImage = defineType({
  name: 'captionedImage',
  title: 'Image',
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
      title: 'Caption',
      type: 'string',
      description:
        'Shown under the image, e.g. "installation view, thinking for way too long (2026). photo: name."',
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'What the image shows, for screen readers. Falls back to the caption.',
    }),
  ],
  preview: {
    select: {title: 'caption', media: 'image'},
  },
})
