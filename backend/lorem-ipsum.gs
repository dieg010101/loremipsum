/**
 * lorem ipsum: everything visitors send us, kept in one google sheet.
 *
 * sanity holds the art and the writing. this sheet holds what people send: the
 * newsletter list, the visitors' book and the contact messages. it is the archive,
 * it is where the book is approved (one tick per line), and the letters to the
 * list are sent from here, from your own gmail, for free.
 *
 * tabs (made by setup):
 *   newsletter  one row per address and list. "newsletter" is the letters; "exhibition-15"
 *               is "tell me when it opens". status: waiting → confirmed (or left).
 *   book        one row per line. tick "approved" and it shows on the site within a
 *               few minutes. untick to take it down again. nothing is ever deleted.
 *   contact     a copy of every message sent through the contact form.
 *
 * set up (about ten minutes, once):
 *   1. make a google sheet. extensions → apps script. paste this whole file in. save.
 *   2. project settings (the cog) → script properties → add:
 *        SECRET   a long random string. the site's BACKEND_SECRET is the same string.
 *        SITE     the site's address, e.g. https://loremipsum-49z.pages.dev (no slash at the end)
 *        NOTIFY   the address that gets "3 lines are waiting in the visitors' book".
 *   3. in the editor pick setup, press run, and allow what it asks (the sheet, sending
 *      email as you, and its own triggers).
 *   4. deploy → new deployment → type: web app. execute as: me. who has access: anyone.
 *      the web app address it gives you is the site's BACKEND_URL.
 *   after changing this file: deploy → manage deployments → edit → new version,
 *   so the address stays the same.
 *
 * sending a letter (menu "lorem ipsum" in the sheet):
 *   write the letter in gmail as a draft with its subject. plain text reads best.
 *   then "send a letter…", type the subject, and choose the list. it goes to every
 *   confirmed address on that list, as many a day as google allows (about 100 on a
 *   personal account, 1,500 on google workspace), and carries on by itself each day
 *   until everyone has it. "send a test to myself" first is a good habit.
 *
 * the site talks to this script with POST { action, secret, ... } as json:
 *   subscribe  { email, list, page }                    → { ok, already? }
 *   sign       { exhibition, line, name, city, tokenHash } → { ok, id }
 *   takedown   { id, tokenHash }                        → { ok }
 *   entries    { exhibition }                           → { ok, entries: [...] }
 *   contact    { name, email, about, work, message }    → { ok }
 *   confirm    { token }                              → { ok, list, already? }
 *   leave      { token }                              → { ok, list }
 * the links in the emails go to SITE/newsletter/confirm and /leave, which call those two.
 */

// ------------------------------------------------------------------ the sheet

const TABS = {
  newsletter: [
    "email",
    "list",
    "status",
    "signed up",
    "confirmed",
    "page",
    "token",
    "last letter",
  ],
  book: [
    "id",
    "exhibition",
    "line",
    "name",
    "city",
    "approved",
    "written",
    "status",
    "token hash",
  ],
  contact: ["date", "name", "email", "about", "work", "message"],
};
// columns, counted from 1 as the sheet does.
const N = {
  email: 1,
  list: 2,
  status: 3,
  signedUp: 4,
  confirmed: 5,
  page: 6,
  token: 7,
  lastLetter: 8,
};
const B = {
  id: 1,
  exhibition: 2,
  line: 3,
  name: 4,
  city: 5,
  approved: 6,
  written: 7,
  status: 8,
  tokenHash: 9,
};

const BOOK_LIMIT = 280;
const CACHE_KEY = "book";
const CACHE_SECONDS = 300;

function setup() {
  for (const name of Object.keys(TABS)) {
    const sheet = tab(name);
    if (sheet.getLastRow() === 0) sheet.appendRow(TABS[name]);
    sheet.setFrozenRows(1);
  }
  // no column of empty checkboxes here: an unticked box counts as a filled row, and new
  // lines would land under the last one. each line gets its own box as it arrives.

  // once a day: say if lines are waiting, and carry on sending a letter.
  for (const trigger of ScriptApp.getProjectTriggers())
    ScriptApp.deleteTrigger(trigger);
  ScriptApp.newTrigger("daily").timeBased().everyDays(1).atHour(9).create();
  MailApp.getRemainingDailyQuota(); // asks for permission to send email.
}

function tab(name) {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  return book.getSheetByName(name) || book.insertSheet(name);
}

/** every row under the header, as arrays. */
function rowsOf(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getValues();
}

const prop = (key) =>
  PropertiesService.getScriptProperties().getProperty(key) || "";
