import {CalendarIcon} from '@sanity/icons'
import {defineField, defineType, type Tool} from 'sanity'
import {Today} from './Today'

export const todayTool: Tool = {name: 'today', title: 'Today', icon: CalendarIcon, component: Today}

// where the "Today" tab notes which wayback copies have been made. it has no place in
// the content list; the tab writes it.
export const todayChecklist = defineType({
  name: 'todayChecklist',
  title: 'Today checklist',
  type: 'document',
  fields: [
    defineField({
      name: 'wayback',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'saved',
          fields: [
            defineField({name: 'number', type: 'number'}),
            defineField({name: 'step', type: 'string'}),
            defineField({name: 'at', type: 'datetime'}),
          ],
        },
      ],
    }),
  ],
})
