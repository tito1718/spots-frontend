class MainProfile {
  constructor({
    api,
    name,
    description,
    avatar,
    stats,
    postsCount,
    followersCount,
    followingCount,
    followersButton,
    followingButton,
    editButton,
    addButton,
    avatarEditButton,
    avatarFallback,
    guestAvatar,
    openAvatarPreview,
    openSocialList,
    isAuthenticated,
    setCurrentUserId,
  }) {
    this._api = api;
    this._name = name;
    this._description = description;
    this._avatar = avatar;
    this._stats = stats;
    this._postsCount = postsCount;
    this._followersCount = followersCount;
    this._followingCount = followingCount;
    this._followersButton = followersButton;
    this._followingButton = followingButton;
    this._editButton = editButton;
    this._addButton = addButton;
    this._avatarEditButton = avatarEditButton;
    this._avatarFallback = avatarFallback;
    this._guestAvatar = guestAvatar;
    this._openAvatarPreview = openAvatarPreview;
    this._openSocialList = openSocialList;
    this._isAuthenticated = isAuthenticated;
    this._setCurrentUserId = setCurrentUserId;

    this._handleAvatarClick = this._handleAvatarClick.bind(this);
    this._handleAvatarKeydown = this._handleAvatarKeydown.bind(this);
    this._handleFollowersClick = this._handleFollowersClick.bind(this);
    this._handleFollowingClick = this._handleFollowingClick.bind(this);
  }

  _handleAvatarError() {
    const fallbackUrl = new URL(this._avatarFallback, document.baseURI).href;

    if (this._avatar.src !== fallbackUrl) {
      this._avatar.src = this._avatarFallback;
    }
  }

  _handleAvatarClick() {
    if (!this._isAuthenticated()) return;

    this._openAvatarPreview({
      image: this._avatar,
      name: this._name.textContent,
      opener: this._avatar,
    });
  }

  _handleAvatarKeydown(event) {
    if (!this._isAuthenticated()) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this._handleAvatarClick();
    }
  }

  _handleFollowersClick() {
    if (!this._isAuthenticated()) return;

    this._openSocialList("followers", this._followersButton);
  }

  _handleFollowingClick() {
    if (!this._isAuthenticated()) return;

    this._openSocialList("following", this._followingButton);
  }

  setAuthenticatedView(authenticated) {
    this._editButton.hidden = !authenticated;
    this._addButton.hidden = !authenticated;
    this._avatarEditButton.hidden = !authenticated;
  }

  displayUser(user) {
    this._setCurrentUserId(user._id);

    this._name.textContent = user.name;
    this._description.textContent = user.about || "Sharing memorable places.";

    this._postsCount.textContent = user.postsCount ?? 0;
    this._followersCount.textContent = user.followersCount ?? 0;
    this._followingCount.textContent = user.followingCount ?? 0;
    this._stats.hidden = false;

    this._avatar.classList.remove("profile__avatar_type_guest");
    this._avatar.classList.add("profile__avatar_type_preview");
    this._avatar.src = user.avatar || this._avatarFallback;
    this._avatar.tabIndex = 0;
    this._avatar.setAttribute("role", "button");
    this._avatar.setAttribute(
      "aria-label",
      `View ${user.name || "Spots user"}'s profile picture`,
    );
  }

  displayGuest() {
    this._setCurrentUserId(null);

    this._name.textContent = "Welcome to Spots";
    this._description.textContent =
      "Log in to share, like, and manage your favorite places.";

    this._stats.hidden = true;
    this._postsCount.textContent = "0";
    this._followersCount.textContent = "0";
    this._followingCount.textContent = "0";

    this._avatar.classList.add("profile__avatar_type_guest");
    this._avatar.classList.remove("profile__avatar_type_preview");
    this._avatar.src = this._guestAvatar;
    this._avatar.removeAttribute("role");
    this._avatar.removeAttribute("aria-label");
    this._avatar.removeAttribute("tabindex");
  }

  updateFollowingCount(change) {
    this._followingCount.textContent = Math.max(
      0,
      Number(this._followingCount.textContent || 0) + change,
    );
  }

  async refreshFollowSummary() {
    if (!this._isAuthenticated()) return;

    try {
      const summary = await this._api.getFollowSummary();

      this._followersCount.textContent = summary.followersCount ?? 0;
      this._followingCount.textContent = summary.followingCount ?? 0;
    } catch {
      // A failed background refresh should not interrupt the completed action.
    }
  }

  updateProfileInfo(user) {
    this._name.textContent = user.name;
    this._description.textContent = user.about;
  }

  updateAvatar(avatar) {
    this._avatar.src = avatar;
  }

  getName() {
    return this._name.textContent;
  }

  getDescription() {
    return this._description.textContent;
  }

  setEventListeners() {
    this._avatar.addEventListener("error", () => {
      this._handleAvatarError();
    });

    this._avatar.addEventListener("click", this._handleAvatarClick);
    this._avatar.addEventListener("keydown", this._handleAvatarKeydown);

    this._followersButton.addEventListener("click", this._handleFollowersClick);

    this._followingButton.addEventListener("click", this._handleFollowingClick);
  }
}

export default MainProfile;
