import {defineArrayMember, defineField, defineType} from 'sanity'

const fields = [
  defineField({name: 'intro', type: 'richText'}),
  defineField({
    name: 'sections',
    type: 'array',
    of: [
      defineArrayMember({
        type: 'object',
        name: 'section',
        fields: [
          defineField({name: 'heading', type: 'string', validation: (r) => r.required()}),
          defineField({name: 'body', type: 'richText'}),
        ],
        preview: {select: {title: 'heading'}},
      }),
    ],
  }),
]

// singletons, edited at a fixed id ("aboutPage", "privacyPage").
export const aboutPage = defineType({name: 'aboutPage', title: 'About', type: 'document', fields, preview: {prepare: () => ({title: 'About'})}})
export const privacyPage = defineType({name: 'privacyPage', title: 'Privacy', type: 'document', fields, preview: {prepare: () => ({title: 'Privacy'})}})
