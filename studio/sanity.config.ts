import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import contactMessages from './schemaTypes/contactMessages'

export default defineConfig({
  name: 'default',
  title: 'Lorem Ipsum',

  projectId: 'd6hlyvrq',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