const out = (body) =>
  ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON,
  );
const clean = (value, max) =>
  String(value == null ? "" : value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
const looksLikeEmail = (s) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 254;
// a sheet turns "=…" into a formula: keep what people type as text.
const safe = (s) => (/^[=+\-@]/.test(s) ? `'${s}` : s);

// ------------------------------------------------------------------ the site

function doPost(event) {
  let body;
  try {
    body = JSON.parse(event.postData.contents);
  } catch (error) {
    return out({ error: "bad request" });
  }
  if (!prop("SECRET") || body.secret !== prop("SECRET"))
    return out({ error: "forbidden" });

  const actions = {
    subscribe,
    confirm,
    leave,
    sign,
    takedown,
    entries,
    contact,
  };
  const action = actions[body.action];
  if (!action) return out({ error: "unknown action" });

  // one at a time, so two quick clicks never make two rows.
  const lock = LockService.getScriptLock();
  if (body.action !== "entries" && !lock.tryLock(15000))
    return out({ error: "busy" });
  try {
    return out(action(body));
  } catch (error) {
    console.error(body.action, error);
    return out({ error: "failed" });
  } finally {
    if (body.action !== "entries") lock.releaseLock();
  }
}

/**
 * the links in the emails point at the site (SITE/newsletter/confirm?token=…), not at
 * this script: spam filters distrust script.google.com links. the site then asks this
 * script with the confirm and leave actions. links sent before that still work here.
 */
function doGet(event) {
  const params = (event && event.parameter) || {};
  if (params.confirm) {
    const r = confirm({ token: params.confirm });
    return page(
      r.ok
        ? "done. you’re on the list."
        : "that link has expired. you can sign up again on the site.",
    );
  }
  if (params.leave) {
    const r = leave({ token: params.leave });
    return page(
      r.ok ? "done. you won’t hear from us again." : "that link has expired.",
    );
  }
  return page("nothing to do here.");
}

function rowFor(token) {
  token = String(token || "");
  if (!/^[\w-]{8,64}$/.test(token)) return null;
  const sheet = tab("newsletter");
  const at = rowsOf(sheet).findIndex((r) => r[N.token - 1] === token);
  return at < 0 ? null : { sheet, row: at + 2 };
}

function confirm(body) {
  const found = rowFor(body.token);
  if (!found) return { error: "expired" };
  const { sheet, row } = found;
  const list = String(sheet.getRange(row, N.list).getValue());
  if (sheet.getRange(row, N.status).getValue() === "confirmed")
    return { ok: true, list, already: true };
  sheet.getRange(row, N.status).setValue("confirmed");
  sheet.getRange(row, N.confirmed).setValue(new Date());
  return { ok: true, list };
}

function leave(body) {
  const found = rowFor(body.token);
  if (!found) return { error: "expired" };
  const { sheet, row } = found;
  sheet.getRange(row, N.status).setValue("left");
  return { ok: true, list: String(sheet.getRange(row, N.list).getValue()) };
}

/** where a link in an email goes: the site, or this script if SITE isn't set. */
function link(kind, token) {
  const site = prop("SITE").replace(/\/+$/, "");
  return site
    ? `${site}/newsletter/${kind}?token=${token}`
    : `${ScriptApp.getService().getUrl()}?${kind}=${token}`;
}

function subscribe(body) {
  const email = clean(body.email, 254).toLowerCase();
  const list =
    clean(body.list || "newsletter", 40).replace(/[^a-z0-9-]/gi, "") ||
    "newsletter";
  if (!looksLikeEmail(email)) return { error: "invalid" };

  const sheet = tab("newsletter");
  const rows = rowsOf(sheet);
  const at = rows.findIndex(
    (r) =>
      String(r[N.email - 1]).toLowerCase() === email && r[N.list - 1] === list,
  );
  if (at >= 0 && rows[at][N.status - 1] === "confirmed")
    return { ok: true, already: true };

  // new, or waiting, or left before: (re)send the confirmation with a fresh token.
  const token = Utilities.getUuid();
  if (at >= 0) {
    sheet.getRange(at + 2, N.status).setValue("waiting");
    sheet.getRange(at + 2, N.token).setValue(token);
  } else {
    sheet.appendRow([
      email,
      list,
      "waiting",
      new Date(),
      "",
      safe(clean(body.page, 300)),
      token,
      "",
    ]);
  }
  askToConfirm(email, list, token);
  return { ok: true };
}

function sign(body) {
  const exhibition = Number(body.exhibition);
  const line = clean(body.line, BOOK_LIMIT + 1);
  if (!Number.isInteger(exhibition) || exhibition < 1)
    return { error: "invalid" };
  if (!line || line.length > BOOK_LIMIT) return { error: "invalid" };
  if (!/^[0-9a-f]{64}$/.test(String(body.tokenHash)))
    return { error: "invalid" };

  const id = Utilities.getUuid();
  const sheet = tab("book");
  sheet.appendRow([
    id,
    exhibition,
    safe(line),
    safe(clean(body.name, 60)),
    safe(clean(body.city, 60)),
    false,
    new Date(),
    "",
    body.tokenHash,
  ]);
  sheet.getRange(sheet.getLastRow(), B.approved).insertCheckboxes();
  return { ok: true, id };
}

/** the writer takes their own line down: it leaves the site, and its words leave the sheet. */
function takedown(body) {
  const sheet = tab("book");
  const rows = rowsOf(sheet);
  const at = rows.findIndex((r) => r[B.id - 1] === body.id);
  if (at < 0 || !body.tokenHash || rows[at][B.tokenHash - 1] !== body.tokenHash)
    return { error: "forbidden" };
  const row = at + 2;
  sheet.getRange(row, B.approved).setValue(false);
  sheet.getRange(row, B.line).setValue("(taken down by its writer)");
  sheet.getRange(row, B.status).setValue("taken down");
  forget();
  return { ok: true };
}

/** the approved lines for one exhibition, newest first. */
function entries(body) {
  const exhibition = Number(body.exhibition);
  return { ok: true, entries: approved()[exhibition] || [] };
}

function contact(body) {
  tab("contact").appendRow([
    new Date(),
    safe(clean(body.name, 200)),
    safe(clean(body.email, 254)),
    safe(clean(body.about, 300)),
    safe(clean(body.work, 40)),
    safe(String(body.message || "").slice(0, 10000)),
  ]);
  return { ok: true };
}

// --------------------------------------------------------------- the book

/** every approved line, by exhibition. kept for a few minutes; any edit clears it. */
function approved() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get(CACHE_KEY);
  if (hit) return JSON.parse(hit);

  const byExhibition = {};
  for (const r of rowsOf(tab("book"))) {
    if (r[B.approved - 1] !== true || r[B.status - 1] === "taken down")
      continue;
    const n = Number(r[B.exhibition - 1]);
    const written =
      r[B.written - 1] instanceof Date
        ? r[B.written - 1]
        : new Date(r[B.written - 1]);
    (byExhibition[n] = byExhibition[n] || []).push({
      id: String(r[B.id - 1]),
      line: unsafe(r[B.line - 1]),
      name: unsafe(r[B.name - 1]) || null,
      city: unsafe(r[B.city - 1]) || null,
      date: written.toISOString(),
    });
  }
  for (const n of Object.keys(byExhibition))
    byExhibition[n].sort((a, b) => b.date.localeCompare(a.date));
  try {
    cache.put(CACHE_KEY, JSON.stringify(byExhibition), CACHE_SECONDS);
  } catch (error) {
    // over the cache's 100 kb: read the sheet each time instead.
  }
  return byExhibition;
}

