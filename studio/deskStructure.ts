import type {StructureResolver} from 'sanity/structure'
export const singletonTypes = new Set(['journalPage'])

const journalTypeIds = [
  'journalSubstack',
  'journalBook',
  'journalEssay',
  'journalBlog',
  'journalPage',
]

const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Journal')
        .child(
          S.list()
            .title('Journal')
            .items([
              S.listItem()
                .title('Journal Page (singleton)')
                .schemaType('journalPage')
                .child(
                  S.editor().id('journalPage').schemaType('journalPage').documentId('journalPage'),
                ),
              S.divider(),
              S.documentTypeListItem('journalSubstack').title('Substack Items'),
              S.documentTypeListItem('journalBook').title('Book/Story/Poetry Items'),
              S.documentTypeListItem('journalEssay').title('Essay/Conversation Items'),
              S.documentTypeListItem('journalBlog').title('Blog Items'),
            ]),
        ),

      S.divider(),
      ...S.documentTypeListItems().filter((li) => !journalTypeIds.includes(li.getId()!)),
    ])

export default deskStructure
