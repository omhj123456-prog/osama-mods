(() => {
  const grid = document.getElementById('mods-grid');
  const status = document.getElementById('status');
  const count = document.getElementById('mod-count');
  const search = document.getElementById('search');
  const category = document.getElementById('category');
  let mods = [];

  // تبديل المظهر مع حفظ الاختيار على نفس الجهاز
  const savedTheme = (() => { try { return localStorage.getItem('osama-mods-theme'); } catch (_) { return null; } })();
  const validThemes = ['normal', 'light', 'pink'];
  function setTheme(theme) {
    if (!validThemes.includes(theme)) theme = 'normal';
    document.body.dataset.theme = theme;
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
    });
    try { localStorage.setItem('osama-mods-theme', theme); } catch (_) {}
  }
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.addEventListener('click', () => setTheme(button.dataset.themeChoice));
  });
  setTheme(savedTheme || 'normal');

  function safeText(value, fallback = '') {
    return typeof value === 'string' ? value.trim() : fallback;
  }

  function makeCard(mod) {
    const card = document.createElement('article');
    card.className = 'mod-card';

    const imageUrl = safeText(mod.image);
    if (imageUrl) {
      const image = document.createElement('img');
      image.className = 'mod-image';
      image.src = imageUrl;
      image.alt = safeText(mod.name, 'صورة المود');
      image.loading = 'lazy';
      image.onerror = () => {
        const placeholder = document.createElement('div');
        placeholder.className = 'mod-image-placeholder';
        placeholder.textContent = 'OM';
        image.replaceWith(placeholder);
      };
      card.appendChild(image);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'mod-image-placeholder';
      placeholder.textContent = 'OM';
      card.appendChild(placeholder);
    }

    const content = document.createElement('div');
    content.className = 'mod-content';
    const badge = document.createElement('span');
    badge.className = 'mod-category';
    badge.textContent = safeText(mod.category, 'عام');
    const title = document.createElement('h3');
    title.textContent = safeText(mod.name, 'مود بدون اسم');
    const description = document.createElement('p');
    description.textContent = safeText(mod.description, 'لا يوجد وصف لهذا المود.');
    content.append(badge, title, description);

    const downloadUrl = safeText(mod.download);
    const link = document.createElement('a');
    link.className = 'download';
    link.textContent = 'تحميل المود';
    if (downloadUrl && /^https?:\/\//i.test(downloadUrl)) {
      link.href = downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    } else {
      link.href = '#';
      link.setAttribute('aria-disabled', 'true');
      link.style.opacity = '.55';
      link.addEventListener('click', event => {
        event.preventDefault();
        status.hidden = false;
        status.className = 'status error';
        status.textContent = 'رابط التحميل لهذا المود غير صحيح. عدّل قيمة download في mods.json.';
      });
    }
    content.appendChild(link);
    card.appendChild(content);
    return card;
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const selectedCategory = category.value;
    const filtered = mods.filter(mod => {
      const haystack = [mod.name, mod.description, mod.category].map(value => safeText(value).toLocaleLowerCase()).join(' ');
      return haystack.includes(query) && (!selectedCategory || safeText(mod.category, 'عام') === selectedCategory);
    });
    grid.replaceChildren();
    filtered.forEach(mod => grid.appendChild(makeCard(mod)));
    count.textContent = `${filtered.length} مود`;
    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = mods.length ? 'ما لقينا مود يطابق بحثك.' : 'لا توجد مودات في ملف mods.json.';
      grid.appendChild(empty);
    }
  }

  async function loadMods() {
    try {
      const response = await fetch('./mods.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('mods.json يجب أن يحتوي على قائمة JSON تبدأ بـ [ وتنتهي بـ ]');
      mods = data.filter(item => item && typeof item === 'object' && !Array.isArray(item));
      const categories = [...new Set(mods.map(mod => safeText(mod.category, 'عام')).filter(Boolean))].sort();
      categories.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        category.appendChild(option);
      });
      status.hidden = true;
      render();
    } catch (error) {
      count.textContent = 'تعذّر التحميل';
      status.hidden = false;
      status.className = 'status error';
      status.textContent = 'تعذّر قراءة mods.json. تأكد أنه مرفوع بجانب index.html وأن صيغة JSON صحيحة، ثم أعد النشر.';
      console.error('OSAMA MODS: failed to load mods.json', error);
    }
  }

  search.addEventListener('input', render);
  category.addEventListener('change', render);
  loadMods();
})();
