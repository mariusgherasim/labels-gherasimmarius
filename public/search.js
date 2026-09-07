// LabelShop — Live search with diacritics-insensitive matching
(function () {
  let products = null;
  let timeout = null;

  const input = document.getElementById('search-input');
  const dropdown = document.getElementById('search-results');
  if (!input || !dropdown) return;

  function normalize(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ș/g, 's').replace(/ț/g, 't')
      .replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i');
  }

  async function loadProducts() {
    if (products) return products;
    const res = await fetch('/products.json');
    products = await res.json();
    return products;
  }

  function render(results) {
    if (!results.length) {
      dropdown.innerHTML = '<div class="search-item" style="justify-content:center;color:var(--mid)">Niciun rezultat</div>';
    } else {
      dropdown.innerHTML = results.slice(0, 8).map(p => `
        <a href="${p.url}" target="_blank" rel="nofollow noopener sponsored" class="search-item">
          <img src="${p.image || '/placeholder.svg'}" alt="" onerror="this.src='/placeholder.svg'" />
          <div class="search-item-info">
            <div class="search-item-title">${p.title}</div>
            <div class="search-item-price">${p.price.toFixed(2)} RON</div>
          </div>
        </a>
      `).join('');
    }
    dropdown.hidden = false;
  }

  async function search(query) {
    const q = normalize(query);
    if (q.length < 2) { dropdown.hidden = true; return; }
    const all = await loadProducts();
    const results = all.filter(p => normalize(p.title).includes(q) || normalize(p.brand || '').includes(q));
    render(results);
  }

  input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => search(input.value.trim()), 220);
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.hidden = true;
    }
  });

  // Mobile nav toggle
  const toggle = document.getElementById('nav-toggle');
  const headerInner = document.querySelector('.header-inner');
  if (toggle && headerInner) {
    toggle.addEventListener('click', () => {
      const open = headerInner.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open);
    });
  }
})();
