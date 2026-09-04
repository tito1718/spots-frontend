// MODAL STATE //

let currentModal = null;
let returnFocusTo = null;
let backgroundState = [];
let scrollState = null;

// FOCUSABLE CONTROLS //

const focusableSelector = [
  "a[href]",
  "button",
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "[tabindex]",
].join(",");

function getFocusable(modal) {
  return Array.from(modal.querySelectorAll(focusableSelector)).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(":disabled") &&
      !element.closest("[inert]") &&
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== "hidden",
  );
}

// DIALOG ACCESSIBILITY //

function configureModal(modal) {
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.tabIndex = -1;

  const title = modal.querySelector(".modal__title");
  const caption = modal.querySelector(".modal__caption");

  if (title) {
    title.id ||= modal.id + "-title";
    modal.setAttribute("aria-labelledby", title.id);
  } else {
    modal.setAttribute("aria-label", "Photo preview");
  }

  const description =
    modal.querySelector(".modal__delete-description") || caption;

  if (description) {
    description.id ||= modal.id + "-description";
    modal.setAttribute("aria-describedby", description.id);
  }

  modal.querySelectorAll(".modal__close-btn").forEach((button) => {
    button.setAttribute("aria-label", "Close dialog");
  });

  modal.querySelectorAll(".modal__input").forEach((input) => {
    const error = document.getElementById(input.id + "-error");
    if (error) {
      input.setAttribute("aria-describedby", error.id);
      error.setAttribute("aria-live", "polite");
    }
  });
}

// BACKGROUND AND SCROLL LOCK //

function lockBackground(modal) {
  backgroundState = [];
  let branch = modal;

  while (branch.parentElement) {
    const parent = branch.parentElement;

    Array.from(parent.children).forEach((sibling) => {
      if (sibling !== branch && sibling instanceof HTMLElement) {
        backgroundState.push([sibling, sibling.inert]);
        sibling.inert = true;
      }
    });

    if (parent === document.body) break;
    branch = parent;
  }

  const body = document.body;
  const properties = [
    "position", "top", "left", "width", "overflow", "padding-right",
  ];
  const savedStyles = properties.map((property) => [
    property,
    body.style.getPropertyValue(property),
    body.style.getPropertyPriority(property),
  ]);
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;

  scrollState = {
    x: window.scrollX,
    y: window.scrollY,
    styles: savedStyles,
  };

  if (scrollbarWidth > 0) {
    body.style.paddingRight =
      parseFloat(getComputedStyle(body).paddingRight) +
      scrollbarWidth + "px";
  }

  body.style.position = "fixed";
  body.style.top = -scrollState.y + "px";
  body.style.left = -scrollState.x + "px";
  body.style.width = "100%";
  body.style.overflow = "hidden";
}

// BACKGROUND AND SCROLL RESTORATION //

function unlockBackground() {
  backgroundState.forEach(([element, previousInert]) => {
    element.inert = previousInert;
  });
  backgroundState = [];

  if (!scrollState) return;

  scrollState.styles.forEach(([property, value, priority]) => {
    if (value) {
      document.body.style.setProperty(property, value, priority);
    } else {
      document.body.style.removeProperty(property);
    }
  });

  window.scrollTo({
    left: scrollState.x,
    top: scrollState.y,
    behavior: "instant",
  });
  scrollState = null;
}

// INITIAL FOCUS //

function focusInitialControl() {
  if (!currentModal) return;

  const cancel = currentModal.querySelector(
    ".modal__submit-btn_type_cancel",
  );
  const focusable = getFocusable(currentModal);
  const target =
    (cancel && focusable.includes(cancel) ? cancel : focusable[0]) ||
    currentModal;

  target.focus({ preventScroll: true });
}

// KEYBOARD NAVIGATION //

function handleModalKeydown(event) {
  if (!currentModal) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeModal(currentModal);
    return;
  }

  if (event.key !== "Tab") return;

  const focusable = getFocusable(currentModal);

  if (!focusable.length) {
    event.preventDefault();
    currentModal.focus({ preventScroll: true });
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (!focusable.includes(active)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

// FOCUS CONTAINMENT //

function handleFocusEscape(event) {
  if (currentModal && !currentModal.contains(event.target)) {
    focusInitialControl();
  }
}

// OPEN MODAL //

export function openModal(modal, opener = document.activeElement) {
  if (!modal || currentModal === modal) return;

  if (currentModal) closeModal(currentModal);

  configureModal(modal);
  returnFocusTo = opener instanceof HTMLElement ? opener : null;
  currentModal = modal;

  modal.inert = false;
  modal.removeAttribute("aria-hidden");
  modal.classList.add("modal_is-opened");

  lockBackground(modal);
  document.addEventListener("keydown", handleModalKeydown);
  document.addEventListener("focusin", handleFocusEscape);
  focusInitialControl();
}

// CLOSE MODAL //

export function closeModal(modal) {
  if (!modal || modal !== currentModal) return;

  const opener = returnFocusTo;
  currentModal = null;
  returnFocusTo = null;

  document.removeEventListener("keydown", handleModalKeydown);
  document.removeEventListener("focusin", handleFocusEscape);

  modal.classList.remove("modal_is-opened");
  unlockBackground();

  const fallback = document.querySelector(".profile__add-btn");
  const target =
    opener?.isConnected && !opener.matches(":disabled") &&
    !opener.closest("[inert]")
      ? opener
      : fallback;

  if (target instanceof HTMLElement) {
    target.focus({ preventScroll: true });
  }

  if (modal.contains(document.activeElement)) {
    document.activeElement.blur();
  }

  modal.inert = true;
  modal.setAttribute("aria-hidden", "true");
}

// LOADING STATE //

export function setLoadingState(
  button,
  isLoading,
  defaultText,
  loadingText,
) {
  if (!button) return;

  button.textContent = isLoading ? loadingText : defaultText;
  button.disabled = isLoading;
  button.setAttribute("aria-busy", String(isLoading));
}

// MODAL INITIALIZATION //

document.querySelectorAll(".modal").forEach((modal) => {
  configureModal(modal);
  modal.inert = true;
  modal.setAttribute("aria-hidden", "true");
});
