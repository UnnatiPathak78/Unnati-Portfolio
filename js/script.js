/* Unnati Pathak portfolio
   Content lives in index.html. This file adds: name animation, theme switch,
   scroll progress, active nav link, skills tabs, experience accordion,
   projects carousel. */

(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* Footer year */
  $("#yr").textContent = new Date().getFullYear();

  /* Hero name: letters rise once on load */
  $$("#name .w").forEach(function (word, wi) {
    var text = word.textContent;
    word.textContent = "";
    text.split("").forEach(function (ch, i) {
      var s = document.createElement("span");
      s.className = "c";
      s.setAttribute("aria-hidden", "true");
      s.style.setProperty("--i", i + wi * 6);
      s.textContent = ch;
      word.appendChild(s);
    });
  });

  /* Theme switch */
  var themeBtn = $("#theme");
  function themeLabel() {
    themeBtn.setAttribute("aria-label",
      root.getAttribute("data-theme") === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }
  themeLabel();
  themeBtn.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    themeLabel();
  });

  /* Scroll progress bar + active nav link */
  var bar = $("#bar");
  var links = $$("nav a");
  var secs = links.map(function (a) { return $(a.getAttribute("href")); });
  function onScroll() {
    var h = document.documentElement;
    bar.style.transform = "scaleX(" + (h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) + ")";
    var y = h.scrollTop + window.innerHeight * 0.35, cur = -1;
    secs.forEach(function (s, i) { if (s && s.offsetTop <= y) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle("on", i === cur); });
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Skills tabs (arrow keys work too) */
  var tabs = $$('[role="tab"]');
  var panelsWrap = $(".panels");
  var panels = $$(".pills", panelsWrap);
  function selectTab(tab) {
    var all = tab.id === "t-all";
    var shown = tab.getAttribute("aria-controls").split(" ");
    panelsWrap.classList.toggle("all", all);
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    var n = 0;
    panels.forEach(function (p) {
      p.hidden = shown.indexOf(p.id) === -1;
      if (!p.hidden) {
        $$("li", p).forEach(function (li) { li.style.setProperty("--n", Math.min(n++, 14)); });
      }
    });
  }
  selectTab($("#t-all"));
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t); });
    t.addEventListener("keydown", function (e) {
      var n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
      if (n === null) return;
      var target = tabs[(n + tabs.length) % tabs.length];
      selectTab(target);
      target.focus();
    });
  });

  /* Experience accordion */
  $$(".job > button").forEach(function (b) {
    b.addEventListener("click", function () {
      var job = b.parentElement;
      var open = !job.classList.contains("open");
      job.classList.toggle("open", open);
      b.setAttribute("aria-expanded", String(open));
    });
  });

  /* Projects carousel: shows 3 cards at a time and moves by itself.
     Arrows and dots are optional extras; there is no manual scrolling. */
  var track = $("#track");
  var cards = $$(".proj", track);
  var dots = $("#dots");
  var prev = $("#prev");
  var next = $("#next");
  var playBtn = $("#play");
  var behavior = reduce ? "auto" : "smooth";
  var page = 0;

  function step() { return cards[0].offsetWidth + 24; }
  function perView() { return Math.max(1, Math.round((track.clientWidth + 24) / step())); }
  function pages() { return Math.max(1, cards.length - perView() + 1); }

  function mark() {
    $$("button", dots).forEach(function (b, k) { b.classList.toggle("on", k === page); });
  }
  function go(i, instant) {
    var n = pages();
    page = (i + n) % n;
    track.scrollTo({ left: page * step(), behavior: instant ? "auto" : behavior });
    mark();
  }
  function buildDots() {
    dots.innerHTML = "";
    for (var p = 0; p < pages(); p++) {
      (function (p) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Show projects from slide " + (p + 1));
        b.addEventListener("click", function () { go(p); start(); });
        dots.appendChild(b);
      })(p);
    }
    mark();
  }
  buildDots();

  prev.addEventListener("click", function () { go(page - 1); start(); });
  next.addEventListener("click", function () { go(page + 1); start(); });
  addEventListener("resize", function () {
    if ($$("button", dots).length !== pages()) buildDots();
    go(Math.min(page, pages() - 1), true);
  });

  /* Auto-advance: one card every 3.5s, back to the first at the end.
     Pauses on hover, keyboard focus, when off-screen, or with the pause button. */
  var timer = null;
  var userPaused = false;
  var hovering = false;
  var visible = false;

  function stop() { clearInterval(timer); timer = null; }
  function start() {
    stop();
    if (userPaused || hovering || !visible) return;
    timer = setInterval(function () { go(page + 1); }, 3500);
  }
  function showState() {
    playBtn.classList.toggle("paused", userPaused);
    playBtn.setAttribute("aria-label", userPaused ? "Play auto-scroll" : "Pause auto-scroll");
  }
  playBtn.addEventListener("click", function () { userPaused = !userPaused; showState(); start(); });
  showState();

  track.addEventListener("mouseenter", function () { hovering = true; stop(); });
  track.addEventListener("mouseleave", function () { hovering = false; start(); });
  track.addEventListener("focusin", function () { hovering = true; stop(); });
  track.addEventListener("focusout", function () { hovering = false; start(); });

  /* Play only while the Projects section is on screen */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      start();
    }, { threshold: 0.1 }).observe($("#projects"));
  } else {
    visible = true;
    start();
  }
})();