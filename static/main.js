// Physio-LLM Registration Site — Frontend JS
const POPULAR_CHIP_BOOKS = [
  "Kisner & Colby - Therapeutic Exercise",
  "Magee - Orthopedic Physical Assessment",
  "O'Sullivan & Schmitz - Physical Rehabilitation",
  "Kendall - Muscles: Testing and Function",
  "Norkin & White - Measurement of Joint Motion",
  "Neumann - Kinesiology of the Musculoskeletal System",
  "Umphred - Neurological Rehabilitation",
  "Frownfelter & Dean - Cardiovascular & Pulmonary PT",
  "Porter - Tidy's Physiotherapy",
  "Clayton's Electrotherapy",
];

const BOOK_CATALOG = [
  ...POPULAR_CHIP_BOOKS,
  "Guyton & Hall - Textbook of Medical Physiology",
  "B.D. Chaurasia - Human Anatomy",
  "Hoppenfeld - Physical Examination of the Spine & Extremities",
  "Maitland's Vertebral Manipulation",
  "Butler - Mobilisation of the Nervous System",
  "Brukner & Khan's Clinical Sports Medicine",
  "Sahrmann - Diagnosis and Treatment of Movement Impairment Syndromes",
];

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
    empty.textContent = "No textbook votes yet — pick or enter two books below to cast the first vote!";
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
  let lastFocusedBookInput = book1Input;

  [book1Input, book2Input].forEach((input) => {
    if (!input) return;
    input.addEventListener("focus", () => {
      lastFocusedBookInput = input;
    });
  });

  const syncChipStates = initBookChips(book1Input, book2Input, () => lastFocusedBookInput, () => {
    validateDuplicateBooks(book1Input, book2Input);
  });

  setupAutocomplete(book1Input, book2Input, syncChipStates, () => validateDuplicateBooks(book1Input, book2Input));
  setupAutocomplete(book2Input, book1Input, syncChipStates, () => validateDuplicateBooks(book1Input, book2Input));

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
      syncChipStates();
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
    setFieldValidity(book2Input, "Please choose two different books or leave Book 2 blank.");
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

function initBookChips(book1Input, book2Input, getTargetInput, onUpdate) {
  const container = document.getElementById("book-chips");
  if (!container || !book1Input || !book2Input) return () => {};

  const buttons = [];

  POPULAR_CHIP_BOOKS.forEach((book) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "book-chip";
    btn.textContent = book;
    btn.dataset.book = book;
    btn.setAttribute("aria-pressed", "false");

    btn.addEventListener("click", () => {
      const normalized = book.toLowerCase();
      const b1 = book1Input.value.trim().toLowerCase();
      const b2 = book2Input.value.trim().toLowerCase();

      if (b1 === normalized) {
        book1Input.value = "";
      } else if (b2 === normalized) {
        book2Input.value = "";
      } else if (!book1Input.value.trim()) {
        book1Input.value = book;
      } else if (!book2Input.value.trim()) {
        book2Input.value = book;
      } else {
        const target = getTargetInput() || book2Input;
        target.value = book;
      }

      syncStates();
      onUpdate();
    });

    buttons.push(btn);
    container.appendChild(btn);
  });

  function syncStates() {
    const selected = new Set([
      book1Input.value.trim().toLowerCase(),
      book2Input.value.trim().toLowerCase(),
    ].filter(Boolean));

    buttons.forEach((btn) => {
      const isSelected = selected.has(btn.dataset.book.toLowerCase());
      btn.classList.toggle("book-chip--selected", isSelected);
      btn.setAttribute("aria-pressed", String(isSelected));
    });
  }

  syncStates();
  return syncStates;
}

function setupAutocomplete(input, otherInput, syncChipStates, onUpdate) {
  if (!input) return;
  const listId = input.getAttribute("aria-controls");
  const listEl = listId ? document.getElementById(listId) : null;
  if (!listEl) return;

  let activeIndex = -1;
  let currentMatches = [];

  function closeList() {
    listEl.hidden = true;
    listEl.innerHTML = "";
    activeIndex = -1;
    currentMatches = [];
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }

  function selectOption(book) {
    input.value = book;
    closeList();
    syncChipStates();
    onUpdate();
  }

  function renderMatches() {
    const query = input.value.trim().toLowerCase();
    const otherVal = otherInput ? otherInput.value.trim().toLowerCase() : "";

    currentMatches = BOOK_CATALOG.filter((book) => {
      const lower = book.toLowerCase();
      if (otherVal && lower === otherVal) return false;
      return !query || lower.includes(query);
    }).slice(0, 6);

    listEl.innerHTML = "";
    activeIndex = -1;

    if (!currentMatches.length || (currentMatches.length === 1 && currentMatches[0].toLowerCase() === query)) {
      closeList();
      return;
    }

    currentMatches.forEach((book, idx) => {
      const li = document.createElement("li");
      li.id = `${input.id}-option-${idx}`;
      li.className = "autocomplete-option";
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      li.textContent = book;

      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        selectOption(book);
      });

      listEl.appendChild(li);
    });

    listEl.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function updateActiveOption(nextIndex) {
    const options = listEl.querySelectorAll(".autocomplete-option");
    if (!options.length) return;

    activeIndex = (nextIndex + options.length) % options.length;
    options.forEach((opt, idx) => {
      const isActive = idx === activeIndex;
      opt.classList.toggle("is-active", isActive);
      opt.setAttribute("aria-selected", String(isActive));
    });
    input.setAttribute("aria-activedescendant", options[activeIndex].id);
  }

  input.addEventListener("focus", renderMatches);
  input.addEventListener("input", renderMatches);
  input.addEventListener("blur", () => {
    setTimeout(closeList, 120);
  });

  input.addEventListener("keydown", (e) => {
    if (listEl.hidden) {
      if (e.key === "ArrowDown") {
        renderMatches();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      updateActiveOption(activeIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      updateActiveOption(activeIndex <= 0 ? currentMatches.length - 1 : activeIndex - 1);
    } else if (e.key === "Enter" && activeIndex >= 0 && currentMatches[activeIndex]) {
      e.preventDefault();
      selectOption(currentMatches[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeList();
    }
  });
}
