import {map} from 'rxjs'
import {defineDocuments, defineLocations, presentationTool, type DocumentLocationResolver} from 'sanity/presentation'

// the "Preview" tab: the site beside the editor, with drafts in it. the site lets
// only this studio in (see site/src/lib/server/preview.ts).

/** the site the preview tab shows. `SANITY_STUDIO_PREVIEW_URL=http://localhost:5173` for a local site. */
export const SITE_URL = process.env.SANITY_STUDIO_PREVIEW_URL || 'https://loremipsum-49z.pages.dev'

// "used on": where a document shows up on the site, worked out live from the content.
const usedOn =
  (query: string, toLocations: (row: any) => {title: string; href: string}[]): DocumentLocationResolver =>
  ({id}, {documentStore}) =>
    documentStore
      .listenQuery(query, {id: id.replace(/^drafts\./, '')}, {perspective: 'drafts'})
      .pipe(map((row: any) => ({locations: row ? toLocations(row) : []})))

const exhibitionsOf = `*[_type == "exhibition" && defined(number) && references($id)] | order(opens desc){number, title}`

export const preview = presentationTool({
  title: 'Preview',
  previewUrl: {
    initial: SITE_URL,
    previewMode: {enable: '/preview/enable'},
  },
  allowOrigins: ['https://loremipsum-49z.pages.dev', 'https://*.loremipsum-49z.pages.dev', 'http://localhost:*'],
  resolve: {
    // the page you're on opens its document beside it.
    mainDocuments: defineDocuments([
      {route: '/', filter: `_id == "homePage"`},
      {route: '/about', filter: `_id == "aboutPage"`},
      {route: '/privacy', filter: `_id == "privacyPage"`},
      {route: '/exhibitions/:n', filter: `_type == "exhibition" && string(number) == $n`},
      {route: '/exhibitions/:n/:w', filter: `_type == "exhibition" && string(number) == $n`},
      {route: '/webstore/:slug', filter: `_type == "work" && store.slug.current == $slug`},
      {route: '/letters/:slug', filter: `_type == "journalEntry" && slug.current == $slug`},
    ]),
    locations: {
      homePage: {locations: [{title: 'Home', href: '/'}]},
      aboutPage: {locations: [{title: 'About', href: '/about'}]},
      privacyPage: {locations: [{title: 'Privacy', href: '/privacy'}]},
      siteSettings: {message: 'Shown in the footer of every page, and on the webstore, letters and contact pages.', tone: 'caution'},
      exhibition: defineLocations({
        select: {number: 'number', title: 'title'},
        resolve: (doc) =>
          doc?.number
            ? {
                locations: [
                  {title: doc.title || `Exhibition ${doc.number}`, href: `/exhibitions/${doc.number}`},
                  {title: 'Exhibitions (the list)', href: '/exhibitions'},
                  {title: 'Home', href: '/'},
                ],
              }
            : {message: 'Give it a number to see it on the site.', tone: 'caution'},
      }),
      journalEntry: defineLocations({
        select: {title: 'title', slug: 'slug.current'},
        resolve: (doc) =>
          doc?.slug
            ? {locations: [{title: doc.title || 'This letter', href: `/letters/${doc.slug}`}, {title: 'Letters', href: '/letters'}]}
            : null,
      }),
      work: usedOn(
        `*[_id == $id][0]{title, "slug": store.slug.current, "inStore": store.inStore, "in": ${exhibitionsOf}}`,
        (w) => [
          ...(w.in ?? []).map((e: any) => ({title: `In exhibition ${e.number}, ${e.title}`, href: `/exhibitions/${e.number}`})),
          ...(w.inStore && w.slug ? [{title: 'In the webstore', href: `/webstore/${w.slug}`}] : []),
          {title: 'The index', href: '/index'},
        ],
      ),
      artist: usedOn(
        `*[_id == $id][0]{name, "in": ${exhibitionsOf}}`,
        (a) => [
          ...(a.in ?? []).map((e: any) => ({title: `In exhibition ${e.number}, ${e.title}`, href: `/exhibitions/${e.number}`})),
          {title: 'The index', href: `/index?q=${encodeURIComponent(a.name ?? '')}`},
        ],
      ),
    },
  },
})
