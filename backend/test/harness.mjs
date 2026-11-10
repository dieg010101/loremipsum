// runs lorem-ipsum.gs in node against stand-ins for the google services it uses,
// so its behaviour can be checked before it is deployed. node backend/test/harness.mjs
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = readFileSync(
  new URL("../lorem-ipsum.gs", import.meta.url),
  "utf8",
);

// ----------------------------------------------------------------- stand-ins

class Range {
  constructor(sheet, row, col, rows = 1, cols = 1) {
    Object.assign(this, { sheet, row, col, rows, cols });
  }
  getValues() {
    return Array.from({ length: this.rows }, (_, r) =>
      Array.from({ length: this.cols }, (_, c) =>
        this.sheet.cell(this.row + r, this.col + c),
      ),
    );
  }
  getValue() {
    return this.sheet.cell(this.row, this.col);
  }
  setValue(v) {
    this.sheet.set(this.row, this.col, v);
    return this;
  }
  insertCheckboxes() {
    for (let r = 0; r < this.rows; r++)
      if (this.sheet.cell(this.row + r, this.col) === "")
        this.sheet.set(this.row + r, this.col, false);
    return this;
  }
  getSheet() {
    return this.sheet;
  }
}

class Sheet {
  constructor(name) {
    this.name = name;
    this.data = [];
  }
  getName() {
    return this.name;
  }
  // like sheets: a leading ' marks text, and isn't part of the value.
  set(row, col, v) {
    while (this.data.length < row) this.data.push([]);
    this.data[row - 1][col - 1] =
      typeof v === "string" && v.startsWith("'") ? v.slice(1) : v;
  }
  cell(row, col) {
    return this.data[row - 1]?.[col - 1] ?? "";
  }
  appendRow(values) {
    const row = this.data.length + 1;
    values.forEach((v, i) => this.set(row, i + 1, v));
  }
  getLastRow() {
    return this.data.length;
  }
  getLastColumn() {
    return Math.max(0, ...this.data.map((r) => r.length));
  }
  getMaxRows() {
    return Math.max(1000, this.data.length);
  }
  getRange(row, col, rows, cols) {
    return new Range(this, row, col, rows, cols);
  }
  setFrozenRows() {}
}

function services() {
  const sheets = new Map();
  const props = new Map([
    ["SECRET", "s3cret"],
    ["SITE", "https://loremipsum.art"],
    ["NOTIFY", "gallery@example.test"],
  ]);
  const cache = new Map();
  const sent = [];
  let quota = 100;
  const drafts = [];
  const triggers = [];
  const fetched = [];
  // what SITE/openings.json answers.
  const site = { status: 200, open: [] };
  const send = (to) => {
    if (quota <= 0)
      throw new Error("Service invoked too many times for one day: email.");
    quota--;
    return to;
  };
  const g = {
    console,
    Date,
    JSON,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: (n) => sheets.get(n) ?? null,
        insertSheet: (n) => (sheets.set(n, new Sheet(n)), sheets.get(n)),
        getUrl: () => "https://docs.google.com/spreadsheets/d/x",
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => props.get(k) ?? null,
        setProperties: (o) =>
          Object.entries(o).forEach(([k, v]) => props.set(k, v)),
        deleteProperty: (k) => props.delete(k),
      }),
    },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (text) => ({ setMimeType: () => ({ text }) }),
    },
    HtmlService: {
      createHtmlOutput: (html) => ({ setTitle: () => ({ html }) }),
    },
    LockService: {
      getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => cache.get(k) ?? null,
        put: (k, v) => cache.set(k, v),
        remove: (k) => cache.delete(k),
      }),
    },
    Utilities: { getUuid: randomUUID },
    ScriptApp: {
      getService: () => ({
        getUrl: () => "https://script.google.com/macros/s/ID/exec",
      }),
      getProjectTriggers: () => [],
      deleteTrigger: () => {},
      newTrigger: (fn) => ({
        timeBased: () => ({
          everyDays: () => ({
            atHour: () => ({ create: () => triggers.push(`${fn} daily`) }),
          }),
          everyHours: () => ({ create: () => triggers.push(`${fn} hourly`) }),
        }),
      }),
    },
    MailApp: {
      getRemainingDailyQuota: () => quota,
      sendEmail: (a, subject, body) => {
        const m = typeof a === "object" ? a : { to: a, subject, body };
        send(m.to);
        sent.push({ via: "mail", ...m });
      },
    },
    GmailApp: {
      getDrafts: () => drafts,
      sendEmail: (to, subject, body, options) => {
        send(to);
        sent.push({ via: "gmail", to, subject, body, ...options });
      },
    },
    UrlFetchApp: {
      fetch: (url) => {
        fetched.push(url);
        return {
          getResponseCode: () => site.status,
          getContentText: () => JSON.stringify(site.open),
        };
      },
    },
    Session: {
      getEffectiveUser: () => ({ getEmail: () => "me@example.test" }),
    },
  };
  return {
    g,
    sheets,
    props,
    cache,
    sent,
    drafts,
    triggers,
    fetched,
    site,
    setQuota: (n) => (quota = n),
  };
}

