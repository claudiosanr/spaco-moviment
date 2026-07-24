const WHATSAPP_NUMBER = "5561991581707";

// Bloqueia cópia de texto, clique-direito, arrastar imagem e zoom (pinça/duplo toque)
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("copy", (e) => e.preventDefault());
document.addEventListener("selectstart", (e) => e.preventDefault());
document.addEventListener("dragstart", (e) => e.preventDefault());
document.addEventListener("gesturestart", (e) => e.preventDefault());

let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  },
  { passive: false }
);

function buildWhatsAppLink(message) {
  const base = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}`
    : `https://wa.me/`;
  return `${base}?text=${encodeURIComponent(message)}`;
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Mobile nav toggle
const navToggle = document.getElementById("nav-toggle");
const mainNav = document.getElementById("main-nav");

navToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => mainNav.classList.remove("is-open"));
});

// Sticky header state
const header = document.getElementById("site-header");
function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 40);
}

// WhatsApp CTA (contact section)
const contactWhatsApp = document.getElementById("contact-whatsapp");
contactWhatsApp.href = buildWhatsAppLink(
  "Olá! Vim pelo site da Spaço Moviment e gostaria de marcar uma avaliação."
);

// Contact form: coleta nome/telefone e encaminha pro WhatsApp (site estático, sem backend)
const contactForm = document.getElementById("contact-form");
contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nome = document.getElementById("input-nome").value.trim();
  const telefone = document.getElementById("input-telefone").value.trim();
  if (!nome || !telefone) return;

  const message =
    `Olá! Me chamo ${nome} e vim pelo site da Spaço Moviment.\n` +
    `Meu telefone: ${telefone}.\n` +
    `Gostaria de marcar minha avaliação.`;

  window.open(buildWhatsAppLink(message), "_blank", "noopener");
});

// Smooth scroll (Lenis quando disponível; senão scroll nativo do navegador)
let lenis = null;
if (!prefersReducedMotion && typeof Lenis !== "undefined") {
  lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
  });
}

// Herói cinematográfico: scroll controla o tempo do vídeo (scroll scrub)
const heroSection = document.querySelector(".cinematic-hero");
const heroVideo = document.getElementById("hero-video");

function updateHeroScrub() {
  if (prefersReducedMotion) return;
  const duration = heroVideo.duration;
  if (!duration || Number.isNaN(duration) || heroVideo.readyState < 1) return;
  const rect = heroSection.getBoundingClientRect();
  const scrollable = rect.height - window.innerHeight;
  if (scrollable <= 0) return;
  const progress = clamp(-rect.top / scrollable, 0, 1);
  const targetTime = progress * duration;
  if (Math.abs(heroVideo.currentTime - targetTime) > 0.03) {
    heroVideo.currentTime = targetTime;
  }
}

// Sequências pinadas (filosofia, pilares, espaço): uma etapa ativa por vez, calculada pelo scroll
function createPinnedSequence(section, stepSelector) {
  if (!section) return null;
  const steps = Array.from(section.querySelectorAll(stepSelector));
  if (!steps.length) return null;

  return function update() {
    const rect = section.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const progress = clamp(scrollable > 0 ? -rect.top / scrollable : 0, 0, 1);
    const activeIndex = Math.min(steps.length - 1, Math.floor(progress * steps.length));
    steps.forEach((el, i) => el.classList.toggle("is-active", i === activeIndex));
    return { progress, activeIndex, rect };
  };
}

const philosophySection = document.querySelector(".philosophy");
const updatePhilosophy = createPinnedSequence(philosophySection, ".philosophy-line");

const pillarsSection = document.querySelector(".pillars");
const updatePillars = createPinnedSequence(pillarsSection, ".pillar-card");
const pillarsBgImg = document.querySelector(".pillars-bg img");

const workspaceSection = document.querySelector(".workspace");
const workspaceBgs = Array.from(document.querySelectorAll(".workspace-bg"));
const workspaceCaptions = Array.from(document.querySelectorAll(".workspace-caption"));

function updateWorkspace() {
  if (!workspaceSection || !workspaceBgs.length) return;
  const rect = workspaceSection.getBoundingClientRect();
  const scrollable = rect.height - window.innerHeight;
  const progress = clamp(scrollable > 0 ? -rect.top / scrollable : 0, 0, 1);
  const activeIndex = Math.min(workspaceBgs.length - 1, Math.floor(progress * workspaceBgs.length));

  workspaceBgs.forEach((el, i) => {
    const isActive = i === activeIndex;
    el.classList.toggle("is-active", isActive);
    if (isActive && !prefersReducedMotion) {
      const img = el.querySelector("img");
      if (img) img.style.transform = `translateY(${rect.top * 0.12}px)`;
    }
  });
  workspaceCaptions.forEach((el, i) => el.classList.toggle("is-active", i === activeIndex));
}

function updatePillarsParallax(rect) {
  if (!pillarsBgImg || prefersReducedMotion) return;
  pillarsBgImg.style.transform = `translateY(${rect.top * 0.15}px)`;
}

function updateAll() {
  updateHeader();
  updateHeroScrub();
  if (updatePhilosophy) updatePhilosophy();
  if (updatePillars) {
    const state = updatePillars();
    if (state) updatePillarsParallax(state.rect);
  }
  updateWorkspace();
}

function raf(time) {
  if (lenis) lenis.raf(time);
  updateAll();
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Reveal on scroll (elementos não pinados: dores, depoimentos)
const revealTargets = document.querySelectorAll("[data-reveal]");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
revealTargets.forEach((el) => observer.observe(el));
