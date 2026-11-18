(() => {
  "use strict";

  const TOKEN_ADDRESS = "EHuyvYuz6umJ7URnb8B81YJBjrJ9EFoTjFVdhecepump";
  const DEX_API = "https://api.dexscreener.com/token-pairs/v1/solana/" + TOKEN_ADDRESS;
  const UNLOCK_AT = Date.UTC(2026, 11, 14, 0, 0, 0);
  const REFRESH_MS = 60_000;

  const $ = (selector) => document.querySelector(selector);
  const toNumber = (value) => value === null || value === undefined || value === "" ? NaN : Number(value);
  const formatUsd = (value, compact = false) => {
    if (!Number.isFinite(value) || value < 0) return "—";
    if (compact && value >= 1_000_000) return "$" + (value / 1_000_000).toFixed(2) + "M";
    if (compact && value >= 10_000) return "$" + (value / 1_000).toFixed(1) + "K";
    if (value >= 1) return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 4 });
    if (value === 0) return "$0";
    return "$" + value.toPrecision(4);
  };

  const showToast = (message) => {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 2300);
  };

  async function copyContract() {
    try {
      await navigator.clipboard.writeText(TOKEN_ADDRESS);
      showToast("Contract address copied");
    } catch (error) {
      const field = document.createElement("textarea");
      field.value = TOKEN_ADDRESS;
      field.setAttribute("readonly", "");
      field.style.position = "absolute";
      field.style.left = "-9999px";
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      showToast(copied ? "Contract address copied" : "Copy failed — select the address manually");
    }
  }

  function initCopyButtons() {
    document.querySelectorAll("[data-copy-contract]").forEach((button) => {
      button.addEventListener("click", copyContract);
    });
  }

  function initMobileNavigation() {
    const button = $(".menu-toggle");
    const nav = $("#primary-nav");
    if (!button || !nav) return;
    const close = () => {
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open navigation");
      nav.classList.remove("is-open");
    };
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      nav.classList.toggle("is-open", open);
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  function initCountdown() {
    const parts = {
      days: $("#count-days"),
      hours: $("#count-hours"),
      minutes: $("#count-minutes"),
      seconds: $("#count-seconds"),
    };
    const tick = () => {
      let remaining = Math.max(0, UNLOCK_AT - Date.now());
      const days = Math.floor(remaining / 86_400_000);
      remaining %= 86_400_000;
      const hours = Math.floor(remaining / 3_600_000);
      remaining %= 3_600_000;
      const minutes = Math.floor(remaining / 60_000);
      const seconds = Math.floor((remaining % 60_000) / 1_000);
      parts.days.textContent = String(days).padStart(2, "0");
      parts.hours.textContent = String(hours).padStart(2, "0");
      parts.minutes.textContent = String(minutes).padStart(2, "0");
      parts.seconds.textContent = String(seconds).padStart(2, "0");
      if (Date.now() >= UNLOCK_AT) {
        const label = $(".countdown-label");
        if (label) label.textContent = "STATED UNLOCK DATE REACHED";
      }
    };
    tick();
    window.setInterval(tick, 1000);
  }

  function setLiveStatus(message, live = false) {
    const status = $("#live-status");
    const dot = $("#live-dot");
    if (status) status.textContent = message;
    if (dot) dot.classList.toggle("is-live", live);
  }

  function setText(selector, value) {
    const element = $(selector);
    if (element) element.textContent = value;
  }

  function renderNoPool() {
    setLiveStatus("NO INDEXED POOL FOUND", false);
    setText("#price-value", "—");
    setText("#liquidity-value", "—");
    setText("#volume-value", "—");
    setText("#cap-value", "—");
    setText("#price-foot", "No verifiable pool data returned");
    setText("#market-updated", "DexScreener returned no indexed APEONX pool · Last checked " + new Date().toLocaleTimeString());
    const frame = $("#dex-chart");
    const placeholder = $("#chart-placeholder");
    if (frame) {
      frame.hidden = true;
      frame.removeAttribute("src");
    }
    if (placeholder) placeholder.hidden = false;
  }

  function renderPair(pair, poolCount) {
    const isBaseToken = pair.baseToken?.address?.toLowerCase() === TOKEN_ADDRESS.toLowerCase();
    const price = isBaseToken ? toNumber(pair.priceUsd) : NaN;
    const liquidity = toNumber(pair.liquidity?.usd);
    const volume24h = toNumber(pair.volume?.h24);
    const cap = isBaseToken ? toNumber(pair.marketCap ?? pair.fdv) : NaN;
    const priceChange = toNumber(pair.priceChange?.h24);

    setText("#price-value", Number.isFinite(price) ? formatUsd(price) : "—");
    setText("#liquidity-value", formatUsd(liquidity, true));
    setText("#volume-value", formatUsd(volume24h, true));
    setText("#cap-value", Number.isFinite(cap) && cap > 0 ? formatUsd(cap, true) : "—");
    setText("#price-foot", Number.isFinite(priceChange) ? (priceChange > 0 ? "+" : "") + priceChange.toFixed(2) + "% over 24h" : "Live indexed token price");
    setText("#market-updated", "Pool: " + (pair.dexId || "DEX") + " · " + poolCount + " pool" + (poolCount === 1 ? "" : "s") + " found · Updated " + new Date().toLocaleTimeString());
    setLiveStatus("LIVE DATA CONNECTED", true);

    const dexLink = $("#dex-link");
    if (dexLink && typeof pair.url === "string" && pair.url.startsWith("https://dexscreener.com/solana/")) {
      dexLink.href = pair.url;
    }

    const chart = $("#dex-chart");
    const placeholder = $("#chart-placeholder");
    if (chart && placeholder && typeof pair.url === "string" && pair.url.startsWith("https://dexscreener.com/solana/")) {
      const chartUrl = new URL(pair.url);
      chartUrl.searchParams.set("embed", "1");
      chartUrl.searchParams.set("theme", "dark");
      chartUrl.searchParams.set("trades", "0");
      chartUrl.searchParams.set("info", "0");
      chart.src = chartUrl.toString();
      chart.hidden = false;
      placeholder.hidden = true;
    }
  }

  async function refreshMarketData() {
    setLiveStatus("REFRESHING LIVE DATA", false);
    try {
      const response = await fetch(DEX_API, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error("DexScreener returned HTTP " + response.status);
      const payload = await response.json();
      if (!Array.isArray(payload)) throw new TypeError("Unexpected DexScreener response format");
      const matching = payload.filter((pair) => {
        const base = pair?.baseToken?.address?.toLowerCase();
        const quote = pair?.quoteToken?.address?.toLowerCase();
        return base === TOKEN_ADDRESS.toLowerCase() || quote === TOKEN_ADDRESS.toLowerCase();
      });
      if (matching.length === 0) {
        renderNoPool();
        return;
      }
      matching.sort((a, b) => Number(b?.liquidity?.usd || 0) - Number(a?.liquidity?.usd || 0));
      const bestPair = matching.find((pair) => pair?.baseToken?.address?.toLowerCase() === TOKEN_ADDRESS.toLowerCase()) || matching[0];
      renderPair(bestPair, matching.length);
    } catch (error) {
      setLiveStatus("LIVE DATA TEMPORARILY UNAVAILABLE", false);
      setText("#market-updated", (error instanceof Error ? error.message : "Could not load market data") + " · Retrying automatically");
      const priceFoot = $("#price-foot");
      if (priceFoot && priceFoot.textContent === "Waiting for indexed pool data") priceFoot.textContent = "No cached or sample values are shown";
    }
  }

  function init() {
    setText("#year", String(new Date().getFullYear()));
    initCopyButtons();
    initMobileNavigation();
    initCountdown();
    refreshMarketData();
    window.setInterval(refreshMarketData, REFRESH_MS);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();