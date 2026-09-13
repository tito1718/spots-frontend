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
import DiscoverPeople from "../components/DiscoverPeople.js";
import PublicProfile from "../components/PublicProfile.js";
import Card from "../components/Card.js";
import MainProfile from "../components/MainProfile.js";
import Comments from "../components/Comments.js";
import { openModal, closeModal, setLoadingState } from "../utils/helpers.js";

// API CONFIGURATION //

const api = new Api({
  baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3002",
});

// APPLICATION STATE //

let currentUserId = null;
let currentUser = null;
let cardToDelete = null;
let collectionToDelete = null;
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
const discoverBtn = document.querySelector(".header__discover-btn");
const notificationBtn = document.querySelector(".header__notification-btn");
const notificationBadge = document.querySelector(".header__notification-badge");
const discoverPeopleModal = document.querySelector("#discover-people-modal");
const discoverPeopleForm = discoverPeopleModal.querySelector(
  ".discover-people__form",
);
const discoverPeopleInput = discoverPeopleModal.querySelector(
  ".discover-people__input",
);
const discoverPeopleStatus = discoverPeopleModal.querySelector(
  ".discover-people__status",
);
const discoverPeopleResults = discoverPeopleModal.querySelector(
  ".discover-people__results",
);
const discoverPeopleEmpty = discoverPeopleModal.querySelector(
  ".discover-people__empty",
);
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
const notificationsClearReadBtn = notificationsModal.querySelector(
  ".notifications__clear-read-btn",
);
const notificationsLoadMoreBtn = notificationsModal.querySelector(
  ".notifications__load-more-btn",
);
const showRegisterBtn = document.querySelector("#show-register-btn");
const showLoginBtn = document.querySelector("#show-login-btn");
const editProfileForm = editProfileModal.querySelector(".modal__form");
const profilePrivateInput = editProfileForm.querySelector(
  "#profile-private-input",
);
const profilePrivacyState = editProfileForm.querySelector(
  "[data-profile-privacy-state]",
);
const profilePrivacyDescription = editProfileForm.querySelector(
  ".profile-privacy__description",
);
const newPostForm = newPostModal.querySelector(".modal__form");
const newPostCaptionInput = newPostForm.querySelector("#caption-input");
const newPostImageInput = newPostForm.querySelector("#card-image-input");
const newPostTagsInput = newPostForm.querySelector("#post-tags-input");
const newPostTagsError = newPostForm.querySelector("#post-tags-input-error");
const newPostLocationInput = newPostForm.querySelector("#post-location-input");
const newPostLatitudeInput = newPostForm.querySelector("#post-latitude-input");
const newPostLongitudeInput = newPostForm.querySelector(
  "#post-longitude-input",
);
const newPostLocationError = newPostForm.querySelector(
  "#post-location-input-error",
);
const newPostCaptionCount = newPostForm.querySelector("[data-caption-count]");
const newPostVisibilityInputs = Array.from(
  newPostForm.querySelectorAll('input[name="post-visibility"]'),
);
const avatarForm = avatarModal.querySelector(".modal__form");
const deleteForm = document.querySelector("#delete-form");
const previewImageEl = previewModal.querySelector(".modal__image");
const captionEl = previewModal.querySelector(".modal__caption");
const commentsRoot = previewModal.querySelector(".comments");
const commentsCount = previewModal.querySelector(".comments__count");
const commentsStatus = previewModal.querySelector(".comments__status");
const commentsList = previewModal.querySelector(".comments__list");
const commentsEmpty = previewModal.querySelector(".comments__empty");
const commentsForm = previewModal.querySelector(".comments__form");
const commentsInput = previewModal.querySelector(".comments__input");
const commentsSubmit = previewModal.querySelector(".comments__submit");
const commentsError = previewModal.querySelector(".comments__error");
const commentsLoginMessage = previewModal.querySelector(
  ".comments__login-message",
);
const deleteSubmitBtn = deleteForm.querySelector(
  ".modal__submit-btn_type_delete",
);
const cancelDeleteBtn = deleteForm.querySelector(
  ".modal__submit-btn_type_cancel",
);
const deleteModalTitle = deleteModal.querySelector("[data-delete-modal-title]");
const deleteModalDescription = deleteModal.querySelector(
  "[data-delete-modal-description]",
);
const deleteCollectionButton = document.querySelector(
  "[data-delete-collection]",
);
const cardTemplate = document
  .querySelector("#card-template")
  .content.querySelector(".card");
