(function () {
  "use strict";

  var script = document.currentScript;
  var hubOrigin = script && script.src ? new URL(script.src, document.baseURI).origin : "";

  var labels = {
    PREPARING: { title: "결제 준비 중", description: "청구 내역을 준비하고 있습니다." },
    UPCOMING: { title: "다음 결제일", description: "예정된 결제 일정을 확인해 주세요." },
    OPEN: { title: "결제할 내역이 있습니다", description: "납부 기한 안에 결제를 진행해 주세요." },
    OVERDUE: { title: "납부 기한이 지났습니다", description: "결제 내역을 확인해 주세요." },
    PAID: { title: "결제 완료", description: "현재 미납된 내역이 없습니다." },
    EMPTY: { title: "결제할 내역이 없습니다", description: "새 청구가 등록되면 이곳에 표시됩니다." },
  };

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function formatDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Seoul",
    }).format(new Date(value + "T00:00:00+09:00"));
  }

  function formatAmount(value) {
    if (!Number.isSafeInteger(value) || value < 0) return "";
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(value);
  }

  class KpopsoftBilling extends HTMLElement {
    constructor() {
      super();
      this.root = this.attachShadow({ mode: "open" });
      this.busy = false;
      this.summary = null;
      this.status = element("div", "status");
      this.status.setAttribute("role", "status");
      this.status.setAttribute("aria-live", "polite");
      this.styleNode = element("style");
      this.styleNode.textContent =
        ":host{display:block;color:#172033;font-family:system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif}" +
        "*{box-sizing:border-box}.card{display:grid;gap:14px;padding:20px;border:1px solid rgba(23,32,51,.12);border-radius:20px;background:#fff;box-shadow:0 8px 24px rgba(23,32,51,.06)}" +
        ".eyebrow{margin:0;color:#2356c4;font-size:11px;font-weight:800;letter-spacing:.14em}.title{margin:0;font-size:20px;line-height:1.35}.description,.meta{margin:0;color:rgba(23,32,51,.62);font-size:14px;line-height:1.6}" +
        ".amount{margin:0;font-size:24px;font-weight:850}.button{min-height: 44px;width:100%;border:0;border-radius:999px;background:#2356c4;color:#fff;font:inherit;font-weight:800;cursor:pointer}.button:disabled{cursor:wait;opacity:.55}.retry{background:#172033}" +
        ".status:focus-within{outline:3px solid rgba(35,86,196,.28);outline-offset:3px}@media(max-width:420px){.card{padding:16px;border-radius:16px}.title{font-size:18px}.amount{font-size:21px}}";
    }

    connectedCallback() {
      this.renderLoading();
      this.load();
    }

    attributes() {
      var publicId = (this.getAttribute("public-id") || "").trim();
      var endpointValue = (this.getAttribute("token-endpoint") || "").trim();
      if (!hubOrigin || !/^[A-Za-z0-9_-]{8,100}$/.test(publicId) || !endpointValue) {
        throw new Error("configuration");
      }
      var endpoint = new URL(endpointValue, window.location.href);
      if (endpoint.origin !== window.location.origin) throw new Error("token-origin");
      return { publicId: publicId, endpoint: endpoint.href };
    }

    async token(config) {
      var response = await fetch(config.endpoint, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      var body = await response.json();
      if (!response.ok || !body || typeof body.token !== "string" || body.token.length > 4096) {
        throw new Error("token");
      }
      return body.token;
    }

    async load() {
      try {
        var config = this.attributes();
        var token = await this.token(config);
        var response = await fetch(hubOrigin + "/api/widget/v1/summary", {
          method: "GET",
          mode: "cors",
          credentials: "omit",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + token,
            "X-KPOPSOFT-Widget": config.publicId,
          },
        });
        var summary = await response.json();
        if (!response.ok || !summary || !labels[summary.state]) throw new Error("summary");
        this.summary = summary;
        this.renderSummary(summary);
      } catch {
        this.renderError();
      }
    }

    shell() {
      var card = element("section", "card");
      card.appendChild(element("p", "eyebrow", "KPOPSOFT BILLING"));
      this.status.replaceChildren(card);
      this.root.replaceChildren(this.styleNode, this.status);
      return card;
    }

    renderLoading() {
      var card = this.shell();
      card.setAttribute("aria-busy", "true");
      card.appendChild(element("h2", "title", "결제 정보를 불러오는 중입니다"));
      card.appendChild(element("p", "description", "잠시만 기다려 주세요."));
    }

    renderSummary(summary) {
      var copy = labels[summary.state];
      var card = this.shell();
      card.appendChild(element("h2", "title", copy.title));
      card.appendChild(element("p", "description", copy.description));
      var nextDate = formatDate(summary.nextPaymentDate);
      if (nextDate) card.appendChild(element("p", "meta", "다음 결제일 " + nextDate));
      var amount = formatAmount(summary.amount);
      if (amount) card.appendChild(element("p", "amount", amount));
      if (summary.canPay === true && (summary.state === "OPEN" || summary.state === "OVERDUE")) {
        var button = element("button", "button", "결제하기");
        button.type = "button";
        button.addEventListener("click", () => this.pay(button));
        card.appendChild(button);
      }
    }

    async pay(button) {
      if (this.busy) return;
      this.busy = true;
      button.disabled = true;
      button.textContent = "결제 화면 연결 중…";
      try {
        var config = this.attributes();
        var token = await this.token(config);
        var response = await fetch(hubOrigin + "/api/widget/v1/handoffs", {
          method: "POST",
          mode: "cors",
          credentials: "omit",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + token,
            "X-KPOPSOFT-Widget": config.publicId,
          },
        });
        var body = await response.json();
        var destination = body && typeof body.url === "string" ? new URL(body.url) : null;
        if (!response.ok || !destination || destination.origin !== hubOrigin) throw new Error("handoff");
        window.location.assign(destination.href);
      } catch {
        this.busy = false;
        button.disabled = false;
        button.textContent = "결제하기";
        this.renderError();
      }
    }

    renderError() {
      var card = this.shell();
      card.appendChild(element("h2", "title", "결제 정보를 불러오지 못했습니다"));
      card.appendChild(element("p", "description", "잠시 후 다시 시도해 주세요."));
      var retry = element("button", "button retry", "다시 시도");
      retry.type = "button";
      retry.addEventListener("click", () => {
        if (this.busy) return;
        this.renderLoading();
        this.load();
      });
      card.appendChild(retry);
    }
  }

  if (!customElements.get("kpopsoft-billing")) {
    customElements.define("kpopsoft-billing", KpopsoftBilling);
  }
})();
