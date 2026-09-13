// CARD //

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
    onBookmarkChange = () => {},
    onCollectionClick = () => {},
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
    this._onBookmarkChange = onBookmarkChange;
    this._onCollectionClick = onCollectionClick;

    this._element = null;
    this._image = null;
    this._isImageUnavailable = false;
    this._likeButton = null;
    this._likeCount = null;
    this._bookmarkButton = null;
    this._collectionButton = null;

    this._isBookmarked = Boolean(data.isBookmarked);
    this._bookmarkId = data.bookmarkId || null;
    this._collectionId = data.collectionId || null;
    this._isBookmarkPending = false;

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
    this._handleBookmarkClick = this._handleBookmarkClick.bind(this);
    this._handleCollectionClick = this._handleCollectionClick.bind(this);
    this._handleImageKeydown = this._handleImageKeydown.bind(this);
  }

  _handleCollectionClick() {
    if (!this._isBookmarked || !this._bookmarkId) return;

    this._onCollectionClick({
      card: this,
      data: this._data,
      bookmarkId: this._bookmarkId,
      opener: this._collectionButton,
    });
  }

  _setBookmarkLoading(isLoading) {
    this._isBookmarkPending = isLoading;
    this._bookmarkButton.disabled = isLoading;
    this._bookmarkButton.setAttribute(
      "aria-busy",
      isLoading ? "true" : "false",
    );
  }

  _renderBookmarkState() {
    this._bookmarkButton.classList.toggle(
      "card__bookmark-btn_active",
      this._isBookmarked,
    );

    this._bookmarkButton.setAttribute(
      "aria-label",
      this._isBookmarked ? "Remove saved post" : "Save post",
    );

    this._bookmarkButton.title = this._isBookmarked
      ? "Remove from saved"
      : "Save post";

    this._collectionButton.hidden = !this._isBookmarked;
    this._collectionButton.classList.toggle(
      "card__collection-btn_active",
      Boolean(this._collectionId),
    );
    this._collectionButton.setAttribute(
      "aria-label",
      this._collectionId
        ? "Change saved post collection"
        : "Add saved post to collection",
    );
    this._collectionButton.title = this._collectionId
      ? "Change collection"
      : "Add to collection";

    this._data.isBookmarked = this._isBookmarked;
    this._data.bookmarkId = this._bookmarkId;
    this._data.collectionId = this._collectionId;
  }

  async _handleBookmarkClick() {
    if (this._isBookmarkPending) return;

    if (!this._isAuthenticated()) {
      this._openLogin();
      return;
    }

    this._clearRequestError();
    this._setBookmarkLoading(true);

    try {
      if (this._isBookmarked) {
        if (!this._bookmarkId) {
          throw new Error("Saved bookmark ID is missing.");
        }

        await this._api.deleteBookmark(this._bookmarkId);

        this._isBookmarked = false;
        this._bookmarkId = null;
        this._collectionId = null;
      } else {
        const bookmark = await this._api.createBookmark(this._data._id);

        if (!bookmark?._id) {
          throw new Error("Bookmark response did not include an ID.");
        }

        this._isBookmarked = true;
        this._bookmarkId = bookmark._id;
        this._collectionId =
          typeof bookmark.collectionId === "object"
            ? bookmark.collectionId?._id || null
            : bookmark.collectionId || null;
      }

      this._renderBookmarkState();
      this._onBookmarkChange(this._data);
    } catch {
      this._showRequestError(
        this._isBookmarked
          ? "Could not remove this saved post. Please try again."
          : "Could not save this post. Please try again.",
      );
    } finally {
      this._setBookmarkLoading(false);
    }
  }

  _setLikeLoading(isLoading) {
    this._isLikePending = isLoading;
    this._likeButton.disabled = isLoading;
    this._likeButton.setAttribute("aria-busy", isLoading ? "true" : "false");
  }

  _renderLikeState() {
    this._likeCount.textContent = this._likeCountValue;
    this._likeButton.classList.toggle("card__like-btn_active", this._isLiked);

    const likeAction = this._isLiked ? "Unlike post" : "Like post";

    this._likeButton.setAttribute("aria-label", likeAction);
    this._likeButton.title = likeAction;
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
    if (this._isImageUnavailable) return;

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
    const fallbackImage = new URL(
      "../images/spots-images/image-unavailable.svg",
      import.meta.url,
    ).href;

    this._image.src = this._data.link;
    this._image.alt = this._data.name;
    this._image.tabIndex = 0;
    this._image.setAttribute("role", "button");
    this._image.setAttribute("aria-label", `View photo: ${this._data.name}`);

    this._image.addEventListener(
      "error",
      () => {
        this._isImageUnavailable = true;
        this._image.src = fallbackImage;
        this._image.alt = `Image unavailable for ${this._data.name}`;
        this._image.tabIndex = -1;
        this._image.removeAttribute("role");
        this._image.setAttribute("aria-disabled", "true");
        this._image.removeAttribute("aria-label");
        this._image.classList.add("card__image_unavailable");
      },
      { once: true },
    );

    this._image.addEventListener("keydown", this._handleImageKeydown);

    this._image.addEventListener("click", () => {
      if (this._isImageUnavailable) return;

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
    this._bookmarkButton = this._element.querySelector(".card__bookmark-btn");
    this._collectionButton = this._element.querySelector(
      ".card__collection-btn",
    );

    title.textContent = this._data.name;

    this._setOwnerContent(ownerButton, ownerAvatar, ownerName);
    this._setImageContent();

    this._renderBookmarkState();
    this._bookmarkButton.addEventListener("click", this._handleBookmarkClick);
    this._collectionButton.addEventListener(
      "click",
      this._handleCollectionClick,
    );

    this._renderLikeState();
    this._likeButton.addEventListener("click", this._handleLikeClick);

    this._setDeleteBehavior(deleteButton);

    return this._element;
  }
}

export default Card;
