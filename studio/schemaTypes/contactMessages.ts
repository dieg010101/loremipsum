import {defineType} from 'sanity'

export default defineType({
  name: 'contactMessage',
  title: 'Contact Message',
  type: 'document',
  fields: [
    {name: 'name', title: 'Name', type: 'string', validation: (r) => r.required()},
    {name: 'email', title: 'Email', type: 'string', validation: (r) => r.required()},
    {name: 'business', title: 'Business', type: 'string'},
    {name: 'bizDesc', title: 'Business Description', type: 'text', validation: (r) => r.required()},
    {name: 'projDesc', title: 'Project Description', type: 'text', validation: (r) => r.required()},
    {name: 'createdAt', title: 'Created at', type: 'datetime', readOnly: true},
  ],
})
