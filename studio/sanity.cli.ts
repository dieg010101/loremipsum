import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  studioHost: 'loremipsumcms',
  api: {
    projectId: 'd6hlyvrq',
    dataset: 'production'
  },
  // the studio lives at https://loremipsumcms.sanity.studio: npx sanity deploy.
  deployment: {appId: 'of2yp4bz0jt0gxncb4wismw4', autoUpdates: true},
})
