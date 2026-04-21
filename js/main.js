// Dinesh G - Portfolio Scripts

const GITHUB_USER = 'idineshgovind';
const REPOS_TOP = 5;
const SECTION_IDS = ['about', 'skills', 'work', 'experience', 'contact'];
const WEBMCP_THEME_VALUES = ['light', 'dark', 'toggle'];

let allProjects = [];
let visibleProjects = [];
let projectsLoadPromise = Promise.resolve();
let projectsLoadError = null;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollEffects();
  initMobileNav();
  initProjects();
  initWebMcp();
});

// GitHub API: fetch repos (sorted by created desc), then show top 5, "Show all" loads rest
function initProjects() {
  const container = document.getElementById('projects-list');
  const loading = document.getElementById('projects-loading');
  const loadMoreBtn = document.getElementById('projects-load-more');

  if (!container || !loading) {
    allProjects = [];
    visibleProjects = [];
    projectsLoadError = new Error('Projects container is unavailable');
    return;
  }

  projectsLoadError = null;
  projectsLoadPromise = fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=created&direction=desc&per_page=100`)
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch repos');
      return res.json();
    })
    .then((repos) => {
      loading.remove();
      const all = repos.filter((r) => !r.fork && !r.private);
      const top = all.slice(0, REPOS_TOP);
      const rest = all.slice(REPOS_TOP);
      allProjects = all;

      renderProjects(container, top);

      if (rest.length > 0) {
        loadMoreBtn.style.display = 'inline-flex';
        loadMoreBtn.textContent = `Show all projects (${rest.length} more)`;
        loadMoreBtn.addEventListener('click', () => {
          renderProjects(container, all);
          loadMoreBtn.remove();
        });
      }
    })
    .catch(() => {
      projectsLoadError = new Error('Could not load projects from GitHub');
      allProjects = [];
      visibleProjects = [];
      loading.textContent = 'Could not load projects. Check back later.';
      loading.classList.add('projects-error');
    });
}

function renderProjects(container, repos) {
  visibleProjects = Array.isArray(repos) ? [...repos] : [];
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
  applyTheme(theme);

  toggle?.addEventListener('click', () => {
    const current = getCurrentTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
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

function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme) {
  if (theme !== 'dark' && theme !== 'light') return false;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  return true;
}

function clampInteger(value, minimum, maximum, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, minimum), maximum);
}

function toProjectToolPayload(repo) {
  return {
    name: repo.name,
    description: repo.description || '',
    url: repo.html_url,
    language: repo.language || null,
    stars: repo.stargazers_count,
  };
}

function registerToolsWithProvideContext(modelContext, tools, signal) {
  if (typeof modelContext?.provideContext !== 'function') return false;

  const attempts = [
    () => modelContext.provideContext({ tools }),
    () => modelContext.provideContext({ tools, signal }),
    () => modelContext.provideContext(tools),
  ];

  for (const attempt of attempts) {
    try {
      attempt();
      return true;
    } catch {
      // Keep trying known signatures while implementations are evolving.
    }
  }

  return false;
}

function registerToolsIndividually(modelContext, tools, signal) {
  if (typeof modelContext?.registerTool !== 'function') return;

  tools.forEach((tool) => {
    try {
      modelContext.registerTool(tool, { signal });
    } catch {
      // Ignore per-tool registration failures in unsupported browsers.
    }
  });
}

function initWebMcp() {
  if (!window.isSecureContext) return;

  const modelContext = navigator.modelContext;
  if (!modelContext) return;

  const abortController = new AbortController();
  window.addEventListener('pagehide', () => abortController.abort(), { once: true });

  const tools = [
    {
      name: 'site.navigate_to_section',
      description: 'Scrolls to a section of this portfolio page by section id.',
      inputSchema: {
        type: 'object',
        properties: {
          section: {
            type: 'string',
            enum: SECTION_IDS,
            description: 'Section id to scroll to (about, skills, work, experience, contact).',
          },
          behavior: {
            type: 'string',
            enum: ['auto', 'smooth'],
            description: 'Scroll behavior.',
          },
        },
        required: ['section'],
        additionalProperties: false,
      },
      execute: async (input = {}) => {
        const section = typeof input.section === 'string' ? input.section : '';
        if (!SECTION_IDS.includes(section)) {
          return {
            ok: false,
            error: 'Unknown section id.',
            availableSections: SECTION_IDS,
          };
        }

        const target = document.getElementById(section);
        if (!target) {
          return { ok: false, error: 'Section element not found in the page.' };
        }

        const behavior = input.behavior === 'auto' ? 'auto' : 'smooth';
        target.scrollIntoView({ behavior, block: 'start' });
        history.replaceState(null, '', `#${section}`);
        return { ok: true, section, hash: `#${section}` };
      },
    },
    {
      name: 'site.set_theme',
      description: 'Sets or toggles the site theme between light and dark.',
      inputSchema: {
        type: 'object',
        properties: {
          theme: {
            type: 'string',
            enum: WEBMCP_THEME_VALUES,
            description: 'Use "light", "dark", or "toggle".',
          },
        },
        required: ['theme'],
        additionalProperties: false,
      },
      execute: async (input = {}) => {
        const requestedTheme = typeof input.theme === 'string' ? input.theme : '';
        if (!WEBMCP_THEME_VALUES.includes(requestedTheme)) {
          return {
            ok: false,
            error: 'Unsupported theme value.',
            supportedValues: WEBMCP_THEME_VALUES,
          };
        }

        const resolvedTheme =
          requestedTheme === 'toggle'
            ? getCurrentTheme() === 'dark'
              ? 'light'
              : 'dark'
            : requestedTheme;

        applyTheme(resolvedTheme);
        return { ok: true, theme: getCurrentTheme() };
      },
    },
    {
      name: 'site.get_projects',
      description: 'Returns project metadata from the GitHub-powered Projects section.',
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['visible', 'all'],
            description: 'visible returns currently rendered cards, all returns every fetched project.',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            description: 'Maximum number of projects to return.',
          },
        },
        additionalProperties: false,
      },
      execute: async (input = {}) => {
        await projectsLoadPromise.catch(() => undefined);

        if (projectsLoadError) {
          return { ok: false, error: 'Projects are currently unavailable.' };
        }

        const scope = input.scope === 'all' ? 'all' : 'visible';
        const limit = clampInteger(input.limit, 1, 100, 10);
        const source = scope === 'all' ? allProjects : visibleProjects;
        return {
          ok: true,
          scope,
          total: source.length,
          projects: source.slice(0, limit).map(toProjectToolPayload),
        };
      },
    },
    {
      name: 'site.expand_projects',
      description: 'Expands the Projects section to reveal all available project cards.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      execute: async () => {
        await projectsLoadPromise.catch(() => undefined);

        const loadMoreBtn = document.getElementById('projects-load-more');
        if (!loadMoreBtn) {
          return { ok: false, error: 'Projects controls are not available on this page.' };
        }

        const isVisible = window.getComputedStyle(loadMoreBtn).display !== 'none';
        if (!isVisible) {
          return { ok: true, expanded: true, totalVisible: visibleProjects.length };
        }

        loadMoreBtn.click();
        return { ok: true, expanded: true, totalVisible: visibleProjects.length };
      },
    },
    {
      name: 'site.get_contact_links',
      description: 'Returns contact and social links that appear on the page.',
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      execute: async () => {
        const links = Array.from(document.querySelectorAll('.contact-links a, .hero-social a')).map((anchor) => ({
          label: anchor.textContent?.trim() || anchor.getAttribute('aria-label') || 'Link',
          href: anchor.href,
        }));

        return {
          ok: true,
          total: links.length,
          links,
        };
      },
    },
  ];

  const provided = registerToolsWithProvideContext(modelContext, tools, abortController.signal);
  if (!provided) {
    registerToolsIndividually(modelContext, tools, abortController.signal);
  }
}