// ------------------------------------------------------------------- the run

const world = services();
const context = vm.createContext(world.g);
vm.runInContext(source, context, { filename: "lorem-ipsum.gs" });
const call = (expression) => vm.runInContext(expression, context);
const post = (body) => {
  context.__body = JSON.stringify(body);
  return JSON.parse(call("doPost({ postData: { contents: __body } })").text);
};
const get = (params) => {
  context.__params = params;
  return call("doGet({ parameter: __params })").html;
};
const tokenFrom = (text, kind) =>
  text.match(new RegExp(`/newsletter/${kind}\\?token=([\\w-]+)`))[1];
const hash = "a".repeat(64);
const book = () => world.sheets.get("book");
const list = () => world.sheets.get("newsletter");

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`ok  ${name}`);
}

call("setup()");

test("setup makes the three tabs with their headers", () => {
  assert.deepEqual([...world.sheets.keys()].sort(), [
    "book",
    "contact",
    "newsletter",
  ]);
  assert.equal(book().cell(1, 6), "approved");
});

test("the wrong secret, or none, is refused", () => {
  assert.deepEqual(post({ action: "subscribe", email: "a@b.test" }), {
    error: "forbidden",
  });
  assert.deepEqual(
    post({ action: "subscribe", secret: "nope", email: "a@b.test" }),
    { error: "forbidden" },
  );
  assert.equal(list().getLastRow(), 1);
});

test("an unknown action and bad json are refused", () => {
  assert.deepEqual(post({ action: "drop", secret: "s3cret" }), {
    error: "unknown action",
  });
  assert.deepEqual(
    JSON.parse(call("doPost({ postData: { contents: '{nope' } })").text),
    { error: "bad request" },
  );
});

let confirmToken;
test("subscribing adds a waiting row and sends one confirmation", () => {
  assert.deepEqual(
    post({
      action: "subscribe",
      secret: "s3cret",
      email: " Ana@Example.test ",
      list: "newsletter",
      page: "https://loremipsum.art/",
    }),
    { ok: true },
  );
  assert.equal(list().getLastRow(), 2);
  assert.equal(list().cell(2, 1), "ana@example.test");
  assert.equal(list().cell(2, 3), "waiting");
  assert.equal(world.sent.length, 1);
  assert.match(world.sent[0].body, /our letters/);
  assert.doesNotMatch(
    world.sent[0].body,
    /script\.google\.com/,
    "no script links: spam filters distrust them",
  );
  assert.match(
    world.sent[0].body,
    /https:\/\/loremipsum\.art\/newsletter\/confirm\?token=/,
  );
  confirmToken = tokenFrom(world.sent[0].body, "confirm");
});

test("subscribing again while waiting resends, with a new token, and no new row", () => {
  post({
    action: "subscribe",
    secret: "s3cret",
    email: "ana@example.test",
    list: "newsletter",
  });
  assert.equal(list().getLastRow(), 2);
  assert.equal(world.sent.length, 2);
  const fresh = tokenFrom(world.sent[1].body, "confirm");
  assert.notEqual(fresh, confirmToken);
  assert.match(
    get({ confirm: confirmToken }),
    /expired/,
    "the old link no longer works",
  );
  confirmToken = fresh;
});

