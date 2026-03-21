document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-nav]');

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener('click', function () {
    nav.classList.toggle('open');
  });
});
