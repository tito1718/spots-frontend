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
import Notifications from "../components/Notifications.js";
import SocialList from "../components/SocialList.js";
import PublicProfile from "../components/PublicProfile.js";
import Card from "../components/Card.js";
import MainProfile from "../components/MainProfile.js";
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
let returnToProfileAfterPreview = false;

// DOM REFERENCES AND AVATAR FALLBACK //

const profileNameEl = document.querySelector(".profile__name");
const profileDescriptionEl = document.querySelector(".profile__description");
const profileAvatarImg = document.querySelector(".profile__avatar");
const profileStatsEl = document.querySelector(".profile__stats");
const profilePostsCountEl = profileStatsEl.querySelector(
  '[data-main-profile-stat="posts"]',
);
const profileFollowersCountEl = profileStatsEl.querySelector(
  '[data-main-profile-stat="followers"]',
);
const profileFollowingCountEl = profileStatsEl.querySelector(
  '[data-main-profile-stat="following"]',
);
const profileFollowersBtn = profileStatsEl.querySelector(
  '[data-social-list="followers"]',
);
const profileFollowingBtn = profileStatsEl.querySelector(
  '[data-social-list="following"]',
);

const socialListModal = document.querySelector("#social-list-modal");
const socialListTitle = socialListModal.querySelector(
  ".social-list__title-text",
);
const socialListCount = socialListModal.querySelector(".social-list__count");
const socialListStatus = socialListModal.querySelector(".social-list__status");
const socialListItems = socialListModal.querySelector(".social-list__items");
const socialListEmpty = socialListModal.querySelector(".social-list__empty");

const editProfileBtn = document.querySelector(".profile__edit-btn");
const newPostBtn = document.querySelector(".profile__add-btn");
const avatarEditBtn = document.querySelector(".profile__avatar-btn");
const editProfileModal = document.querySelector("#edit-profile-modal");
const newPostModal = document.querySelector("#new-post-modal");
const previewModal = document.querySelector("#preview-modal");
const avatarModal = document.querySelector("#edit-avatar-modal");
const deleteModal = document.querySelector("#delete-modal");
const profileModal = document.querySelector("#profile-modal");
const publicProfileAvatarImg = profileModal.querySelector(
  ".public-profile__avatar",
);
const publicProfileFollowBtn = profileModal.querySelector(
  ".public-profile__follow-btn",
);
const loginModal = document.querySelector("#login-modal");
const registerModal = document.querySelector("#register-modal");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const loginBtn = document.querySelector(".header__login-btn");
const logoutBtn = document.querySelector(".header__logout-btn");
const notificationBtn = document.querySelector(".header__notification-btn");
const notificationBadge = document.querySelector(".header__notification-badge");
const notificationsModal = document.querySelector("#notifications-modal");
const notificationsList = notificationsModal.querySelector(
  ".notifications__list",
);
const notificationsStatus = notificationsModal.querySelector(
  ".notifications__status",
);
const notificationsEmpty = notificationsModal.querySelector(
  ".notifications__empty",
);
const notificationsMarkAllBtn = notificationsModal.querySelector(
  ".notifications__mark-all-btn",
);
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

// NOTIFICATIONS //

const notifications = new Notifications({
  api,
  modal: notificationsModal,
  button: notificationBtn,
  badge: notificationBadge,
  list: notificationsList,
  status: notificationsStatus,
  empty: notificationsEmpty,
  markAllButton: notificationsMarkAllBtn,
  avatarFallback: avatarDefault,
  openModal,
  closeModal,
  openPublicProfile,
  refreshFollowSummary: () => mainProfile.refreshFollowSummary(),
  isAuthenticated: () => isAuthenticated,
});

notifications.setEventListeners();

const socialList = new SocialList({
  api,
  modal: socialListModal,
  title: socialListTitle,
  count: socialListCount,
  status: socialListStatus,
  items: socialListItems,
  empty: socialListEmpty,
  avatarFallback: avatarDefault,
  openModal,
  closeModal,
  openPublicProfile,
  isAuthenticated: () => isAuthenticated,
});

function openPublicProfilePostPreview(card, opener) {
  returnToProfileAfterPreview = true;
  closeModal(profileModal);

  window.setTimeout(() => {
    previewImageEl.src = card.link;
    previewImageEl.alt = card.name;
    captionEl.textContent = card.name;
    openModal(previewModal, opener);
  }, 0);
}

