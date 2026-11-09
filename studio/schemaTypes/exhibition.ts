import {CalendarIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

const opened = (doc: unknown) => {
  const opens = (doc as {opens?: string} | undefined)?.opens
  return Boolean(opens && new Date(opens) <= new Date())
}

export const exhibition = defineType({
  name: 'exhibition',
  title: 'Exhibition',
  type: 'document',
  icon: CalendarIcon,
  groups: [
    {name: 'exhibition', title: 'Exhibition', default: true},
    {name: 'works', title: 'Artists and works'},
    {name: 'end', title: 'End of the exhibition'},
  ],
  fields: [
    defineField({
      name: 'number',
      type: 'number',
      group: 'exhibition',
      description: 'Its address: /exhibitions/14. Numbers go in order of opening.',
      validation: (r) =>
        r
          .required()
          .integer()
          .min(1)
          .custom(async (number, {document, getClient}) => {
            if (!number) return true
            const id = (document?._id ?? '').replace(/^drafts\./, '')
            const taken = await getClient({apiVersion: '2025-02-19'}).fetch<number>(
              `count(*[_type == "exhibition" && number == $number && !(_id in [$id, "drafts." + $id])])`,
              {number, id},
            )
            return taken ? `Exhibition ${number} already exists.` : true
          }),
    }),
    defineField({name: 'title', type: 'string', group: 'exhibition', validation: (r) => r.required()}),
    defineField({
      name: 'opens',
      type: 'datetime',
      group: 'exhibition',
      description:
        'The moment it goes up, in your own time zone. Before then it shows as announced, with "tell me when it opens".',
      options: {timeStep: 15},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'newFor',
      type: 'number',
      group: 'exhibition',
      title: 'New for (days)',
      description: '"day 6 of 30". It stays open after that, for good.',
      initialValue: 30,
      validation: (r) => r.required().integer().min(1).max(365),
    }),
    defineField({
      name: 'summary',
      type: 'string',
      group: 'exhibition',
      description: 'For the home page sentence: "paintings, prints, an essay, a video, a tape, a book and a website".',
    }),
    defineField({
      name: 'withLines',
      type: 'text',
      rows: 3,
      group: 'exhibition',
      title: 'With (facts row)',
      description: '"8 artists, 12 works:" and the media, one line each.',
    }),
    defineField({name: 'organisedBy', type: 'richText', group: 'exhibition', title: 'Organised by'}),
    defineField({name: 'languages', type: 'richText', group: 'exhibition'}),
    defineField({
      name: 'text',
      type: 'richText',
      group: 'exhibition',
      title: 'Exhibition text',
      validation: (r) =>
        r.custom((v, {document}) =>
          opened(document) && !(v as unknown[] | undefined)?.length ? 'It’s open: add the text people read first.' : true,
        ).warning(),
    }),
    defineField({name: 'signature', type: 'string', group: 'exhibition', description: '"lorem ipsum, november 2026"'}),
    defineField({
      name: 'announcedWith',
      type: 'text',
      rows: 3,
      group: 'exhibition',
      title: 'Announced with',
      description: 'Before it opens: who is in it, written out.',
    }),
    defineField({
      name: 'credit',
      type: 'string',
      group: 'exhibition',
      description: 'How the list of exhibitions credits it, when the artists’ names alone don’t say it right.',
    }),

    defineField({
      name: 'chapters',
      type: 'array',
      group: 'works',
      description:
        'One chapter per artist, in order. Works are numbered 1.1, 1.2, 2.1… An announced exhibition can wait for these.',
      validation: (r) =>
        r.custom((chapters, {document}) => {
          const list = (chapters ?? []) as {artist?: {_ref?: string}}[]
          if (opened(document) && list.length === 0) return 'It has opened with no works. Add a chapter, or move the date.'
          const artists = list.map((c) => c.artist?._ref).filter(Boolean)
          return new Set(artists).size === artists.length ? true : 'An artist has two chapters; put their works in one.'
        }),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'chapter',
          fields: [
            defineField({name: 'artist', type: 'reference', to: [{type: 'artist'}], validation: (r) => r.required()}),
            defineField({
              name: 'works',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'reference',
                  to: [{type: 'work'}],
                  options: {filter: ({parent}) => ({filter: 'artist._ref == $a', params: {a: (parent as {artist?: {_ref?: string}})?.artist?._ref ?? ''}})},
                }),
              ],
              description: 'Only this artist’s works are offered. Make the work first under "Works", or with "Create new".',
              validation: (r) => r.required().min(1).unique(),
            }),
          ],
          preview: {
            select: {title: 'artist.name', works: 'works'},
            prepare: ({title, works}) => ({title, subtitle: `${works?.length ?? 0} works`}),
          },
        }),
      ],
    }),

    defineField({
      name: 'files',
      type: 'object',
      group: 'end',
      title: 'Take it with you',
      fields: [
        defineField({name: 'pdf', type: 'pagedFile', title: 'The exhibition as a pdf', options: {accept: 'application/pdf'}}),
        defineField({
          name: 'zip',
          type: 'pagedFile',
          title: 'Everything, as a zip',
          description: 'Optional. Without it, the visitor’s browser makes the zip from the files.',
          options: {accept: '.zip,application/zip'},
        }),
        defineField({name: 'pressRelease', type: 'pagedFile', title: 'Press release', options: {accept: 'application/pdf'}}),
        defineField({name: 'list', type: 'pagedFile', title: 'List of works', options: {accept: 'application/pdf'}}),
      ],
    }),
    defineField({
      name: 'colophon',
      type: 'object',
      group: 'end',
      fields: [
        defineField({name: 'translations', type: 'text', rows: 3, description: 'One per line: "dolor sitamet, italiano → english".'}),
        defineField({name: 'images', type: 'text', rows: 3}),
        defineField({name: 'thanks', type: 'text', rows: 3}),
        defineField({name: 'press', type: 'richText', description: 'One link per line.'}),
      ],
    }),
  ],
  orderings: [{title: 'Number', name: 'numberDesc', by: [{field: 'number', direction: 'desc'}]}],
  preview: {
    select: {number: 'number', title: 'title', opens: 'opens'},
    prepare: ({number, title, opens}) => ({
      title: `${number ?? '?'}. ${title ?? ''}`,
      subtitle: opens ? new Date(opens).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'}) : 'no date yet',
    }),
  },
})
