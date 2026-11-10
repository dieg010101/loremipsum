import {ImageIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {requiredFor} from './shared'

const MEDIA = [
  {title: 'Image', value: 'image'},
  {title: 'Video', value: 'video'},
  {title: 'Sound', value: 'sound'},
  {title: 'Text', value: 'text'},
  {title: 'Website', value: 'website'},
  {title: 'PDF (a book)', value: 'pdf'},
]

const SALE = [
  {title: 'Not for sale', value: 'notForSale'},
  {title: 'Available', value: 'available'},
  {title: 'Price on request', value: 'onRequest'},
  {title: 'Reserved', value: 'reserved'},
  {title: 'Sold', value: 'sold'},
  {title: 'Free (to read, watch, visit…)', value: 'free'},
]

type Parent = {medium?: string; kind?: string; inStore?: boolean}

/** shown only when the work is in this medium. */
const only =
  (medium: string) =>
  ({document}: {document?: Record<string, unknown>}) =>
    document?.medium !== medium

const saleIs =
  (...kinds: string[]) =>
  ({parent}: {parent?: Parent}) =>
    !kinds.includes(parent?.kind ?? '')

const LENGTH = 'In seconds: 3 min 25 s is 205. Shown before it plays; the file’s own length takes over once it loads.'

export const work = defineType({
  name: 'work',
  title: 'Work',
  type: 'document',
  icon: ImageIcon,
  groups: [
    {name: 'work', title: 'Work', default: true},
    {name: 'media', title: 'Media'},
    {name: 'sale', title: 'Sale'},
    {name: 'record', title: 'Record'},
  ],
  fields: [
    defineField({name: 'title', type: 'string', group: 'work', validation: (r) => r.required()}),
    defineField({
      name: 'artist',
      type: 'reference',
      to: [{type: 'artist'}],
      group: 'work',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'year',
      type: 'string',
      group: 'work',
      description: '"2026", a span: "2024–26", or "c. 1990".',
      validation: (r) => [
        r.required(),
        r.regex(/\d{4}/, {name: 'year'}).warning('Usually a four-digit year somewhere in it: "2026", "2024–26".'),
      ],
    }),
    defineField({
      name: 'medium',
      type: 'string',
      group: 'work',
      description: 'What the page shows. The fields for it are under "Media".',
      options: {list: MEDIA, layout: 'radio', direction: 'horizontal'},
      initialValue: 'image',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'lines',
      type: 'array',
      group: 'work',
      title: 'Label lines',
      description:
        'Under the title: what it is, then how big or long. e.g. "acrylic and silkscreen ink on linen", "82 × 82 cm".',
      of: [defineArrayMember({type: 'string'})],
      validation: (r) => r.max(3).warning('The label has room for about three lines.'),
    }),
    defineField({
      name: 'note',
      type: 'richText',
      group: 'work',
      title: 'Note',
      description: 'Optional. A line or two, shown with the label on phones and in the text version.',
    }),

    // ---------------------------------------------------------------- media
    defineField({
      name: 'image',
      type: 'artImage',
      group: 'media',
      description:
        'The work itself. For a video or a sound, an optional still (the webstore and the index use it). Upload the largest file you have; it is never cropped.',
      hidden: ({document}) => !['image', 'video', 'sound'].includes((document as Parent)?.medium ?? ''),
      validation: (r) => r.custom(requiredFor('image', 'An image work needs its image.')),
    }),
    defineField({
      name: 'text',
      type: 'object',
      group: 'media',
      hidden: only('text'),
      fields: [
        defineField({
          name: 'paragraphs',
          type: 'array',
          of: [defineArrayMember({type: 'noted'})],
          validation: (r) => r.custom(requiredFor('text', 'Add the text: at least one paragraph.')),
        }),
        defineField({
          name: 'excerpt',
          type: 'number',
          title: 'Paragraphs shown in the exhibition',
          description: 'The rest is on the work’s own page, behind "keep reading".',
          initialValue: 3,
          validation: (r) => r.integer().min(1),
        }),
        defineField({
          name: 'pdf',
          type: 'pagedFile',
          title: 'As a pdf',
          description: 'Optional.',
          options: {accept: 'application/pdf'},
        }),
        defineField({
          name: 'original',
          type: 'object',
          title: 'The original',
          description: 'Optional, for a translation: a link to the text in its first language.',
          fields: [
            defineField({name: 'label', type: 'string', description: '"read the italian original"'}),
            defineField({
              name: 'href',
              type: 'url',
              title: 'Address',
              validation: (r) =>
                r
                  .uri({allowRelative: true, scheme: ['http', 'https']})
                  .custom((href, {parent}) =>
                    href && !(parent as {label?: string})?.label ? 'Add the words for the link too.' : true,
                  ),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'sound',
      type: 'object',
      group: 'media',
      hidden: only('sound'),
      fields: [
        defineField({
          name: 'file',
          type: 'pagedFile',
          description:
            'An mp3 (or m4a). They play everywhere, know their own length and can be skipped through. It is also what "download" gives.',
          options: {accept: 'audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a'},
          validation: (r) => r.custom(requiredFor('sound', 'Upload the sound.')),
        }),
        defineField({
          name: 'duration',
          type: 'number',
          title: 'Length in seconds',
          description: LENGTH,
          validation: (r) =>
            r.integer().min(1).custom(requiredFor('sound', 'Add its length, so the tape can show it.')),
        }),
        defineField({name: 'sides', type: 'string', description: 'Optional: "side a: …  ·  side b: …"'}),
        defineField({
          name: 'transcript',
          type: 'richText',
          title: 'The words, as text',
          description: 'For anyone who can’t listen. Worth adding whenever there are words.',
        }),
      ],
    }),
    defineField({
      name: 'video',
      type: 'object',
      group: 'media',
      hidden: only('video'),
      fields: [
        defineField({
          name: 'file',
          type: 'pagedFile',
          description:
            'An mp4 (h.264). It plays everywhere, iphones included; other kinds (webm, screen recordings) can show the wrong length and refuse to skip. Keep it under about 200 mb: it is served as a plain file, not streamed.',
          options: {accept: 'video/mp4,.mp4,.m4v'},
          validation: (r) => r.custom(requiredFor('video', 'Upload the video.')),
        }),
        defineField({
          name: 'duration',
          type: 'number',
          title: 'Length in seconds',
          description: LENGTH,
          validation: (r) => r.integer().min(1).custom(requiredFor('video', 'Add its length.')),
        }),
        defineField({name: 'loop', type: 'boolean', description: 'Starts again when it ends.', initialValue: false}),
        defineField({
          name: 'tracks',
          type: 'array',
          title: 'Subtitles',
          description: 'WebVTT files (.vtt). Worth adding whenever someone speaks.',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'track',
              fields: [
                defineField({
                  name: 'lang',
                  type: 'string',
                  title: 'Language code',
                  description: '"en", "it", "pt-BR"',
                  validation: (r) => r.required().regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, {name: 'language code'}),
                }),
                defineField({name: 'label', type: 'string', description: '"english"', validation: (r) => r.required()}),
                defineField({
                  name: 'file',
                  type: 'file',
                  title: 'WebVTT file',
                  options: {accept: '.vtt,text/vtt'},
                  validation: (r) => r.required(),
                }),
              ],
              preview: {select: {title: 'label', subtitle: 'lang'}},
            }),
          ],
          validation: (r) =>
            r.custom((tracks) => {
              const langs = ((tracks ?? []) as {lang?: string}[]).map((t) => t.lang).filter(Boolean)
              return new Set(langs).size === langs.length ? true : 'Each language once.'
            }),
        }),
      ],
    }),
    defineField({
      name: 'pdf',
      type: 'object',
      group: 'media',
      title: 'PDF',
      hidden: only('pdf'),
      fields: [
        defineField({
          name: 'file',
          type: 'pagedFile',
          options: {accept: 'application/pdf'},
          validation: (r) => r.custom(requiredFor('pdf', 'Upload the pdf.')),
        }),
        defineField({
          name: 'cover',
          type: 'artImage',
          description: 'Optional. Without one, the site sets a plain cover with the title and the artist.',
        }),
      ],
    }),
    defineField({
      name: 'website',
      type: 'object',
      group: 'media',
      hidden: only('website'),
      fields: [
        defineField({
          name: 'url',
          type: 'url',
          title: 'Address',
          description: 'It runs in a frame on the page, so it must start with https://.',
          validation: (r) =>
            r
              .uri({scheme: ['https']})
              .error('It needs to start with https:// to run inside the page.')
              .custom(requiredFor('website', 'Add the website’s address.')),
        }),
        defineField({name: 'source', type: 'url', title: 'Source code', description: 'Optional.'}),
        defineField({name: 'note', type: 'string', description: 'Optional: "best on a computer, with sound"'}),
        defineField({
          name: 'needsComputer',
          type: 'boolean',
          title: 'Needs a computer',
          description: 'On phones, ask before running it.',
          initialValue: false,
        }),
      ],
    }),

    // ----------------------------------------------------------------- sale
    defineField({
      name: 'sale',
      type: 'object',
      group: 'sale',
      fields: [
        defineField({
          name: 'kind',
          type: 'string',
          title: 'Status',
          options: {list: SALE, layout: 'radio'},
          initialValue: 'notForSale',
          validation: (r) => r.required(),
        }),
        defineField({
          name: 'amount',
          type: 'number',
          title: 'Price (USD)',
          description: 'Whole dollars: 4800.',
          hidden: saleIs('available'),
          validation: (r) =>
            r
              .min(1)
              .custom((v, {parent}) => ((parent as Parent)?.kind === 'available' && !v ? 'Add the price.' : true)),
        }),
        defineField({name: 'per', type: 'string', description: 'Optional: "a roll", "each".', hidden: saleIs('available')}),
        defineField({
          name: 'edition',
          type: 'string',
          description: 'Optional: "edition of 50 cassettes", "edition of 5 + 2 ap".',
          hidden: saleIs('available', 'onRequest'),
        }),
        defineField({
          name: 'until',
          type: 'date',
          title: 'Reserved until',
          hidden: saleIs('reserved'),
          validation: (r) =>
            r.custom((v, {parent}) =>
              (parent as Parent)?.kind === 'reserved' && !v ? 'Until when? The label says "reserved until …".' : true,
            ),
        }),
        defineField({name: 'label', type: 'string', description: 'Instead of "free to read".', hidden: saleIs('free')}),
      ],
    }),
    defineField({
      name: 'checkoutUrl',
      type: 'url',
      group: 'sale',
      title: 'Checkout link',
      description: 'Optional. Where "buy" goes (a Stripe or Shopify link). Without one, "buy" opens the contact form.',
      hidden: ({document}) => (document?.sale as Parent | undefined)?.kind !== 'available',
      validation: (r) => r.uri({scheme: ['https']}).error('A checkout link starts with https://.'),
    }),
    defineField({
      name: 'store',
      type: 'object',
      group: 'sale',
      title: 'Webstore',
      fields: [
        defineField({name: 'inStore', type: 'boolean', title: 'In the webstore', initialValue: false}),
        defineField({
          name: 'slug',
          type: 'slug',
          title: 'Address',
          description: 'loremipsum.art/webstore/… Press "Generate" to make it from the title.',
          options: {source: (doc) => (doc as {title?: string}).title ?? '', maxLength: 80},
          hidden: ({parent}) => !parent?.inStore,
          validation: (r) =>
            r.custom((v, {parent}) =>
              (parent as Parent)?.inStore && !(v as {current?: string} | undefined)?.current
                ? 'The webstore needs an address. Press "Generate".'
                : true,
            ),
        }),
        defineField({
          name: 'category',
          type: 'string',
          description: 'For the webstore’s "show" filter.',
          options: {list: ['painting', 'print', 'book', 'other'], layout: 'radio', direction: 'horizontal'},
          initialValue: 'other',
          hidden: ({parent}) => !parent?.inStore,
        }),
        defineField({name: 'size', type: 'string', description: 'Optional: "82 × 82 cm".', hidden: ({parent}) => !parent?.inStore}),
        defineField({name: 'edition', type: 'string', description: 'Optional.', hidden: ({parent}) => !parent?.inStore}),
        defineField({
          name: 'about',
          type: 'richText',
          title: 'What you’re buying',
          description: 'Optional: the object itself, its frame, how it ships.',
          hidden: ({parent}) => !parent?.inStore,
        }),
        defineField({
          name: 'added',
          type: 'datetime',
          description: 'Optional. For "newest first"; without it, when this work was created here.',
          hidden: ({parent}) => !parent?.inStore,
        }),
      ],
    }),

    // --------------------------------------------------------------- record
    defineField({
      name: 'record',
      type: 'object',
      group: 'record',
      title: 'Details for the record',
      description:
        'All optional. The file’s name, size and weight come from the image itself; "added" falls back to when this work was created here.',
      fields: [
        defineField({name: 'added', type: 'datetime'}),
        defineField({
          name: 'sha256',
          type: 'string',
          title: 'SHA-256 of the original',
          description: 'On a Mac: shasum -a 256 file.tif. Paste the 64 characters.',
          validation: (r) =>
            r.custom((v) => {
              if (!v) return true
              const hex = String(v).replace(/\s+/g, '')
              return /^[0-9a-fA-F]{64}$/.test(hex)
                ? true
                : `That’s ${hex.length} characters; a sha-256 has 64 (0–9, a–f).`
            }),
        }),
        defineField({name: 'photograph', type: 'string', description: '"sunt culpa, lorem, october 2026"'}),
        defineField({
          name: 'provenance',
          type: 'string',
          description: 'Without it: "the artist; lorem ipsum art group, exhibition 14".',
        }),
        defineField({
          name: 'rights',
          type: 'string',
          initialValue: 'the artist keeps every right. you may look as long as you like.',
        }),
      ],
    }),
  ],
  orderings: [
    {title: 'Title', name: 'titleAsc', by: [{field: 'title', direction: 'asc'}]},
    {title: 'Newest', name: 'createdDesc', by: [{field: '_createdAt', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', artist: 'artist.name', year: 'year', medium: 'medium', media: 'image', sale: 'sale.kind'},
    prepare: ({title, artist, year, medium, media, sale}) => ({
      title: title || 'Untitled',
      subtitle: [artist, year, medium, sale === 'sold' || sale === 'reserved' ? sale : null].filter(Boolean).join(' · '),
      media,
    }),
  },
})
