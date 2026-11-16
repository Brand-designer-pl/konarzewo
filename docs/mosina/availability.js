(() => {
  const seed = new URL('../data/offers.json', document.currentScript.src);
  const labels = {
    pending: 'Dostępność do potwierdzenia',
    available: 'Dostępny',
    reserved: 'Zarezerwowany',
    sold: 'Sprzedany',
  };
  const money = new Intl.NumberFormat('pl-PL', {
    style: 'currency', currency: 'PLN', maximumFractionDigits: 0,
  });
  const targets = document.querySelectorAll('[data-mosina-offer]');
  let pending = false;

  async function refresh() {
    if (pending || document.hidden) return;
    pending = true;
    try {
      const response = await fetch(window.MB_OFFERS_URL || seed, { cache: 'no-store' });
      if (!response.ok) return;
      const { offers } = await response.json();
      if (!Array.isArray(offers)) return;
      const units = new Map(offers.filter(offer => offer.investment === 'Mosina')
        .map(offer => [offer.id, offer]));
      for (const target of targets) {
        const offer = units.get(target.dataset.mosinaOffer);
        if (!offer || !Object.hasOwn(labels, offer.status)) continue;
        let price = Number.isFinite(offer.price) ? money.format(offer.price) : 'Cena do potwierdzenia';
        if (offer.id === 'mosina-a1' && offer.version === 1) price += ' wg ogłoszenia';
        target.querySelector('[data-mosina-price]').textContent = price;
        target.querySelector('[data-mosina-status]').textContent = labels[offer.status];
        target.dataset.status = offer.status;
      }
    } catch {
      // Retain the last displayed values during a connection interruption.
    } finally {
      pending = false;
    }
  }

  let timer;
  function updateSchedule() {
    clearInterval(timer);
    if (document.hidden) return;
    refresh();
    timer = setInterval(refresh, 10000);
  }
  document.addEventListener('visibilitychange', updateSchedule);
  window.addEventListener('pageshow', updateSchedule);
  window.addEventListener('pagehide', () => clearInterval(timer));
  updateSchedule();
})();
