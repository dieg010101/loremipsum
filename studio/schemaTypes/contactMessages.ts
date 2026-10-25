import {defineType} from 'sanity'

export default defineType({
  name: 'contactMessage',
  title: 'Contact Message',
  type: 'document',
  fields: [
    {
      name: 'topic',
      title: 'Topic',
      type: 'string',
      options: {list: ['general', 'press', 'sales', 'artists']},
    },
    {name: 'regarding', title: 'Regarding', type: 'string'},
    {name: 'name', title: 'Name', type: 'string', validation: (r) => r.required()},
    {name: 'email', title: 'Email', type: 'string', validation: (r) => r.required().email()},
    {name: 'message', title: 'Message', type: 'text', validation: (r) => r.required()},
    {name: 'createdAt', title: 'Created at', type: 'datetime', readOnly: true},
  ],
  orderings: [
    {title: 'Newest', name: 'createdDesc', by: [{field: 'createdAt', direction: 'desc'}]},
  ],
  preview: {select: {title: 'name', subtitle: 'topic'}},
})
