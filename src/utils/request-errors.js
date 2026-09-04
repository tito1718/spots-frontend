// ERROR REGIONS //

const regions = new Map();
const content = document.querySelector(".content");

const pageRegion = document.createElement("div");
pageRegion.className = "request-error page__section";
pageRegion.setAttribute("role", "alert");
pageRegion.setAttribute("aria-atomic", "true");
content.prepend(pageRegion);

document.querySelectorAll(".modal__form").forEach((form) => {
  const region = document.createElement("div");
  region.className = "request-error";
  region.setAttribute("role", "alert");
  region.setAttribute("aria-atomic", "true");

  // Keep messages outside the delete form's horizontal button layout.
  form.before(region);
  regions.set(form, region);
});

// CLEAR REQUEST ERROR //

export function clearRequestError(form = null) {
  const region = form ? regions.get(form) : pageRegion;
  if (region) region.textContent = "";
}

// SHOW REQUEST ERROR //

export function showRequestError(message, form = null) {
  const visibleModal = document.querySelector(".modal_is-opened");
  const formModal = form?.closest(".modal");

  let region = pageRegion;

  if (formModal === visibleModal && regions.has(form)) {
    region = regions.get(form);
  } else if (visibleModal) {
    // Keep errors perceivable when the background page is inert.
    region = visibleModal.querySelector(".request-error");

    if (!region) {
      region = document.createElement("div");
      region.className = "request-error";
      region.setAttribute("role", "alert");
      region.setAttribute("aria-atomic", "true");
      const container =
        visibleModal.querySelector(".modal__image-container") || visibleModal;
      container.append(region);
    }
  }

  region.textContent = message;
}

// CLEAR MESSAGES WHEN A MODAL CLOSES //

document.querySelectorAll(".modal").forEach((modal) => {
  const observer = new MutationObserver(() => {
    if (!modal.classList.contains("modal_is-opened")) {
      modal.querySelectorAll(".request-error").forEach((region) => {
        region.textContent = "";
      });
    }
  });

  observer.observe(modal, {
    attributes: true,
    attributeFilter: ["class"],
  });
});
