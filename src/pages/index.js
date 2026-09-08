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
let publicProfileOpener = null;
let activePublicProfileUser = null;
let publicProfileFollowPending = false;

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

profileModal.addEventListener("modalclosed", () => {
  if (returnToProfileAfterPreview) return;

  activePublicProfileUser = null;
  publicProfileFollowPending = false;
  publicProfileFollowBtn.hidden = true;
});

// NOTIFICATIONS //

async function refreshOwnFollowSummary() {
  if (!isAuthenticated) return;

  try {
    const summary = await api.getFollowSummary();

    profileFollowersCountEl.textContent = summary.followersCount ?? 0;
    profileFollowingCountEl.textContent = summary.followingCount ?? 0;
  } catch {
    // A failed background refresh should not interrupt the completed action.
  }
}

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
  refreshFollowSummary: refreshOwnFollowSummary,
  isAuthenticated: () => isAuthenticated,
});

notifications.setEventListeners();

// PROFILE PREVIEW RETURN //

previewModal.addEventListener("modalclosed", () => {
  previewImageEl.classList.remove("modal__image_type_avatar");

  if (!returnToProfileAfterPreview) return;

  returnToProfileAfterPreview = false;

  window.setTimeout(() => {
    openModal(profileModal, publicProfileOpener);
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

function handleAvatarKeydown(event, callback) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    callback();
  }
}

// AUTHENTICATION VIEW //

function setAuthenticatedView(authenticated) {
  isAuthenticated = authenticated;
  loginBtn.hidden = authenticated;
  logoutBtn.hidden = !authenticated;
  notificationBtn.hidden = !authenticated;
  editProfileBtn.hidden = !authenticated;
  newPostBtn.hidden = !authenticated;
  avatarEditBtn.hidden = !authenticated;

  if (!authenticated) {
    notifications.renderUnreadCount(0);
  }
}

function displayUser(user) {
  currentUserId = user._id;
  profileNameEl.textContent = user.name;
  profileDescriptionEl.textContent = user.about || "Sharing memorable places.";

  profilePostsCountEl.textContent = user.postsCount ?? 0;
  profileFollowersCountEl.textContent = user.followersCount ?? 0;
  profileFollowingCountEl.textContent = user.followingCount ?? 0;
  profileStatsEl.hidden = false;

  profileAvatarImg.classList.remove("profile__avatar_type_guest");
  profileAvatarImg.classList.add("profile__avatar_type_preview");
  profileAvatarImg.src = user.avatar || avatarDefault;
  profileAvatarImg.tabIndex = 0;
  profileAvatarImg.setAttribute("role", "button");
  profileAvatarImg.setAttribute(
    "aria-label",
    `View ${user.name || "Spots user"}'s profile picture`,
  );
}

function displayGuestProfile() {
  currentUserId = null;
  profileNameEl.textContent = "Welcome to Spots";
  profileDescriptionEl.textContent =
    "Log in to share, like, and manage your favorite places.";

  profileStatsEl.hidden = true;
  profilePostsCountEl.textContent = "0";
  profileFollowersCountEl.textContent = "0";
  profileFollowingCountEl.textContent = "0";
  profileAvatarImg.classList.add("profile__avatar_type_guest");
  profileAvatarImg.classList.remove("profile__avatar_type_preview");
  profileAvatarImg.src = spotsMark;
  profileAvatarImg.removeAttribute("role");
  profileAvatarImg.removeAttribute("aria-label");
  profileAvatarImg.removeAttribute("tabindex");
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

function createSocialListItem(entry) {
  const user = entry?.user;

  if (!user?._id) {
    return null;
  }

  const item = document.createElement("li");
  item.className = "social-list__item";

  const button = document.createElement("button");
  button.className = "social-list__user";
  button.type = "button";
  button.setAttribute("aria-label", `View ${user.name}'s profile`);

  const avatar = document.createElement("img");
  avatar.className = "social-list__avatar";
  avatar.src = user.avatar || avatarDefault;
  avatar.alt = `${user.name}'s profile picture`;

  avatar.addEventListener("error", () => {
    const fallbackUrl = new URL(avatarDefault, document.baseURI).href;

    if (avatar.src !== fallbackUrl) {
      avatar.src = avatarDefault;
    }
  });

  const details = document.createElement("span");
  details.className = "social-list__details";

  const name = document.createElement("strong");
  name.className = "social-list__name";
  name.textContent = user.name;

  const about = document.createElement("span");
  about.className = "social-list__about";
  about.textContent = user.about || "Explorer";

  details.append(name, about);
  button.append(avatar, details);
  item.append(button);

  button.addEventListener("click", () => {
    closeModal(socialListModal);
    openPublicProfile(user._id, button);
  });

  return item;
}

async function handleSocialListClick(type, opener) {
  if (!isAuthenticated) return;

  clearRequestError();

  const isFollowers = type === "followers";
  const title = isFollowers ? "Followers" : "Following";

  socialListTitle.textContent = title;
  socialListCount.textContent = "0";
  socialListCount.setAttribute("aria-label", "0 accounts");
  socialListStatus.textContent = "Loading…";
  socialListEmpty.hidden = true;
  socialListEmpty.textContent = "";
  socialListItems.replaceChildren();

  openModal(socialListModal, opener);

  try {
    const entries = isFollowers
      ? await api.getFollowers()
      : await api.getFollowing();

    const items = entries.map(createSocialListItem).filter(Boolean);

    socialListStatus.textContent = "";

    socialListCount.textContent = String(items.length);
    socialListCount.setAttribute(
      "aria-label",
      `${items.length} ${items.length === 1 ? "account" : "accounts"}`,
    );

    if (!items.length) {
      socialListEmpty.textContent = isFollowers
        ? "No followers yet. When someone follows you, they'll appear here."
        : "Not following anyone yet. Accounts you follow will appear here.";
      socialListEmpty.hidden = false;
      return;
    }

    socialListItems.append(...items);
  } catch {
    socialListStatus.textContent = "";
    socialListEmpty.textContent = `Could not load ${type}. Please try again.`;
    socialListEmpty.hidden = false;
  }
}

profileFollowersBtn.addEventListener("click", () => {
  handleSocialListClick("followers", profileFollowersBtn);
});

profileFollowingBtn.addEventListener("click", () => {
  handleSocialListClick("following", profileFollowingBtn);
});

// MAIN PROFILE AVATAR PREVIEW //

function openCurrentUserAvatarPreview() {
  if (!isAuthenticated) return;

  openAvatarPreview({
    image: profileAvatarImg,
    name: profileNameEl.textContent,
    opener: profileAvatarImg,
  });
}

profileAvatarImg.addEventListener("click", openCurrentUserAvatarPreview);

profileAvatarImg.addEventListener("keydown", (event) => {
  if (!isAuthenticated) return;

  handleAvatarKeydown(event, openCurrentUserAvatarPreview);
});

// PUBLIC PROFILE //

function updatePublicProfileFollowButton(user) {
  publicProfileFollowBtn.classList.remove(
    "public-profile__follow-btn_type_following",
    "public-profile__follow-btn_type_pending",
  );

  if (!isAuthenticated || !user || user.relationshipStatus === "self") {
    publicProfileFollowBtn.hidden = true;
    publicProfileFollowBtn.disabled = false;
    return;
  }

  publicProfileFollowBtn.hidden = false;

  if (user.relationshipStatus === "following") {
    publicProfileFollowBtn.textContent = "Following";
    publicProfileFollowBtn.classList.add(
      "public-profile__follow-btn_type_following",
    );
  } else if (user.relationshipStatus === "pending") {
    publicProfileFollowBtn.textContent = "Pending";
    publicProfileFollowBtn.classList.add(
      "public-profile__follow-btn_type_pending",
    );
  } else {
    publicProfileFollowBtn.textContent = "Follow";
  }

  publicProfileFollowBtn.disabled = publicProfileFollowPending;
  publicProfileFollowBtn.setAttribute(
    "aria-busy",
    publicProfileFollowPending ? "true" : "false",
  );
}

function getRelationshipLabel(status) {
  const labels = {
    self: "This is your profile",
    following: "Following",
    pending: "Follow request pending",
    none: "",
  };

  return labels[status] || "";
}

function createProfilePostElement(card) {
  const button = document.createElement("button");
  const image = document.createElement("img");

  button.type = "button";
  button.className = "public-profile__post";
  button.setAttribute("aria-label", `View photo: ${card.name}`);

  image.className = "public-profile__post-image";
  image.src = card.link;
  image.alt = card.name;

  image.addEventListener("error", () => {
    button.remove();
  });

  button.append(image);

  button.addEventListener("click", () => {
    returnToProfileAfterPreview = true;

    closeModal(profileModal);

    window.setTimeout(() => {
      previewImageEl.src = card.link;
      previewImageEl.alt = card.name;
      captionEl.textContent = card.name;
      openModal(previewModal, button);
    }, 0);
  });

  return button;
}

function openPublicProfileAvatarPreview() {
  const name = profileModal.querySelector(".public-profile__name").textContent;

  openAvatarPreview({
    image: publicProfileAvatarImg,
    name,
    opener: publicProfileAvatarImg,
    returnToProfile: true,
  });
}

publicProfileAvatarImg.tabIndex = 0;
publicProfileAvatarImg.setAttribute("role", "button");

publicProfileAvatarImg.addEventListener(
  "click",
  openPublicProfileAvatarPreview,
);

publicProfileAvatarImg.addEventListener("keydown", (event) => {
  handleAvatarKeydown(event, openPublicProfileAvatarPreview);
});

publicProfileFollowBtn.addEventListener("click", async () => {
  if (
    !isAuthenticated ||
    !activePublicProfileUser ||
    publicProfileFollowPending ||
    activePublicProfileUser.relationshipStatus === "self"
  ) {
    return;
  }

  clearRequestError();
  publicProfileFollowPending = true;
  updatePublicProfileFollowButton(activePublicProfileUser);

  try {
    const previousStatus = activePublicProfileUser.relationshipStatus;
    const followersCountEl = profileModal.querySelector(
      '[data-profile-stat="followers"]',
    );

    if (previousStatus === "following" || previousStatus === "pending") {
      await api.unfollowUser(activePublicProfileUser._id);

      if (previousStatus === "following") {
        activePublicProfileUser.followersCount = Math.max(
          0,
          (activePublicProfileUser.followersCount ?? 0) - 1,
        );
      }

      activePublicProfileUser.relationshipStatus = "none";

      if (previousStatus === "following") {
        profileFollowingCountEl.textContent = Math.max(
          0,
          Number(profileFollowingCountEl.textContent || 0) - 1,
        );
      }
    } else {
      const follow = await api.followUser(activePublicProfileUser._id);
      const nextStatus =
        follow?.status === "accepted" ? "following" : "pending";

      if (nextStatus === "following") {
        activePublicProfileUser.followersCount =
          (activePublicProfileUser.followersCount ?? 0) + 1;

        profileFollowingCountEl.textContent =
          Number(profileFollowingCountEl.textContent || 0) + 1;
      }

      activePublicProfileUser.relationshipStatus = nextStatus;
    }

    followersCountEl.textContent = activePublicProfileUser.followersCount ?? 0;

    const status = profileModal.querySelector(".public-profile__status");
    status.textContent = getRelationshipLabel(
      activePublicProfileUser.relationshipStatus,
    );
  } catch {
    showRequestError(
      "Could not update this follow relationship. Please try again.",
    );
  } finally {
    publicProfileFollowPending = false;
    updatePublicProfileFollowButton(activePublicProfileUser);
  }
});

async function openPublicProfile(userId, opener) {
  if (!userId) return;

  clearRequestError();

  try {
    const [user, posts] = await Promise.all([
      api.getUserProfile(userId),
      api.getUserPosts(userId),
    ]);

    activePublicProfileUser = user;

    const avatar = profileModal.querySelector(".public-profile__avatar");
    const name = profileModal.querySelector(".public-profile__name");
    const about = profileModal.querySelector(".public-profile__about");
    const status = profileModal.querySelector(".public-profile__status");
    const postsCount = profileModal.querySelector(
      '[data-profile-stat="posts"]',
    );
    const followersCount = profileModal.querySelector(
      '[data-profile-stat="followers"]',
    );
    const followingCount = profileModal.querySelector(
      '[data-profile-stat="following"]',
    );
    const postsGrid = profileModal.querySelector(".public-profile__posts-grid");
    const emptyState = profileModal.querySelector(".public-profile__empty");

    name.textContent = user.name || "Spots user";
    about.textContent = user.about || "Sharing memorable places.";

    avatar.src = user.avatar || avatarDefault;
    avatar.alt = user.name
      ? `${user.name}'s profile picture`
      : "Spots user profile picture";
    avatar.setAttribute(
      "aria-label",
      `View ${user.name || "Spots user"}'s profile picture`,
    );

    avatar.onerror = () => {
      const fallbackUrl = new URL(avatarDefault, document.baseURI).href;

      if (avatar.src !== fallbackUrl) {
        avatar.src = avatarDefault;
      }
    };

    postsCount.textContent = user.postsCount ?? posts.length;
    followersCount.textContent = user.followersCount ?? 0;
    followingCount.textContent = user.followingCount ?? 0;
    status.textContent = getRelationshipLabel(user.relationshipStatus);
    updatePublicProfileFollowButton(user);

    postsGrid.replaceChildren(
      ...posts.map((post) => createProfilePostElement(post)),
    );

    emptyState.hidden = posts.length !== 0;

    publicProfileOpener = opener;
    openModal(profileModal, opener);
  } catch {
    showRequestError("Could not load this profile. Please try again shortly.");
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
  const ownerButton = cardElement.querySelector(".card__owner");
  const ownerAvatar = cardElement.querySelector(".card__owner-avatar");
  const ownerName = cardElement.querySelector(".card__owner-name");
  const ownerId = typeof data.owner === "object" ? data.owner._id : data.owner;
  const owner =
    typeof data.owner === "object" && data.owner
      ? data.owner
      : {
          _id: ownerId,
          name: "Spots user",
          avatar: "",
        };

  // CARD CONTENT AND KEYBOARD ACCESS //

  title.textContent = data.name;
  ownerName.textContent = owner.name || "Spots user";
  ownerAvatar.src = owner.avatar || avatarDefault;
  ownerAvatar.alt = owner.name
    ? `${owner.name}'s profile picture`
    : "Spots user profile picture";

  ownerAvatar.addEventListener("error", () => {
    const fallbackUrl = new URL(avatarDefault, document.baseURI).href;

    if (ownerAvatar.src !== fallbackUrl) {
      ownerAvatar.src = avatarDefault;
    }
  });

  ownerButton.setAttribute(
    "aria-label",
    `View ${owner.name || "Spots user"}'s profile`,
  );

  ownerButton.addEventListener("click", () => {
    openPublicProfile(ownerId, ownerButton);
  });

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
