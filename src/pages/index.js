// IMPORTS //

import "./index.css";
import {
  clearRequestError,
  showRequestError,
} from "../utils/request-errors.js";
import {
  enableValidation,
  resetValidation,
  settings,
} from "../scripts/validation.js";
import logoIcon from "../images/spots-images/spots-logo.svg";
import spotsMark from "../images/spots-images/spots-mark.svg";
import avatarDefault from "../images/spots-images/user-avatar-fallback.svg";
import penIcon from "../images/spots-images/edit-dark.svg";
import plusIcon from "../images/spots-images/plus.svg";
import penWhiteIcon from "../images/spots-images/edit-light.svg";
import Api from "../utils/Api.js";
import { openModal, closeModal, setLoadingState } from "../utils/helpers.js";

// API CONFIGURATION //

const api = new Api({
  baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3002",
});

// APPLICATION STATE //

let currentUserId = null;
let cardToDelete = null;
let isDeleting = false;
let isAuthenticated = false;

// DOM REFERENCES AND AVATAR FALLBACK //

const profileNameEl = document.querySelector(".profile__name");
const profileDescriptionEl = document.querySelector(".profile__description");
const profileAvatarImg = document.querySelector(".profile__avatar");

profileAvatarImg.addEventListener("error", () => {
  const fallbackUrl = new URL(avatarDefault, document.baseURI).href;
  if (profileAvatarImg.src !== fallbackUrl) {
    profileAvatarImg.src = avatarDefault;
  }
});
const editProfileBtn = document.querySelector(".profile__edit-btn");
const newPostBtn = document.querySelector(".profile__add-btn");
const avatarEditBtn = document.querySelector(".profile__avatar-btn");
const editProfileModal = document.querySelector("#edit-profile-modal");
const newPostModal = document.querySelector("#new-post-modal");
const previewModal = document.querySelector("#preview-modal");
const avatarModal = document.querySelector("#edit-avatar-modal");
const deleteModal = document.querySelector("#delete-modal");
const loginModal = document.querySelector("#login-modal");
const registerModal = document.querySelector("#register-modal");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const loginBtn = document.querySelector(".header__login-btn");
const logoutBtn = document.querySelector(".header__logout-btn");
const showRegisterBtn = document.querySelector("#show-register-btn");
const showLoginBtn = document.querySelector("#show-login-btn");
const editProfileForm = editProfileModal.querySelector(".modal__form");
const newPostForm = newPostModal.querySelector(".modal__form");
const avatarForm = avatarModal.querySelector(".modal__form");
const deleteForm = document.querySelector("#delete-form");
const previewImageEl = previewModal.querySelector(".modal__image");
const captionEl = previewModal.querySelector(".modal__caption");
const deleteSubmitBtn = deleteForm.querySelector(
  ".modal__submit-btn_type_delete",
);
const cancelDeleteBtn = deleteForm.querySelector(
  ".modal__submit-btn_type_cancel",
);
const cardTemplate = document
  .querySelector("#card-template")
  .content.querySelector(".card");
const cardsList = document.querySelector(".cards__list");

// OVERLAY CLOSING //

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("mousedown", (evt) => {
    if (evt.target === modal) {
      closeModal(modal);
    }
  });
});

// AUTHENTICATION VIEW //

function setAuthenticatedView(authenticated) {
  isAuthenticated = authenticated;
  loginBtn.hidden = authenticated;
  logoutBtn.hidden = !authenticated;
  editProfileBtn.hidden = !authenticated;
  newPostBtn.hidden = !authenticated;
  avatarEditBtn.hidden = !authenticated;
}

function displayUser(user) {
  currentUserId = user._id;
  profileNameEl.textContent = user.name;
  profileDescriptionEl.textContent = user.about || "Sharing memorable places.";
  profileAvatarImg.classList.remove("profile__avatar_type_guest");
  profileAvatarImg.src = user.avatar || avatarDefault;
}