test("the confirm link confirms; signing up again says already", () => {
  assert.match(get({ confirm: confirmToken }), /on the list/);
  assert.equal(list().cell(2, 3), "confirmed");
  assert.deepEqual(
    post({ action: "subscribe", secret: "s3cret", email: "ana@example.test" }),
    { ok: true, already: true },
  );
  assert.equal(world.sent.length, 2, "no third email");
});

test("the same address on another list is its own row", () => {
  post({
    action: "subscribe",
    secret: "s3cret",
    email: "ana@example.test",
    list: "exhibition-15",
  });
  assert.equal(list().getLastRow(), 3);
  assert.match(world.sent.at(-1).body, /exhibition 15 opens/);
});

test("a bad address is refused and nothing is sent", () => {
  const before = world.sent.length;
  assert.deepEqual(
    post({ action: "subscribe", secret: "s3cret", email: "not an email" }),
    { error: "invalid" },
  );
  assert.equal(world.sent.length, before);
});

let entryId;
test("signing the book adds an unapproved line that is not shown", () => {
  const res = post({
    action: "sign",
    secret: "s3cret",
    exhibition: 14,
    line: "  it stayed   with me ",
    name: "a.",
    city: "lorem",
    tokenHash: hash,
  });
  assert.equal(res.ok, true);
  entryId = res.id;
  assert.equal(book().cell(2, 3), "it stayed with me");
  assert.equal(book().cell(2, 6), false);
  assert.deepEqual(
    post({ action: "entries", secret: "s3cret", exhibition: 14 }).entries,
    [],
  );
});

test("ticking approved shows it, once the edit clears the cache", () => {
  book().set(2, 6, true);
  call(
    "onEdit({ range: SpreadsheetApp.getActiveSpreadsheet().getSheetByName('book').getRange(2, 6) })",
  );
  const { entries } = post({
    action: "entries",
    secret: "s3cret",
    exhibition: 14,
  });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].line, "it stayed with me");
  assert.equal(entries[0].name, "a.");
  assert.ok(world.cache.has("book"), "kept in the cache");
  assert.deepEqual(
    post({ action: "entries", secret: "s3cret", exhibition: 13 }).entries,
    [],
  );
});

test("a line that looks like a formula is kept as text", () => {
  const res = post({
    action: "sign",
    secret: "s3cret",
    exhibition: 14,
    line: '=IMPORTXML("http://evil")',
    tokenHash: hash,
  });
  book().set(3, 6, true);
  call("forget()");
  const shown = post({
    action: "entries",
    secret: "s3cret",
    exhibition: 14,
  }).entries.find((e) => e.id === res.id);
  assert.equal(shown.line, '=IMPORTXML("http://evil")');
});

test("lines over 280 characters, empty lines and bad hashes are refused", () => {
  assert.deepEqual(
    post({
      action: "sign",
      secret: "s3cret",
      exhibition: 14,
      line: "x".repeat(281),
      tokenHash: hash,
    }),
    { error: "invalid" },
  );
  assert.deepEqual(
    post({
      action: "sign",
      secret: "s3cret",
      exhibition: 14,
      line: "   ",
      tokenHash: hash,
    }),
    { error: "invalid" },
  );
  assert.deepEqual(
    post({
      action: "sign",
      secret: "s3cret",
      exhibition: 14,
      line: "hi",
      tokenHash: "nope",
    }),
    { error: "invalid" },
  );
  assert.deepEqual(
    post({
      action: "sign",
      secret: "s3cret",
      exhibition: 0,
      line: "hi",
      tokenHash: hash,
    }),
    { error: "invalid" },
  );
});

