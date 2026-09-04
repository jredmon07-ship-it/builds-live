/* THE HALE GROUP , interactions. Classic JS, file:// safe. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* capture mode for screenshots: ?cap caps full-height sections so a tall window shows the whole page */
  if (/[?&]cap/.test(location.search)) {
    var s = document.createElement("style");
    s.textContent = ".hero{height:760px!important;min-height:0!important}.phero{padding-top:170px!important}";
    document.head.appendChild(s);
  }

  /* header scrolled state */
  var head = document.querySelector(".site-head");
  function onScroll() { if (head) head.classList.toggle("scrolled", window.scrollY > 40); }
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  /* mobile nav */
  var burger = document.querySelector(".burger");
  var mnav = document.querySelector(".mnav");
  if (burger && mnav) {
    burger.addEventListener("click", function () {
      var open = mnav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    mnav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { mnav.classList.remove("open"); document.body.style.overflow = ""; burger.setAttribute("aria-expanded", "false"); }
    });
  }

  /* scroll reveal */
  var reveals = [].slice.call(document.querySelectorAll(".reveal"));
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* hero slideshow crossfade */
  var slides = [].slice.call(document.querySelectorAll(".hero-slide"));
  if (slides.length > 1 && !reduce) {
    var hi = 0;
    setInterval(function () {
      slides[hi].classList.remove("active");
      hi = (hi + 1) % slides.length;
      slides[hi].classList.add("active");
    }, 7600);   /* R115: the homepage opening — held, not flicked through */
  } else if (slides.length) {
    slides[0].classList.add("active");
  }

  /* count-up stats */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    /* R64: the count-up displayed FALSE figures for seconds — a normal scroll
       caught "19 years" where the truth is 21, "90% of list" where it is 98. On a
       page whose pitch is real numbers that is not an acceptable flourish, so the
       run is short. The markup now carries the true figure, so the pre-animation
       and no-JS states are both correct. */
    var dur = 800, start = null;
    function fmt(v) {
      return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    }
    if (reduce) { el.textContent = fmt(target); return; }
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(target);
    }
    requestAnimationFrame(step);
  }
  var counters = [].slice.call(document.querySelectorAll("[data-count]"));
  if (counters.length) {
    if (!("IntersectionObserver" in window) || reduce) {
      counters.forEach(animateCount);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* testimonials carousel */
  var quotes = [].slice.call(document.querySelectorAll(".quote"));
  var dots = [].slice.call(document.querySelectorAll(".q-dots button"));
  if (quotes.length) {
    var qi = 0, qtimer;
    function showQ(n) {
      quotes.forEach(function (q, i) { q.classList.toggle("active", i === n); });
      dots.forEach(function (d, i) { d.setAttribute("aria-selected", i === n ? "true" : "false"); });
      qi = n;
    }
    function nextQ() { showQ((qi + 1) % quotes.length); }
    function startQ() { if (!reduce) qtimer = setInterval(nextQ, 5600); }
    dots.forEach(function (d, i) {
      d.addEventListener("click", function () { clearInterval(qtimer); showQ(i); startQ(); });
    });
    showQ(0); startQ();
  }

  /* contact / form fake submit */
  var forms = [].slice.call(document.querySelectorAll("form[data-demo]"));
  forms.forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = f.querySelector(".form-ok");
      if (ok) { ok.classList.add("show"); ok.setAttribute("role", "status"); }
      f.querySelectorAll("input,textarea,select,button").forEach(function (el) {
        if (el.type !== "button") el.setAttribute("disabled", "true");
      });
    });
  });

  /* current year */
  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();
})();

/* R108: the opening view. The clip is fetched only once the page is ready and
   only if motion is allowed, so it never delays the first paint and never plays
   for anyone who has asked for stillness — the poster is the designed fallback. */

