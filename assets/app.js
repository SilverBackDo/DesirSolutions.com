// ── Active nav link ──
const navLinks = document.querySelectorAll('nav a');
const current = window.location.pathname.split('/').pop() || 'index.html';
navLinks.forEach((link) => {
  const href = link.getAttribute('href');
  if (href === current) link.classList.add('active');
});

// ── Mobile hamburger toggle ──
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    const expanded = nav.classList.contains('open');
    toggle.setAttribute('aria-expanded', expanded);
  });
}

// ── Engagement tabs ──
document.querySelectorAll('.engage-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tab.closest('.container').querySelectorAll('.engage-tab').forEach((t) => t.classList.remove('active'));
    tab.closest('.container').querySelectorAll('.engage-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById('panel-' + target);
    if (panel) panel.classList.add('active');
  });
});

// ── Contact form async UX ──
const contactForm = document.querySelector('[data-contact-form]');
if (contactForm) {
  const statusEl = document.getElementById('contactFormStatus');
  const usesStaticFallback = window.location.hostname.endsWith('github.io');

  const buildMailtoHref = (formData) => {
    const subject = `[Assessment Request] ${formData.get('company') || 'New Inquiry'} - ${formData.get('priority') || 'General Inquiry'}`;
    const lines = [
      'Assessment inquiry details',
      '',
      `Name: ${formData.get('name') || ''}`,
      `Email: ${formData.get('email') || ''}`,
      `Company: ${formData.get('company') || ''}`,
      `Role: ${formData.get('role') || ''}`,
      `Primary Environment: ${formData.get('environment') || ''}`,
      `Timeline: ${formData.get('timeline') || ''}`,
      `Primary Need: ${formData.get('priority') || ''}`,
      `Environment Scope: ${formData.get('infrastructure_scope') || ''}`,
      `Budget Range: ${formData.get('budget_band') || ''}`,
      '',
      'Current situation:',
      `${formData.get('message') || ''}`,
    ];
    return `mailto:contact@desirsolutions.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  };

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (statusEl) {
      statusEl.textContent = 'Submitting...';
      statusEl.style.color = '#64748b';
    }

    try {
      const formData = new FormData(contactForm);
      if (usesStaticFallback) {
        if (statusEl) {
          statusEl.textContent = 'The secure intake API is unavailable on this public preview. Your email client will open so you can send the request directly.';
          statusEl.style.color = '#1d4ed8';
        }
        window.location.href = buildMailtoHref(formData);
        return;
      }

      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      contactForm.reset();
      if (statusEl) {
        statusEl.textContent = 'Thank you. Your request has been received. We will follow up within one business day.';
        statusEl.style.color = '#166534';
      }
    } catch (error) {
      if (statusEl) {
        statusEl.textContent = 'Submission could not be completed. Please retry or email contact@desirsolutions.com.';
        statusEl.style.color = '#b91c1c';
      }
    }
  });
}