const publicProfile = new PublicProfile({
  api,
  modal: profileModal,
  avatar: publicProfileAvatarImg,
  followButton: publicProfileFollowBtn,
  avatarFallback: avatarDefault,
  openModal,
  openAvatarPreview,
  openPostPreview: openPublicProfilePostPreview,
  clearRequestError,
  showRequestError,
  isAuthenticated: () => isAuthenticated,
  updateOwnFollowingCount: (change) => mainProfile.updateFollowingCount(change),
});

publicProfile.setEventListeners();

async function openPublicProfile(userId, opener) {
  await publicProfile.open(userId, opener);
}

// PROFILE PREVIEW RETURN //

previewModal.addEventListener("modalclosed", () => {
  previewImageEl.classList.remove("modal__image_type_avatar");

  if (!returnToProfileAfterPreview) return;

  returnToProfileAfterPreview = false;

  window.setTimeout(() => {
    publicProfile.reopen();
  }, 0);
});

// OVERLAY CLOSING //

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("mousedown", (evt) => {
    if (evt.target === modal) {
      closeModal(modal);
    }
  });
});

// AVATAR PREVIEW //

function openAvatarPreview({ image, name, opener, returnToProfile = false }) {
  if (!image?.src) return;

  if (returnToProfile) {
    returnToProfileAfterPreview = true;
    closeModal(profileModal);
  }

  previewImageEl.src = image.src;
  previewImageEl.alt = name
    ? `Profile picture for ${name}`
    : "Spots user profile picture";
  previewImageEl.classList.add("modal__image_type_avatar");

  captionEl.textContent = name
    ? `${name} — Profile picture`
    : "Profile picture";

  window.setTimeout(() => {
    openModal(previewModal, opener);
  }, 0);
}

// AUTHENTICATION VIEW //

function setAuthenticatedView(authenticated) {
  isAuthenticated = authenticated;
  loginBtn.hidden = authenticated;
  logoutBtn.hidden = !authenticated;
  notificationBtn.hidden = !authenticated;
  mainProfile.setAuthenticatedView(authenticated);

  if (!authenticated) {
    notifications.renderUnreadCount(0);
  }
}

function displayUser(user) {
  mainProfile.displayUser(user);
}

function displayGuestProfile() {
  mainProfile.displayGuest();
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
  const profileUser = await api.getUserProfile(user._id);

  setAuthenticatedView(true);
  displayUser(profileUser);
  renderCards(cards);
  clearRequestError();

  await notifications.refreshUnreadCount();
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

// MAIN PROFILE //

const mainProfile = new MainProfile({
  api,
  name: profileNameEl,
  description: profileDescriptionEl,
  avatar: profileAvatarImg,
  stats: profileStatsEl,
  postsCount: profilePostsCountEl,
  followersCount: profileFollowersCountEl,
  followingCount: profileFollowingCountEl,
  followersButton: profileFollowersBtn,
  followingButton: profileFollowingBtn,
  editButton: editProfileBtn,
  addButton: newPostBtn,
  avatarEditButton: avatarEditBtn,
  avatarFallback: avatarDefault,
  guestAvatar: spotsMark,
  openAvatarPreview,
  openSocialList: (type, opener) => {
    void socialList.open(type, opener);
  },
  isAuthenticated: () => isAuthenticated,
  setCurrentUserId: (userId) => {
    currentUserId = userId;
  },
});

mainProfile.setEventListeners();

// CARD CREATION //

function requestCardDelete(card) {
  clearRequestError(deleteForm);
  cardToDelete = card;
  openModal(deleteModal);
}

function openCardPreview(data, opener) {
  previewImageEl.src = data.link;
  previewImageEl.alt = data.name;
  captionEl.textContent = data.name;
  openModal(previewModal, opener);
}

function getCardElement(data) {
  const card = new Card({
    data,
    template: cardTemplate,
    api,
    avatarFallback: avatarDefault,
    isAuthenticated: () => isAuthenticated,
    getCurrentUserId: () => currentUserId,
    openLogin: () => openAuthModal(loginModal),
    openPublicProfile,
    openPreview: openCardPreview,
    requestDelete: requestCardDelete,
    clearRequestError,
    showRequestError,
  });

  return card.getElement();
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
      mainProfile.updateProfileInfo(data);
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
      mainProfile.updateAvatar(data.avatar);
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
