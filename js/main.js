// Dinesh G - Portfolio Scripts

const GITHUB_USER = 'idineshgovind';
const REPOS_TOP = 5;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollEffects();
  initMobileNav();
  initProjects();
});

// GitHub projects: use cached JSON (updated by authenticated workflow) to avoid API rate limits
function initProjects() {
  const container = document.getElementById('projects-list');
  const loading = document.getElementById('projects-loading');
  const loadMoreBtn = document.getElementById('projects-load-more');

  if (!container || !loading) return;

  function handleRepos(repos) {
    loading.remove();
    const all = repos.filter((r) => !r.fork && !r.private);
    const top = all.slice(0, REPOS_TOP);
    const rest = all.slice(REPOS_TOP);

    renderProjects(container, top);

    if (rest.length > 0) {
      loadMoreBtn.style.display = 'inline-flex';
      loadMoreBtn.textContent = `Show all projects (${rest.length} more)`;
      loadMoreBtn.addEventListener('click', () => {
        renderProjects(container, all);
        loadMoreBtn.remove();
      });
    }
  }

  function showError() {
    loading.textContent = 'Could not load projects. Check back later.';
    loading.classList.add('projects-error');
  }

  // Try cached file first (avoids rate limits); fall back to API
  fetch('data/repos.json')
    .then((res) => {
      if (res.ok) return res.json();
      throw new Error('No cache');
    })
    .then(handleRepos)
    .catch(() => {
      fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=created&direction=desc&per_page=100`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch repos');
          return res.json();
        })
        .then(handleRepos)
        .catch(showError);
    });
}

function renderProjects(container, repos) {
  container.innerHTML = repos
    .map(
      (r) => `
    <article class="project-card">
      <div class="project-content">
        <h3 class="project-title">${escapeHtml(r.name)}</h3>
        <p class="project-desc">${escapeHtml(r.description || 'No description.')}</p>
        <div class="project-meta">
          ${r.language ? `<span class="project-lang">${escapeHtml(r.language)}</span>` : ''}
          <span class="project-stars">★ ${r.stargazers_count}</span>
        </div>
        <a href="${escapeHtml(r.html_url)}" target="_blank" rel="noopener noreferrer" class="project-link">View on GitHub →</a>
      </div>
    </article>
  `
    )
    .join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Theme toggle (dark/light)
function initTheme() {
  const toggle = document.querySelector('.theme-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');

  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);

  toggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

// Scroll-triggered fade-in for sections
function initScrollEffects() {
  const sections = document.querySelectorAll('.section, .hero');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

  sections.forEach((section, i) => {
    section.classList.add('fade-in');
    section.style.transitionDelay = `${i * 0.05}s`;
    observer.observe(section);
  });
}

// Mobile navigation toggle
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  toggle?.addEventListener('click', () => {
    links?.classList.toggle('open');
    toggle.classList.toggle('active');
  });

  // Close on link click (for anchor links)
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      links?.classList.remove('open');
      toggle?.classList.remove('active');
    });
  });
}
