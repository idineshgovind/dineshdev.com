// Dinesh G - Portfolio Scripts

const GITHUB_USER = 'idineshgovind';
const REPOS_TOP = 5;
const SECTION_IDS = ['about', 'skills', 'work', 'experience', 'focus', 'learning', 'writing', 'now', 'contact'];

// Curated project copy: problem → solution → impact (fallback to GitHub description)
const PROJECT_META = {
  'BlockDrop-TetrisGame': {
    category: 'Mobile',
    description:
      'Classic Tetris rebuilt for Android and iOS from a shared codebase. Problem: prove cross-platform game UX without sacrificing native feel. Solution: Kotlin Multiplatform with Compose Multiplatform. Impact: one logic layer, two polished clients — and a deep lesson in shared UI architecture.',
  },
  'HarryPotterAPI': {
    category: 'Backend',
    description:
      'REST API for Harry Potter character data. Problem: learn server-side design hands-on. Solution: Kotlin Ktor service with clean endpoints and structured responses. Impact: foundation for mobile clients and a practical intro to API design beyond the client.',
  },
  'OpenWeatherMap-AndroidSDK': {
    category: 'Open Source',
    description:
      'Kotlin wrapper around OpenWeatherMap APIs. Problem: existing Android integrations were dated and awkward to use. Solution: a modern, typed SDK with sensible defaults. Impact: simpler weather features in any Android app — fewer boilerplate calls, clearer error handling.',
  },
  'Google-Translator-Cursor-Plugin': {
    category: 'AI',
    description:
      'Cursor plugin for in-editor translation. Problem: context switching breaks flow when working across languages. Solution: translate selected text inside the editor and paste results back instantly. Impact: faster multilingual development with less friction.',
  },
  'ArtieChatBot': {
    category: 'AI',
    description:
      'Conversational Android assistant. Problem: explore how AI could feel useful inside a mobile app, not bolted on. Solution: OpenAI-backed chat with thoughtful Android integration. Impact: early experiments in AI UX patterns that informed later product thinking.',
  },
  'PdfBox-Android': {
    category: 'Open Source',
    description:
      'Android port of Apache PdfBox. Problem: PDF manipulation on Android lacked a mature Java library. Solution: adapt PdfBox for the Android runtime. Impact: enables document processing features in mobile apps that depend on reliable PDF handling.',
  },
  'SIP-Investment-Calculator': {
    category: 'Web',
    description:
      'Interactive SIP calculator for investment planning. Problem: most calculators hide the math or feel clunky on mobile. Solution: a responsive, no-framework web app with clear inputs and visual growth projections. Impact: helps users understand long-term savings with adjustable parameters.',
  },
  'dineshdev.com': {
    category: 'Web',
    description:
      'This portfolio site. Problem: represent who I am as an engineer, not just a list of technologies. Solution: a lightweight, accessible static site with agent-friendly metadata. Impact: a clear home for my work, writing, and how to reach me.',
  },
  'HarryPotterCharacters': {
    category: 'Mobile',
    description:
      'Character browser powered by a custom API. Problem: practice end-to-end mobile development with real network data. Solution: clean list UI wired to the Harry Potter REST service. Impact: solidified patterns for API consumption, loading states, and presentation on Android.',
  },
  'Video-Compression-Automation-Script': {
    category: 'Experiments',
    description:
      'Batch video compression pipeline. Problem: large video files slow down sharing and storage. Solution: ffmpeg automation with parallel processing and quality tiers. Impact: organized output, compression reports, and a reusable script for media workflows.',
  },
  'AdventOfCode2024-Solutions': {
    category: 'Experiments',
    description:
      'Advent of Code 2024 solutions. Problem: sharpen algorithmic thinking under time pressure. Solution: daily puzzle implementations in Python. Impact: kept problem-solving instincts sharp and explored edge cases outside day-to-day product work.',
  },
  'kmmsampleapp': {
    category: 'Mobile',
    description:
      'Kotlin Multiplatform sample exploring shared business logic across platforms. Problem: understand KMP project structure and shared modules in practice. Solution: a minimal multi-target app with common and platform-specific layers. Impact: hands-on reference for cross-platform architecture decisions.',
  },
  'WeatherWise': {
    category: 'Mobile',
    description:
      'Weather app experiment focused on clean data presentation. Problem: weather apps often overwhelm with data. Solution: a focused Android client with essential forecasts and readable UI. Impact: practice in API integration, state management, and user-centered information design.',
  },
};
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

function getProjectMeta(repo) {
  const curated = PROJECT_META[repo.name];
  if (curated) {
    return {
      category: curated.category,
      description: curated.description,
    };
  }

  return {
    category: null,
    description: repo.description || 'An engineering experiment — details on GitHub.',
  };
}

function renderProjects(container, repos) {
  visibleProjects = Array.isArray(repos) ? [...repos] : [];
  container.innerHTML = repos
    .map((r) => {
      const meta = getProjectMeta(r);
      return `
    <article class="project-card">
      <div class="project-content">
        ${meta.category ? `<span class="project-category">${escapeHtml(meta.category)}</span>` : ''}
        <h3 class="project-title">${escapeHtml(r.name)}</h3>
        <p class="project-desc">${escapeHtml(meta.description)}</p>
        <div class="project-meta">
          ${r.language ? `<span class="project-lang">${escapeHtml(r.language)}</span>` : ''}
          <span class="project-stars">★ ${r.stargazers_count}</span>
        </div>
        <a href="${escapeHtml(r.html_url)}" target="_blank" rel="noopener noreferrer" class="project-link">View on GitHub →</a>
      </div>
    </article>
  `;
    })
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
            description: 'Section id to scroll to (about, skills, work, experience, focus, learning, writing, now, contact).',
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
