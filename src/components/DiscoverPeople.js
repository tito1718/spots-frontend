// DISCOVER PEOPLE //

class DiscoverPeople {
  constructor({
    api,
    modal,
    form,
    input,
    status,
    results,
    empty,
    avatarFallback,
    openModal,
    closeModal,
    openPublicProfile,
    isAuthenticated,
  }) {
    this._api = api;
    this._modal = modal;
    this._form = form;
    this._input = input;
    this._status = status;
    this._results = results;
    this._empty = empty;
    this._avatarFallback = avatarFallback;
    this._openModal = openModal;
    this._closeModal = closeModal;
    this._openPublicProfile = openPublicProfile;
    this._isAuthenticated = isAuthenticated;

    this._isSearching = false;

    this._handleSubmit = this._handleSubmit.bind(this);
  }

  _setSearching(isSearching) {
    this._isSearching = isSearching;
    this._input.disabled = isSearching;

    this._form.setAttribute("aria-busy", isSearching ? "true" : "false");
  }

  _clearResults() {
    this._results.replaceChildren();
    this._empty.hidden = true;
    this._empty.textContent = "";
  }

  _createResult(user) {
    if (!user?._id) {
      return null;
    }

    const item = document.createElement("li");
    item.className = "discover-people__item";

    const button = document.createElement("button");
    button.className = "discover-people__user";
    button.type = "button";
    button.setAttribute(
      "aria-label",
      `View ${user.name || "Spots user"}'s profile`,
    );

    const avatar = document.createElement("img");
    avatar.className = "discover-people__avatar";
    avatar.src = user.avatar || this._avatarFallback;
    avatar.alt = user.name
      ? `${user.name}'s profile picture`
      : "Spots user profile picture";

    avatar.addEventListener("error", () => {
      const fallbackUrl = new URL(this._avatarFallback, document.baseURI).href;

      if (avatar.src !== fallbackUrl) {
        avatar.src = this._avatarFallback;
      }
    });

    const details = document.createElement("span");
    details.className = "discover-people__details";

    const name = document.createElement("strong");
    name.className = "discover-people__name";
    name.textContent = user.name || "Spots user";

    const about = document.createElement("span");
    about.className = "discover-people__about";
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

  _getUsers(data) {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.users)) {
      return data.users;
    }

    return [];
  }

  async _handleSubmit(event) {
    event.preventDefault();

    if (this._isSearching) return;

    const search = this._input.value.trim();

    if (!search) {
      this._status.textContent = "";
      this._clearResults();
      this._empty.textContent = "Enter a name to discover people.";
      this._empty.hidden = false;
      this._input.focus();
      return;
    }

    this._clearResults();
    this._status.textContent = "Searching…";
    this._setSearching(true);

    try {
      const data = await this._api.searchUsers(search);
      const users = this._getUsers(data);

      const renderedResults = users
        .map((user) => this._createResult(user))
        .filter(Boolean);

      this._status.textContent = "";

      if (!renderedResults.length) {
        this._empty.textContent = `No people found for “${search}”.`;
        this._empty.hidden = false;
        return;
      }

      this._results.append(...renderedResults);
    } catch {
      this._status.textContent = "";
      this._empty.textContent =
        "Could not search for people. Please try again.";
      this._empty.hidden = false;
    } finally {
      this._setSearching(false);
    }
  }

  open(opener) {
    if (!this._isAuthenticated()) return;

    this._status.textContent = "";
    this._clearResults();
    this._input.value = "";

    this._openModal(this._modal, opener);

    window.setTimeout(() => {
      this._input.focus();
    }, 0);
  }

  setEventListeners() {
    this._form.addEventListener("submit", this._handleSubmit);
  }
}

export default DiscoverPeople;