const unsafe = (v) => String(v == null ? "" : v);

function forget() {
  CacheService.getScriptCache().remove(CACHE_KEY);
}

/** ticking "approved" (or any edit to the book) shows on the site at the next look. */
function onEdit(event) {
  if (event && event.range && event.range.getSheet().getName() === "book")
    forget();
}

// --------------------------------------------------------------- the mail

function askToConfirm(email, list, token) {
  const site = prop("SITE").replace(/\/+$/, "") || "https://loremipsum.art";
  const what =
    list === "newsletter"
      ? "our letters, about four a year"
      : `one email when exhibition ${list.replace("exhibition-", "")} opens`;
  // one link, to our own site, in plain words: what spam filters trust most.
  MailApp.sendEmail({
    to: email,
    subject: "one click to finish signing up to lorem ipsum",
    name: "lorem ipsum",
    body: [
      "hello,",
      "",
      `thank you for signing up for ${what}. to finish, open this link:`,
      "",
      link("confirm", token),
      "",
      "if you didn’t sign up, ignore this email and you won’t hear from us again.",
      "",
      "lorem ipsum",
      site,
    ].join("\n"),
  });
}

function page(message) {
  const site = prop("SITE") || "https://loremipsum.art";
  return HtmlService.createHtmlOutput(
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
      `<body style="font:13px/18px 'Helvetica Neue',Helvetica,Arial,sans-serif;margin:8px">` +
      `<p>${message}</p><p><a href="${site}" style="color:#0000ee">back to lorem ipsum</a></p></body>`,
  ).setTitle("lorem ipsum");
}

