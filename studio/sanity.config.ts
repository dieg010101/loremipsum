import {defineConfig, isDev} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {preview} from './presentation'
import {todayChecklist, todayTool} from './today'

import deskStructure, {singletonTypes} from './deskStructure'

export default defineConfig({
  name: 'default',
  title: 'Lorem Ipsum',
  projectId: 'd6hlyvrq',
  dataset: 'production',
  // Today first: what's on and what's left to do. Vision (raw queries) only when
  // running the studio locally.
  tools: (prev) => [todayTool, ...prev],
  plugins: [structureTool({structure: deskStructure}), preview, ...(isDev ? [visionTool()] : [])],
  schema: {
    types: [...schemaTypes, todayChecklist],
  },
  document: {
    newDocumentOptions: (prev) => prev.filter((t) => !singletonTypes.has(t.templateId) && t.templateId !== 'todayChecklist'),
    actions: (prev, {schemaType}) => {
      if (singletonTypes.has(schemaType))
        return prev.filter(
          ({action}) => action === 'publish' || action === 'discardChanges' || action === 'restore',
        )
      return prev
    },
  },
})