test("only the writer can take a line down; its words leave the sheet", () => {
  assert.deepEqual(
    post({
      action: "takedown",
      secret: "s3cret",
      id: entryId,
      tokenHash: "b".repeat(64),
    }),
    { error: "forbidden" },
  );
  assert.deepEqual(
    post({
      action: "takedown",
      secret: "s3cret",
      id: entryId,
      tokenHash: hash,
    }),
    { ok: true },
  );
  assert.ok(
    !post({ action: "entries", secret: "s3cret", exhibition: 14 }).entries.some(
      (e) => e.id === entryId,
    ),
  );
  assert.equal(book().cell(2, 8), "taken down");
  assert.doesNotMatch(String(book().cell(2, 3)), /stayed/);
});

test("contact messages are archived", () => {
  assert.deepEqual(
    post({
      action: "contact",
      secret: "s3cret",
      name: "b",
      email: "b@example.test",
      about: "x",
      work: "14.2",
      message: "hello",
    }),
    { ok: true },
  );
  assert.equal(world.sheets.get("contact").cell(2, 6), "hello");
});

test("a letter goes to confirmed addresses only, a day at a time, and never twice", () => {
  // three more confirmed readers and one who never confirmed.
  for (const email of [
    "b@example.test",
    "c@example.test",
    "d@example.test",
    "e@example.test",
  ]) {
    post({ action: "subscribe", secret: "s3cret", email });
    if (email !== "e@example.test")
      get({ confirm: tokenFrom(world.sent.at(-1).body, "confirm") });
  }
  world.drafts.push({
    getMessage: () => ({
      getSubject: () => "letter no. 1",
      getPlainBody: () => "dear friends,",
      getBody: () => "<p>dear friends,</p>",
    }),
  });
  world.props.set("LETTER", "letter no. 1");
  world.props.set("LETTER_LIST", "newsletter");

  world.setQuota(7); // 7 left today, 5 kept back: 2 go.
  assert.equal(call("sendLetter()"), 2);
  world.setQuota(100); // the next day.
  assert.equal(call("sendLetter()"), 2);
  assert.equal(call("sendLetter()"), 0, "everyone has it");
  const letters = world.sent.filter((m) => m.via === "gmail");
  assert.deepEqual(letters.map((m) => m.to).sort(), [
    "ana@example.test",
    "b@example.test",
    "c@example.test",
    "d@example.test",
  ]);
  assert.ok(
    letters.every((m) => /\/newsletter\/leave\?token=[\w-]+/.test(m.body)),
    "each has its own way out",
  );
  assert.equal(
    world.props.has("LETTER"),
    false,
    "done, so the daily trigger stops",
  );
});

test("leaving works, and the next letter skips them", () => {
  const ana = world.sent.find(
    (m) => m.via === "gmail" && m.to === "ana@example.test",
  );
  assert.match(
    get({ leave: tokenFrom(ana.body, "leave") }),
    /won’t hear from us/,
  );
  assert.equal(list().cell(2, 3), "left");
  assert.ok(
    !call("recipients('newsletter', 'letter no. 2')").some(
      (r) => r.email === "ana@example.test",
    ),
  );
});

test("the daily run tells the gallery how many lines are waiting", () => {
  post({
    action: "sign",
    secret: "s3cret",
    exhibition: 14,
    line: "waiting line",
    tokenHash: hash,
  });
  const before = world.sent.length;
  call("daily()");
  const note = world.sent
    .slice(before)
    .find((m) => m.to === "gallery@example.test");
  assert.ok(note, "a note was sent");
  assert.match(note.subject, /1 line waiting/);
});

test("the site confirms and unsubscribes through the script", () => {
  post({
    action: "subscribe",
    secret: "s3cret",
    email: "f@example.test",
    list: "exhibition-16",
  });
  const token = tokenFrom(world.sent.at(-1).body, "confirm");
  assert.deepEqual(post({ action: "confirm", secret: "s3cret", token }), {
    ok: true,
    list: "exhibition-16",
  });
  assert.deepEqual(post({ action: "confirm", secret: "s3cret", token }), {
    ok: true,
    list: "exhibition-16",
    already: true,
  });
  assert.deepEqual(post({ action: "leave", secret: "s3cret", token }), {
    ok: true,
    list: "exhibition-16",
  });
  assert.deepEqual(
    post({ action: "confirm", secret: "s3cret", token: "not-a-real-token" }),
    { error: "expired" },
  );
  assert.deepEqual(post({ action: "leave", secret: "s3cret", token: "" }), {
    error: "expired",
  });
});

