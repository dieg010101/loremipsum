import {useCallback, useEffect, useState, type ReactNode} from 'react'
import {Badge, Box, Button, Card, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'
import {SITE_URL} from '../presentation'

// the "Today" tab: what's on, what the next exhibition still needs, what isn't
// published, and the two wayback copies each exhibition gets. read straight from the
// content; nothing here counts visitors (the site promises no analytics).

const API = '2025-02-19'
const SHARP = 2400
const SHEET_URL = process.env.SANITY_STUDIO_SHEET_URL

type Ref = {_id: string; _type: string; title?: string}
type Work = Ref & {
  medium?: string
  year?: string
  alt?: string
  long?: number
  media: boolean
  sale?: string
  amount?: number
}
type Exhibition = {
  _id: string
  number: number
  title?: string
  opens?: string
  newFor?: number
  text: number
  chapters: {artist?: Ref; works: Work[]}[]
  files: {pressRelease: boolean; list: boolean; pdf: boolean}
}
type Saved = {number: number; step: 'opened' | 'settled'; at: string}
type Data = {
  now: string
  showing: Exhibition | null
  upcoming: Exhibition[]
  open: Exhibition[]
  home: string
  drafts: Ref[]
  recent: (Ref & {_updatedAt: string})[]
  small: Work[]
  saved: Saved[]
  documents: number
}

const WORK = `{
  _id, _type, title, medium, year,
  "alt": image.alt,
  "long": math::max([image.asset->metadata.dimensions.width, image.asset->metadata.dimensions.height]),
  "media": select(
    medium == "text" => count(text.paragraphs) > 0 || defined(text.pdf.asset),
    medium == "sound" => defined(sound.file.asset),
    medium == "video" => defined(video.file.asset),
    medium == "pdf" => defined(pdf.file.asset),
    medium == "website" => defined(website.url),
    defined(image.asset)
  ),
  "sale": sale.kind, "amount": sale.amount
}`
const EXHIBITION = `{
  _id, number, title, opens, newFor,
  "text": count(text),
  "chapters": chapters[]{ "artist": artist->{_id, _type, "title": name}, "works": coalesce(works[]->${WORK}, []) },
  "files": { "pressRelease": defined(files.pressRelease.asset), "list": defined(files.list.asset), "pdf": defined(files.pdf.asset) }
}`
const READY = `count(chapters[count(works) > 0]) > 0`
const QUERY = `{
  "now": now(),
  "showing": *[_type == "exhibition" && defined(number) && opens <= now() && ${READY}] | order(opens desc)[0]${EXHIBITION},
  "upcoming": *[_type == "exhibition" && defined(number) && !(opens <= now() && ${READY})] | order(coalesce(opens, "9999") asc)${EXHIBITION},
  "open": *[_type == "exhibition" && defined(number) && opens <= now() && ${READY}] | order(opens desc)[0...6]{_id, number, title, opens, newFor},
  "home": pt::text(*[_id == "homePage"][0].statement),
  "recent": *[_type in ["exhibition", "work", "artist", "journalEntry", "homePage", "aboutPage", "privacyPage", "siteSettings"]] | order(_updatedAt desc)[0...8]{_id, _type, _updatedAt, "title": coalesce(title, name)},
  "small": *[_type == "work" && defined(image.asset) && math::max([image.asset->metadata.dimensions.width, image.asset->metadata.dimensions.height]) < ${SHARP}] | order(title asc)${WORK},
  "saved": coalesce(*[_id == "todayChecklist"][0].wayback, []),
  "documents": count(*[!(_id in path("_.**"))])
}`
// raw: drafts are their own documents here, so this finds what isn't published.
const DRAFTS = `*[_id in path("drafts.**") && _type in ["exhibition", "work", "artist", "journalEntry", "homePage", "aboutPage", "privacyPage", "siteSettings"]]{_id, _type, "title": coalesce(title, name)}`

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})
const daysFrom = (iso: string, now: string) => Math.floor((Date.parse(now) - Date.parse(iso)) / 86_400_000) + 1
const bare = (id: string) => id.replace(/^drafts\./, '')
const LABELS: Record<string, string> = {
  exhibition: 'Exhibition',
  work: 'Work',
  artist: 'Artist',
  journalEntry: 'Letter',
  homePage: 'Home',
  aboutPage: 'About',
  privacyPage: 'Privacy',
  siteSettings: 'Site settings',
}

