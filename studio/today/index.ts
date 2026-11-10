import {CalendarIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType, type Tool} from 'sanity'
import {Today} from './Today'

export const todayTool: Tool = {name: 'today', title: 'Today', icon: CalendarIcon, component: Today}

// what the "Today" tab remembers, in one private document ("today.checklist": a dot in
// the id keeps it out of the public dataset). not in the content list: the tab and the
// wayback action write it.
export const todayChecklist = defineType({
  name: 'todayChecklist',
  title: 'Today checklist',
  type: 'document',
  fields: [
    defineField({name: 'sheetUrl', title: 'The Google Sheet', type: 'url'}),
    defineField({
      name: 'ticks',
      description: 'What you ticked: one per exhibition and item.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tick',
          fields: [
            defineField({name: 'number', type: 'number'}),
            defineField({name: 'item', type: 'string'}),
            defineField({name: 'at', type: 'datetime'}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'wayback',
      description: 'Each run of the wayback action.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'saved',
          fields: [
            defineField({name: 'number', type: 'number'}),
            defineField({name: 'step', type: 'string', options: {list: ['opened', 'closed']}}),
            defineField({name: 'at', type: 'datetime'}),
            defineField({name: 'saved', type: 'number'}),
            defineField({name: 'failed', type: 'array', of: [{type: 'string'}]}),
            defineField({name: 'run', type: 'url'}),
          ],
        }),
      ],
    }),
  ],
})
