import {HomeIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

// the words on the home page, in one box: what you write is what the page says.
// the site doesn't add to it or rearrange it.

type Block = {children?: {text?: string}[]}
const plain = (blocks: unknown) =>
  ((blocks ?? []) as Block[]).map((b) => (b.children ?? []).map((c) => c.text ?? '').join('')).join(' ')

export const homePage = defineType({
  name: 'homePage',
  title: 'Home',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'statement',
      type: 'richText',
      title: 'What the home page says',
      description:
        'Exactly as it will read, links and italics included: "lorem ipsum is an online gallery. now showing: thinking for way too long, with …". Select words and use the link button to link them. Left empty, the site writes a sentence on its own from the exhibitions.',
      validation: (r) =>
        // nothing updates it by itself, so say so when a new exhibition has opened.
        r
          .custom(async (value, {getClient}) => {
            const text = plain(value).toLowerCase()
            if (!text) return true
            const showing = await getClient({apiVersion: '2025-02-19'}).fetch<string | null>(
              `*[_type == "exhibition" && opens <= now() && count(chapters[].works[]) > 0] | order(opens desc)[0].title`,
            )
            return showing && !text.includes(showing.toLowerCase())
              ? `"${showing}" is the exhibition showing now, and this doesn’t name it yet.`
              : true
          })
          .warning(),
    }),
  ],
  preview: {prepare: () => ({title: 'Home'})},
})
