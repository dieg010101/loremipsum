import type {StructureResolver} from 'sanity/structure'

// one of each, at a fixed id the site asks for.
export const singletonTypes = new Set(['siteSettings', 'aboutPage', 'privacyPage'])

const singleton = (S: Parameters<StructureResolver>[0], type: string, title: string) =>
  S.listItem().title(title).schemaType(type).child(S.editor().id(type).schemaType(type).documentId(type))

// the art and the writing live here. what visitors send (the visitors' book, the
// newsletter, contact messages) lives in the google sheet: see backend/lorem-ipsum.gs.
const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('exhibition').title('Exhibitions'),
      S.documentTypeListItem('work').title('Works'),
      S.documentTypeListItem('artist').title('Artists'),
      S.divider(),
      S.documentTypeListItem('journalEntry').title('Letters'),
      singleton(S, 'aboutPage', 'About'),
      singleton(S, 'privacyPage', 'Privacy'),
      singleton(S, 'siteSettings', 'Site settings'),
    ])

export default deskStructure
