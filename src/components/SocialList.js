class SocialList {
  constructor({
    api,
    modal,
    title,
    count,
    status,
    items,
    empty,
    avatarFallback,
    openModal,
    closeModal,
    openPublicProfile,
    isAuthenticated,
  }) {
    this._api = api;
    this._modal = modal;
    this._title = title;
    this._count = count;
    this._status = status;
    this._items = items;
    this._empty = empty;
    this._avatarFallback = avatarFallback;
    this._openModal = openModal;
    this._closeModal = closeModal;
    this._openPublicProfile = openPublicProfile;
    this._isAuthenticated = isAuthenticated;
  }

  _createItem(entry) {
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
    avatar.src = user.avatar || this._avatarFallback;
    avatar.alt = `${user.name}'s profile picture`;

    avatar.addEventListener("error", () => {
      const fallbackUrl = new URL(this._avatarFallback, document.baseURI).href;

      if (avatar.src !== fallbackUrl) {
        avatar.src = this._avatarFallback;
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
      this._closeModal(this._modal);
      this._openPublicProfile(user._id, button);
    });

    return item;
  }

  async open(type, opener) {
    if (!this._isAuthenticated()) return;

    const isFollowers = type === "followers";
    const heading = isFollowers ? "Followers" : "Following";

    this._title.textContent = heading;
    this._count.textContent = "0";
    this._count.setAttribute("aria-label", "0 accounts");
    this._status.textContent = "Loading…";
    this._empty.hidden = true;
    this._empty.textContent = "";
    this._items.replaceChildren();

    this._openModal(this._modal, opener);

    try {
      const entries = isFollowers
        ? await this._api.getFollowers()
        : await this._api.getFollowing();

      const renderedItems = entries
        .map((entry) => this._createItem(entry))
        .filter(Boolean);

      this._status.textContent = "";

      this._count.textContent = String(renderedItems.length);
      this._count.setAttribute(
        "aria-label",
        `${renderedItems.length} ${
          renderedItems.length === 1 ? "account" : "accounts"
        }`,
      );

      if (!renderedItems.length) {
        this._empty.textContent = isFollowers
          ? "No followers yet. When someone follows you, they'll appear here."
          : "Not following anyone yet. Accounts you follow will appear here.";

        this._empty.hidden = false;
        return;
      }

      this._items.append(...renderedItems);
    } catch {
      this._status.textContent = "";
      this._empty.textContent = `Could not load ${type}. Please try again.`;
      this._empty.hidden = false;
    }
  }
}

export default SocialList;
