import {defineArrayMember, defineField, defineType} from 'sanity'

// one document per show, for its whole life: announced, on view, then archive.
// the site works out upcoming / on view / past from the dates.
export const exhibition = defineType({
  name: 'exhibition',
  title: 'Exhibition',
  type: 'document',
  groups: [
    {name: 'facts', title: 'Facts', default: true},
    {name: 'content', title: 'Concept & images'},
    {name: 'works', title: 'Works & programs'},
    {name: 'press', title: 'Press & archive'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'facts',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      group: 'facts',
      validation: (rule) => rule.required().integer(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'facts',
      options: {source: (doc) => `${doc.title ?? ''} ${doc.year ?? ''}`, maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'openingDate',
      title: 'Opening date',
      type: 'date',
      group: 'facts',
      description: 'Leave empty until the dates are set.',
    }),
    defineField({
      name: 'closingDate',
      title: 'Closing date',
      type: 'date',
      group: 'facts',
      description: 'The show becomes "past" the day after this date.',
      validation: (rule) =>
        rule.custom((closing, {document}) => {
          const opening = document?.openingDate as string | undefined
          if (closing && opening && closing < opening)
            return 'Closing date is before the opening date.'
          return true
        }),
    }),
    defineField({
      name: 'datesNote',
      title: 'Dates note',
      type: 'string',
      group: 'facts',
      description:
        'Shown while the dates are not set, e.g. "opening march 2026. exact dates soon."',
    }),
    defineField({
      name: 'venue',
      title: 'Venue name',
      type: 'string',
      group: 'facts',
      description: 'Leave empty to show "to be announced".',
    }),
    defineField({name: 'address', title: 'Street address', type: 'string', group: 'facts'}),
    defineField({name: 'city', title: 'City', type: 'string', group: 'facts'}),
    defineField({
      name: 'hours',
      title: 'Hours',
      type: 'string',
      group: 'facts',
      description:
        'e.g. "thursday – sunday, 12–6pm. free and open to everyone." Hidden after the show closes.',
    }),
    defineField({
      name: 'inviteUrl',
      title: 'Invite link',
      type: 'url',
      group: 'facts',
      description: 'RSVP or invite page. Hidden after the show closes.',
    }),
    defineField({
      name: 'concept',
      title: 'Concept',
      type: 'text',
      rows: 12,
      group: 'content',
      description: 'Leave a blank line between paragraphs.',
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{type: 'captionedImage'}],
      group: 'content',
      description:
        'The poster before opening, installation views once it is up. The first image is used on cards and share previews.',
    }),
    defineField({
      name: 'works',
      title: 'Works',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'work'}]})],
      group: 'works',
      description: 'Drag to set the order. Add each work as its artist is revealed.',
    }),
    defineField({
      name: 'worksNote',
      title: 'Works note',
      type: 'string',
      group: 'works',
      description:
        'Shown while there are no works yet, e.g. "artists are announced one at a time. first reveal: [date]."',
    }),
    defineField({
      name: 'programs',
      title: 'Programs',
      type: 'array',
      group: 'works',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'program',
          fields: [
            defineField({
              name: 'when',
              title: 'When',
              type: 'string',
              description: 'e.g. "march 12, 7pm" or "throughout".',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'what',
              title: 'What',
              type: 'string',
              description: 'e.g. "guest lecture · speaker name".',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'recordingUrl',
              title: 'Recording link',
              type: 'url',
              description: 'Add after it happens.',
            }),
            defineField({
              name: 'recordingLabel',
              title: 'Recording label',
              type: 'string',
              initialValue: 'recording',
              options: {list: ['recording', 'video']},
            }),
          ],
          preview: {select: {title: 'what', subtitle: 'when'}},
        }),
      ],
    }),
    defineField({name: 'pressRelease', title: 'Press release (pdf)', type: 'file', group: 'press'}),
    defineField({name: 'pressKit', title: 'Press kit (zip)', type: 'file', group: 'press'}),
    defineField({
      name: 'coverage',
      title: 'Coverage',
      type: 'array',
      group: 'press',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'article',
          fields: [
            defineField({
              name: 'publication',
              title: 'Publication',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'title',
              title: 'Article title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'Link',
              type: 'url',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {select: {title: 'title', subtitle: 'publication'}},
        }),
      ],
    }),
    defineField({
      name: 'photoCredit',
      title: 'Documentation credit',
      type: 'string',
      group: 'press',
      description: 'e.g. "installation photography by name." Shown after the show closes.',
    }),
    defineField({
      name: 'photoArchive',
      title: 'Installation photos (zip)',
      type: 'file',
      group: 'press',
    }),
  ],
  orderings: [
    {
      title: 'Opening date, newest',
      name: 'openingDesc',
      by: [{field: 'openingDate', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title', year: 'year', opening: 'openingDate', media: 'images.0.image'},
    prepare: ({title, year, opening, media}) => ({
      title: `${title ?? ''}${year ? ` (${year})` : ''}`,
      subtitle: opening ? `opens ${opening}` : 'dates not set',
      media,
    }),
  },
})
