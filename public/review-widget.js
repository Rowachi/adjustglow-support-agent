/* Review form + one-tap sharing, used by agent.html (inside the chat) and
 * review.html (the page an NFC/QR card links to).
 *
 * Flow: the customer picks a rating and writes a review here. After
 * submitting, EVERY customer, whatever the rating, gets the same buttons:
 * each one copies their own text and opens the business's Google or
 * Trustpilot review page, where they paste it and publish it themselves.
 * We never post anything on their behalf.
 */
(function () {
  var CSS = "" +
    ".agr{border:1px solid var(--line-bright,#453419);background:var(--surface-2,#1D160C);border-radius:14px;padding:16px;color:var(--ink,#F5EFE0);font-size:.9rem;line-height:1.45;max-width:100%}" +
    // Host pages (agent.html) give every <button> a ::before hover overlay
    // positioned against the button. Our buttons reset their own styles with
    // all:unset, which would let that overlay escape and cover the form, so
    // switch it off and keep each button positioned.
    ".agr button{position:relative}" +
    ".agr button::before,.agr button::after{content:none!important;display:none!important}" +
    ".agr h3{margin:0 0 4px;font-size:1rem;font-weight:700}" +
    ".agr p{margin:0}" +
    ".agr .agr-sub{color:var(--ink-soft,#C9BEA4);font-size:.84rem}" +
    ".agr-stars{display:flex;gap:4px;margin:12px 0 10px}" +
    ".agr-star{all:unset;cursor:pointer;font-size:1.7rem;line-height:1;color:var(--line-bright,#453419);padding:2px;border-radius:6px;transition:color .15s ease}" +
    ".agr-star.on{color:var(--accent,#E8AC2E)}" +
    ".agr-star:hover{color:var(--accent-bright,#F7CB5E)}" +
    ".agr-star:focus-visible{outline:2px solid var(--accent,#E8AC2E);outline-offset:2px}" +
    ".agr textarea,.agr input{box-sizing:border-box;width:100%;font:inherit;font-size:.88rem;border:1px solid var(--line-bright,#453419);border-radius:10px;padding:10px 12px;background:var(--surface-sunk,#0E0A06);color:var(--ink,#F5EFE0);margin-top:8px}" +
    ".agr textarea{min-height:84px;resize:vertical}" +
    ".agr textarea:focus-visible,.agr input:focus-visible{outline:2px solid var(--accent,#E8AC2E);outline-offset:1px}" +
    ".agr-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}" +
    ".agr-btn{all:unset;box-sizing:border-box;cursor:pointer;font-weight:700;font-size:.84rem;padding:9px 14px;border-radius:999px;background:var(--accent,#E8AC2E);color:var(--accent-ink,#1C1300);text-align:center}" +
    ".agr-btn.ghost{background:transparent;color:var(--accent-bright,#F7CB5E);border:1px solid var(--line-bright,#453419)}" +
    ".agr-btn:hover{filter:brightness(1.08)}" +
    ".agr-btn:focus-visible{outline:2px solid var(--accent,#E8AC2E);outline-offset:2px}" +
    ".agr-btn[disabled]{opacity:.45;cursor:not-allowed;filter:none}" +
    ".agr-fine{margin-top:10px!important;font-size:.76rem;color:var(--ink-faint,#857A61)}" +
    ".agr-quote{margin-top:10px!important;padding:10px 12px;border-left:3px solid var(--accent,#E8AC2E);background:var(--surface-sunk,#0E0A06);border-radius:8px;white-space:pre-wrap;color:var(--ink-soft,#C9BEA4)}" +
    ".agr-status{margin-top:8px!important;font-size:.8rem;color:var(--accent-bright,#F7CB5E);min-height:1em}" +
    ".agr-err{color:var(--orange-bright,#F0824E)}";

  function injectCss() {
    if (document.getElementById("agr-css")) return;
    var s = document.createElement("style");
    s.id = "agr-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "class") e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  // navigator.clipboard is blocked in some embedded/iframe contexts, so fall
  // back to a hidden textarea + execCommand, which works on a user click.
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  function post(url, body) {
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Något gick fel."); return d; }); });
  }

  function mount(container, opts) {
    injectCss();
    opts = opts || {};
    var api = opts.apiBase || "";
    var persona = opts.persona || "default";
    var settingsP = opts.settings
      ? Promise.resolve(opts.settings)
      : fetch(api + "/api/reviews/settings?persona=" + encodeURIComponent(persona)).then(function (r) { return r.json(); });

    var root = el("div", { class: "agr" });
    container.appendChild(root);

    settingsP.then(function (settings) {
      if (!settings || !settings.enabled) { root.remove(); return; }
      renderForm(settings);
    }).catch(function () { root.remove(); });

    function renderForm(settings) {
      var rating = 0;
      var stars = [];
      var starRow = el("div", { class: "agr-stars", role: "radiogroup", "aria-label": "Betyg från 1 till 5" });
      for (var i = 1; i <= 5; i++) {
        (function (n) {
          var b = el("button", { type: "button", class: "agr-star", role: "radio", "aria-checked": "false", "aria-label": n + " av 5", text: "★" });
          b.addEventListener("click", function () { setRating(n); });
          stars.push(b);
          starRow.appendChild(b);
        })(i);
      }
      var text = el("textarea", { maxlength: "2000", placeholder: "Berätta med egna ord hur det gick (valfritt)", "aria-label": "Ditt omdöme" });
      var name = el("input", { maxlength: "80", placeholder: "Ditt förnamn (valfritt)", "aria-label": "Ditt förnamn", autocomplete: "given-name" });
      var submit = el("button", { type: "button", class: "agr-btn", text: "Skicka omdöme" });
      submit.disabled = true;
      var status = el("p", { class: "agr-status", "aria-live": "polite" });

      function setRating(n) {
        rating = n;
        stars.forEach(function (s, idx) {
          s.classList.toggle("on", idx < n);
          s.setAttribute("aria-checked", idx === n - 1 ? "true" : "false");
        });
        submit.disabled = false;
      }

      submit.addEventListener("click", function () {
        if (!rating) return;
        submit.disabled = true;
        status.className = "agr-status";
        status.textContent = "Skickar…";
        post(api + "/api/reviews", {
          persona: persona,
          conversationId: opts.conversationId || null,
          rating: rating,
          text: text.value,
          name: name.value,
          source: opts.source || "chat",
        }).then(function (res) {
          renderShare(res.settings || settings, res.id, text.value.trim());
        }).catch(function (e) {
          submit.disabled = false;
          status.className = "agr-status agr-err";
          status.textContent = e.message || "Kunde inte skicka. Försök igen.";
        });
      });

      root.innerHTML = "";
      root.appendChild(el("h3", { text: "Hur var din upplevelse av " + settings.businessName + "?" }));
      root.appendChild(el("p", { class: "agr-sub", text: "Välj ett betyg och skriv gärna några ord." }));
      root.appendChild(starRow);
      root.appendChild(text);
      root.appendChild(name);
      root.appendChild(el("div", { class: "agr-row" }, [submit]));
      root.appendChild(status);
      root.appendChild(el("p", { class: "agr-fine", text: "Ditt omdöme sparas hos " + settings.businessName + "." }));
      if (opts.onReady) opts.onReady();
    }

    function renderShare(settings, reviewId, reviewText) {
      var status = el("p", { class: "agr-status", "aria-live": "polite" });
      function track(target) {
        post(api + "/api/reviews/" + encodeURIComponent(reviewId) + "/share", { target: target }).catch(function () {});
      }
      function shareButton(label, url, target) {
        var b = el("button", { type: "button", class: "agr-btn", text: label });
        if (!url) { b.disabled = true; b.title = "Inte tillgänglig i demot"; return b; }
        b.addEventListener("click", function () {
          // Open the tab first, inside the click, so pop-up blockers allow it.
          var win = window.open(url, "_blank");
          if (win) { try { win.opener = null; } catch (e) {} }
          track(target);
          if (reviewText) {
            copyText(reviewText).then(function (ok) {
              status.textContent = ok
                ? "Din text är kopierad. Klistra in den på sidan som öppnades och publicera."
                : "Kunde inte kopiera automatiskt. Markera texten ovan och kopiera den själv.";
            });
          }
          if (!win) status.textContent = "Sidan blockerades av webbläsaren. Tillåt popup-fönster och försök igen.";
        });
        return b;
      }

      var hasText = Boolean(reviewText);
      var copyBtn = null;
      if (hasText) {
        copyBtn = el("button", { type: "button", class: "agr-btn ghost", text: "Kopiera texten" });
        copyBtn.addEventListener("click", function () {
          track("copy");
          copyText(reviewText).then(function (ok) {
            status.textContent = ok ? "Kopierat." : "Kunde inte kopiera automatiskt. Markera texten och kopiera den själv.";
          });
        });
      }

      root.innerHTML = "";
      root.appendChild(el("h3", { text: "Tack för ditt omdöme!" }));
      root.appendChild(el("p", { class: "agr-sub", text: hasText
        ? "Vill du dela det på Google eller Trustpilot också? Knappen kopierar din text och öppnar sidan, där du klistrar in och publicerar från ditt eget konto."
        : "Vill du recensera " + settings.businessName + " på Google eller Trustpilot också? Knappen öppnar sidan, där du skriver och publicerar från ditt eget konto." }));
      if (hasText) root.appendChild(el("p", { class: "agr-quote", text: reviewText }));
      root.appendChild(el("div", { class: "agr-row" }, [
        shareButton(hasText ? "Kopiera och öppna Google" : "Öppna Google", settings.googleReviewUrl, "google"),
        shareButton(hasText ? "Kopiera och öppna Trustpilot" : "Öppna Trustpilot", settings.trustpilotReviewUrl, "trustpilot"),
        copyBtn,
      ]));
      root.appendChild(status);
      if (settings.demoNote && (!settings.googleReviewUrl || !settings.trustpilotReviewUrl)) {
        root.appendChild(el("p", { class: "agr-fine", text: settings.demoNote }));
      }
      root.appendChild(el("p", { class: "agr-fine", text: "Helt frivilligt. Vi publicerar aldrig något i ditt namn, och alla som lämnar ett omdöme får samma val." }));
      if (opts.onDone) opts.onDone(reviewId);
    }
  }

  window.AdjustglowReview = { mount: mount };
})();
