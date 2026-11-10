import {useCallback, useEffect, useState, type ReactNode} from 'react'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'
import {SITE_URL} from '../presentation'

// the "Today" tab: each exhibition's checklist, from before it opens to after it closes.
// what sanity can see ticks itself (greyed out: fix the thing and it ticks); what only
// you can judge, you tick. the wayback copies are made by a github action you start,
// and tick themselves when it's done. nothing here counts visitors.

const API = '2025-02-19'
const SHARP = 2400
const DOC = 'today.checklist' // a dot in the id keeps it private: the dataset is public.
const WAYBACK = 'https://github.com/dieg010101/loremipsum/actions/workflows/wayback.yml'

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
  files: {pressRelease: boolean; list: boolean}
}
type Tick = {_key: string; number: number; item: string; at: string}
type Copy = {
  _key: string
  number: number
  step: 'opened' | 'closed'
  at: string
  saved?: number
  failed?: string[]
  run?: string
}
type Data = {
  now: string
  exhibitions: Exhibition[]
  checklist: {sheetUrl?: string; ticks?: Tick[]; wayback?: Copy[]} | null
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
    _id, number, title, opens, newFor,
    "text": count(text),
    "chapters": coalesce(chapters[]{ "artist": artist->{_id, _type, "title": name}, "works": coalesce(works[]->${WORK}, []) }, []),
    "files": { "pressRelease": defined(files.pressRelease.asset), "list": defined(files.list.asset) }
  },
  "checklist": *[_id == "${DOC}"][0]{sheetUrl, ticks, wayback}
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
.today section { margin-top: 56px; }
.today h2 { font-size: 32px; line-height: 36px; font-weight: 400; margin-bottom: 8px; }
.today h3 { font-size: 13px; font-weight: 700; margin: 24px 0 4px; }
.today li { display: flex; gap: 8px; align-items: flex-start; padding: 2px 0; }
.today li input { margin: 2px 0 0; flex-shrink: 0; width: 13px; height: 13px; }
.today li input:not(:disabled) { cursor: pointer; }
.today li input:disabled { opacity: 0.4; }
.today .how { margin: 0 0 4px 21px; }
`

const Open = ({doc}: {doc: Ref}) => (
  <IntentLink intent="edit" params={{id: bare(doc._id), type: doc._type}}>
    {doc.title || KIND[doc._type]}
  </IntentLink>
)
const Names = ({docs}: {docs: Ref[]}) => (
  <>
    {docs.map((d, i) => (
      <span key={d._id}>
        {i ? ', ' : ': '}
        <Open doc={d} />
      </span>
    ))}
  </>
)

/** one line of a checklist. `auto` lines are ticked by what's in sanity and can't be clicked. */
function Item({
  done,
  auto,
  onTick,
  children,
}: {
  done: boolean
  auto?: boolean
  onTick?: () => void
  children: ReactNode
}) {
  return (
    <li>
      <input type="checkbox" checked={done} disabled={auto} onChange={onTick} aria-label="done" />
      <span className={done ? 'dim' : undefined}>{children}</span>
    </li>
  )
}

function Exhibit({
  e,
  data,
  drafts,
  tick,
}: {
  e: Exhibition
  data: Data
  drafts: Set<string>
  tick: (n: number, item: string) => void
}) {
  const now = Date.parse(data.now)
  const opens = e.opens ? Date.parse(e.opens) : null
  const newFor = e.newFor ?? 30
  const closes = opens !== null ? opens + newFor * DAY : null
  const day = opens !== null ? Math.floor((now - opens) / DAY) + 1 : 0
  const ticks = data.checklist?.ticks ?? []
  const copies = data.checklist?.wayback ?? []
  const mine = (item: string, label: ReactNode) => (
    <Item
      done={ticks.some((t) => t.number === e.number && t.item === item)}
      onTick={() => tick(e.number, item)}
    >
      {label}
    </Item>
  )
  const copy = (step: Copy['step'], label: string) => {
    const c = [...copies].reverse().find((x) => x.number === e.number && x.step === step)
    const ok = Boolean(c && !c.failed?.length)
    return (
      <>
        <Item done={ok} auto>
          {label}
          {c ? (
            <>
              {': '}
              {ok
                ? `saved ${date(c.at)}, ${c.saved} pages`
                : `${c.failed!.length} didn’t save on ${date(c.at)}, run it again`}
              {c.run ? (
                <>
                  {' '}
                  (
                  <a href={c.run} target="_blank" rel="noreferrer">
                    the run
                  </a>
                  )
                </>
              ) : null}
            </>
          ) : null}
        </Item>
        {!ok ? (
          <p className="how dim">
            <a href={WAYBACK} target="_blank" rel="noreferrer">
              github → wayback
            </a>{' '}
            → run workflow → {e.number} → {step}
          </p>
        ) : null}
      </>
    )
  }

  const works = e.chapters.flatMap((c) => c.works)
  const empty = e.chapters.filter((c) => !c.works.length && c.artist).map((c) => c.artist!)
  const noMedia = works.filter((w) => !w.media)
  const noAlt = works.filter((w) => (w.medium ?? 'image') === 'image' && w.media && !w.alt)
  const small = works.filter((w) => w.long && w.long < SHARP)
  const noYear = works.filter((w) => !w.year)
  const noSale = works.filter((w) => !w.sale || (w.sale === 'available' && !w.amount))
  const unpublished = [e, ...works, ...e.chapters.map((c) => c.artist)].filter((d): d is Ref =>
    Boolean(d && drafts.has(`drafts.${bare(d._id)}`)),
  )
  const preview = `/presentation?preview=${encodeURIComponent(`/exhibitions/${e.number}`)}`
  const before = day < 1
  const during = day <= newFor

  const when =
    opens === null
      ? 'no date yet'
      : before
        ? `opens ${date(opens)}, in ${Math.ceil((opens - now) / DAY)} days`
        : during
          ? `showing: day ${day} of ${newFor}, closes ${date(closes!)}`
          : `closed ${date(closes!)}`

  return (
    <section>
      <h2>
        {e.number}.{' '}
        <IntentLink intent="edit" params={{id: e._id, type: 'exhibition'}}>
          {e.title || 'untitled'}
        </IntentLink>
      </h2>
      <p>
        {when} · <a href={preview}>in the preview tab</a> ·{' '}
        <a href={`${SITE_URL}/exhibitions/${e.number}`} target="_blank" rel="noreferrer">
          on the site
        </a>
      </p>

      {before ? (
        <>
          <h3>before it opens</h3>
          <ul>
            <Item done={opens !== null} auto>
              a date and time it opens
            </Item>
            <Item done={e.text > 0} auto>
              the exhibition text
            </Item>
            <Item done={!empty.length && works.length > 0} auto>
              every artist has their works{empty.length ? <Names docs={empty} /> : null}
            </Item>
            <Item done={!noMedia.length} auto>
              every work has its file{noMedia.length ? <Names docs={noMedia} /> : null}
            </Item>
            <Item done={!noAlt.length} auto>
              every image says what it shows{noAlt.length ? <Names docs={noAlt} /> : null}
            </Item>
            <Item done={!small.length} auto>
              every image is {SHARP}px or more on its long side
              {small.length ? <Names docs={small} /> : null}
            </Item>
            <Item done={!noYear.length} auto>
              every work has a year{noYear.length ? <Names docs={noYear} /> : null}
            </Item>
            <Item done={!noSale.length} auto>
              every work says if it’s for sale, and its price
              {noSale.length ? <Names docs={noSale} /> : null}
            </Item>
            <Item done={e.files.pressRelease} auto>
              press release (optional)
            </Item>
            <Item done={e.files.list} auto>
              list of works (optional)
            </Item>
            {mine('read', 'read the text and every work’s label for typos')}
            {mine('artists', 'every artist has seen their pages and said yes')}
            {mine(
              'looked',
              <>
                looked through it in the <a href={preview}>preview tab</a> “as on its opening day”,
                wide and narrow
              </>,
            )}
            <Item done={!unpublished.length} auto>
              everything is published{unpublished.length ? <Names docs={unpublished} /> : null}
            </Item>
          </ul>
        </>
      ) : null}

      {during ? (
        <div className={before ? 'dim' : undefined}>
          <h3>when it opens{before && opens ? `, ${date(opens)}` : ''}</h3>
          <ul>
            {mine(
              'home',
              <>
                changed the words on{' '}
                <IntentLink intent="edit" params={{id: 'homePage', type: 'homePage'}}>
                  home
                </IntentLink>{' '}
                to say it’s showing
              </>,
            )}
            {mine('told', 'told people: instagram, and the newsletter if there’s a letter')}
            {copy('opened', 'once it looks right, a copy in the wayback machine')}
          </ul>
        </div>
      ) : null}

      <div className={during ? 'dim' : undefined}>
        <h3>when it closes{closes && during ? `, ${date(closes)}` : ''}</h3>
        <ul>
          {mine(
            'book',
            <>
              every entry in the visitors’ book is approved or turned down
              {data.checklist?.sheetUrl ? (
                <>
                  {' '}
                  (
                  <a href={data.checklist.sheetUrl} target="_blank" rel="noreferrer">
                    the sheet
                  </a>
                  )
                </>
              ) : null}
            </>,
          )}
          {copy('closed', 'then a second copy in the wayback machine, with the book')}
        </ul>
      </div>
    </section>
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
    // anything changed anywhere (an edit, a tick, the wayback action): look again.
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

  // a tick is kept in sanity, so it's the same on every computer.
  const tick = async (number: number, item: string) => {
    const _key = `${number}-${item}`
    const had = data?.checklist?.ticks?.some((t) => t._key === _key)
    const tx = client.transaction().createIfNotExists({_id: DOC, _type: 'todayChecklist'})
    await (
      had
        ? tx.patch(DOC, (p) => p.unset([`ticks[_key=="${_key}"]`]))
        : tx.patch(DOC, (p) =>
            p
              .setIfMissing({ticks: []})
              .append('ticks', [{_key, _type: 'tick', number, item, at: new Date().toISOString()}]),
          )
    ).commit()
    load()
  }

  if (!data)
    return (
      <div className="today">
        <style>{CSS}</style>
        <p className="dim">{error ? `couldn’t load: ${error}` : '…'}</p>
      </div>
    )

  const now = Date.parse(data.now)
  const drafts = new Set(data.drafts.map((d) => d._id))
  const ends = (e: Exhibition) =>
    e.opens ? Date.parse(e.opens) + (e.newFor ?? 30) * DAY : Infinity
  const closedCopy = (e: Exhibition) =>
    (data.checklist?.wayback ?? []).some(
      (c) => c.number === e.number && c.step === 'closed' && !c.failed?.length,
    )
  // what still needs you: everything not yet closed, and the last one to close until its second copy is made.
  const live = data.exhibitions.filter((e) => ends(e) > now)
  const lastClosed = data.exhibitions.find((e) => ends(e) <= now)
  const shown = [...live, ...(lastClosed && !closedCopy(lastClosed) ? [lastClosed] : [])].sort(
    (a, b) => a.number - b.number,
  )
  const older = data.exhibitions.filter((e) => ends(e) <= now && e !== lastClosed && !closedCopy(e))

  return (
    <div className="today">
      <style>{CSS}</style>
      <p>
        today, {date(now)} ·{' '}
        <a href={SITE_URL} target="_blank" rel="noreferrer">
          the site
        </a>
        {data.checklist?.sheetUrl ? (
          <>
            {' · '}
            <a href={data.checklist.sheetUrl} target="_blank" rel="noreferrer">
              the sheet
            </a>{' '}
            (visitors’ book, newsletter, messages)
          </>
        ) : null}
      </p>
      <p className="dim">
        the faint boxes tick themselves: from what’s in sanity, or, for the wayback machine, when
        the github action has saved the exhibition (its page, every work, the visitors’ book and the
        artists’ own sites). the others are yours to tick.
      </p>

      {shown.map((e) => (
        <Exhibit key={e._id} e={e} data={data} drafts={drafts} tick={tick} />
      ))}

      <section>
        <h3>not published yet</h3>
        {data.drafts.length ? (
          <ul>
            {data.drafts.map((d) => (
              <li key={d._id}>
                <span>
                  {KIND[d._type]}: <Open doc={d} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dim">everything is published.</p>
        )}
        {older.length ? (
          <p className="dim" style={{marginTop: 24}}>
            older exhibitions without a closing copy in the wayback machine:{' '}
            {older.map((e) => e.number).join(', ')}. to make one:{' '}
            <a href={WAYBACK} target="_blank" rel="noreferrer">
              github → wayback
            </a>{' '}
            → run workflow → its number → closed.
          </p>
        ) : null}
      </section>
    </div>
  )
}
