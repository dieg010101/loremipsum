import {CalendarIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType, type Tool} from 'sanity'
import {Today} from './Today'

export const todayTool: Tool = {name: 'today', title: 'Today', icon: CalendarIcon, component: Today}

export const WHEN = [
  {title: 'Before it opens', value: 'before'},
  {title: 'When it opens', value: 'opening'},
  {title: 'While it’s on', value: 'during'},
  {title: 'When it closes', value: 'closing'},
]

// the checklist on the "Today" tab: one list for every exhibition, written here, ticked
// there. kept in one private document ("today.checklist": a dot in the id keeps it out of
// the public dataset), edited live, without drafts, so a tick and an edit never collide.
export const todayChecklist = defineType({
  name: 'todayChecklist',
  title: 'Checklist',
  type: 'document',
  liveEdit: true,
  fields: [
    defineField({
      name: 'items',
      title: 'The list',
      description:
        'What to do for every exhibition, in order. Add, change, drag or delete; the Today tab follows.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'item',
          fields: [
            defineField({name: 'text', type: 'string', validation: (r) => r.required()}),
            defineField({
              name: 'when',
              type: 'string',
              options: {list: WHEN, layout: 'radio', direction: 'horizontal'},
              initialValue: 'before',
            }),
            defineField({name: 'link', type: 'url', description: 'Optional: where to do it.'}),
          ],
          preview: {
            select: {title: 'text', when: 'when'},
            prepare: ({title, when}) => ({
              title,
              subtitle: WHEN.find((w) => w.value === when)?.title,
            }),
          },
        }),
      ],
    }),
    defineField({name: 'sheetUrl', title: 'The Google Sheet', type: 'url'}),
    defineField({
      name: 'for',
      title: 'This round is for exhibition',
      type: 'number',
      readOnly: true,
      description: 'Set by “start a new round” on the Today tab.',
    }),
    defineField({name: 'done', type: 'array', of: [{type: 'string'}], hidden: true}),
  ],
  preview: {prepare: () => ({title: 'Checklist'})},
})
