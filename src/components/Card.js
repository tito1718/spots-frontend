class Card {
  constructor({
    data,
    template,
    api,
    avatarFallback,
    isAuthenticated,
    getCurrentUserId,
    openLogin,
    openPublicProfile,
    openPreview,
    requestDelete,
    clearRequestError,
    showRequestError,
  }) {
    this._data = data;
    this._template = template;
    this._api = api;
    this._avatarFallback = avatarFallback;
    this._isAuthenticated = isAuthenticated;
    this._getCurrentUserId = getCurrentUserId;
    this._openLogin = openLogin;
    this._openPublicProfile = openPublicProfile;
    this._openPreview = openPreview;
    this._requestDelete = requestDelete;
    this._clearRequestError = clearRequestError;
    this._showRequestError = showRequestError;

    this._element = null;
    this._image = null;
    this._likeButton = null;
    this._likeCount = null;

    this._isLiked = Boolean(data.isLiked);
    this._isLikePending = false;
    this._likeCountValue =
      typeof data.likesCount === "number" ? data.likesCount : 0;

    this._ownerId =
      typeof data.owner === "object" ? data.owner?._id : data.owner;

    this._owner =
      typeof data.owner === "object" && data.owner
        ? data.owner
        : {
            _id: this._ownerId,
            name: "Spots user",
            avatar: "",
          };

    this._handleLikeClick = this._handleLikeClick.bind(this);
    this._handleImageKeydown = this._handleImageKeydown.bind(this);
  }

  _setLikeLoading(isLoading) {
    this._isLikePending = isLoading;
    this._likeButton.disabled = isLoading;
    this._likeButton.setAttribute("aria-busy", isLoading ? "true" : "false");
  }

  _renderLikeState() {
    this._likeCount.textContent = this._likeCountValue;
    this._likeButton.classList.toggle("card__like-btn_active", this._isLiked);
  }

  async _handleLikeClick() {
    if (this._isLikePending) return;

    if (!this._isAuthenticated()) {
      this._openLogin();
      return;
    }

    this._clearRequestError();
    this._setLikeLoading(true);

    try {
      const updatedCard = this._isLiked
        ? await this._api.unlikeCard(this._data._id)
        : await this._api.likeCard(this._data._id);

      this._isLiked = Boolean(updatedCard.isLiked);

      if (typeof updatedCard.likesCount === "number") {
        this._likeCountValue = updatedCard.likesCount;
      } else {
        this._likeCountValue = this._isLiked
          ? this._likeCountValue + 1
          : Math.max(0, this._likeCountValue - 1);
      }

      this._renderLikeState();
    } catch {
      this._showRequestError("Could not update the like. Please try again.");
    } finally {
      this._setLikeLoading(false);
    }
  }

  _handleImageKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this._image.click();
    }
  }

  _setOwnerContent(ownerButton, ownerAvatar, ownerName) {
    ownerName.textContent = this._owner.name || "Spots user";

    ownerAvatar.src = this._owner.avatar || this._avatarFallback;
    ownerAvatar.alt = this._owner.name
      ? `${this._owner.name}'s profile picture`
      : "Spots user profile picture";

    ownerAvatar.addEventListener("error", () => {
      const fallbackUrl = new URL(this._avatarFallback, document.baseURI).href;

      if (ownerAvatar.src !== fallbackUrl) {
        ownerAvatar.src = this._avatarFallback;
      }
    });

    ownerButton.setAttribute(
      "aria-label",
      `View ${this._owner.name || "Spots user"}'s profile`,
    );

    ownerButton.addEventListener("click", () => {
      this._openPublicProfile(this._ownerId, ownerButton);
    });
  }

  _setImageContent() {
    this._image.src = this._data.link;
    this._image.alt = this._data.name;
    this._image.tabIndex = 0;
    this._image.setAttribute("role", "button");
    this._image.setAttribute("aria-label", `View photo: ${this._data.name}`);

    this._image.addEventListener("keydown", this._handleImageKeydown);

    this._image.addEventListener("click", () => {
      this._openPreview(this._data, this._image);
    });
  }

  _setDeleteBehavior(deleteButton) {
    const ownsCard =
      this._isAuthenticated() && this._ownerId === this._getCurrentUserId();

    if (!ownsCard) {
      deleteButton.remove();
      return;
    }

    deleteButton.addEventListener("click", () => {
      this._requestDelete({
        element: this._element,
        id: this._data._id,
      });
    });
  }

  getElement() {
    this._element = this._template.cloneNode(true);

    const title = this._element.querySelector(".card__title");
    const deleteButton = this._element.querySelector(".card__delete-btn");
    const ownerButton = this._element.querySelector(".card__owner");
    const ownerAvatar = this._element.querySelector(".card__owner-avatar");
    const ownerName = this._element.querySelector(".card__owner-name");

    this._image = this._element.querySelector(".card__image");
    this._likeButton = this._element.querySelector(".card__like-btn");
    this._likeCount = this._element.querySelector(".card__like-count");

    title.textContent = this._data.name;

    this._setOwnerContent(ownerButton, ownerAvatar, ownerName);
    this._setImageContent();

    this._renderLikeState();
    this._likeButton.addEventListener("click", this._handleLikeClick);

    this._setDeleteBehavior(deleteButton);

    return this._element;
  }
}

export default Card;
