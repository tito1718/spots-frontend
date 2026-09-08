class Notifications {
  constructor({
    api,
    modal,
    button,
    badge,
    list,
    status,
    empty,
    markAllButton,
    avatarFallback,
    openModal,
    closeModal,
    openPublicProfile,
    refreshFollowSummary,
    isAuthenticated,
  }) {
    this._api = api;
    this._modal = modal;
    this._button = button;
    this._badge = badge;
    this._list = list;
    this._status = status;
    this._empty = empty;
    this._markAllButton = markAllButton;
    this._avatarFallback = avatarFallback;
    this._openModal = openModal;
    this._closeModal = closeModal;
    this._openPublicProfile = openPublicProfile;
    this._refreshFollowSummary = refreshFollowSummary;
    this._isAuthenticated = isAuthenticated;

    this._handleNotificationButtonClick =
      this._handleNotificationButtonClick.bind(this);

    this._handleMarkAllClick = this._handleMarkAllClick.bind(this);
  }

  renderUnreadCount(count = 0) {
    const safeCount = Math.max(0, Number(count) || 0);

    this._badge.textContent = safeCount > 99 ? "99+" : String(safeCount);
    this._badge.hidden = safeCount === 0;

    this._badge.setAttribute(
      "aria-label",
      `${safeCount} unread ${
        safeCount === 1 ? "notification" : "notifications"
      }`,
    );

    this._button.setAttribute(
      "aria-label",
      safeCount > 0
        ? `Open notifications, ${safeCount} unread`
        : "Open notifications",
    );
  }

  async refreshUnreadCount() {
    if (!this._isAuthenticated()) {
      this.renderUnreadCount(0);
      return;
    }

    try {
      const unreadCount = await this._api.getUnreadNotificationCount();
      this.renderUnreadCount(unreadCount);
    } catch {
      this.renderUnreadCount(0);
    }
  }

  _formatTime(createdAt) {
    const createdTime = new Date(createdAt).getTime();

    if (!Number.isFinite(createdTime)) {
      return "";
    }

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - createdTime) / 1000),
    );

    if (elapsedSeconds < 60) {
      return "Just now";
    }

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    if (elapsedMinutes < 60) {
      return `${elapsedMinutes}m ago`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);

    if (elapsedHours < 24) {
      return `${elapsedHours}h ago`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);

    if (elapsedDays < 7) {
      return `${elapsedDays}d ago`;
    }

    const elapsedWeeks = Math.floor(elapsedDays / 7);

    if (elapsedWeeks < 5) {
      return `${elapsedWeeks}w ago`;
    }

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year:
        new Date(createdTime).getFullYear() === new Date().getFullYear()
          ? undefined
          : "numeric",
    }).format(new Date(createdTime));
  }

  _getMessage(notification) {
    const messages = {
      follow_request: "requested to follow you.",
      follow_accepted: "accepted your follow request.",
      post_like: "liked your photo.",
      post_comment: "commented on your photo.",
    };

    return messages[notification.type] || "interacted with your account.";
  }

  _setActionLoading(actions, loading) {
    actions.forEach((button) => {
      button.disabled = loading;
      button.setAttribute("aria-busy", loading ? "true" : "false");
    });
  }

  _createItem(notification) {
    const actor = notification?.actor;

    if (!notification?._id || !actor?._id) {
      return null;
    }

    const item = document.createElement("li");
    item.className = "notification";

    if (!notification.readAt) {
      item.classList.add("notification_type_unread");
    }

    item.dataset.notificationId = notification._id;

    const avatarButton = document.createElement("button");
    avatarButton.className = "notification__avatar-btn";
    avatarButton.type = "button";
    avatarButton.setAttribute(
      "aria-label",
      `View ${actor.name || "this user"}'s profile`,
    );

    const avatar = document.createElement("img");
    avatar.className = "notification__avatar";
    avatar.src = actor.avatar || this._avatarFallback;
    avatar.alt = `${actor.name || "Spots user"}'s profile picture`;

    avatar.addEventListener("error", () => {
      const fallbackUrl = new URL(this._avatarFallback, document.baseURI).href;

      if (avatar.src !== fallbackUrl) {
        avatar.src = this._avatarFallback;
      }
    });

    avatarButton.append(avatar);

    avatarButton.addEventListener("click", () => {
      this._closeModal(this._modal);

      window.setTimeout(() => {
        this._openPublicProfile(actor._id, avatarButton);
      }, 0);
    });

    const body = document.createElement("div");
    body.className = "notification__body";

    const message = document.createElement("p");
    message.className = "notification__message";

    const actorName = document.createElement("span");
    actorName.className = "notification__actor";
    actorName.textContent = actor.name || "Someone";

    message.append(
      actorName,
      document.createTextNode(` ${this._getMessage(notification)}`),
    );

    if (
      (notification.type === "post_like" ||
        notification.type === "post_comment") &&
      notification.post?.caption
    ) {
      message.append(
        document.createTextNode(` “${notification.post.caption}”`),
      );
    }

    const time = document.createElement("time");
    time.className = "notification__time";
    time.dateTime = notification.createdAt || "";
    time.textContent = this._formatTime(notification.createdAt);

    body.append(message, time);

    const followId = notification.follow?._id;
    const isPendingFollowRequest =
      notification.type === "follow_request" &&
      followId &&
      notification.follow?.status === "pending";

    if (isPendingFollowRequest) {
      const actions = document.createElement("div");
      actions.className = "notification__actions";

      const acceptButton = document.createElement("button");
      acceptButton.className =
        "notification__action-btn notification__action-btn_type_accept";
      acceptButton.type = "button";
      acceptButton.textContent = "Accept";

      const declineButton = document.createElement("button");
      declineButton.className =
        "notification__action-btn notification__action-btn_type_decline";
      declineButton.type = "button";
      declineButton.textContent = "Decline";

      const actionButtons = [acceptButton, declineButton];

      acceptButton.addEventListener("click", async () => {
        if (acceptButton.disabled) return;

        this._setActionLoading(actionButtons, true);
        this._status.textContent = "";

        try {
          await this._api.acceptFollowRequest(followId);
          await this._refreshFollowSummary();
          await this.load();
          await this.refreshUnreadCount();
        } catch {
          this._status.textContent =
            "Could not accept this follow request. Please try again.";
          this._setActionLoading(actionButtons, false);
        }
      });

      declineButton.addEventListener("click", async () => {
        if (declineButton.disabled) return;

        this._setActionLoading(actionButtons, true);
        this._status.textContent = "";

        try {
          await this._api.rejectFollowRequest(followId);
          await this.load();
          await this.refreshUnreadCount();
        } catch {
          this._status.textContent =
            "Could not decline this follow request. Please try again.";
          this._setActionLoading(actionButtons, false);
        }
      });

      actions.append(acceptButton, declineButton);
      body.append(actions);
    }

    item.append(avatarButton, body);

    return item;
  }

  async load() {
    this._status.textContent = "Loading activity…";
    this._empty.hidden = true;
    this._markAllButton.hidden = true;
    this._list.replaceChildren();

    try {
      const data = await this._api.getNotifications({
        page: 1,
        limit: 50,
      });

      const notifications = data.notifications || [];
      const items = notifications
        .map((notification) => this._createItem(notification))
        .filter(Boolean);

      this._status.textContent = "";

      if (!items.length) {
        this._empty.hidden = false;
        return;
      }

      this._list.append(...items);

      this._markAllButton.hidden = !notifications.some(
        (notification) => !notification.readAt,
      );
    } catch {
      this._status.textContent =
        "Could not load notifications. Please try again.";
    }
  }

  _handleNotificationButtonClick() {
    if (!this._isAuthenticated()) return;

    this._openModal(this._modal, this._button);
    void this.load();
  }

  async _handleMarkAllClick() {
    if (this._markAllButton.disabled) return;

    this._markAllButton.disabled = true;
    this._markAllButton.textContent = "Marking as read…";
    this._status.textContent = "";

    try {
      await this._api.markAllNotificationsRead();
      await this.load();
      await this.refreshUnreadCount();
    } catch {
      this._status.textContent =
        "Could not mark notifications as read. Please try again.";
    } finally {
      this._markAllButton.disabled = false;
      this._markAllButton.textContent = "Mark all as read";
    }
  }

  setEventListeners() {
    this._button.addEventListener("click", this._handleNotificationButtonClick);

    this._markAllButton.addEventListener("click", this._handleMarkAllClick);
  }
}

export default Notifications;