function displayGuestProfile() {
  currentUserId = null;
  profileNameEl.textContent = "Welcome to Spots";
  profileDescriptionEl.textContent =
    "Log in to share, like, and manage your favorite places.";
  profileAvatarImg.classList.add("profile__avatar_type_guest");
  profileAvatarImg.src = spotsMark;
}

function renderCards(cards) {
  cardsList.replaceChildren();
  cards.forEach(renderCard);
}

function openAuthModal(modal) {
  const form = modal.querySelector(".modal__form");
  form.reset();
  resetModalValidation(form);
  openModal(modal);
}

async function loadAuthenticatedApp() {
  const [cards, user] = await api.getAppInfo();
  setAuthenticatedView(true);
  displayUser(user);
  renderCards(cards);
  clearRequestError();
}

async function loadGuestApp() {
  setAuthenticatedView(false);
  displayGuestProfile();

  try {
    const cards = await api.getInitialCards();
    renderCards(cards);
  } catch {
    cardsList.replaceChildren();
    showRequestError("Could not load public photos. Please try again shortly.");
  }
}

// CARD CREATION //

function getCardElement(data) {
  const cardElement = cardTemplate.cloneNode(true);
  const title = cardElement.querySelector(".card__title");
  const image = cardElement.querySelector(".card__image");
  const likeBtn = cardElement.querySelector(".card__like-btn");
  const likeCount = cardElement.querySelector(".card__like-count");
  const deleteBtn = cardElement.querySelector(".card__delete-btn");
  const ownerId = typeof data.owner === "object" ? data.owner._id : data.owner;

  // CARD CONTENT AND KEYBOARD ACCESS //

  title.textContent = data.name;
  image.src = data.link;
  image.alt = data.name;
  image.tabIndex = 0;
  image.setAttribute("role", "button");
  image.setAttribute("aria-label", `View photo: ${data.name}`);
  image.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      image.click();
    }
  });

  // LIKE INTERACTION //

  let isLiked = Boolean(data.isLiked);
  let isLikePending = false;
  let likeCountValue =
    typeof data.likesCount === "number" ? data.likesCount : 0;
  likeCount.textContent = likeCountValue;
  likeBtn.classList.toggle("card__like-btn_active", isLiked);
  likeBtn.addEventListener("click", () => {
    if (isLikePending) return;

    if (!isAuthenticated) {
      openAuthModal(loginModal);
      return;
    }

    clearRequestError();
    isLikePending = true;
    likeBtn.disabled = true;
    likeBtn.setAttribute("aria-busy", "true");

    const apiCall = isLiked ? api.unlikeCard(data._id) : api.likeCard(data._id);
    apiCall
      .then((updatedCard) => {
        isLiked = Boolean(updatedCard.isLiked);
        if (typeof updatedCard.likesCount === "number") {
          likeCountValue = updatedCard.likesCount;
        } else {
          likeCountValue = isLiked
            ? likeCountValue + 1
            : Math.max(0, likeCountValue - 1);
        }
        likeCount.textContent = likeCountValue;
        likeBtn.classList.toggle("card__like-btn_active", isLiked);
      })
      .catch(() => {
        showRequestError("Could not update the like. Please try again.");
      })
      .finally(() => {
        isLikePending = false;
        likeBtn.disabled = false;
        likeBtn.setAttribute("aria-busy", "false");
      });
  });

  // DELETE CONFIRMATION //

  if (isAuthenticated && ownerId === currentUserId) {
    deleteBtn.addEventListener("click", () => {
      clearRequestError(deleteForm);
      cardToDelete = { element: cardElement, id: data._id };
      openModal(deleteModal);
    });
  } else {
    deleteBtn.remove();
  }

  // IMAGE PREVIEW //

  image.addEventListener("click", () => {
    previewImageEl.src = data.link;
    previewImageEl.alt = data.name;
    captionEl.textContent = data.name;
    openModal(previewModal, image);
  });

  return cardElement;
}

