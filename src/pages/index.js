//IMPORTS//

import "./index.css";
import {
  enableValidation,
  resetValidation,
  settings,
} from "../scripts/validation.js";
import logoIcon from "../images/spots-images/spots-logo.svg";
import avatarDefault from "../images/spots-images/avatar-fallback.jpg";
import penIcon from "../images/spots-images/edit-dark.svg";
import plusIcon from "../images/spots-images/plus.svg";
import penWhiteIcon from "../images/spots-images/edit-light.svg";
import Api from "../utils/Api.js";
import { openModal, closeModal, setLoadingState } from "../utils/helpers.js";

//API//

const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "95e6328a-c5c5-4efa-b41d-e406591e5a9c",
    "Content-Type": "application/json",
  },
});

//STATE//

let currentUserId = null;
let cardToDelete = null;

//DOM//

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

//OVERLAY CLOSE//

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("mousedown", (evt) => {
    if (evt.target === modal) {
      closeModal(modal);
    }
  });
});

//CARD//

function getCardElement(data) {
  const cardElement = cardTemplate.cloneNode(true);
  const title = cardElement.querySelector(".card__title");
  const image = cardElement.querySelector(".card__image");
  const likeBtn = cardElement.querySelector(".card__like-btn");
  const likeCount = cardElement.querySelector(".card__like-count");
  const deleteBtn = cardElement.querySelector(".card__delete-btn");
  const ownerId = typeof data.owner === "object" ? data.owner._id : data.owner;

  //DATA//

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

  //LIKES//

  let isLiked = Boolean(data.isLiked);
  let likeCountValue =
    typeof data.likesCount === "number" ? data.likesCount : 0;
  likeCount.textContent = likeCountValue;
  likeBtn.classList.toggle("card__like-btn_active", isLiked);
  likeBtn.addEventListener("click", () => {
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
      .catch(console.error);
  });

  //DELETE//

  if (ownerId === currentUserId) {
    deleteBtn.addEventListener("click", () => {
      cardToDelete = { element: cardElement, id: data._id };
      openModal(deleteModal);
    });
  } else {
    deleteBtn.remove();
  }

  //PREVIEW//

  image.addEventListener("click", () => {
    previewImageEl.src = data.link;
    previewImageEl.alt = data.name;
    captionEl.textContent = data.name;
    openModal(previewModal, image);
  });

  return cardElement;
}

//RENDER//

function renderCard(item) {
  const card = getCardElement(item);
  cardsList.prepend(card);
}

//DELETE FORM//

deleteForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  if (!cardToDelete) return;
  setLoadingState(deleteSubmitBtn, true, "Delete", "Deleting...");

  api
    .deleteCard(cardToDelete.id)
    .then(() => {
      cardToDelete.element.remove();
      closeModal(deleteModal);
      cardToDelete = null;
    })
    .catch(console.error)
    .finally(() => {
      setLoadingState(deleteSubmitBtn, false, "Delete", "Deleting...");
    });
});

cancelDeleteBtn.addEventListener("click", () => {
  closeModal(deleteModal);
});

//CLOSE BUTTONS//

document.querySelectorAll(".modal__close-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    closeModal(btn.closest(".modal"));
  });
});

//BUTTONS//

editProfileBtn.addEventListener("click", () => {
  const nameInput = editProfileForm.querySelector("#profile_name-input");
  const descInput = editProfileForm.querySelector("#profile_description-input");
  nameInput.value = profileNameEl.textContent;
  descInput.value = profileDescriptionEl.textContent;
  resetValidation(
    editProfileForm,
    Array.from(editProfileForm.querySelectorAll(".modal__input")),
    settings,
  );
  openModal(editProfileModal);
});

newPostBtn.addEventListener("click", () => {
  newPostForm.reset();
  resetValidation(
    newPostForm,
    Array.from(newPostForm.querySelectorAll(".modal__input")),
    settings,
  );
  openModal(newPostModal);
});

avatarEditBtn.addEventListener("click", () => {
  avatarForm.reset();
  resetValidation(
    avatarForm,
    Array.from(avatarForm.querySelectorAll(".modal__input")),
    settings,
  );
  openModal(avatarModal);
});

//EDIT PROFILE//

editProfileForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
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
    .catch(console.error)
    .finally(() => {
      setLoadingState(btn, false, "Save", "Saving...");
    });
});

//NEW POST//

newPostForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
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
    .catch(console.error)
    .finally(() => {
      setLoadingState(btn, false, "Save", "Creating...");
    });
});

//AVATAR//

avatarForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
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
    .catch(console.error)
    .finally(() => {
      setLoadingState(btn, false, "Save", "Updating...");
    });
});

//INIT//

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".header__logo").src = logoIcon;
  profileAvatarImg.src = avatarDefault;
  document.querySelector(".profile__edit-btn img").src = penIcon;
  document.querySelector(".profile__add-btn img").src = plusIcon;
  document.querySelector(".profile__pencil-icon").src = penWhiteIcon;

  api
    .getAppInfo()
    .then(([cards, user]) => {
      currentUserId = user._id;
      profileNameEl.textContent = user.name;
      profileDescriptionEl.textContent = user.about;
      profileAvatarImg.src = user.avatar || avatarDefault;
      cards.forEach(renderCard);
    })
    .catch(console.error);
});

//VALIDATION//

enableValidation(settings);