const cardsList = document.querySelector(".cards__list");
const savedEmptyState = document.querySelector("[data-saved-empty]");
const savedLibrary = document.querySelector("[data-saved-library]");
const collectionsEmptyState = document.querySelector(
  "[data-collections-empty]",
);
const collectionsList = document.querySelector("[data-collections-list]");
const collectionAssignmentModal = document.querySelector(
  "#collection-assignment-modal",
);
const collectionAssignmentPost = collectionAssignmentModal.querySelector(
  "[data-collection-assignment-post]",
);
const collectionAssignmentOptions = collectionAssignmentModal.querySelector(
  "[data-collection-assignment-options]",
);
const collectionAssignmentEmpty = collectionAssignmentModal.querySelector(
  "[data-collection-assignment-empty]",
);
const collectionDetail = document.querySelector("[data-collection-detail]");
const collectionDetailBack = document.querySelector(
  "[data-collection-detail-back]",
);
const collectionDetailTitle = document.querySelector(
  "[data-collection-detail-title]",
);
const collectionDetailDescription = document.querySelector(
  "[data-collection-detail-description]",
);
const collectionDetailVisibility = document.querySelector(
  "[data-collection-detail-visibility]",
);
const editCollectionButton = document.querySelector("[data-edit-collection]");
const editCollectionModal = document.querySelector("#edit-collection-modal");
const editCollectionForm = document.querySelector("#edit-collection-form");
const editCollectionNameInput = editCollectionForm.querySelector(
  "#edit-collection-name-input",
);
const editCollectionDescriptionInput = editCollectionForm.querySelector(
  "#edit-collection-description-input",
);
const editCollectionVisibilityInputs = Array.from(
  editCollectionForm.querySelectorAll(
    'input[name="edit-collection-visibility"]',
  ),
);
const createCollectionBtn = document.querySelector("[data-create-collection]");
const createCollectionModal = document.querySelector(
  "#create-collection-modal",
);
const createCollectionForm = document.querySelector("#create-collection-form");
const collectionNameInput = createCollectionForm.querySelector(
  "#collection-name-input",
);
const collectionDescriptionInput = createCollectionForm.querySelector(
  "#collection-description-input",
);
const collectionVisibilityInputs = Array.from(
  createCollectionForm.querySelectorAll('input[name="collection-visibility"]'),
);
const profileTabs = document.querySelector(".profile-tabs");
const profileTabButtons = Array.from(
  profileTabs.querySelectorAll(".profile-tabs__button"),
);

let loadedCards = [];
let loadedCollections = [];
let collectionAssignmentTarget = null;
let activeCollectionId = null;
let activeProfileView = "posts";

// COMMENTS //

function openCommentAuthorProfile(userId, opener) {
  if (!userId) return;

  returnToProfileAfterPreview = false;
  closeModal(previewModal);

  window.setTimeout(() => {
    void openPublicProfile(userId, opener);
  }, 0);
}

const comments = new Comments({
  api,
  root: commentsRoot,
  count: commentsCount,
  status: commentsStatus,
  list: commentsList,
  empty: commentsEmpty,
  form: commentsForm,
  input: commentsInput,
  submitButton: commentsSubmit,
  error: commentsError,
  loginMessage: commentsLoginMessage,
  avatarFallback: avatarDefault,
  isAuthenticated: () => isAuthenticated,
  getCurrentUserId: () => currentUserId,
  openPublicProfile: openCommentAuthorProfile,
});

comments.setEventListeners();
comments.hide();

// NOTIFICATIONS //