test("old script links in emails already sent still work", () => {
  post({ action: "subscribe", secret: "s3cret", email: "g@example.test" });
  assert.match(
    get({ confirm: tokenFrom(world.sent.at(-1).body, "confirm") }),
    /on the list/,
  );
});

// ------------------------------------------------------------- "it's open"

const signUp = (email, list) => {
  post({ action: "subscribe", secret: "s3cret", email, list });
  get({ confirm: tokenFrom(world.sent.at(-1).body, "confirm") });
};
const opening = (number, daysAgo) => ({
  number,
  title: "nemo <enim> & ipsam",
  opens: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  url: `https://loremipsum.art/exhibitions/${number}`,
  with: "duis aute, irure dolor",
});
const openingsSent = () => world.sent.filter((m) => / is open$/.test(m.subject));

test("setup also starts the hourly opening check", () => {
  assert.ok(world.triggers.includes("daily daily"));
  assert.ok(world.triggers.includes("openings hourly"));
});

test("before it opens, nobody hears anything", () => {
  world.setQuota(100);
  signUp("o1@example.test", "exhibition-20");
  signUp("o2@example.test", "exhibition-20");
  post({ action: "subscribe", secret: "s3cret", email: "o3@example.test", list: "exhibition-20" }); // never confirmed
  world.site.open = [opening(19, 40)];
  assert.equal(call("openings()"), 0);
  assert.equal(world.fetched.at(-1), "https://loremipsum.art/openings.json");
});

test("once it's open, each confirmed address gets one email, once", () => {
  world.site.open = [opening(20, 0.01), opening(19, 40)];
  assert.equal(call("openings()"), 2);
  const mails = openingsSent();
  assert.deepEqual(mails.map((m) => m.to).sort(), ["o1@example.test", "o2@example.test"]);
  assert.equal(mails[0].subject, "exhibition 20, nemo <enim> & ipsam, is open");
  assert.match(mails[0].body, /https:\/\/loremipsum\.art\/exhibitions\/20/);
  assert.match(mails[0].body, /with duis aute, irure dolor/);
  assert.match(mails[0].htmlBody, /nemo &lt;enim&gt; &amp; ipsam/, "the title is escaped in html");
  assert.equal(call("openings()"), 0, "the next hour sends nothing more");
});

test("a newsletter going out at the same time is not disturbed", () => {
  const row = list().data.findIndex((r) => r[0] === "o1@example.test") + 1;
  assert.equal(list().cell(row, 8), "opening");
  const news = list().data.filter((r) => r[1] === "newsletter");
  assert.ok(news.every((r) => r[7] !== "opening"));
});

test("over the day's quota, the rest go the next hour", () => {
  signUp("o4@example.test", "exhibition-21");
  signUp("o5@example.test", "exhibition-21");
  world.site.open = [opening(21, 0.5)];
  world.setQuota(6);
  assert.equal(call("openings()"), 1, "keeps five for confirmations");
  world.setQuota(100);
  assert.equal(call("openings()"), 1);
  assert.equal(call("openings()"), 0);
});

test("more than two weeks after opening, nobody is written to", () => {
  signUp("o6@example.test", "exhibition-22");
  world.site.open = [opening(22, 15)];
  assert.equal(call("openings()"), 0);
});

test("the site being down sends nothing and breaks nothing", () => {
  signUp("o7@example.test", "exhibition-23");
  world.site.open = [opening(23, 0.1)];
  world.site.status = 503;
  assert.equal(call("openings()"), 0);
  world.site.status = 200;
  world.site.open = "<html>";
  assert.equal(call("openings()"), 0);
  world.site.open = [opening(23, 0.1)];
  assert.equal(call("openings()"), 1);
});

console.log(`\n${passed} passed`);
