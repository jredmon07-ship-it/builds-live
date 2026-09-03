/* ==========================================================================
   HALDEN WATCH CO. — main.js
   Hand-rolled motion layer. Classic script, file://-safe, no modules, no libs.
   Enhancement ONLY: with this file absent the site is complete and readable.
   Native scroll discipline: everything below READS scroll position; nothing
   calls preventDefault on wheel/touch, nothing sets scrollTop.
   ========================================================================== */
(function () {
  "use strict";

  var d = document, w = window, html = d.documentElement;

  /* ------------------------------------------------------------------ *
   * 0 · Motion state (media query + footer toggle, honored identically)
   * ------------------------------------------------------------------ */
  var mq = w.matchMedia ? w.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  function storedPref() {
    try { return localStorage.getItem("haldenMotion"); } catch (e) { return null; }
  }
  function reduced() { return mq.matches || storedPref() === "reduced"; }
  function motionOn() { return html.classList.contains("motion-on"); }

  function applyMotionState() {
    var toggles = d.querySelectorAll("[data-motion-toggle]");
    if (reduced()) {
      html.setAttribute("data-motion", "reduced");
      html.classList.remove("motion-on");
      teardownVideo();
    } else {
      html.removeAttribute("data-motion");
      html.classList.add("motion-on");
      setupVideo();
    }
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].setAttribute("aria-pressed", reduced() ? "true" : "false");
    }
  }
  if (mq.addEventListener) mq.addEventListener("change", applyMotionState);
  applyMotionState();   /* set html.motion-on BEFORE the initializers below read it */

  /* ------------------------------------------------------------------ *
   * 1 · Shared rAF ticker (one loop; sleeps off-tab; tasks early-out)
   * ------------------------------------------------------------------ */
  var tasks = [];
  var rafOn = true;
  d.addEventListener("visibilitychange", function () {
    rafOn = !d.hidden;
    if (rafOn) w.requestAnimationFrame(tick);
  });
  function tick(now) {
    if (!rafOn) return;
    for (var i = 0; i < tasks.length; i++) tasks[i](now);
    w.requestAnimationFrame(tick);
  }
  w.requestAnimationFrame(tick);

  /* ------------------------------------------------------------------ *
   * 2 · Preloader wordmark draw-in (~1.6s; sessionStorage gate; JS-only)
   * ------------------------------------------------------------------ */
  (function preloader() {
    var seen = false;
    try { seen = !!sessionStorage.getItem("haldenSeen"); } catch (e) {}
    if (seen || !motionOn()) return;
    try { sessionStorage.setItem("haldenSeen", "1"); } catch (e) {}
    var el = d.createElement("div");
    el.className = "loader";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div>' +
      '<svg class="loader__mark" viewBox="0 0 48 48" fill="none">' +      /* the monogram seal draws itself in */
      '<circle class="stroke ring" cx="24" cy="24" r="21.5" stroke="currentColor" stroke-width="1.8"/>' +
      '<path class="stroke" d="M18.8 14v20" stroke="currentColor" stroke-width="3.2"/>' +
      '<path class="stroke" d="M29.2 14v20" stroke="currentColor" stroke-width="3.2"/>' +
      '<path class="stroke" d="M18.8 24h3.3" stroke="currentColor" stroke-width="2.2"/>' +
      '<path class="stroke" d="M25.9 24h3.3" stroke="currentColor" stroke-width="2.2"/>' +
      '<circle class="jewel" cx="24" cy="24" r="1.8" fill="#C8A35B"/>' +
      '</svg>' +
      '<div class="loader__word" aria-hidden="true"></div>' +
      '</div>';
    var word = el.querySelector(".loader__word");
    "HALDEN".split("").forEach(function (ch, i) {
      var s = d.createElement("span");
      s.textContent = ch;
      s.style.setProperty("--i", i);
      word.appendChild(s);
    });
    d.body.appendChild(el);
    w.setTimeout(function () {
      el.classList.add("is-done");
      w.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
    }, 1500);
  })();

  /* ------------------------------------------------------------------ *
   * 3 · Smart header (hide down past 100px, show up, shrink past 8%)
   * ------------------------------------------------------------------ */
  (function header() {
    var hdr = d.querySelector("[data-hdr]");
    if (!hdr) return;
    var lastY = w.scrollY;
    w.addEventListener("scroll", function () {
      var y = w.scrollY;
      hdr.classList.toggle("is-shrunk", y > w.innerHeight * 0.08);
      if (y > 100 && y > lastY + 4) hdr.classList.add("is-hidden");
      else if (y < lastY - 4 || y <= 100) hdr.classList.remove("is-hidden");
      d.body.classList.toggle("hdr-hidden", hdr.classList.contains("is-hidden"));
      lastY = y;
    }, { passive: true });
  })();

  /* ------------------------------------------------------------------ *
   * 4 · Side-drawer menu (JS-only; no-JS keeps the plain anchor list)
   * ------------------------------------------------------------------ */
  (function menu() {
    var btn = d.querySelector("[data-menu-btn]");
    var pane = d.querySelector("[data-menu]");
    if (!btn || !pane) return;
    pane.removeAttribute("hidden");
    var links = pane.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) links[i].closest("li") &&
      links[i].closest("li").style.setProperty("--i", i);
    var open = false;
    function setOpen(v) {
      open = v;
      pane.classList.toggle("is-open", v);
      btn.setAttribute("aria-expanded", v ? "true" : "false");
      d.body.classList.toggle("menu-open", v);
      /* R54: focusing the first LINK painted a heavy focus ring on "Home" the
         moment the drawer opened, which read as a rendering bug. Focus the panel
         instead — keyboard users still land inside the drawer (and Tab moves to
         the first link), but nothing is spuriously ring-highlighted on open. */
      var panel = pane.querySelector(".menu__panel");
      if (v && panel) panel.focus();
      if (!v) btn.focus();
    }
    btn.addEventListener("click", function () { setOpen(!open); });
    /* R54: the menu is a right-hand drawer now, so the page behind it is visible
       and clicking the scrim has to dismiss it — that is what a drawer implies. */
    var scrim = pane.querySelector("[data-menu-close]");
    if (scrim) scrim.addEventListener("click", function () { setOpen(false); });
    d.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) setOpen(false);
      if (e.key === "Tab" && open) { /* soft trap: cycle within pane */
        var f = pane.querySelectorAll("a, button");
        var first = btn, last = f[f.length - 1];
        if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  })();


  /* ------------------------------------------------------------------ *
   * 4b · Reference tabs (R61, owner: Omega's tabbed product row)
   *      Filters the carousel on the case size already printed on each
   *      card. JS-only — the tablist is [hidden] in the markup and is
   *      only revealed here, so with JS off the five stay whole.
   * ------------------------------------------------------------------ */
  (function refTabs() {
    var wrap = d.querySelector("[data-cartabs]");
    if (!wrap) return;
    /* the homepage filters its carousel, the collection page its catalogue
       grid; the tablist names its own target so one behaviour drives both. */
    var track = d.querySelector(wrap.getAttribute("data-target") || ".car__track");
    if (!track) return;
    var cards = [].slice.call(track.querySelectorAll("[data-mm]"));
    if (!cards.length) return;
    wrap.removeAttribute("hidden");
    var tabs = [].slice.call(wrap.querySelectorAll(".tab"));
    function match(card, f) {
      if (f === "all") return true;
      var mm = parseInt(card.getAttribute("data-mm"), 10);
      return f === "small" ? mm <= 38 : mm >= 39;
    }
    function apply(f, btn) {
      cards.forEach(function (c) {
        var on = match(c, f);
        if (on) c.removeAttribute("hidden"); else c.setAttribute("hidden", "");
      });
      tabs.forEach(function (t) {
        var on = t === btn;
        t.classList.toggle("is-on", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      if (track.scrollWidth > track.clientWidth) {
        track.scrollTo({ left: 0, behavior: motionOn() ? "smooth" : "auto" });
      }
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () { apply(t.getAttribute("data-filter"), t); });
      t.addEventListener("keydown", function (e) {
        var i = tabs.indexOf(t), n = null;
        if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); n.focus(); apply(n.getAttribute("data-filter"), n); }
      });
    });
  })();

  /* ------------------------------------------------------------------ *
   * 4c · Boutique rows -> the boutique field (contact page)
   *      Each city row is a real anchor to #boutique, so with JS off it
   *      still takes you to the field. With JS it also picks that city,
   *      which saves the visitor doing it twice.
   * ------------------------------------------------------------------ */
  (function boutiqueRows() {
    var wrap = d.querySelector("[data-boutique-rows]");
    var sel = d.getElementById("boutique");
    if (!wrap || !sel) return;
    wrap.addEventListener("click", function (e) {
      var row = e.target.closest ? e.target.closest("[data-city]") : null;
      if (!row) return;
      var city = row.getAttribute("data-city");
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === city) { sel.selectedIndex = i; break; }
      }
      /* the anchor still does the scrolling; we only move focus after it */
      w.setTimeout(function () { try { sel.focus({ preventScroll: true }); } catch (err) { sel.focus(); } }, 0);
    });
  })();


  /* ------------------------------------------------------------------ *
   * R70 · Scroll-linked parallax + the custom scrollbar.
   *      Measured off the reference: it runs NATIVE scrolling (no Lenis,
   *      no Locomotive, no GSAP) with its own scrollbar element, and moves
   *      imagery on scroll with the travel clamped near 180px. One rAF
   *      loop drives both, and it only runs while something is in view.
   * ------------------------------------------------------------------ */
  (function scrollMotion() {
    if (!motionOn()) return;
    var pars = [].slice.call(d.querySelectorAll("[data-par]"));
    var bar = d.querySelector(".sbar"), thumb = bar ? bar.querySelector(".sbar__thumb") : null;
    if (!pars.length && !bar) return;

    var MAX = 180;               /* the clamp the reference uses */
    var ticking = false, lastY = -1;

    function frame() {
      ticking = false;
      var y = w.scrollY || w.pageYOffset;
      var vh = w.innerHeight;

      for (var i = 0; i < pars.length; i++) {
        var el = pars[i];
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;   /* offscreen: skip */
        var depth = parseFloat(el.getAttribute("data-par")) || 0.18;
        /* -1 above the fold .. +1 below it, 0 when centred */
        var mid = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        var shift = Math.max(-MAX, Math.min(MAX, mid * MAX * depth));
        el.style.transform = "translate3d(0," + shift.toFixed(1) + "px,0)";
      }

      if (thumb) {
        var doc = d.documentElement;
        var max = doc.scrollHeight - vh;
        var frac = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
        var h = Math.max(40, vh * (vh / doc.scrollHeight));
        thumb.style.height = h + "px";
        thumb.style.transform = "translateY(" + ((vh - h) * frac).toFixed(1) + "px)";
        bar.classList.toggle("is-live", max > 200);
      }
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      w.requestAnimationFrame(frame);
    }
    w.addEventListener("scroll", onScroll, { passive: true });
    w.addEventListener("resize", onScroll);
    frame();
  })();

  /* ------------------------------------------------------------------ *
   * 4a · Site search (W5, owner): Rolex-style panel under the bar.
   *      A small hand-kept index of everything on the site; typing
   *      filters it, Enter opens the top result, Escape/scroll/click-
   *      away closes. JS-only — the button never renders without JS.
   * ------------------------------------------------------------------ */
  (function search() {
    var btn = d.querySelector("[data-search-btn]");
    var pane = d.querySelector("[data-search]");
    if (!btn || !pane) return;
    pane.removeAttribute("hidden");
    var input = pane.querySelector("[data-search-input]");
    var list = pane.querySelector("[data-search-results]");
    var label = pane.querySelector("[data-search-label]");
    var closeBtn = pane.querySelector("[data-search-close]");
    var form = pane.querySelector("[data-search-form]");
    var menuBtn = d.querySelector("[data-menu-btn]");

    /* everything on the site, hand-indexed (titles, details, loose keywords) */
    var INDEX = [
      { t: "Halden No. 1", dl: "38 mm · blue sunburst", h: "collection.html#no1", k: "watch no 1 one blue sunburst dial 38 steel" },
      { t: "Halden Meridian", dl: "39 mm · champagne guilloché", h: "collection.html#meridian", k: "watch champagne guilloche dress 39" },
      { t: "Halden Field", dl: "36 mm · salmon", h: "collection.html#field", k: "watch salmon field 36" },
      { t: "Halden Tide", dl: "40 mm · black · diver", h: "collection.html#tide", k: "watch diver dive black tide 40 water sea" },
      { t: "Halden Crossing", dl: "39 mm · navy · dual time", h: "collection.html#crossing", k: "watch gmt dual time travel navy 39" },
      { t: "The collection", dl: "all five references", h: "collection.html", k: "watches collection references lineup models" },
      { t: "Calibre H-1", dl: "the in-house movement", h: "movement.html", k: "movement calibre caliber h1 h-1 automatic mechanical in-house jewels power reserve" },
      { t: "Request a viewing", dl: "boutiques, by appointment", h: "contact.html", k: "contact visit appointment boutique viewing email buy price" },
      { t: "The house", dl: "who Halden is", h: "index.html", k: "home about house story halden watch co" }
    ];
    var POPULAR = [0, 3, 4, 6, 7];

    function render(items, q) {
      list.innerHTML = "";
      if (!items.length) {
        var none = d.createElement("li");
        none.className = "spanel__none";
        none.textContent = "Nothing in the house matches “" + q + "” — try “diver”, “calibre”, or “viewing”.";
        list.appendChild(none);
        return;
      }
      for (var i = 0; i < items.length; i++) {
        var li = d.createElement("li");
        var a = d.createElement("a");
        a.href = items[i].h;
        var t = d.createElement("span");
        t.textContent = items[i].t;
        var dl = d.createElement("span");
        dl.className = "dl";
        dl.textContent = items[i].dl;
        a.appendChild(t);
        a.appendChild(dl);
        li.appendChild(a);
        list.appendChild(li);
      }
    }
    function suggest() {
      label.textContent = "Popular on this site";
      var items = [];
      for (var i = 0; i < POPULAR.length; i++) items.push(INDEX[POPULAR[i]]);
      render(items, "");
    }
    function query(q) {
      var s = q.replace(/^\s+|\s+$/g, "").toLowerCase();
      if (!s) { suggest(); return; }
      label.textContent = "Results";
      var hits = [];
      for (var i = 0; i < INDEX.length; i++) {
        if ((INDEX[i].t + " " + INDEX[i].dl + " " + INDEX[i].k).toLowerCase().indexOf(s) > -1) hits.push(INDEX[i]);
      }
      render(hits, s);
    }

    var open = false;
    function setOpen(v) {
      open = v;
      pane.classList.toggle("is-open", v);
      btn.setAttribute("aria-expanded", v ? "true" : "false");
      if (v) {
        /* the ink menu sits above the panel — close it first */
        if (d.body.classList.contains("menu-open") && menuBtn) menuBtn.click();
        input.value = "";
        suggest();
        input.focus();
      } else {
        btn.focus();
      }
    }
    btn.addEventListener("click", function () { setOpen(!open); });
    closeBtn.addEventListener("click", function () { setOpen(false); });
    if (menuBtn) menuBtn.addEventListener("click", function () { if (open) setOpen(false); });
    input.addEventListener("input", function () { query(input.value); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var a = list.querySelector("a");
      if (a) a.click();
    });
    d.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) setOpen(false);
    });
    d.addEventListener("click", function (e) {
      if (open && !pane.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });
    w.addEventListener("scroll", function () { if (open) setOpen(false); }, { passive: true });
  })();

  /* ------------------------------------------------------------------ *
   * 4b · Watches panel (desktop): open/close is CSS (hover/focus-within);
   *      JS only adds ARIA state and an Escape hatch for keyboards.
   * ------------------------------------------------------------------ */
  (function watchesPanel() {
    var group = d.querySelector("[data-wnav]");
    if (!group) return;
    var link = group.querySelector("a");
    if (!link) return;
    link.setAttribute("aria-haspopup", "true");
    link.setAttribute("aria-expanded", "false");
    function sync(v) {
      group.classList.toggle("is-open", v);
      link.setAttribute("aria-expanded", v ? "true" : "false");
      if (v) group.classList.remove("is-esc");
    }
    group.addEventListener("mouseenter", function () { sync(true); });
    group.addEventListener("mouseleave", function () { sync(false); });
    group.addEventListener("focusin", function () {
      if (!group.classList.contains("is-esc")) sync(true);
    });
    group.addEventListener("focusout", function (e) {
      if (!group.contains(e.relatedTarget)) { sync(false); group.classList.remove("is-esc"); }
    });
    group.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && group.classList.contains("is-open")) {
        group.classList.add("is-esc");
        group.classList.remove("is-open");
        link.setAttribute("aria-expanded", "false");
        link.focus();
      }
    });
  })();

  /* ------------------------------------------------------------------ *
   * 5 · Declarative reveals: data-reveal="block | lines | chars | dezoom"
   * ------------------------------------------------------------------ */
  (function reveals() {
    if (!motionOn() || !("IntersectionObserver" in w)) return;
    var els = d.querySelectorAll("[data-reveal]");
    function splitLines(el) {
      var text = el.textContent.trim();
      /* each line becomes its own block-level mask, so the element's text
         content loses the spaces BETWEEN lines ("Request a" + "viewing").
         Name the element with the original string, as splitChars does. */
      el.setAttribute("aria-label", text);
      var words = text.split(/\s+/);
      el.textContent = "";
      var spans = words.map(function (wd) {
        var s = d.createElement("span");
        s.textContent = wd;
        el.appendChild(s);
        el.appendChild(d.createTextNode(" "));
        return s;
      });
      var lines = [], top = null, cur = [];
      spans.forEach(function (s) {
        if (top === null || Math.abs(s.offsetTop - top) > 4) {
          if (cur.length) lines.push(cur);
          cur = [s]; top = s.offsetTop;
        } else cur.push(s);
      });
      if (cur.length) lines.push(cur);
      el.textContent = "";
      lines.forEach(function (line, li) {
        var mask = d.createElement("span");
        mask.className = "rl";
        var inner = d.createElement("span");
        inner.style.transitionDelay = (li * 110) + "ms";
        inner.textContent = line.map(function (s) { return s.textContent; }).join(" ");
        mask.appendChild(inner);
        el.appendChild(mask);
      });
    }
    function splitChars(el) {
      var text = el.textContent.trim();
      el.setAttribute("aria-label", text);
      el.textContent = "";
      var i = 0;
      text.split(/(\s+)/).forEach(function (part) {
        if (/^\s+$/.test(part)) { el.appendChild(d.createTextNode(" ")); return; }
        var wordWrap = d.createElement("span");
        wordWrap.className = "rw";
        wordWrap.setAttribute("aria-hidden", "true");
        part.split("").forEach(function (ch) {
          var s = d.createElement("span");
          s.className = "rc";
          s.textContent = ch;
          s.style.transitionDelay = (i * 22) + "ms";
          i++;
          wordWrap.appendChild(s);
        });
        el.appendChild(wordWrap);
      });
    }
    var pending = [];
    function markIn(el) {
      el.classList.add("is-in");
      io.unobserve(el);
      var at = pending.indexOf(el);
      if (at > -1) pending.splice(at, 1);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) markIn(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) {
      if (el.hasAttribute("data-reveal-off") && w.innerWidth < 768) return;
      var kind = el.getAttribute("data-reveal");
      if (kind === "lines") splitLines(el);
      if (kind === "chars") splitChars(el);
      io.observe(el);
      pending.push(el);
    });
    /* settle fallback: instant jumps (End key, anchors, scrollTo) can outrun
       the observer's async callback. On scroll-end, force-reveal anything
       still pending whose box already intersects the viewport. The observer
       stays the primary path; this only catches what it missed. */
    function settle() {
      for (var i = pending.length - 1; i >= 0; i--) {
        var r = pending[i].getBoundingClientRect();
        if (r.bottom > 0 && r.top < w.innerHeight && r.right > 0 && r.left < w.innerWidth) {
          markIn(pending[i]);
        }
      }
    }
    if ("onscrollend" in w) {
      w.addEventListener("scrollend", settle, { passive: true });
    } else {
      var settleT = 0;
      w.addEventListener("scroll", function () {
        w.clearTimeout(settleT);
        settleT = w.setTimeout(settle, 150);
      }, { passive: true });
    }
    w.setTimeout(settle, 250);   /* catches anchor-load jumps with no scroll event */
  })();

  /* ------------------------------------------------------------------ *
   * 6 · The film: lazy video src, entrance, pause toggle, curtain var
   * ------------------------------------------------------------------ */
  var filmSection = d.querySelector("[data-film]");
  var vid = filmSection ? filmSection.querySelector(".film__vid") : null;
  var videoReady = false;

  function connectionOK() {
    var c = navigator.connection;
    if (c && c.saveData) return false;
    if (c && /(^|-)2g$/.test(c.effectiveType || "")) return false;
    return true;
  }
  function setupVideo() {
    if (!vid || videoReady || !motionOn() || !connectionOK()) return;
    videoReady = true;
    var start = function () {
      w.requestAnimationFrame(function () {
        var portrait = w.matchMedia("(max-width: 768px)").matches;
        vid.src = portrait ? vid.getAttribute("data-src-portrait") : vid.getAttribute("data-src");
        var timer = w.setTimeout(function () { /* poster stays; no hole */ }, 2500);
        vid.addEventListener("canplay", function () {
          w.clearTimeout(timer);
          vid.classList.add("is-on");
          var p = vid.play(); if (p && p.catch) p.catch(function () {});
        }, { once: true });
        vid.load();
      });
    };
    if (d.readyState === "complete") start();
    else w.addEventListener("load", start, { once: true });
  }
  function teardownVideo() {
    if (!vid || !videoReady) return;
    videoReady = false;
    try { vid.pause(); } catch (e) {}
    vid.classList.remove("is-on");
    vid.removeAttribute("src");
    vid.load();
  }
  if (filmSection) {
    setupVideo();
    var pauseBtn = filmSection.querySelector("[data-film-pause]");
    var userPaused = false;
    if (pauseBtn) pauseBtn.addEventListener("click", function () {
      userPaused = !userPaused;
      pauseBtn.setAttribute("aria-pressed", userPaused ? "true" : "false");
      if (userPaused) vid.pause();
      else { var p = vid.play(); if (p && p.catch) p.catch(function () {}); }
    });
    /* curtain progress + offscreen pause (reads scroll; never writes it) */
    var lastFp = -1;
    tasks.push(function () {
      if (!motionOn()) return;
      /* the film ends one header-height early now (white bar owns the top) */
      var fp = Math.min(1.2, Math.max(0, w.scrollY / Math.max(1, filmSection.offsetHeight)));
      if (Math.abs(fp - lastFp) < 0.0005) return;
      lastFp = fp;
      filmSection.style.setProperty("--fp", fp.toFixed(4));
      if (vid && videoReady && !userPaused) {
        if (fp >= 1 && !vid.paused) vid.pause();
        else if (fp < 1 && vid.paused && vid.classList.contains("is-on")) {
          var p = vid.play(); if (p && p.catch) p.catch(function () {});
        }
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 7 · Reference carousel: snap is CSS; buttons + arrow keys only
   * ------------------------------------------------------------------ */
  (function carousel() {
    var car = d.querySelector("[data-car]");
    if (!car) return;
    var track = car.querySelector(".car__track");
    var step = function () {
      var card = track.querySelector(".car__card");
      return card ? card.offsetWidth + 24 : 320;
    };
    car.querySelectorAll("[data-car-btn]").forEach(function (b) {
      b.addEventListener("click", function () {
        track.scrollBy({ left: (b.getAttribute("data-car-btn") === "next" ? 1 : -1) * step(), behavior: reduced() ? "auto" : "smooth" });
      });
    });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") track.scrollBy({ left: step(), behavior: "smooth" });
      if (e.key === "ArrowLeft") track.scrollBy({ left: -step(), behavior: "smooth" });
    });
  })();

  /* ------------------------------------------------------------------ *
   * 7b · Model rail scrollspy (collection): the navy bullet follows the
   *      model in view — reads scroll only, never writes it.
   * ------------------------------------------------------------------ */
  (function modelRail() {
    var rail = d.querySelector("[data-mnav]");
    if (!rail || !("IntersectionObserver" in w)) return;
    var links = [].slice.call(rail.querySelectorAll("[data-spy]"));
    if (!links.length) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("data-spy")] = a; });
    var live = {};
    function paint() {
      var current = null;
      links.forEach(function (a) {
        var id = a.getAttribute("data-spy");
        if (live[id] && !current) current = id;
      });
      links.forEach(function (a) {
        a.classList.toggle("is-here", a.getAttribute("data-spy") === current);
      });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { live[en.target.id] = en.isIntersecting; });
      paint();
    }, { rootMargin: "-35% 0px -45% 0px" });
    Object.keys(map).forEach(function (id) {
      var sec = d.getElementById(id);
      if (sec) io.observe(sec);
    });
  })();

  /* ------------------------------------------------------------------ *
   * 9 · The living watch: seconds sweep + 4Hz balance (ported from v1)
   * ------------------------------------------------------------------ */
  (function living() {
    var seconds = [].slice.call(d.querySelectorAll(".hw__seconds"));
    var balances = [].slice.call(d.querySelectorAll(".mv__balance"));
    if (!seconds.length && !balances.length) return;
    function base(el) { var b = parseFloat(el.getAttribute("data-base")); return isNaN(b) ? 0 : b; }
    var secBase = seconds.map(base), balBase = balances.map(base);
    var onscreen = new WeakMap();
    if ("IntersectionObserver" in w) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { onscreen.set(en.target, en.isIntersecting); });
      }, { rootMargin: "60px" });
      seconds.concat(balances).forEach(function (el) {
        var svg = el.ownerSVGElement || el;
        io.observe(svg);
        onscreen.set(svg, false);
      });
    }
    function vis(el) {
      var svg = el.ownerSVGElement || el;
      var v = onscreen.get(svg);
      return v === undefined ? true : v;
    }
    var t0 = null;
    tasks.push(function (now) {
      if (!motionOn()) return;
      if (t0 === null) t0 = now;
      var t = (now - t0) / 1000;
      var sweep = t * 6;
      for (var i = 0; i < seconds.length; i++) {
        if (!vis(seconds[i])) continue;
        seconds[i].setAttribute("transform", "rotate(" + (secBase[i] + sweep).toFixed(2) + " 500 500)");
      }
      var osc = Math.sin(t * 4 * 2 * Math.PI) * 26;
      for (var j = 0; j < balances.length; j++) {
        if (!vis(balances[j])) continue;
        balances[j].setAttribute("transform", "rotate(" + (balBase[j] + osc).toFixed(2) + " 320 360)");
      }
    });
  })();

  /* ------------------------------------------------------------------ *
   * 10 · Contact form: inline validation, input preserved, specific copy
   * ------------------------------------------------------------------ */
  (function form() {
    var f = d.querySelector("[data-form]");
    if (!f) return;
    f.setAttribute("novalidate", "novalidate");
    function fieldOf(input) { return input.closest(".field"); }
    function check(input) {
      var ok = true;
      if (input.required && !input.value.trim()) ok = false;
      if (ok && input.type === "email" && input.value.trim() &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) ok = false;
      fieldOf(input).classList.toggle("is-bad", !ok);
      input.setAttribute("aria-invalid", ok ? "false" : "true");
      return ok;
    }
    var watched = f.querySelectorAll("input[required], input[type=email]");
    watched.forEach(function (input) {
      input.addEventListener("input", function () {
        if (fieldOf(input).classList.contains("is-bad")) check(input);
      });
    });
    f.addEventListener("submit", function (e) {
      var firstBad = null;
      watched.forEach(function (input) {
        if (!check(input) && !firstBad) firstBad = input;
      });
      if (firstBad) { e.preventDefault(); firstBad.focus(); }
    });
  })();

  /* ------------------------------------------------------------------ *
   * 11 · Footer "Reduce motion" toggle
   * ------------------------------------------------------------------ */
  d.querySelectorAll("[data-motion-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      try {
        localStorage.setItem("haldenMotion", storedPref() === "reduced" ? "full" : "reduced");
      } catch (e) {}
      applyMotionState();
    });
  });

  applyMotionState();
})();