// CARD RENDERING //

function renderCard(item) {
  const card = getCardElement(item);
  cardsList.prepend(card);
}

// DELETE SUBMISSION //

deleteForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  if (!cardToDelete || isDeleting) return;

  // Keep the submitted target stable if another photo is selected.
  clearRequestError(deleteForm);
  const submittedCard = cardToDelete;
  isDeleting = true;
  setLoadingState(deleteSubmitBtn, true, "Delete", "Deleting...");

  api
    .deleteCard(submittedCard.id)
    .then(() => {
      submittedCard.element.remove();

      // Do not dismiss a confirmation opened for a different selection.
      if (cardToDelete === submittedCard) {
        closeModal(deleteModal);
        cardToDelete = null;
      }
    })
    .catch(() => {
      showRequestError(
        "Could not delete the photo. Please try again.",
        cardToDelete === submittedCard ? deleteForm : null,
      );
    })
    .finally(() => {
      isDeleting = false;
      setLoadingState(deleteSubmitBtn, false, "Delete", "Deleting...");
    });
});

cancelDeleteBtn.addEventListener("click", () => {
  closeModal(deleteModal);
});

// CLOSE CONTROLS //

document.querySelectorAll(".modal__close-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    closeModal(btn.closest(".modal"));
  });
});

// FORM VALIDATION RESET //

function resetModalValidation(form) {
  clearRequestError(form);
  resetValidation(
    form,
    Array.from(form.querySelectorAll(settings.inputSelector)),
    settings,
  );
}

// PROFILE ACTION BUTTONS //

editProfileBtn.addEventListener("click", () => {
  const nameInput = editProfileForm.querySelector("#profile_name-input");
  const descInput = editProfileForm.querySelector("#profile_description-input");
  nameInput.value = profileNameEl.textContent;
  descInput.value = profileDescriptionEl.textContent;
  resetModalValidation(editProfileForm);
  openModal(editProfileModal);
});

newPostBtn.addEventListener("click", () => {
  newPostForm.reset();
  resetModalValidation(newPostForm);
  openModal(newPostModal);
});

avatarEditBtn.addEventListener("click", () => {
  avatarForm.reset();
  resetModalValidation(avatarForm);
  openModal(avatarModal);
});

// AUTHENTICATION MODAL SWITCHING //

loginBtn.addEventListener("click", () => {
  openAuthModal(loginModal);
});

showRegisterBtn.addEventListener("click", () => {
  closeModal(loginModal);
  openAuthModal(registerModal);
});

showLoginBtn.addEventListener("click", () => {
  closeModal(registerModal);
  openAuthModal(loginModal);
});

// LOGIN SUBMISSION //

loginForm.addEventListener("submit", async (evt) => {
  evt.preventDefault();
  clearRequestError(loginForm);

  const button = loginForm.querySelector(".modal__submit-btn");
  const email = loginForm.elements.email.value.trim();
  const password = loginForm.elements.password.value;

  setLoadingState(button, true, "Log in", "Logging in...");

  try {
    await api.login({ email, password });
    await loadAuthenticatedApp();
    loginForm.reset();
    closeModal(loginModal);
  } catch (error) {
    const message =
      error.status === 401
        ? "The email or password is incorrect."
        : "Could not log in. Please try again.";

    showRequestError(message, loginForm);
  } finally {
    setLoadingState(button, false, "Log in", "Logging in...");
  }
});

// REGISTRATION SUBMISSION //

