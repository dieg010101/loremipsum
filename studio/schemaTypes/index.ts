import {artImage, noted, pagedFile, richText} from './shared'
import {artist} from './artist'
import {work} from './work'
import {exhibition} from './exhibition'
import {journalEntry} from './journalEntry'
import {aboutPage, privacyPage} from './pages'
import {homePage} from './homePage'
import {siteSettings} from './siteSettings'

export const schemaTypes = [
  richText,
  noted,
  artImage,
  pagedFile,
  exhibition,
  work,
  artist,
  journalEntry,
  homePage,
  aboutPage,
  privacyPage,
  siteSettings,
]
