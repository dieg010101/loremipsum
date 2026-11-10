import {CalendarIcon, CogIcon, DocumentTextIcon, HomeIcon, ImageIcon} from '@sanity/icons'
import type {StructureBuilder, StructureResolver} from 'sanity/structure'

// one of each, at a fixed id the site asks for.
export const singletonTypes = new Set(['siteSettings', 'homePage', 'aboutPage', 'privacyPage'])

const API = '2025-02-19'

const singleton = (S: StructureBuilder, type: string, title: string, icon?: typeof HomeIcon) =>
  S.listItem().title(title).icon(icon).schemaType(type).child(S.editor().id(type).schemaType(type).documentId(type))

/** a list of exhibitions, newest opening first. */
const exhibitions = (S: StructureBuilder, title: string, filter: string) =>
  S.listItem()
    .title(title)
    .icon(CalendarIcon)
    .child(
      S.documentList()
        .title(title)
        .schemaType('exhibition')
        .apiVersion(API)
        .filter(`_type == "exhibition" && ${filter}`)
        .defaultOrdering([{field: 'opens', direction: 'desc'}]),
    )

// an exhibition moves through its life on its own, by its "opens" date: published
// with a date to come, it's announced; once the date passes (and it has works), it's
// open, the newest open one being the one showing now; when the next one opens, it
// stays open in the list for good. unpublished, nobody sees it.
//
// the art and the writing live here. what visitors send (the visitors' book, the
// newsletter, contact messages) lives in the google sheet: see backend/lorem-ipsum.gs.
const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Exhibitions')
        .icon(CalendarIcon)
        .child(
          S.list()
            .title('Exhibitions')
            .items([
              exhibitions(S, 'Coming up', 'opens > now()'),
              exhibitions(S, 'Open (the top one is showing now)', 'opens <= now()'),
              exhibitions(S, 'No date yet', '!defined(opens)'),
              S.divider(),
              S.documentTypeListItem('exhibition').title('All exhibitions'),
            ]),
        ),
      S.listItem()
        .title('Works')
        .icon(ImageIcon)
        .child(
          S.list()
            .title('Works')
            .items([
              S.listItem()
                .title('By exhibition')
                .icon(CalendarIcon)
                .child(
                  S.documentTypeList('exhibition')
                    .title('By exhibition')
                    .apiVersion(API)
                    .defaultOrdering([{field: 'opens', direction: 'desc'}])
                    .child((id) =>
                      S.documentList()
                        .title('Works in it')
                        .schemaType('work')
                        .apiVersion(API)
                        .filter('_type == "work" && _id in *[_id in [$id, "drafts." + $id]].chapters[].works[]._ref')
                        .params({id: id.replace(/^drafts\./, '')}),
                    ),
                ),
              S.listItem()
                .title('Webstore only (in no exhibition)')
                .icon(ImageIcon)
                .child(
                  S.documentList()
                    .title('Webstore only')
                    .schemaType('work')
                    .apiVersion(API)
                    .filter('_type == "work" && count(*[_type == "exhibition" && references(^._id)]) == 0'),
                ),
              S.divider(),
              S.documentTypeListItem('work').title('All works'),
            ]),
        ),
      S.documentTypeListItem('artist').title('Artists'),
      S.divider(),
      S.documentTypeListItem('journalEntry').title('Letters'),
      S.divider(),
      // the pages, each with its own words.
      singleton(S, 'homePage', 'Home', HomeIcon),
      singleton(S, 'aboutPage', 'About', DocumentTextIcon),
      singleton(S, 'privacyPage', 'Privacy', DocumentTextIcon),
      S.divider(),
      singleton(S, 'siteSettings', 'Site settings (footer, webstore, letters, contact)', CogIcon),
    ])

export default deskStructure
