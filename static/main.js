// Kinetic Registration Site — Frontend JS
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initStatsAndLeaderboard();
  initRegistrationForm();
});

function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.getElementById("primary-nav-links");
  if (!toggle || !navLinks) return;

  toggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initStatsAndLeaderboard() {
  const regCountEl = document.getElementById("reg-count");
  const booksCountEl = document.getElementById("books-count");
  const container = document.getElementById("top-books-container");

  fetch("/api/stats")
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      const registrations = Number(data.registrations) || 0;
      const topBooks = Array.isArray(data.top_books) ? data.top_books : [];

      if (regCountEl) regCountEl.textContent = registrations.toLocaleString();
      if (booksCountEl) booksCountEl.textContent = String(topBooks.length);
      if (container) renderTopBooks(container, topBooks);
    })
    .catch(() => {
      if (container) {
        container.innerHTML = "";
        const msg = document.createElement("p");
        msg.className = "leaderboard-empty";
        msg.textContent = "Live book stats are temporarily unavailable. You can still submit your favorite textbooks below.";
        container.appendChild(msg);
      }
    });
}

function renderTopBooks(container, topBooks) {
  container.innerHTML = "";

  if (!topBooks.length) {
    const empty = document.createElement("p");
    empty.className = "leaderboard-empty";
    empty.textContent = "No textbook votes yet — enter two books below to cast the first vote!";
    container.appendChild(empty);
    return;
  }

  const maxCount = Math.max(...topBooks.map(([, count]) => Number(count) || 0), 1);
  const list = document.createElement("ol");
  list.className = "top-books-list";
  list.id = "top-books-list";

  topBooks.forEach(([title, rawCount], index) => {
    const count = Number(rawCount) || 0;
    const item = document.createElement("li");
    item.className = "top-book-item";

    const rank = document.createElement("span");
    rank.className = "top-book-rank";
    rank.textContent = `#${index + 1}`;
    rank.setAttribute("aria-label", `Rank ${index + 1}`);

    const main = document.createElement("div");
    main.className = "top-book-main";

    const meta = document.createElement("div");
    meta.className = "top-book-meta";

    const titleEl = document.createElement("span");
    titleEl.className = "top-book-title";
    titleEl.textContent = String(title);

    const countEl = document.createElement("span");
    countEl.className = "top-book-count";
    countEl.textContent = count === 1 ? "1 request" : `${count.toLocaleString()} requests`;

    const barTrack = document.createElement("div");
    barTrack.className = "top-book-bar-track";
    barTrack.setAttribute("aria-hidden", "true");

    const barFill = document.createElement("div");
    barFill.className = "top-book-bar-fill";
    barFill.style.width = `${Math.max(8, Math.round((count / maxCount) * 100))}%`;

    barTrack.appendChild(barFill);
    meta.append(titleEl, countEl);
    main.append(meta, barTrack);
    item.append(rank, main);
    list.appendChild(item);
  });

  container.appendChild(list);
}

function initRegistrationForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  const flashMessages = document.getElementById("flash-messages");
  if (flashMessages && !window.location.hash) {
    document.getElementById("register")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const collegeInput = document.getElementById("college");
  const book1Input = document.getElementById("book1");
  const book2Input = document.getElementById("book2");
  const submitBtn = document.getElementById("submit-btn");
  const errorSummary = document.getElementById("form-error-summary");

  const requiredFields = [nameInput, emailInput, collegeInput].filter(Boolean);

  requiredFields.forEach((input) => {
    input.addEventListener("blur", () => {
      validateField(input);
    });
    input.addEventListener("input", () => {
      if (input.classList.contains("input-invalid")) {
        validateField(input);
      }
      if (errorSummary && !errorSummary.hidden && !hasAnyErrors()) {
        errorSummary.hidden = true;
      }
    });
  });

  [book1Input, book2Input].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      validateDuplicateBooks(book1Input, book2Input);
    });
  });

  function hasAnyErrors() {
    return Boolean(form.querySelector(".input-invalid"));
  }

  form.addEventListener("submit", (event) => {
    const validName = validateField(nameInput);
    const validEmail = validateField(emailInput);
    const validCollege = validateField(collegeInput);
    const validBooks = validateDuplicateBooks(book1Input, book2Input);

    if (!validName || !validEmail || !validCollege || !validBooks) {
      event.preventDefault();
      if (errorSummary) {
        errorSummary.textContent = "Please fix the highlighted fields below before submitting.";
        errorSummary.hidden = false;
      }
      const firstInvalid = form.querySelector(".input-invalid");
      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: true });
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (errorSummary) errorSummary.hidden = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Joining Waitlist…";
    }
  });
}

function validateField(input) {
  if (!input) return true;
  const value = input.value.trim();
  let errorMessage = "";

  if (input.id === "name") {
    if (!value) errorMessage = "Please enter your full name.";
    else if (value.length < 2) errorMessage = "Full name must be at least 2 characters.";
  } else if (input.id === "email") {
    if (!value) errorMessage = "Please enter your email address.";
    else if (!EMAIL_PATTERN.test(value)) errorMessage = "Please enter a valid email address (e.g. name@college.edu).";
  } else if (input.id === "college") {
    if (!value) errorMessage = "Please enter your college or university.";
    else if (value.length < 2) errorMessage = "College or university must be at least 2 characters.";
  }

  setFieldValidity(input, errorMessage);
  return !errorMessage;
}

function validateDuplicateBooks(book1Input, book2Input) {
  if (!book1Input || !book2Input) return true;
  const b1 = book1Input.value.trim().toLowerCase();
  const b2 = book2Input.value.trim().toLowerCase();

  if (b1 && b2 && b1 === b2) {
    setFieldValidity(book2Input, "Please enter two different books.");
    return false;
  }

  setFieldValidity(book2Input, "");
  return true;
}

function setFieldValidity(input, errorMessage) {
  const errorEl = document.getElementById(`${input.id}-error`);
  if (errorMessage) {
    input.classList.add("input-invalid");
    input.classList.remove("input-valid");
    input.setAttribute("aria-invalid", "true");
    if (errorEl) errorEl.textContent = errorMessage;
  } else {
    input.classList.remove("input-invalid");
    input.removeAttribute("aria-invalid");
    if (input.value.trim() && ["name", "email", "college"].includes(input.id)) {
      input.classList.add("input-valid");
    } else {
      input.classList.remove("input-valid");
    }
    if (errorEl) errorEl.textContent = "";
  }
}
