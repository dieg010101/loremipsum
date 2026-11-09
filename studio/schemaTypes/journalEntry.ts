import {defineArrayMember, defineField, defineType} from 'sanity'

const KINDS = [
  {title: 'Letter (to everyone who follows us, written here)', value: 'letter'},
  {title: 'Essay (written here)', value: 'essay'},
  {title: 'Conversation (written here)', value: 'conversation'},
  {title: 'Press (a link to something written about us)', value: 'press'},
  {title: 'PDF', value: 'pdf'},
]

const isHere = (kind?: string) => kind === 'letter' || kind === 'essay' || kind === 'conversation'
// older entries saved as "substack" are links too, and show as press.
const isLink = (kind?: string) => kind === 'press' || kind === 'substack'

export const journalEntry = defineType({
  name: 'journalEntry',
  title: 'Letter or press',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}, validation: (r) => r.required()}),
    defineField({name: 'date', type: 'date', validation: (r) => r.required()}),
    defineField({name: 'kind', type: 'string', options: {list: KINDS, layout: 'radio'}, initialValue: 'letter', validation: (r) => r.required()}),
    defineField({name: 'author', type: 'string'}),
    defineField({
      name: 'href',
      type: 'url',
      title: 'Link',
      hidden: ({parent}) => !isLink(parent?.kind),
      validation: (r) =>
        r.custom((v, {parent}) => (isLink((parent as {kind?: string})?.kind) && !v ? 'Add the address of the piece.' : true)),
    }),
    defineField({
      name: 'file',
      type: 'file',
      options: {accept: 'application/pdf'},
      hidden: ({parent}) => parent?.kind !== 'pdf',
      validation: (r) =>
        r.custom((v, {parent}) => ((parent as {kind?: string})?.kind === 'pdf' && !v ? 'Upload the pdf.' : true)),
    }),
    defineField({name: 'byline', type: 'richText', hidden: ({parent}) => !isHere(parent?.kind)}),
    defineField({
      name: 'paragraphs',
      type: 'array',
      of: [defineArrayMember({type: 'noted'})],
      hidden: ({parent}) => !isHere(parent?.kind),
    }),
  ],
  orderings: [{title: 'Newest', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
  preview: {select: {title: 'title', subtitle: 'kind', date: 'date'}, prepare: ({title, subtitle, date}) => ({title, subtitle: [date, subtitle].filter(Boolean).join(' · ')})},
})
