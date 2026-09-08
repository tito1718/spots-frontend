class PublicProfile {
  constructor({
    api,
    modal,
    avatar,
    followButton,
    avatarFallback,
    openModal,
    openAvatarPreview,
    openPostPreview,
    clearRequestError,
    showRequestError,
    isAuthenticated,
    updateOwnFollowingCount,
  }) {
    this._api = api;
    this._modal = modal;
    this._avatar = avatar;
    this._followButton = followButton;
    this._avatarFallback = avatarFallback;
    this._openModal = openModal;
    this._openAvatarPreview = openAvatarPreview;
    this._openPostPreview = openPostPreview;
    this._clearRequestError = clearRequestError;
    this._showRequestError = showRequestError;
    this._isAuthenticated = isAuthenticated;
    this._updateOwnFollowingCount = updateOwnFollowingCount;

    this._activeUser = null;
    this._followPending = false;
    this._opener = null;
    this._returningFromPreview = false;

    this._handleAvatarClick = this._handleAvatarClick.bind(this);
    this._handleAvatarKeydown = this._handleAvatarKeydown.bind(this);
    this._handleFollowClick = this._handleFollowClick.bind(this);
    this._handleModalClosed = this._handleModalClosed.bind(this);
  }

  _getRelationshipLabel(status) {
    const labels = {
      self: "This is your profile",
      following: "Following",
      pending: "Follow request pending",
      none: "",
    };

    return labels[status] || "";
  }

  _updateFollowButton() {
    const user = this._activeUser;

    this._followButton.classList.remove(
      "public-profile__follow-btn_type_following",
      "public-profile__follow-btn_type_pending",
    );

    if (
      !this._isAuthenticated() ||
      !user ||
      user.relationshipStatus === "self"
    ) {
      this._followButton.hidden = true;
      this._followButton.disabled = false;
      return;
    }

    this._followButton.hidden = false;

    if (user.relationshipStatus === "following") {
      this._followButton.textContent = "Following";
      this._followButton.classList.add(
        "public-profile__follow-btn_type_following",
      );
    } else if (user.relationshipStatus === "pending") {
      this._followButton.textContent = "Pending";
      this._followButton.classList.add(
        "public-profile__follow-btn_type_pending",
      );
    } else {
      this._followButton.textContent = "Follow";
    }

    this._followButton.disabled = this._followPending;
    this._followButton.setAttribute(
      "aria-busy",
      this._followPending ? "true" : "false",
    );
  }

  _createPostElement(card) {
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
      this._returningFromPreview = true;
      this._openPostPreview(card, button);
    });

    return button;
  }

  _handleAvatarClick() {
    if (!this._activeUser) return;

    this._returningFromPreview = true;

    this._openAvatarPreview({
      image: this._avatar,
      name: this._activeUser.name || "Spots user",
      opener: this._avatar,
      returnToProfile: true,
    });
  }

  _handleAvatarKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    this._handleAvatarClick();
  }

  async _handleFollowClick() {
    if (
      !this._isAuthenticated() ||
      !this._activeUser ||
      this._followPending ||
      this._activeUser.relationshipStatus === "self"
    ) {
      return;
    }

    this._clearRequestError();
    this._followPending = true;
    this._updateFollowButton();

    try {
      const previousStatus = this._activeUser.relationshipStatus;
      const followersCountEl = this._modal.querySelector(
        '[data-profile-stat="followers"]',
      );

      if (previousStatus === "following" || previousStatus === "pending") {
        await this._api.unfollowUser(this._activeUser._id);

        if (previousStatus === "following") {
          this._activeUser.followersCount = Math.max(
            0,
            (this._activeUser.followersCount ?? 0) - 1,
          );

          this._updateOwnFollowingCount(-1);
        }

        this._activeUser.relationshipStatus = "none";
      } else {
        const follow = await this._api.followUser(this._activeUser._id);
        const nextStatus =
          follow?.status === "accepted" ? "following" : "pending";

        if (nextStatus === "following") {
          this._activeUser.followersCount =
            (this._activeUser.followersCount ?? 0) + 1;

          this._updateOwnFollowingCount(1);
        }

        this._activeUser.relationshipStatus = nextStatus;
      }

      followersCountEl.textContent = this._activeUser.followersCount ?? 0;

      const status = this._modal.querySelector(".public-profile__status");
      status.textContent = this._getRelationshipLabel(
        this._activeUser.relationshipStatus,
      );
    } catch {
      this._showRequestError(
        "Could not update this follow relationship. Please try again.",
      );
    } finally {
      this._followPending = false;
      this._updateFollowButton();
    }
  }

  _handleModalClosed() {
    if (this._returningFromPreview) {
      return;
    }

    this._activeUser = null;
    this._followPending = false;
    this._opener = null;
    this._followButton.hidden = true;
  }

  async open(userId, opener) {
    if (!userId) return;

    this._clearRequestError();

    try {
      const [user, posts] = await Promise.all([
        this._api.getUserProfile(userId),
        this._api.getUserPosts(userId),
      ]);

      this._activeUser = user;
      this._opener = opener;

      const name = this._modal.querySelector(".public-profile__name");
      const about = this._modal.querySelector(".public-profile__about");
      const status = this._modal.querySelector(".public-profile__status");

      const postsCount = this._modal.querySelector(
        '[data-profile-stat="posts"]',
      );

      const followersCount = this._modal.querySelector(
        '[data-profile-stat="followers"]',
      );

      const followingCount = this._modal.querySelector(
        '[data-profile-stat="following"]',
      );

      const postsGrid = this._modal.querySelector(
        ".public-profile__posts-grid",
      );

      const emptyState = this._modal.querySelector(".public-profile__empty");

      name.textContent = user.name || "Spots user";
      about.textContent = user.about || "Sharing memorable places.";

      this._avatar.src = user.avatar || this._avatarFallback;
      this._avatar.alt = user.name
        ? `${user.name}'s profile picture`
        : "Spots user profile picture";

      this._avatar.setAttribute(
        "aria-label",
        `View ${user.name || "Spots user"}'s profile picture`,
      );

      postsCount.textContent = user.postsCount ?? posts.length;
      followersCount.textContent = user.followersCount ?? 0;
      followingCount.textContent = user.followingCount ?? 0;
      status.textContent = this._getRelationshipLabel(user.relationshipStatus);

      this._updateFollowButton();

      postsGrid.replaceChildren(
        ...posts.map((post) => this._createPostElement(post)),
      );

      emptyState.hidden = posts.length !== 0;

      this._openModal(this._modal, opener);
    } catch {
      this._showRequestError(
        "Could not load this profile. Please try again shortly.",
      );
    }
  }

  reopen() {
    if (!this._activeUser) {
      this._returningFromPreview = false;
      return;
    }

    this._returningFromPreview = false;
    this._openModal(this._modal, this._opener);
  }

  setEventListeners() {
    this._avatar.tabIndex = 0;
    this._avatar.setAttribute("role", "button");

    this._avatar.addEventListener("error", () => {
      const fallbackUrl = new URL(this._avatarFallback, document.baseURI).href;

      if (this._avatar.src !== fallbackUrl) {
        this._avatar.src = this._avatarFallback;
      }
    });

    this._avatar.addEventListener("click", this._handleAvatarClick);

    this._avatar.addEventListener("keydown", this._handleAvatarKeydown);

    this._followButton.addEventListener("click", this._handleFollowClick);

    this._modal.addEventListener("modalclosed", this._handleModalClosed);
  }
}

export default PublicProfile;
