import {defineField, defineType} from 'sanity'

export const journalSubstack = defineType({
  name: 'journalSubstack',
  title: 'Journal | Substack Item',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'url', title: 'URL', type: 'url', validation: (r) => r.required()}),
  ],
  preview: {select: {title: 'title'}},
})

export const journalBook = defineType({
  name: 'journalBook',
  title: 'Journal | Book/Story/Poetry Item',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'url', title: 'URL', type: 'url', validation: (r) => r.required()}),
  ],
  preview: {select: {title: 'title'}},
})

export const journalEssay = defineType({
  name: 'journalEssay',
  title: 'Journal | Essay/Conversation Item',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'url', title: 'URL', type: 'url', validation: (r) => r.required()}),
  ],
  preview: {select: {title: 'title'}},
})

export const journalBlog = defineType({
  name: 'journalBlog',
  title: 'Journal | Blog Item',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'url', title: 'URL', type: 'url', validation: (r) => r.required()}),
  ],
  preview: {select: {title: 'title'}},
})

function excludeTakenFor(fieldName: 'substack' | 'books' | 'essays' | 'blogs') {
  return {
    filter: async ({document, getClient}: any) => {
      const apiVersion = '2023-10-01'
      const client = getClient({apiVersion})
      const baseId = (document?._id || 'journalPage').replace(/^drafts\./, '')
      const draftId = `drafts.${baseId}`
      const pubId = baseId
      const data = await client.fetch(
        `{
          "d": *[_id == $draftId][0].${fieldName}[]._ref,
          "p": *[_id == $pubId][0].${fieldName}[]._ref
        }`,
        {draftId, pubId},
      )
      const taken = Array.from(new Set([...(data?.d ?? []), ...(data?.p ?? [])]))
      return taken.length
        ? {filter: '!(_id in $taken)', params: {taken}}
        : {filter: '_type match "*"'}
    },
  }
}

export const journalPage = defineType({
  name: 'journalPage',
  title: 'Journal Page',
  type: 'document',
  fields: [
    defineField({
      name: 'intro',
      title: 'Intro (optional)',
      type: 'text',
      rows: 3,
    }),

    defineField({
      name: 'substack',
      title: 'Substack Articles',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'journalSubstack'}],
          options: excludeTakenFor('substack'),
        },
      ],
      description: 'Drag to reorder',
    }),

    defineField({
      name: 'books',
      title: 'Books/Short Stories/Poetry',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'journalBook'}],
          options: excludeTakenFor('books'),
        },
      ],
      description: 'Drag to reorder',
    }),

    defineField({
      name: 'essays',
      title: 'Essays & Conversations',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'journalEssay'}],
          options: excludeTakenFor('essays'),
        },
      ],
      description: 'Drag to reorder',
    }),

    defineField({
      name: 'blogs',
      title: 'Blogs',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'journalBlog'}],
          options: excludeTakenFor('blogs'),
        },
      ],
      description: 'Drag to reorder',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Journal Page', subtitle: 'Controls sections + order'}
    },
  },
})