function openNotificationPost(notification, opener) {
  const post = notification?.post;

  if (!post?._id || !post?.image?.url) return;

  const card = {
    ...post,
    name: post.caption || "Spots photo",
    link: post.image.url,
  };

  const targetCommentId =
    notification.type === "post_comment" || notification.type === "comment_like"
      ? notification.comment?._id || null
      : null;

  const previewContainer = previewModal.querySelector(
    ".modal__image-container",
  );

  previewContainer.classList.remove("modal__image-container_type_avatar");
  previewContainer.classList.add("modal__image-container_type_post");

  previewImageEl.classList.remove("modal__image_type_avatar");
  previewImageEl.src = card.link;
  previewImageEl.alt = card.name;
  captionEl.textContent = card.name;

  openModal(previewModal, opener);
  void comments.show(card, { targetCommentId });
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
  clearReadButton: notificationsClearReadBtn,
  loadMoreButton: notificationsLoadMoreBtn,
  avatarFallback: avatarDefault,
  openModal,
  closeModal,
  openPublicProfile,
  openNotificationPost,
  refreshFollowSummary: () => mainProfile.refreshFollowSummary(),
  isAuthenticated: () => isAuthenticated,
});

notifications.setEventListeners();

const discoverPeople = new DiscoverPeople({
  api,
  modal: discoverPeopleModal,
  form: discoverPeopleForm,
  input: discoverPeopleInput,
  status: discoverPeopleStatus,
  results: discoverPeopleResults,
  empty: discoverPeopleEmpty,
  avatarFallback: avatarDefault,
  openModal,
  closeModal,
  openPublicProfile,
  isAuthenticated: () => isAuthenticated,
});

discoverPeople.setEventListeners();

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
    const previewContainer = previewModal.querySelector(
      ".modal__image-container",
    );

    previewContainer.classList.remove("modal__image-container_type_avatar");
    previewContainer.classList.add("modal__image-container_type_post");

    previewImageEl.classList.remove("modal__image_type_avatar");
    previewImageEl.src = card.link;
    previewImageEl.alt = card.name;
    captionEl.textContent = card.name;

    openModal(previewModal, opener);
    void comments.show(card);
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
  onRelationshipChange: async () => {
    loadedCards = await api.getInitialCards();
    renderProfileView();
  },
});

publicProfile.setEventListeners();

async function openPublicProfile(userId, opener) {
  await publicProfile.open(userId, opener);
}

// PROFILE PREVIEW RETURN //