function Open({doc}: {doc: Ref}) {
  return (
    <IntentLink intent="edit" params={{id: bare(doc._id), type: doc._type}}>
      {doc.title || LABELS[doc._type] || 'Untitled'}
    </IntentLink>
  )
}

function Check({ok, optional, children}: {ok: boolean; optional?: boolean; children: ReactNode}) {
  return (
    <Flex gap={3} align="flex-start">
      <Box style={{width: 64, flexShrink: 0}}>
        <Badge tone={ok ? 'positive' : optional ? 'default' : 'caution'}>{ok ? 'done' : optional ? 'optional' : 'to do'}</Badge>
      </Box>
      <Text size={1}>{children}</Text>
    </Flex>
  )
}

function List({docs}: {docs: Ref[]}) {
  return (
    <>
      {docs.map((d, i) => (
        <span key={d._id}>
          {i ? ', ' : ': '}
          <Open doc={d} />
        </span>
      ))}
    </>
  )
}

function Checklist({e, drafts, now}: {e: Exhibition; drafts: Set<string>; now: string}) {
  const works = e.chapters.flatMap((c) => c.works)
  const empty = e.chapters.filter((c) => !c.works.length && c.artist).map((c) => c.artist!)
  const noMedia = works.filter((w) => !w.media)
  const noAlt = works.filter((w) => (w.medium ?? 'image') === 'image' && w.media && !w.alt)
  const small = works.filter((w) => w.long && w.long < SHARP)
  const noYear = works.filter((w) => !w.year)
  const noSale = works.filter((w) => !w.sale || (w.sale === 'available' && !w.amount))
  const unpublished = [e, ...works, ...e.chapters.map((c) => c.artist).filter(Boolean)].filter((d) =>
    drafts.has(`drafts.${bare(d!._id)}`),
  ) as Ref[]
  const left = e.opens ? -daysFrom(e.opens, now) + 1 : null
  return (
    <Stack space={3}>
      <Text size={1} muted>
        {e.opens ? `Opens ${day(e.opens)}${left !== null && left > 0 ? `, in ${left} day${left === 1 ? '' : 's'}` : ''}.` : 'No date yet.'}{' '}
        <IntentLink intent="edit" params={{id: e._id, type: 'exhibition'}}>Open it</IntentLink>
        {' · '}
        <a href={`${SITE_URL}/exhibitions/${e.number}`} target="_blank" rel="noreferrer">
          the page
        </a>
        {' · in the Preview tab, use “see it as on its opening day”.'}
      </Text>
      <Check ok={Boolean(e.opens)}>A date and time it opens</Check>
      <Check ok={e.text > 0}>The exhibition text</Check>
      <Check ok={e.chapters.length > 0}>The artists, one chapter each</Check>
      <Check ok={!empty.length && works.length > 0}>
        Every artist has their works{empty.length ? <List docs={empty} /> : null}
      </Check>
      <Check ok={!noMedia.length}>
        Every work has its file (image, sound, video, pdf, text or address){noMedia.length ? <List docs={noMedia} /> : null}
      </Check>
      <Check ok={!noAlt.length}>
        Every image says what it shows{noAlt.length ? <List docs={noAlt} /> : null}
      </Check>
      <Check ok={!small.length}>
        Every image is at least {SHARP}px on its long side{small.length ? <List docs={small} /> : null}
      </Check>
      <Check ok={!noYear.length}>Every work has a year{noYear.length ? <List docs={noYear} /> : null}</Check>
      <Check ok={!noSale.length}>
        Every work says whether it’s for sale (and its price){noSale.length ? <List docs={noSale} /> : null}
      </Check>
      <Check ok={!unpublished.length}>
        Everything is published{unpublished.length ? <List docs={unpublished} /> : null}
      </Check>
      <Check ok={e.files.pressRelease} optional>
        Press release (.pdf)
      </Check>
      <Check ok={e.files.list} optional>
        List of works (.pdf)
      </Check>
      <Check ok={false} optional>
        On the day: change the words on <IntentLink intent="edit" params={{id: 'homePage', type: 'homePage'}}>Home</IntentLink> to name it
      </Check>
    </Stack>
  )
}

