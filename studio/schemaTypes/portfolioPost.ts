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
      title: 'Image description',
      type: 'string',
    }),
    defineField({
      name: 'imageType',
      title: 'Image variant',
      type: 'string',
      options: {
        layout: 'radio',
        list: [
          {title: '3:4 Vertical', value: 'default'},
          {title: '16:9 Website desktop view', value: 'websiteDesktop'},
          {title: '3:4 Website movile view', value: 'websiteMobile'},
        ],
      },
      hidden: ({document}) => !document?.isWebsite,
    }),
  ],
})

export const portfolioPost = defineType({
  name: 'portfolioPost',
  title: 'Portfolio post',
  type: 'document',
  fields: [
    defineField({
      name: 'isWebsite',
      title: 'Website project',
      type: 'boolean',
      initialValue: false,
      description:
        'Please make sure that you check this box if it is a website or else the formatting will be off.',
    }),

    defineField({
      name: 'pinned',
      title: 'Show on landing',
      type: 'boolean',
      initialValue: false,
      description:
        'Toggle ON to feature this project on the landing page. Order is set in “Pinned Posts Order”.',
    }),

    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
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
      title: 'Cover image',
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

    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'category'}],
          options: {disableNew: false},
        },
      ],
      options: {layout: 'tags'},
      description:
        'Pick an existing category or create a new one (e.g., “logos”, “packaging”, “apparel”).',
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
    select: {title: 'title', media: 'coverImage', subtitle: 'date'},
    prepare({title, media, subtitle}) {
      return {title, media, subtitle}
    },
  },
})

export const pinnedOrder = defineType({
  name: 'pinnedOrder',
  title: 'Pinned Posts Order',
  type: 'document',
  fields: [
    defineField({
      name: 'pinnedPosts',
      title: 'Pinned posts (drag to reorder)',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'portfolioPost'}],
          // filter MUST be on the reference member:
          options: {filter: 'pinned == true'},
        },
      ],
      description: 'Add to pin. Drag to set landing-page order.',
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Pinned Posts Order',
        subtitle: 'Controls the landing page membership + order',
      }
    },
  },
})
