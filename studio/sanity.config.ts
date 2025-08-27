import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

import deskStructure, {singletonTypes} from './deskStructure'

export default defineConfig({
  name: 'default',
  title: 'Lorem Ipsum',
  projectId: 'd6hlyvrq',
  dataset: 'production',
  plugins: [structureTool({structure: deskStructure}), visionTool()],
  schema: {
    types: schemaTypes,
  },
  document: {
    newDocumentOptions: (prev) => prev.filter((t) => !singletonTypes.has(t.templateId)),
    actions: (prev, {schemaType}) =>
      singletonTypes.has(schemaType)
        ? prev.filter(
            ({action}) =>
              action === 'publish' || action === 'discardChanges' || action === 'restore',
          )
        : prev,
  },
})