previewModal.addEventListener("modalclosed", () => {
  const previewContainer = previewModal.querySelector(
    ".modal__image-container",
  );

  previewImageEl.classList.remove("modal__image_type_avatar");
  previewContainer.classList.remove(
    "modal__image-container_type_avatar",
    "modal__image-container_type_post",
  );

  comments.hide();

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

  comments.hide();

  const previewContainer = previewModal.querySelector(
    ".modal__image-container",
  );

  previewContainer.classList.remove("modal__image-container_type_post");
  previewContainer.classList.add("modal__image-container_type_avatar");

  if (returnToProfile) {
    returnToProfileAfterPreview = true;
    closeModal(profileModal);
  }

  previewImageEl.src = image.src;
  previewImageEl.alt = name
    ? `Profile picture for ${name}`
    : "Spots user profile picture";
  previewImageEl.classList.add("modal__image_type_avatar");

  captionEl.textContent = name || "Spots";

  window.setTimeout(() => {
    openModal(previewModal, opener);
  }, 0);
}

// AUTHENTICATION VIEW //

function setAuthenticatedView(authenticated) {
  isAuthenticated = authenticated;
  loginBtn.hidden = authenticated;
  logoutBtn.hidden = !authenticated;
  discoverBtn.hidden = !authenticated;
  notificationBtn.hidden = !authenticated;
  profileTabs.hidden = !authenticated;
  mainProfile.setAuthenticatedView(authenticated);
  comments.refreshAuthenticationState();

  if (!authenticated) {
    activeProfileView = "posts";
    loadedCards = [];
    loadedCollections = [];

    profileTabButtons.forEach((button) => {
      const isPosts = button.dataset.profileView === "posts";

      button.classList.toggle("profile-tabs__button_active", isPosts);
      button.setAttribute("aria-pressed", isPosts ? "true" : "false");
    });

    notifications.renderUnreadCount(0);
  }
}

function displayUser(user) {
  currentUser = user;
  mainProfile.displayUser(user);
}

function displayGuestProfile() {
  currentUser = null;
  mainProfile.displayGuest();
}

function renderCards(cards) {
  cardsList.replaceChildren();
  cards.forEach(renderCard);
}

function getVisibleProfileCards() {
  if (activeProfileView === "saved") {
    const savedCards = loadedCards.filter((card) => card.isBookmarked);

    if (activeCollectionId) {
      return savedCards.filter(
        (card) => card.collectionId === activeCollectionId,
      );
    }

    return savedCards;
  }

  return loadedCards;
}

function renderCollections() {
  collectionsList.replaceChildren();

  loadedCollections.forEach((collection) => {
    const item = document.createElement("li");
    const card = document.createElement("button");
    const header = document.createElement("div");
    const name = document.createElement("h3");
    const visibility = document.createElement("span");
    const description = document.createElement("p");
    const count = document.createElement("p");

    item.className = "saved-library__item";
    card.className = "saved-library__card";
    card.type = "button";
    card.dataset.collectionId = collection._id;
    card.setAttribute("aria-label", `Open collection ${collection.name}`);

    card.addEventListener("click", () => {
      activeCollectionId = collection._id;
      renderProfileView();
    });

    header.className = "saved-library__card-header";
    name.className = "saved-library__card-title";
    visibility.className = "saved-library__visibility";
    description.className = "saved-library__card-description";
    count.className = "saved-library__card-count";

    name.textContent = collection.name;
    visibility.textContent =
      collection.visibility === "public" ? "Public" : "Private";
    visibility.dataset.visibility = collection.visibility;

    description.textContent = collection.description || "No description yet.";

    const bookmarkCount = Number(collection.bookmarkCount) || 0;
    count.textContent = `${bookmarkCount} saved ${
      bookmarkCount === 1 ? "post" : "posts"
    }`;

    header.append(name, visibility);
    card.append(header, description, count);
    item.append(card);
    collectionsList.append(item);
  });

  const hasCollections = loadedCollections.length > 0;

  collectionsEmptyState.hidden = hasCollections;
  collectionsList.hidden = !hasCollections;
}

function renderActiveCollectionDetail() {
  const collection = loadedCollections.find(
    (item) => item._id === activeCollectionId,
  );

  if (!collection) {
    activeCollectionId = null;
    collectionDetail.hidden = true;
    return;
  }

  collectionDetailTitle.textContent = collection.name;
  collectionDetailDescription.textContent =
    collection.description || "No description yet.";

  collectionDetailVisibility.textContent =
    collection.visibility === "public" ? "Public" : "Private";
  collectionDetailVisibility.dataset.visibility = collection.visibility;

  collectionDetail.hidden = false;
}

function renderProfileView() {
  const visibleCards = getVisibleProfileCards();
  const isSavedView = activeProfileView === "saved";
  const isCollectionView = isSavedView && Boolean(activeCollectionId);
  const showSavedEmptyState = isSavedView && visibleCards.length === 0;

  savedLibrary.hidden = !isSavedView || isCollectionView;
  collectionDetail.hidden = !isCollectionView;
  savedEmptyState.hidden = !showSavedEmptyState;
  cardsList.hidden = showSavedEmptyState;

  if (isCollectionView) {
    const collection = loadedCollections.find(
      (item) => item._id === activeCollectionId,
    );

    savedEmptyState.querySelector(".cards__empty-title").textContent =
      "No posts in this collection yet";
    savedEmptyState.querySelector(".cards__empty-text").textContent =
      "Add a saved post to this collection and it will appear here.";

    if (collection) {
      renderActiveCollectionDetail();
    } else {
      activeCollectionId = null;
      renderProfileView();
      return;
    }
  } else {
    collectionDetail.hidden = true;

    savedEmptyState.querySelector(".cards__empty-title").textContent =
      "No saved posts yet";
    savedEmptyState.querySelector(".cards__empty-text").textContent =
      "Save posts you want to revisit and they'll appear here.";
  }

  renderCollections();
  renderCards(visibleCards);
}

function setActiveProfileView(view) {
  activeProfileView = view === "saved" ? "saved" : "posts";

  if (activeProfileView !== "saved") {
    activeCollectionId = null;
  }

  profileTabButtons.forEach((button) => {
    const isActive = button.dataset.profileView === activeProfileView;

    button.classList.toggle("profile-tabs__button_active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  renderProfileView();
}

function openAuthModal(modal) {
  const form = modal.querySelector(".modal__form");
  form.reset();
  resetModalValidation(form);
  openModal(modal);
}

async function loadAuthenticatedApp() {
  const [cards, user] = await api.getAppInfo();
  const [profileUser, collections] = await Promise.all([
    api.getUserProfile(user._id),
    api.getCollections(),
  ]);

  setAuthenticatedView(true);
  displayUser(profileUser);

  loadedCards = cards;
  loadedCollections = collections;
  setActiveProfileView("posts");

  clearRequestError();

  await notifications.refreshUnreadCount();
}

async function loadGuestApp() {
  setAuthenticatedView(false);
  displayGuestProfile();

  savedEmptyState.hidden = true;
  cardsList.hidden = false;

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

// DISCOVER PEOPLE //

discoverBtn.addEventListener("click", () => {
  discoverPeople.open(discoverBtn);
});

// PROFILE CONTENT TABS //

profileTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!isAuthenticated) return;

    setActiveProfileView(button.dataset.profileView);
  });
});

