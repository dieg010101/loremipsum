import {defineArrayMember, defineField, defineType} from 'sanity'

// what the site can show of rich text: italics, bold and links. nothing else, so
// nothing reaches the page that the design doesn't have.
const marks = {
  decorators: [
    {title: 'Italic', value: 'em'},
    {title: 'Bold', value: 'strong'},
  ],
  annotations: [
    {
      name: 'link',
      type: 'object',
      title: 'Link',
      fields: [
        defineField({
          name: 'href',
          type: 'url',
          title: 'Address',
          validation: (rule) =>
            rule.required().uri({allowRelative: true, scheme: ['http', 'https', 'mailto']}),
        }),
      ],
    },
  ],
}

/** paragraphs of text: no headings, no lists. */
export const richText = defineType({
  name: 'richText',
  title: 'Text',
  type: 'array',
  of: [defineArrayMember({type: 'block', styles: [], lists: [], marks})],
})

/** a paragraph with an optional sidenote, for essays. */
export const noted = defineType({
  name: 'noted',
  title: 'Paragraph',
  type: 'object',
  fields: [
    defineField({name: 'text', type: 'richText', title: 'Paragraph', validation: (r) => r.required()}),
    defineField({
      name: 'note',
      type: 'richText',
      title: 'Sidenote',
      description: 'Shown beside the paragraph on a computer, under it on a phone.',
    }),
  ],
  preview: {
    select: {text: 'text', note: 'note'},
    prepare: ({text, note}) => ({
      title: text?.[0]?.children?.map((c: {text?: string}) => c.text).join('') ?? '',
      subtitle: note?.length ? 'with a sidenote' : undefined,
    }),
  },
})

// below this many pixels on the long side, "full size" looks soft on a large screen.
const SHARP = 2400

/** an image of a work, with what it shows for people who can't see it. */
export const artImage = defineType({
  name: 'artImage',
  title: 'Image',
  type: 'image',
  description:
    'Upload the largest file you have (jpg, png, webp or tiff). It is never cropped; the site makes every smaller size.',
  options: {hotspot: false, metadata: ['palette', 'lqip'], accept: 'image/jpeg,image/png,image/webp,image/tiff,image/avif'},
  // a gentle nudge, never a block: a small file still publishes.
  validation: (r) =>
    r.custom(async (value, {getClient}) => {
      const ref = (value as {asset?: {_ref?: string}} | undefined)?.asset?._ref
      if (!ref) return true
      const size = await getClient({apiVersion: '2025-02-19'}).fetch<{width?: number; height?: number} | null>(
        `*[_id == $ref][0].metadata.dimensions{width, height}`,
        {ref},
      )
      const long = Math.max(size?.width ?? 0, size?.height ?? 0)
      return long && long < SHARP
        ? {message: `This file is ${long}px on its long side. ${SHARP}px or more keeps "full size" sharp.`, level: 'warning'}
        : true
    }),
  fields: [
    defineField({
      name: 'alt',
      type: 'string',
      title: 'What it shows',
      description:
        'Read aloud to people who can’t see the image. Say what is there, plainly, in a sentence: "four flowers, flat and bright, on a dark green ground." No need to repeat the title.',
      validation: (r) => [
        r.required().warning('Describe the image for people who can’t see it.'),
        r.max(300).warning('Shorter is easier to listen to: one or two sentences.'),
      ],
    }),
  ],
})

/**
 * required, but only when the work is in this medium. the other media's fields are
 * hidden, and never block publishing.
 */
export const requiredFor =
  (medium: string, message: string) =>
  (value: unknown, {document}: {document?: Record<string, unknown>}) =>
    document?.medium !== medium || isFilled(value) ? true : message

/** a value that's really there: not empty, and a file field with its file still in it. */
function isFilled(value: unknown) {
  if (value === undefined || value === null || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object' && '_type' in value && !('asset' in value)) {
    // an image or file whose upload was removed keeps its _type and nothing else.
    const type = (value as {_type: string})._type
    if (type === 'pagedFile' || type === 'artImage' || type === 'file' || type === 'image') return false
  }
  return true
}

/** "@name", "name" or "https://instagram.com/name": all fine; the site makes the link. */
export const instagramHandle = (value: unknown) => {
  if (!value || typeof value !== 'string') return true
  const v = value.trim()
  if (/^@?[A-Za-z0-9._]{1,30}$/.test(v)) return true
  if (/^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]{1,30}\/?$/.test(v)) return true
  return 'Write the handle ("loremipsum") or paste the profile’s address.'
}

/** a file, and how many pages it has when that's worth saying ("a pdf, 41 pages"). */
export const pagedFile = defineType({
  name: 'pagedFile',
  title: 'File',
  type: 'file',
  fields: [
    defineField({
      name: 'pages',
      type: 'number',
      title: 'Pages',
      description: 'Optional. Shown with the link: "a pdf, 41 pages".',
      validation: (r) => r.integer().min(1),
    }),
  ],
})