registerForm.addEventListener("submit", async (evt) => {
  evt.preventDefault();
  clearRequestError(registerForm);

  const button = registerForm.querySelector(".modal__submit-btn");
  const name = registerForm.elements.name.value.trim();
  const about = registerForm.elements.about.value.trim();
  const avatar = registerForm.elements.avatar.value.trim();
  const email = registerForm.elements.email.value.trim();
  const password = registerForm.elements.password.value;

  setLoadingState(button, true, "Create account", "Creating...");

  try {
    await api.register({
      name,
      about: about || undefined,
      avatar: avatar || undefined,
      email,
      password,
    });
    await api.login({ email, password });
    await loadAuthenticatedApp();
    registerForm.reset();
    closeModal(registerModal);
  } catch (error) {
    const message =
      error.status === 409
        ? "An account with that email already exists."
        : error.status === 400
          ? "Please check your information and try again."
          : "Could not create your account. Please try again.";

    showRequestError(message, registerForm);
  } finally {
    setLoadingState(button, false, "Create account", "Creating...");
  }
});

// LOGOUT //

logoutBtn.addEventListener("click", async () => {
  if (logoutBtn.disabled) return;

  clearRequestError();
  logoutBtn.disabled = true;
  logoutBtn.textContent = "Logging out...";

  try {
    await api.logout();
    await loadGuestApp();
  } catch {
    showRequestError("Could not log out. Please try again.");
  } finally {
    logoutBtn.disabled = false;
    logoutBtn.textContent = "Log out";
  }
});

// PROFILE SUBMISSION //

editProfileForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  clearRequestError(editProfileForm);
  const btn = editProfileForm.querySelector(".modal__submit-btn");
  setLoadingState(btn, true, "Save", "Saving...");

  api
    .editUserInfo({
      name: editProfileForm.querySelector("#profile_name-input").value,
      about: editProfileForm.querySelector("#profile_description-input").value,
    })
    .then((data) => {
      profileNameEl.textContent = data.name;
      profileDescriptionEl.textContent = data.about;
      closeModal(editProfileModal);
    })
    .catch(() => {
      showRequestError(
        "Could not save your profile. Your changes are still in the form.",
        editProfileForm,
      );
    })
    .finally(() => {
      setLoadingState(btn, false, "Save", "Saving...");
    });
});

// POST SUBMISSION //

newPostForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  clearRequestError(newPostForm);
  const btn = newPostForm.querySelector(".modal__submit-btn");
  setLoadingState(btn, true, "Save", "Creating...");

  api
    .addNewCard({
      name: newPostForm.querySelector("#caption-input").value,
      link: newPostForm.querySelector("#card-image-input").value,
    })
    .then((data) => {
      renderCard(data);
      newPostForm.reset();
      closeModal(newPostModal);
    })
    .catch(() => {
      showRequestError(
        "Could not create the post. Your entries are still in the form.",
        newPostForm,
      );
    })
    .finally(() => {
      setLoadingState(btn, false, "Save", "Creating...");
    });
});

// AVATAR SUBMISSION //

avatarForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  clearRequestError(avatarForm);
  const btn = avatarForm.querySelector(".modal__submit-btn");
  setLoadingState(btn, true, "Save", "Updating...");

  api
    .editAvatar({
      avatar: avatarForm.querySelector("#profile-avatar-input").value,
    })
    .then((data) => {
      profileAvatarImg.src = data.avatar;
      avatarForm.reset();
      closeModal(avatarModal);
    })
    .catch(() => {
      showRequestError(
        "Could not update your avatar. Please try again.",
        avatarForm,
      );
    })
    .finally(() => {
      setLoadingState(btn, false, "Save", "Updating...");
    });
});

// APPLICATION INITIALIZATION //

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".header__logo").src = logoIcon;
  profileAvatarImg.src = avatarDefault;
  document.querySelector(".profile__edit-btn img").src = penIcon;
  document.querySelector(".profile__add-btn img").src = plusIcon;
  document.querySelector(".profile__pencil-icon").src = penWhiteIcon;

  setAuthenticatedView(false);
  displayGuestProfile();

  loadAuthenticatedApp().catch(async (error) => {
    await loadGuestApp();

    if (error.status === 401) {
      return;
    }

    showRequestError("Could not connect to Spots. Please try again shortly.");
  });
});

// VALIDATION INITIALIZATION //

enableValidation(settings);