function Wayback({e, saved, now, onSaved}: {e: Exhibition; saved: Saved[]; now: string; onSaved: (n: number, s: Saved['step']) => void}) {
  const days = e.opens ? daysFrom(e.opens, now) : 0
  const newFor = e.newFor ?? 30
  const page = `${SITE_URL}/exhibitions/${e.number}`
  const steps: {step: Saved['step']; label: string; ready: boolean; why: string}[] = [
    {step: 'opened', label: 'Once it has opened', ready: days >= 1, why: 'after it opens'},
    {
      step: 'settled',
      label: `After its ${newFor} days, with the visitors’ book filled in`,
      ready: days > newFor,
      why: `from day ${newFor + 1}`,
    },
  ]
  return (
    <Card padding={3} radius={2} border>
      <Stack space={3}>
        <Text size={1} weight="semibold">
          {e.number}. {e.title}{' '}
          <a href={`https://web.archive.org/web/*/${page}*`} target="_blank" rel="noreferrer">
            (copies so far)
          </a>
        </Text>
        {steps.map(({step, label, ready, why}) => {
          const done = saved.find((s) => s.number === e.number && s.step === step)
          return (
            <Flex key={step} gap={2} align="center" wrap="wrap">
              <Box style={{width: 64}}>
                <Badge tone={done ? 'positive' : ready ? 'caution' : 'default'}>{done ? 'saved' : ready ? 'to do' : 'later'}</Badge>
              </Box>
              <Text size={1}>
                {label}
                {done ? `: saved ${day(done.at)}` : ready ? '' : ` (${why})`}
              </Text>
              {!done && ready ? (
                <>
                  <Button as="a" href={`https://web.archive.org/save/${page}`} target="_blank" rel="noreferrer" text="Save the page" mode="ghost" fontSize={1} padding={2} />
                  <Button as="a" href={`https://web.archive.org/save/${page}/book`} target="_blank" rel="noreferrer" text="Save the visitors’ book" mode="ghost" fontSize={1} padding={2} />
                  <Button text="Mark as saved" tone="positive" fontSize={1} padding={2} onClick={() => onSaved(e.number, step)} />
                </>
              ) : null}
            </Flex>
          )
        })}
      </Stack>
    </Card>
  )
}

function Section({title, children}: {title: string; children: ReactNode}) {
  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        <Heading as="h2" size={1}>
          {title}
        </Heading>
        {children}
      </Stack>
    </Card>
  )
}

