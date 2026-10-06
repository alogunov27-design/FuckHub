/* Progressive presentation enhancements. No account, payment or catalog logic. */
(() => {
  'use strict';
  document.querySelectorAll('[data-password]').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.password);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(show));
      button.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
    });
  });

  const app = document.getElementById('view-app');
  const updateAccountState = () => {
    document.body.classList.toggle('signed-in', !!app && !app.classList.contains('hidden'));
  };
  if (app) {
    updateAccountState();
    new MutationObserver(updateAccountState).observe(app, { attributes: true, attributeFilter: ['class'] });
  }
  document.querySelectorAll('[data-tab], [data-auth]').forEach(button => {
    const updateSelected = () => button.setAttribute('aria-pressed', String(button.classList.contains('on')));
    updateSelected();
    new MutationObserver(updateSelected).observe(button, { attributes: true, attributeFilter: ['class'] });
  });

  for (const id of ['shop-girls', 'mine-list']) {
    const container = document.getElementById(id);
    if (!container) continue;
    const describeImages = () => {
      container.querySelectorAll('article').forEach(card => {
        const image = card.querySelector('img');
        if (!image) return;
        image.alt = card.querySelector('h3')?.textContent || '';
        image.loading = 'lazy';
        image.decoding = 'async';
      });
    };
    describeImages();
    new MutationObserver(describeImages).observe(container, { childList: true, subtree: true });
  }

  document.querySelectorAll('[data-copy-card]').forEach(button => {
    button.addEventListener('click', async () => {
      const panel = button.closest('.panel');
      const card = panel.querySelector('.price').textContent.trim();
      const feedback = panel.querySelector('.copy-status');
      try {
        await navigator.clipboard.writeText(card.replace(/\s/g, ''));
        feedback.textContent = 'Номер карты скопирован';
      } catch {
        feedback.textContent = 'Номер карты: ' + card;
      }
    });
  });
})();
