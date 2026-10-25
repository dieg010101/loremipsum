import type {StructureResolver} from 'sanity/structure'

export const singletonTypes = new Set(['siteSettings', 'journalPage'])

const journalTypeIds = [
  'journalSubstack',
  'journalBook',
  'journalEssay',
  'journalBlog',
  'journalPage',
]

const singleton = (S: Parameters<StructureResolver>[0], type: string, title: string) =>
  S.listItem()
    .title(title)
    .schemaType(type)
    .child(S.editor().id(type).schemaType(type).documentId(type))

const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('exhibition').title('Exhibitions'),
      S.documentTypeListItem('work').title('Works'),
      S.documentTypeListItem('artist').title('Artists'),
      S.divider(),
      S.listItem()
        .title('Journal')
        .child(
          S.list()
            .title('Journal')
            .items([
              singleton(S, 'journalPage', 'Journal Page (singleton)'),
              S.divider(),
              S.documentTypeListItem('journalSubstack').title('Substack Items'),
              S.documentTypeListItem('journalBook').title('Book/Story/Poetry Items'),
              S.documentTypeListItem('journalEssay').title('Essay/Conversation Items'),
              S.documentTypeListItem('journalBlog').title('Blog Items'),
            ]),
        ),
      S.documentTypeListItem('contactMessage').title('Contact Messages'),
      S.divider(),
      singleton(S, 'siteSettings', 'Site Settings'),
      ...S.documentTypeListItems().filter(
        (li) =>
          ![
            'exhibition',
            'work',
            'artist',
            'contactMessage',
            'siteSettings',
            ...journalTypeIds,
          ].includes(li.getId()!),
      ),
    ])

export default deskStructure
