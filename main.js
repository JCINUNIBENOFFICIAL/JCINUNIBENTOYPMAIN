// Accessible mobile navigation and dropdown handling.
function toggleMenu(forceOpen) {
  const nav = document.querySelector("header nav");
  const toggle = document.querySelector(".menu-toggle");
  if (!nav || !toggle) return;

  const shouldOpen = typeof forceOpen === "boolean"
    ? forceOpen
    : !nav.classList.contains("active");

  nav.classList.toggle("active", shouldOpen);
  document.body.classList.toggle("menu-open", shouldOpen);
  toggle.setAttribute("aria-expanded", String(shouldOpen));
  toggle.setAttribute("aria-label", shouldOpen ? "Close navigation menu" : "Open navigation menu");
}

document.addEventListener("DOMContentLoaded", function () {
  const nav = document.querySelector("header nav");
  const toggle = document.querySelector(".menu-toggle");
  const dropdowns = document.querySelectorAll(".dropdown");

  if (toggle && nav) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "primary-navigation");
    nav.id = nav.id || "primary-navigation";
  }

  dropdowns.forEach((dropdown) => {
    const link = dropdown.querySelector(":scope > a");
    if (!link) return;

    link.setAttribute("aria-haspopup", "true");
    link.setAttribute("aria-expanded", "false");
    link.addEventListener("click", function (event) {
      event.preventDefault();
      const opening = !dropdown.classList.contains("active");
      dropdowns.forEach((other) => {
        other.classList.remove("active");
        const otherLink = other.querySelector(":scope > a");
        if (otherLink) otherLink.setAttribute("aria-expanded", "false");
      });
      dropdown.classList.toggle("active", opening);
      link.setAttribute("aria-expanded", String(opening));
    });
  });

  if (nav) {
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", function () {
        if (!link.closest(".dropdown") || link.closest(".dropdown-menu")) {
          toggleMenu(false);
        }
      });
    });
  }

  document.addEventListener("click", function (event) {
    if (nav && nav.classList.contains("active") &&
        !nav.contains(event.target) &&
        !event.target.closest(".menu-toggle")) {
      toggleMenu(false);
    }

    dropdowns.forEach((dropdown) => {
      if (!dropdown.contains(event.target)) {
        dropdown.classList.remove("active");
        const link = dropdown.querySelector(":scope > a");
        if (link) link.setAttribute("aria-expanded", "false");
      }
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      toggleMenu(false);
      dropdowns.forEach((dropdown) => dropdown.classList.remove("active"));
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) {
      toggleMenu(false);
    }
  });
});

window.addEventListener("load", function () {
  const preloader = document.getElementById("creative-preloader");
  if (preloader) preloader.style.display = "none";
});

const yearElement = document.querySelector(".year");
if (yearElement) yearElement.textContent = new Date().getFullYear();