// ------------------------------------------------------------- the letters

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("lorem ipsum")
    .addItem("send a letter…", "chooseLetter")
    .addItem("send a test to myself…", "testLetter")
    .addItem("how many can i send today?", "quota")
    .addToUi();
}

function chooseLetter() {
  const ui = SpreadsheetApp.getUi();
  const subject = ui
    .prompt("the subject of the gmail draft to send")
    .getResponseText()
    .trim();
  if (!subject || !draftFor(subject))
    return ui.alert(`no draft in gmail with the subject “${subject}”.`);
  const list =
    ui
      .prompt('which list? "newsletter", or "exhibition-15" for its opening')
      .getResponseText()
      .trim() || "newsletter";
  const waiting = recipients(list, subject).length;
  if (
    ui.alert(
      `send “${subject}” to ${waiting} confirmed address${waiting === 1 ? "" : "es"} on ${list}?`,
      ui.ButtonSet.YES_NO,
    ) !== ui.Button.YES
  )
    return;
  PropertiesService.getScriptProperties().setProperties({
    LETTER: subject,
    LETTER_LIST: list,
  });
  const sent = sendLetter();
  ui.alert(
    `${sent} sent today.${recipients(list, subject).length ? " the rest go out over the next days, by themselves." : ""}`,
  );
}

function testLetter() {
  const ui = SpreadsheetApp.getUi();
  const subject = ui
    .prompt("the subject of the gmail draft")
    .getResponseText()
    .trim();
  const draft = draftFor(subject);
  if (!draft) return ui.alert(`no draft with the subject “${subject}”.`);
  const me = Session.getEffectiveUser().getEmail();
  deliver(draft, me, link("leave", "test"));
  ui.alert(`sent to ${me}.`);
}

function quota() {
  SpreadsheetApp.getUi().alert(
    `${MailApp.getRemainingDailyQuota()} emails left today.`,
  );
}

function draftFor(subject) {
  return (
    GmailApp.getDrafts().find((d) => d.getMessage().getSubject() === subject) ||
    null
  );
}

/** confirmed addresses on the list that haven't had this letter. */
function recipients(list, subject) {
  return rowsOf(tab("newsletter"))
    .map((r, i) => ({
      row: i + 2,
      email: r[N.email - 1],
      token: r[N.token - 1],
      list: r[N.list - 1],
      status: r[N.status - 1],
      last: r[N.lastLetter - 1],
    }))
    .filter(
      (r) => r.list === list && r.status === "confirmed" && r.last !== subject,
    );
}

/** sends as many of the current letter as today allows. returns how many went. */
function sendLetter() {
  const subject = prop("LETTER");
  const list = prop("LETTER_LIST") || "newsletter";
  if (!subject) return 0;
  const draft = draftFor(subject);
  if (!draft) return 0;

  const sheet = tab("newsletter");
  // keep a few for confirmation emails today.
  const room = Math.max(0, MailApp.getRemainingDailyQuota() - 5);
  const batch = recipients(list, subject).slice(0, room);
  for (const r of batch) {
    deliver(draft, r.email, link("leave", r.token));
    sheet.getRange(r.row, N.lastLetter).setValue(subject);
  }
  if (!recipients(list, subject).length)
    PropertiesService.getScriptProperties().deleteProperty("LETTER");
  return batch.length;
}

/** one copy of the draft, to one person, with their own way to leave. */
function deliver(draft, to, leave) {
  const message = draft.getMessage();
  const footer = `\n\n-- \nlorem ipsum art group\nto stop getting these letters: ${leave}`;
  GmailApp.sendEmail(
    to,
    message.getSubject(),
    message.getPlainBody() + footer,
    {
      htmlBody: `${message.getBody()}<p style="color:#555;font-size:12px">-- <br>lorem ipsum art group<br><a href="${leave}">stop getting these letters</a></p>`,
      name: "lorem ipsum",
    },
  );
}

/** the daily trigger: carry on with a letter, then say if lines are waiting. */
function daily() {
  sendLetter();
  const waiting = rowsOf(tab("book")).filter(
    (r) =>
      r[B.approved - 1] !== true &&
      r[B.status - 1] !== "taken down" &&
      r[B.status - 1] !== "refused",
  ).length;
  if (waiting && prop("NOTIFY"))
    MailApp.sendEmail(
      prop("NOTIFY"),
      `${waiting} line${waiting === 1 ? "" : "s"} waiting in the visitors’ book`,
      `tick "approved" to put them up, or write "refused" in the status column.\n\n${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`,
    );
}
