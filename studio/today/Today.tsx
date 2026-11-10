import {useCallback, useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'
import {SITE_URL} from '../presentation'
import {WHEN} from './index'

// the "Today" tab: one checklist for every exhibition, the list itself written in sanity
// ("edit the list"), ticked here, cleared with "start a new round" when the next one
// begins. under it, what sanity can see is still missing in that exhibition, and what
// isn't published. nothing here counts visitors.

const API = '2025-02-19'
const SHARP = 2400
const DOC = 'today.checklist'

type Ref = {_id: string; _type: string; title?: string}
type Item = {_key: string; text?: string; when?: string; link?: string}
type Work = Ref & {
  medium?: string
  year?: string
  alt?: string
  long?: number
  media: boolean
  sale?: string
  amount?: number
}
type Exhibition = Ref & {
  _id: string
  number: number
  title?: string
  opens?: string
  newFor?: number
  text: number
  chapters: {artist?: Ref; works: Work[]}[]
}
type Data = {
  now: string
  exhibitions: Exhibition[]
  checklist: {items?: Item[]; sheetUrl?: string; for?: number; done?: string[]} | null
  drafts: Ref[]
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
const QUERY = `{
  "now": now(),
  "exhibitions": *[_type == "exhibition" && defined(number)] | order(number desc){
    _id, _type, number, title, opens, newFor,
    "text": count(text),
    "chapters": coalesce(chapters[]{ "artist": artist->{_id, _type, "title": name}, "works": coalesce(works[]->${WORK}, []) }, [])
  },
  "checklist": *[_id == "${DOC}"][0]{items, sheetUrl, for, done}
}`
// drafts are their own documents in the raw view: this finds what isn't published.
const DRAFTS = `*[_id in path("drafts.**") && _type in ["exhibition", "work", "artist", "journalEntry", "homePage", "aboutPage", "privacyPage", "siteSettings"]]{_id, _type, "title": coalesce(title, name)}`

const DAY = 86_400_000
const date = (t: number | string) =>
  new Date(t).toLocaleDateString('en-GB', {day: 'numeric', month: 'long'}).toLowerCase()
const bare = (id: string) => id.replace(/^drafts\./, '')
const KIND: Record<string, string> = {
  exhibition: 'exhibition',
  work: 'work',
  artist: 'artist',
  journalEntry: 'letter',
  homePage: 'home',
  aboutPage: 'about',
  privacyPage: 'privacy',
  siteSettings: 'site settings',
}

// the site's type and spacing; the studio's own colours, so it reads in light and dark.
const CSS = `
.today { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 18px;
  padding: 24px 16px 120px; max-width: 760px; -webkit-font-smoothing: antialiased; }
.today a { color: inherit; text-decoration: underline; text-decoration-thickness: from-font; }
.today p, .today ul, .today h2, .today h3 { margin: 0; }
.today ul { list-style: none; padding: 0; }
.today .dim { opacity: 0.55; }
.today section { margin-top: 48px; }
.today h2 { font-size: 32px; line-height: 36px; font-weight: 400; margin: 40px 0 8px; }
.today h3 { font-size: 13px; font-weight: 700; margin: 24px 0 4px; }
.today li { padding: 2px 0; }
.today label { display: flex; gap: 8px; align-items: flex-start; cursor: pointer; }
.today label input { margin: 2px 0 0; flex-shrink: 0; width: 13px; height: 13px; cursor: pointer; }
.today button, .today select { font: inherit; color: inherit; background: none; border: 0; padding: 0;
  text-decoration: underline; text-decoration-thickness: from-font; cursor: pointer; }
.today select { text-decoration: none; border-bottom: 1px solid; }
`

const Open = ({doc}: {doc: Ref}) => (
  <IntentLink intent="edit" params={{id: bare(doc._id), type: doc._type}}>
    {doc.title || KIND[doc._type]}
  </IntentLink>
)

/** what sanity can see is still missing in an exhibition: each line names what to open. */
function missing(e: Exhibition, drafts: Set<string>) {
  const works = e.chapters.flatMap((c) => c.works)
  const lines: [string, Ref[]][] = [
    ['no date it opens', e.opens ? [] : [e]],
    ['no exhibition text', e.text ? [] : [e]],
    ['no artists yet', e.chapters.length ? [] : [e]],
    [
      'artists without works',
      e.chapters.filter((c) => !c.works.length && c.artist).map((c) => c.artist!),
    ],
    ['works without their file', works.filter((w) => !w.media)],
    [
      'images that don’t say what they show',
      works.filter((w) => (w.medium ?? 'image') === 'image' && w.media && !w.alt),
    ],
    [`images under ${SHARP}px (soft at full size)`, works.filter((w) => w.long && w.long < SHARP)],
    ['works without a year', works.filter((w) => !w.year)],
    [
      'works that don’t say if they’re for sale, or their price',
      works.filter((w) => !w.sale || (w.sale === 'available' && !w.amount)),
    ],
    [
      'not published yet',
      [e, ...works, ...e.chapters.map((c) => c.artist)].filter((d): d is Ref =>
        Boolean(d && drafts.has(`drafts.${bare(d._id)}`)),
      ),
    ],
  ]
  return lines.filter(([, docs]) => docs.length)
}

export function Today() {
  const client = useClient({apiVersion: API})
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [next, setNext] = useState<number | null>(null)
  const [sure, setSure] = useState(false)

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
    // anything changed anywhere (an edit, a tick, the list): look again.
    let timer: ReturnType<typeof setTimeout>
    const sub = client
      .listen(`*[!(_id in path("_.**"))]`, {}, {visibility: 'query', events: ['mutation']})
      .subscribe(() => {
        clearTimeout(timer)
        timer = setTimeout(load, 300)
      })
    return () => {
      clearTimeout(timer)
      sub.unsubscribe()
    }
  }, [client, load])

  if (!data)
    return (
      <div className="today">
        <style>{CSS}</style>
        <p className="dim">{error ? `couldn’t load: ${error}` : '…'}</p>
      </div>
    )

  const now = Date.parse(data.now)
  const list = data.checklist
  const items = list?.items ?? []
  const done = new Set(list?.done ?? [])
  const drafts = new Set(data.drafts.map((d) => d._id))
  const ends = (e: Exhibition) =>
    e.opens ? Date.parse(e.opens) + (e.newFor ?? 30) * DAY : Infinity
  // the round's exhibition: the one it was started for, or else the soonest not yet closed.
  const current =
    data.exhibitions.find((e) => e.number === list?.for) ??
    [...data.exhibitions].reverse().find((e) => ends(e) > now) ??
    data.exhibitions[0]
  const upcoming = data.exhibitions.filter((e) => e !== current && ends(e) > now)
  const choice = next ?? upcoming.at(-1)?.number ?? null

  const tick = async (key: string) => {
    const tx = client.transaction().createIfNotExists({_id: DOC, _type: 'todayChecklist'})
    await (
      done.has(key)
        ? tx.patch(DOC, (p) => p.unset([`done[@ == "${key}"]`]))
        : tx.patch(DOC, (p) => p.setIfMissing({done: []}).append('done', [key]))
    ).commit()
    load()
  }
  const startRound = async () => {
    if (choice === null) return
    await client.patch(DOC).set({for: choice, done: []}).commit()
    setSure(false)
    setNext(null)
    load()
  }

  let status = ''
  if (current) {
    const opens = current.opens ? Date.parse(current.opens) : null
    const newFor = current.newFor ?? 30
    const day = opens !== null ? Math.floor((now - opens) / DAY) + 1 : 0
    status =
      opens === null
        ? 'no date yet'
        : day < 1
          ? `opens ${date(opens)}, in ${Math.ceil((opens - now) / DAY)} days`
          : day <= newFor
            ? `showing: day ${day} of ${newFor}, closes ${date(opens + newFor * DAY)}`
            : `closed ${date(opens + newFor * DAY)}`
  }
  const gaps = current ? missing(current, drafts) : []

  return (
    <div className="today">
      <style>{CSS}</style>
      <p>
        today, {date(now)} ·{' '}
        <a href={SITE_URL} target="_blank" rel="noreferrer">
          the site
        </a>
        {list?.sheetUrl ? (
          <>
            {' · '}
            <a href={list.sheetUrl} target="_blank" rel="noreferrer">
              the sheet
            </a>
          </>
        ) : null}
      </p>

      {current ? (
        <>
          <h2>
            {current.number}.{' '}
            <IntentLink intent="edit" params={{id: current._id, type: 'exhibition'}}>
              {current.title || 'untitled'}
            </IntentLink>
          </h2>
          <p>
            {status} ·{' '}
            <a
              href={`/presentation?preview=${encodeURIComponent(`/exhibitions/${current.number}`)}`}
            >
              in the preview tab
            </a>{' '}
            ·{' '}
            <a href={`${SITE_URL}/exhibitions/${current.number}`} target="_blank" rel="noreferrer">
              on the site
            </a>
          </p>
        </>
      ) : null}

      <p style={{marginTop: 18}}>
        {items.filter((i) => done.has(i._key)).length} of {items.length} done ·{' '}
        <IntentLink intent="edit" params={{id: DOC, type: 'todayChecklist'}}>
          edit the list
        </IntentLink>
        {' · '}
        {sure ? (
          <>
            clear every tick and start for {choice}? <button onClick={startRound}>yes</button> ·{' '}
            <button onClick={() => setSure(false)}>no</button>
          </>
        ) : (
          <>
            <button onClick={() => setSure(true)} disabled={choice === null}>
              start a new round
            </button>{' '}
            for{' '}
            <select
              value={choice ?? ''}
              onChange={(ev) => setNext(Number(ev.target.value))}
              aria-label="exhibition"
            >
              {data.exhibitions.map((e) => (
                <option key={e._id} value={e.number}>
                  {e.number}. {e.title}
                </option>
              ))}
            </select>
          </>
        )}
      </p>

      {WHEN.map(({title, value}) => {
        const these = items.filter((i) => (i.when ?? 'before') === value)
        if (!these.length) return null
        return (
          <div key={value}>
            <h3>{title.toLowerCase()}</h3>
            <ul>
              {these.map((i) => (
                <li key={i._key}>
                  <label className={done.has(i._key) ? 'dim' : undefined}>
                    <input
                      type="checkbox"
                      checked={done.has(i._key)}
                      onChange={() => tick(i._key)}
                    />
                    <span>
                      {i.text}
                      {i.link ? (
                        <>
                          {' '}
                          <a
                            href={i.link}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(ev) => ev.stopPropagation()}
                          >
                            (open)
                          </a>
                        </>
                      ) : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      {!items.length ? (
        <p className="dim" style={{marginTop: 24}}>
          the list is empty:{' '}
          <IntentLink intent="edit" params={{id: DOC, type: 'todayChecklist'}}>
            write it
          </IntentLink>
          .
        </p>
      ) : null}

      {current ? (
        <section>
          <h3>what sanity sees is still missing in {current.number}</h3>
          {gaps.length ? (
            <ul>
              {gaps.map(([label, docs]) => (
                <li key={label}>
                  {label}:{' '}
                  {docs.map((d, i) => (
                    <span key={d._id}>
                      {i ? ', ' : ''}
                      <Open doc={d} />
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          ) : (
            <p className="dim">nothing.</p>
          )}
        </section>
      ) : null}

      <section>
        <h3>not published yet, anywhere</h3>
        {data.drafts.length ? (
          <ul>
            {data.drafts.map((d) => (
              <li key={d._id}>
                {KIND[d._type]}: <Open doc={d} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="dim">everything is published.</p>
        )}
      </section>
    </div>
  )
}