collectionDetailBack.addEventListener("click", () => {
  activeCollectionId = null;
  renderProfileView();
});

// COLLECTION DETAIL //

// CARD CREATION //

function requestCardDelete(card) {
  clearRequestError(deleteForm);
  collectionToDelete = null;
  cardToDelete = card;
  deleteModalTitle.textContent = "Delete this photo?";
  deleteModalDescription.textContent =
    "This photo will be permanently removed. This cannot be undone.";
  openModal(deleteModal);
}

function openCardPreview(data, opener) {
  const previewContainer = previewModal.querySelector(
    ".modal__image-container",
  );

  previewContainer.classList.remove("modal__image-container_type_avatar");
  previewContainer.classList.add("modal__image-container_type_post");

  previewImageEl.classList.remove("modal__image_type_avatar");
  previewImageEl.src = data.link;
  previewImageEl.alt = data.name;
  captionEl.textContent = data.name;

  openModal(previewModal, opener);
  void comments.show(data);
}

function getBookmarkCollectionId(bookmark) {
  if (!bookmark?.collectionId) return null;

  return typeof bookmark.collectionId === "object"
    ? bookmark.collectionId?._id || null
    : bookmark.collectionId;
}

function setCollectionAssignmentLoading(isLoading) {
  collectionAssignmentOptions
    .querySelectorAll(".collection-assignment__option")
    .forEach((button) => {
      button.disabled = isLoading;
    });

  collectionAssignmentOptions.setAttribute(
    "aria-busy",
    isLoading ? "true" : "false",
  );
}

async function assignBookmarkToCollection(collectionId) {
  if (!collectionAssignmentTarget) return;

  const { data, bookmarkId } = collectionAssignmentTarget;

  clearRequestError();
  setCollectionAssignmentLoading(true);

  try {
    const bookmark = await api.updateBookmark(bookmarkId, {
      collectionId,
    });

    const updatedCollectionId = getBookmarkCollectionId(bookmark);

    data.collectionId = updatedCollectionId;

    const loadedCard = loadedCards.find((card) => card._id === data._id);

    if (loadedCard) {
      loadedCard.collectionId = updatedCollectionId;
    }

    loadedCollections = await api.getCollections();

    closeModal(collectionAssignmentModal);
    collectionAssignmentTarget = null;
    renderProfileView();
  } catch {
    showRequestError(
      "Could not update this saved post's collection. Please try again.",
    );
  } finally {
    setCollectionAssignmentLoading(false);
  }
}