export function Today() {
  const client = useClient({apiVersion: API})
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [main, drafts] = await Promise.all([
        client.withConfig({perspective: 'drafts'}).fetch<Omit<Data, 'drafts'>>(QUERY),
        client.withConfig({perspective: 'raw'}).fetch<Ref[]>(DRAFTS),
      ])
      setData({...main, drafts})
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [client])

  useEffect(() => {
    load()
    // anything edited elsewhere: look again.
    const sub = client.listen(`*[!(_id in path("_.**"))]`, {}, {visibility: 'query', events: ['mutation']}).subscribe(() => load())
    return () => sub.unsubscribe()
  }, [client, load])

  const markSaved = async (number: number, step: Saved['step']) => {
    await client
      .transaction()
      .createIfNotExists({_id: 'todayChecklist', _type: 'todayChecklist'})
      .patch('todayChecklist', (p) =>
        p.setIfMissing({wayback: []}).append('wayback', [{_key: `${number}-${step}`, number, step, at: new Date().toISOString()}]),
      )
      .commit()
    load()
  }

  if (error) return <Card padding={5} tone="critical"><Text>Couldn’t load: {error}</Text></Card>
  if (!data) return <Flex padding={5} justify="center"><Spinner /></Flex>

  const drafts = new Set(data.drafts.map((d) => d._id))
  const s = data.showing
  const homeNamesIt = s?.title ? data.home?.toLowerCase().includes(s.title.toLowerCase()) : true

  return (
    <Box padding={4} style={{maxWidth: 880, margin: '0 auto'}}>
      <Stack space={4}>
        <Section title="Now">
          {s ? (
            <Stack space={3}>
              <Text>
                Showing: <IntentLink intent="edit" params={{id: s._id, type: 'exhibition'}}>{s.number}. {s.title}</IntentLink>
                {s.opens ? (daysFrom(s.opens, data.now) <= (s.newFor ?? 30) ? `, day ${daysFrom(s.opens, data.now)} of ${s.newFor ?? 30}` : `, open since ${day(s.opens)}`) : ''}.
              </Text>
              <Check ok={Boolean(homeNamesIt)}>
                The words on <IntentLink intent="edit" params={{id: 'homePage', type: 'homePage'}}>Home</IntentLink> name it
              </Check>
            </Stack>
          ) : (
            <Text>Nothing is showing yet.</Text>
          )}
          <Text size={1} muted>
            <a href={SITE_URL} target="_blank" rel="noreferrer">The site</a>
            {SHEET_URL ? (
              <>
                {' · '}
                <a href={SHEET_URL} target="_blank" rel="noreferrer">The Google Sheet (visitors’ book, newsletter, messages)</a>
              </>
            ) : null}
            {' · '}
            <a href="https://dash.cloudflare.com/" target="_blank" rel="noreferrer">Cloudflare</a>
            {' · '}
            <a href="https://www.sanity.io/manage/project/d6hlyvrq" target="_blank" rel="noreferrer">Sanity project</a>
            {` · ${data.documents.toLocaleString()} of 10,000 documents on the free plan`}
          </Text>
        </Section>

        {data.upcoming.map((e) => (
          <Section key={e._id} title={`Next: ${e.number}. ${e.title ?? ''}`}>
            <Checklist e={e} drafts={drafts} now={data.now} />
          </Section>
        ))}

        <Section title="Not published yet">
          {data.drafts.length ? (
            <Stack space={2}>
              {data.drafts.map((d) => (
                <Text key={d._id} size={1}>
                  {LABELS[d._type]}: <Open doc={d} />
                </Text>
              ))}
            </Stack>
          ) : (
            <Text size={1} muted>Everything is published.</Text>
          )}
        </Section>

        <Section title="Wayback Machine copies">
          <Text size={1} muted>
            Two copies of each exhibition at web.archive.org: once it has opened, and once its new days are over and the visitors’ book has filled in. “Save” opens the archive in a new tab; when it says the page is saved, come back and mark it.
          </Text>
          {data.open.map((e) => (
            <Wayback key={e._id} e={e as Exhibition} saved={data.saved} now={data.now} onSaved={markSaved} />
          ))}
        </Section>

        {data.small.length ? (
          <Section title={`Images under ${SHARP}px`}>
            <Text size={1}>
              “Full size” looks soft on a big screen. Upload a larger file if you have one
              <List docs={data.small} />.
            </Text>
          </Section>
        ) : null}

        <Section title="Recently changed">
          <Stack space={2}>
            {data.recent.map((d) => (
              <Text key={d._id} size={1}>
                {LABELS[d._type]}: <Open doc={d} /> <span style={{opacity: 0.6}}>· {new Date(d._updatedAt).toLocaleString('en-GB', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}</span>
              </Text>
            ))}
          </Stack>
        </Section>
      </Stack>
    </Box>
  )
}
