(() => {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  const productsToggle = document.querySelector('[data-products-toggle]');
  const productsDropdown = productsToggle?.closest('.nav-dropdown');

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  if (productsToggle && productsDropdown) {
    const openDropdown = () => {
      productsDropdown.classList.add('is-open');
      productsToggle.setAttribute('aria-expanded', 'true');
    };

    const closeDropdown = () => {
      productsDropdown.classList.remove('is-open');
      productsToggle.setAttribute('aria-expanded', 'false');
    };

    productsDropdown.addEventListener('mouseenter', () => {
      openDropdown();
    });

    productsToggle.addEventListener('click', (event) => {
      event.preventDefault();
      if (productsDropdown.classList.contains('is-open')) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    document.addEventListener('click', (event) => {
      if (!productsDropdown.contains(event.target)) {
        closeDropdown();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeDropdown();
      }
    });
  }

  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -30px 0px' }
    );

    reveals.forEach((el) => observer.observe(el));
  }
})();