function createCollectionAssignmentOption({ label, collectionId, selected }) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "collection-assignment__option";
  button.classList.toggle("collection-assignment__option_selected", selected);
  button.setAttribute("aria-pressed", selected ? "true" : "false");
  button.dataset.collectionId = collectionId || "";
  button.textContent = label;

  button.addEventListener("click", () => {
    void assignBookmarkToCollection(collectionId);
  });

  return button;
}

function renderCollectionAssignmentOptions() {
  collectionAssignmentOptions.replaceChildren();

  if (!collectionAssignmentTarget) return;

  const currentCollectionId =
    collectionAssignmentTarget.data.collectionId || null;

  collectionAssignmentOptions.append(
    createCollectionAssignmentOption({
      label: "No collection",
      collectionId: null,
      selected: currentCollectionId === null,
    }),
  );

  loadedCollections.forEach((collection) => {
    collectionAssignmentOptions.append(
      createCollectionAssignmentOption({
        label: collection.name,
        collectionId: collection._id,
        selected: currentCollectionId === collection._id,
      }),
    );
  });

  collectionAssignmentEmpty.hidden = loadedCollections.length > 0;
}

function requestCollectionAssignment({ data, bookmarkId, opener }) {
  if (!bookmarkId) return;

  collectionAssignmentTarget = {
    data,
    bookmarkId,
  };

  collectionAssignmentPost.textContent = data.name;
  renderCollectionAssignmentOptions();
  openModal(collectionAssignmentModal, opener);
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
    onCollectionClick: requestCollectionAssignment,
    onBookmarkChange: () => {
      if (activeProfileView === "saved") {
        renderProfileView();
      }

      void api
        .getCollections()
        .then((collections) => {
          loadedCollections = collections;

          if (activeProfileView === "saved") {
            renderCollections();
          }
        })
        .catch(() => {
          showRequestError(
            "Saved posts updated, but collection totals could not refresh.",
          );
        });
    },
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

  if (isDeleting) return;

  clearRequestError(deleteForm);

  if (collectionToDelete) {
    const submittedCollection = collectionToDelete;
    const collectionId = submittedCollection._id;

    isDeleting = true;
    setLoadingState(deleteSubmitBtn, true, "Delete", "Deleting...");

    const removeDeletedCollection = () => {
      loadedCollections = loadedCollections.filter(
        (collection) => collection._id !== collectionId,
      );

      loadedCards.forEach((card) => {
        if (card.collectionId === collectionId) {
          card.collectionId = null;
        }
      });

      if (activeCollectionId === collectionId) {
        activeCollectionId = null;
      }

      renderProfileView();

      if (collectionToDelete === submittedCollection) {
        closeModal(deleteModal);
        collectionToDelete = null;
      }
    };

    api
      .deleteCollection(collectionId)
      .then(() => {
        removeDeletedCollection();
      })
      .catch((error) => {
        if (error.status === 404) {
          removeDeletedCollection();
          return;
        }

        showRequestError(
          "Could not delete the collection. Please try again.",
          collectionToDelete === submittedCollection ? deleteForm : null,
        );
      })
      .finally(() => {
        isDeleting = false;
        setLoadingState(deleteSubmitBtn, false, "Delete", "Deleting...");
      });

    return;
  }

  if (!cardToDelete) return;

  const submittedCard = cardToDelete;
  isDeleting = true;
  setLoadingState(deleteSubmitBtn, true, "Delete", "Deleting...");

  const removeDeletedCard = () => {
    loadedCards = loadedCards.filter((card) => card._id !== submittedCard.id);
    renderProfileView();

    if (cardToDelete === submittedCard) {
      closeModal(deleteModal);
      cardToDelete = null;
    }
  };

  api
    .deleteCard(submittedCard.id)
    .then(() => {
      removeDeletedCard();
    })
    .catch((error) => {
      if (error.status === 404) {
        removeDeletedCard();
        return;
      }

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

function updatePrivacyControl(isPrivate) {
  profilePrivateInput.checked = Boolean(isPrivate);

  profilePrivacyState.textContent = isPrivate
    ? "Private account"
    : "Public account";

  profilePrivacyDescription.textContent = isPrivate
    ? "New followers must send a request that you approve."
    : "Anyone can follow you immediately and view your posts.";
}

profilePrivateInput.addEventListener("change", () => {
  updatePrivacyControl(profilePrivateInput.checked);
});

function updateNewPostCaptionCount() {
  const count = newPostCaptionInput.value.length;
  newPostCaptionCount.textContent = `${count} / 2200`;
}

function parsePostTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function validatePostTags(tags) {
  newPostTagsError.textContent = "";

  if (tags.length > 10) {
    newPostTagsError.textContent = "You can add up to 10 tags.";
    return false;
  }

  if (new Set(tags).size !== tags.length) {
    newPostTagsError.textContent = "Tags must be unique.";
    return false;
  }

  if (tags.some((tag) => tag.length > 40)) {
    newPostTagsError.textContent = "Each tag must be 40 characters or fewer.";
    return false;
  }

  return true;
}

function getSelectedPostVisibility() {
  return (
    newPostVisibilityInputs.find((input) => input.checked)?.value || "public"
  );
}

function getPostLocation() {
  newPostLocationError.textContent = "";

  const name = newPostLocationInput.value.trim();
  const latitudeValue = newPostLatitudeInput.value.trim();
  const longitudeValue = newPostLongitudeInput.value.trim();

  const hasName = Boolean(name);
  const hasLatitude = latitudeValue !== "";
  const hasLongitude = longitudeValue !== "";
  const hasAnyLocation = hasName || hasLatitude || hasLongitude;

  if (!hasAnyLocation) {
    return undefined;
  }

  if (!hasName || !hasLatitude || !hasLongitude) {
    newPostLocationError.textContent =
      "Add a place, latitude, and longitude together.";
    return null;
  }

  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    newPostLocationError.textContent = "Latitude must be between -90 and 90.";
    return null;
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    newPostLocationError.textContent =
      "Longitude must be between -180 and 180.";
    return null;
  }

  return {
    name,
    point: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
  };
}

function resetNewPostForm() {
  newPostForm.reset();
  newPostTagsError.textContent = "";
  newPostLocationError.textContent = "";
  updateNewPostCaptionCount();
  resetModalValidation(newPostForm);
}

newPostCaptionInput.addEventListener("input", updateNewPostCaptionCount);

// COLLECTION CREATION //

function getSelectedCollectionVisibility() {
  return (
    collectionVisibilityInputs.find((input) => input.checked)?.value ||
    "private"
  );
}

function getSelectedEditCollectionVisibility() {
  return (
    editCollectionVisibilityInputs.find((input) => input.checked)?.value ||
    "private"
  );
}

function resetCreateCollectionForm() {
  createCollectionForm.reset();
  resetModalValidation(createCollectionForm);
}

editCollectionButton.addEventListener("click", () => {
  const collection = loadedCollections.find(
    (item) => item._id === activeCollectionId,
  );

  if (!collection) return;

  editCollectionNameInput.value = collection.name || "";
  editCollectionDescriptionInput.value = collection.description || "";

  editCollectionVisibilityInputs.forEach((input) => {
    input.checked = input.value === collection.visibility;
  });

  resetModalValidation(editCollectionForm);
  openModal(editCollectionModal, editCollectionButton);
});

deleteCollectionButton.addEventListener("click", () => {
  const collection = loadedCollections.find(
    (item) => item._id === activeCollectionId,
  );

  if (!collection) return;

  clearRequestError(deleteForm);
  cardToDelete = null;
  collectionToDelete = collection;

  deleteModalTitle.textContent = "Delete this collection?";
  deleteModalDescription.textContent = `"${collection.name}" will be permanently deleted. Saved posts will remain saved. This cannot be undone.`;

  closeModal(editCollectionModal);
  openModal(deleteModal, deleteCollectionButton);
});

createCollectionBtn.addEventListener("click", () => {
  resetCreateCollectionForm();
  openModal(createCollectionModal, createCollectionBtn);
});

createCollectionForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  clearRequestError(createCollectionForm);

  const submitButton = createCollectionForm.querySelector(".modal__submit-btn");

  setLoadingState(submitButton, true, "Create collection", "Creating...");

  api
    .createCollection({
      name: collectionNameInput.value.trim(),
      description: collectionDescriptionInput.value.trim(),
      visibility: getSelectedCollectionVisibility(),
    })
    .then((collection) => {
      loadedCollections.unshift(collection);
      renderCollections();
      resetCreateCollectionForm();
      closeModal(createCollectionModal);
    })
    .catch(() => {
      showRequestError(
        "Could not create the collection. Please try again.",
        createCollectionForm,
      );
    })
    .finally(() => {
      setLoadingState(submitButton, false, "Create collection", "Creating...");
    });
});

editCollectionForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  clearRequestError(editCollectionForm);

  const collectionId = activeCollectionId;

  if (!collectionId) return;

  const submitButton = editCollectionForm.querySelector(".modal__submit-btn");

  setLoadingState(submitButton, true, "Save changes", "Saving...");

  api
    .updateCollection(collectionId, {
      name: editCollectionNameInput.value.trim(),
      description: editCollectionDescriptionInput.value.trim(),
      visibility: getSelectedEditCollectionVisibility(),
    })
    .then((updatedCollection) => {
      loadedCollections = loadedCollections.map((collection) =>
        collection._id === collectionId ? updatedCollection : collection,
      );

      renderCollections();
      renderActiveCollectionDetail();
      closeModal(editCollectionModal);
    })
    .catch(() => {
      showRequestError(
        "Could not update the collection. Please try again.",
        editCollectionForm,
      );
    })
    .finally(() => {
      setLoadingState(submitButton, false, "Save changes", "Saving...");
    });
});

// PROFILE ACTION BUTTONS //

editProfileBtn.addEventListener("click", () => {
  const nameInput = editProfileForm.querySelector("#profile_name-input");
  const descInput = editProfileForm.querySelector("#profile_description-input");
  nameInput.value = profileNameEl.textContent;
  descInput.value = profileDescriptionEl.textContent;
  updatePrivacyControl(currentUser?.isPrivate ?? false);
  resetModalValidation(editProfileForm);
  openModal(editProfileModal);
});

newPostBtn.addEventListener("click", () => {
  resetNewPostForm();
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
      isPrivate: profilePrivateInput.checked,
    })
    .then((data) => {
      currentUser = {
        ...currentUser,
        ...data,
      };
      mainProfile.updateProfileInfo(data);
      updatePrivacyControl(currentUser.isPrivate);
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

  const tags = parsePostTags(newPostTagsInput.value);
  const location = getPostLocation();

  if (!validatePostTags(tags)) {
    newPostTagsInput.focus();
    return;
  }

  if (location === null) {
    newPostLocationInput.focus();
    return;
  }

  const btn = newPostForm.querySelector(".modal__submit-btn");
  setLoadingState(btn, true, "Create post", "Creating...");

  api
    .addNewCard({
      name: newPostCaptionInput.value,
      link: newPostImageInput.value,
      tags,
      visibility: getSelectedPostVisibility(),
      location,
    })
    .then((data) => {
      loadedCards.unshift(data);
      renderProfileView();
      resetNewPostForm();
      closeModal(newPostModal);
    })
    .catch(() => {
      showRequestError(
        "Could not create the post. Your entries are still in the form.",
        newPostForm,
      );
    })
    .finally(() => {
      setLoadingState(btn, false, "Create post", "Creating...");
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
