/* DNS resolution visualizer (Kurose §2.4): iterative vs recursive, with caching. */
(function () {
  'use strict';
  var CN = window.CN;

  function names(host) {
    var parts = host.toLowerCase().replace(/[^a-z0-9.-]/g, '').split('.').filter(Boolean);
    if (parts.length < 2) parts = ['gaia', 'cs', 'umass', 'edu'];
    var tld = parts[parts.length - 1], dom = parts.slice(-2).join('.');
    return { host: parts.join('.'), tld: tld, dom: dom, tldServer: 'a.' + tld + '-servers.net', auth: 'dns.' + dom };
  }

  function build(c) {
    var N = names(c.host), msgs = [], notes = [], steps = [], t = 0, ms = 0;
    var A = { tld: '192.5.6.30', auth: '128.119.40.111', host: '128.119.245.12' };
    var lanes = [{ name: 'Requesting host', sub: 'cse.nyu.edu' }, { name: 'Local DNS', sub: 'dns.nyu.edu' }, { name: 'Root DNS', sub: 'one of 13' }, { name: 'TLD DNS', sub: '.' + N.tld }, { name: 'Authoritative', sub: N.auth }];
    function msg(from, to, label, kind, half) {
      msgs.push({ from: from, to: to, t0: t, t1: t + 1, label: label, kind: kind });
      t += 1; ms += half;
    }
    function step(title, text) { steps.push({ t: t, title: title, text: text, ms: ms }); }
    var rr = {
      root: 'Referral: (' + N.tld + ', ' + N.tldServer + ', NS) and glue (' + N.tldServer + ', ' + A.tld + ', A)',
      tld: 'Referral: (' + N.dom + ', ' + N.auth + ', NS) and glue (' + N.auth + ', ' + A.auth + ', A)',
      ans: 'Answer: (' + N.host + ', ' + A.host + ', A), TTL 2 days'
    };
    msg(0, 1, '1. query ' + N.host + ' (A?)', 'data', c.r1 / 2);
    step('Host asks its local DNS server', 'The application calls the resolver, which sends a DNS query message (UDP, destination port 53) to the local DNS server learned from DHCP. This query is <b>recursive</b>: the host wants the final answer. Elapsed: ' + ms + ' ms.');
    if (c.cache === 'answer') {
      msg(1, 0, '2. ' + N.host + ' = ' + A.host, 'ack', c.r1 / 2);
      notes.push({ lane: 1, t: 1, text: 'cache hit', cls: 'good' });
      step('Local DNS answers from its cache', 'The mapping is already cached (from an earlier lookup within the TTL), so the local server replies immediately with a non-authoritative answer. No root, TLD or authoritative server is contacted. Total: <b>' + ms + ' ms</b>.');
      return { lanes: lanes, msgs: msgs, notes: notes, steps: steps, total: ms };
    }
    var n = 2;
    if (c.mode === 'iterative') {
      if (c.cache !== 'tld') {
        msg(1, 2, n++ + '. query ' + N.host, 'data', c.r2 / 2);
        step('Local DNS asks a root server', 'The local server forwards the query to a root DNS server. Root servers don\'t know host addresses; they know who runs each top-level domain. Elapsed: ' + ms + ' ms.');
        msg(2, 1, n++ + '. try .' + N.tld + ' TLD', 'ack', c.r2 / 2);
        step('Root replies with a referral to the .' + N.tld + ' TLD servers', rr.root + '. This is an <b>iterative</b> reply: “I don\'t know, ask them.” Elapsed: ' + ms + ' ms.');
      } else {
        notes.push({ lane: 1, t: 1, text: 'TLD address cached: skip root', cls: 'good' });
      }
      msg(1, 3, n++ + '. query ' + N.host, 'data', c.r3 / 2);
      step('Local DNS asks the .' + N.tld + ' TLD server', 'Elapsed: ' + ms + ' ms.');
      msg(3, 1, n++ + '. try ' + N.auth, 'ack', c.r3 / 2);
      step('TLD replies with a referral to the authoritative server', rr.tld + '. Elapsed: ' + ms + ' ms.');
      msg(1, 4, n++ + '. query ' + N.host, 'data', c.r4 / 2);
      step('Local DNS asks the authoritative server', 'Elapsed: ' + ms + ' ms.');
      msg(4, 1, n++ + '. ' + A.host, 'ack', c.r4 / 2);
      step('Authoritative server returns the type A record', rr.ans + '. The local server caches it (and the referrals) for future queries. Elapsed: ' + ms + ' ms.');
    } else {
      if (c.cache !== 'tld') {
        msg(1, 2, n++ + '. query ' + N.host, 'data', c.r2 / 2);
        step('Local DNS asks the root server, recursively', 'In a fully recursive resolution, each server takes on the job of finding the answer. Elapsed: ' + ms + ' ms.');
        msg(2, 3, n++ + '. query ' + N.host, 'data', c.r3 / 2);
        step('Root forwards the query to the .' + N.tld + ' TLD server', 'Recursive: the root server itself queries the next server down. Elapsed: ' + ms + ' ms.');
      } else {
        notes.push({ lane: 1, t: 1, text: 'TLD address cached: skip root', cls: 'good' });
        msg(1, 3, n++ + '. query ' + N.host, 'data', c.r3 / 2);
        step('Local DNS asks the TLD server (its address is cached)', 'Elapsed: ' + ms + ' ms.');
      }
      msg(3, 4, n++ + '. query ' + N.host, 'data', c.r4 / 2);
      step('TLD forwards the query to the authoritative server', 'Elapsed: ' + ms + ' ms.');
      msg(4, 3, n++ + '. ' + A.host, 'ack', c.r4 / 2);
      step('Authoritative server answers the TLD server', rr.ans + '. Elapsed: ' + ms + ' ms.');
      if (c.cache !== 'tld') {
        msg(3, 2, n++ + '. ' + A.host, 'ack', c.r3 / 2);
        step('The answer travels back through the root', 'Every server on the way back can cache the result. Elapsed: ' + ms + ' ms.');
        msg(2, 1, n++ + '. ' + A.host, 'ack', c.r2 / 2);
        step('Root returns the answer to the local DNS server', 'Recursive queries put the burden on the higher-level servers, which is why root and TLD servers normally only answer iteratively. Elapsed: ' + ms + ' ms.');
      } else {
        msg(3, 1, n++ + '. ' + A.host, 'ack', c.r3 / 2);
        step('TLD returns the answer to the local DNS server', 'Elapsed: ' + ms + ' ms.');
      }
    }
    msg(1, 0, n++ + '. ' + N.host + ' = ' + A.host, 'ack', c.r1 / 2);
    step('Local DNS returns the address to the host', 'The host can now open a TCP connection to ' + A.host + '. Total DNS delay = <b>' + ms + ' ms</b> (' + (n - 1) + ' messages). Run it again with “Already has the answer” to see caching in action.');
    return { lanes: lanes, msgs: msgs, notes: notes, steps: steps, total: ms };
  }

  var tl = new CN.Timeline(CN.$('#stage'), { width: 860, unitPx: 52, margin: 80 });
  var cur = null;
  var player = new CN.Player({ steps: [], unitMs: 700, render: function (T) { tl.draw(T); }, onStep: paint });
  CN.controls(CN.$('#controls'), player);
  CN.stepPanel(CN.$('#now'), CN.$('#steplist'), player);
  function paint(i) {
    if (!cur) return;
    var ms = i >= 0 ? cur.steps[i].ms : 0;
    CN.$('#state').innerHTML = '<div class="tw"><table><tbody><tr><td>Elapsed DNS time</td><td class="mono"><b>' + ms + ' ms</b></td></tr><tr><td>Total for this lookup</td><td class="mono">' + cur.total + ' ms</td></tr><tr><td>Messages</td><td class="mono">' + cur.msgs.length + '</td></tr><tr><td>Transport</td><td>UDP, port 53</td></tr></tbody></table></div>' +
      '<p class="srcline" style="margin:6px 0 0">IP addresses shown are illustrative (they match Kurose\'s example).</p>';
  }
  function run() {
    var c = { mode: CN.$('#mode').value, host: CN.$('#host').value || 'gaia.cs.umass.edu', cache: CN.$('#cache').value, r1: +CN.$('#r1').value || 0, r2: +CN.$('#r2').value || 0, r3: +CN.$('#r3').value || 0, r4: +CN.$('#r4').value || 0 };
    cur = build(c);
    tl.setModel({ lanes: cur.lanes, msgs: cur.msgs, notes: cur.notes, timers: [] });
    player.load(cur.steps);
  }
  ['#mode', '#cache'].forEach(function (s) { CN.$(s).addEventListener('change', run); });
  CN.$('#apply').addEventListener('click', run);
  run();
})();
