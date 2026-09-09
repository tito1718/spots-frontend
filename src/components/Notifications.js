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
    clearReadButton,
    loadMoreButton,
    avatarFallback,
    openModal,
    closeModal,
    openPublicProfile,
    openNotificationPost,
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
    this._clearReadButton = clearReadButton;
    this._loadMoreButton = loadMoreButton;
    this._page = 1;
    this._pageSize = 20;
    this._hasNextPage = false;
    this._loadedNotifications = [];
    this._avatarFallback = avatarFallback;
    this._openModal = openModal;
    this._closeModal = closeModal;
    this._openPublicProfile = openPublicProfile;
    this._openNotificationPost = openNotificationPost;
    this._refreshFollowSummary = refreshFollowSummary;
    this._isAuthenticated = isAuthenticated;

    this._handleNotificationButtonClick =
      this._handleNotificationButtonClick.bind(this);

    this._handleMarkAllClick = this._handleMarkAllClick.bind(this);
    this._handleClearReadClick = this._handleClearReadClick.bind(this);
    this._handleLoadMoreClick = this._handleLoadMoreClick.bind(this);
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
      comment_like: "liked your comment.",
    };

    return messages[notification.type] || "interacted with your account.";
  }

  _setActionLoading(actions, loading) {
    actions.forEach((button) => {
      button.disabled = loading;
      button.setAttribute("aria-busy", loading ? "true" : "false");
    });
  }

  async _markNotificationRead(notification, item) {
    if (notification.readAt) return;

    await this._api.markNotificationRead(notification._id);

    notification.readAt = new Date().toISOString();
    item.classList.remove("notification_type_unread");

    await this.refreshUnreadCount();
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

    avatarButton.addEventListener("click", async () => {
      if (avatarButton.getAttribute("aria-busy") === "true") return;

      avatarButton.setAttribute("aria-busy", "true");
      this._status.textContent = "";

      try {
        await this._markNotificationRead(notification, item);

        this._closeModal(this._modal);

        window.setTimeout(() => {
          this._openPublicProfile(actor._id, avatarButton);
        }, 0);
      } catch {
        this._status.textContent =
          "Could not open this notification. Please try again.";
      } finally {
        avatarButton.setAttribute("aria-busy", "false");
      }
    });

    const body = document.createElement("div");
    body.className = "notification__body";

    if (notification.type === "follow_accepted") {
      body.classList.add("notification__body_type_link");
      body.tabIndex = 0;
      body.setAttribute("role", "link");
      body.setAttribute(
        "aria-label",
        `View ${actor.name || "this user"}'s profile`,
      );

      const openAcceptedProfile = async () => {
        if (body.getAttribute("aria-busy") === "true") return;

        body.setAttribute("aria-busy", "true");
        this._status.textContent = "";

        try {
          await this._markNotificationRead(notification, item);

          this._closeModal(this._modal);

          window.setTimeout(() => {
            this._openPublicProfile(actor._id, body);
          }, 0);
        } catch {
          this._status.textContent =
            "Could not open this notification. Please try again.";
        } finally {
          body.setAttribute("aria-busy", "false");
        }
      };

      body.addEventListener("click", () => {
        void openAcceptedProfile();
      });

      body.addEventListener("keydown", (evt) => {
        if (evt.key !== "Enter" && evt.key !== " ") return;

        evt.preventDefault();
        void openAcceptedProfile();
      });
    }

    const opensPost =
      notification.type === "post_like" ||
      notification.type === "post_comment" ||
      notification.type === "comment_like";

    if (opensPost && notification.post?._id) {
      body.classList.add("notification__body_type_link");
      body.tabIndex = 0;
      body.setAttribute("role", "button");
      body.setAttribute(
        "aria-label",
        `Open ${notification.post.caption || "related photo"}`,
      );

      const openRelatedPost = async () => {
        if (body.getAttribute("aria-busy") === "true") return;

        body.setAttribute("aria-busy", "true");
        this._status.textContent = "";

        try {
          await this._markNotificationRead(notification, item);

          this._closeModal(this._modal);

          window.setTimeout(() => {
            this._openNotificationPost(notification, body);
          }, 0);
        } catch {
          this._status.textContent =
            "Could not open this notification. Please try again.";
        } finally {
          body.setAttribute("aria-busy", "false");
        }
      };

      body.addEventListener("click", () => {
        void openRelatedPost();
      });

      body.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        void openRelatedPost();
      });
    }

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
        notification.type === "post_comment" ||
        notification.type === "comment_like") &&
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

    const deleteButton = document.createElement("button");
    deleteButton.className = "notification__delete-btn";
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", "Delete notification");

    deleteButton.addEventListener("click", async (evt) => {
      evt.stopPropagation();

      if (deleteButton.disabled) return;

      deleteButton.disabled = true;
      deleteButton.setAttribute("aria-busy", "true");
      this._status.textContent = "";

      try {
        await this._api.deleteNotification(notification._id);

        item.remove();

        await this.refreshUnreadCount();

        if (!this._list.children.length) {
          this._empty.hidden = false;
          this._markAllButton.hidden = true;
          this._clearReadButton.hidden = true;
        } else {
          await this.load();
        }
      } catch {
        this._status.textContent =
          "Could not delete this notification. Please try again.";
        deleteButton.disabled = false;
        deleteButton.setAttribute("aria-busy", "false");
      }
    });

    item.append(avatarButton, body, deleteButton);

    return item;
  }

  async load({ append = false } = {}) {
    if (!append) {
      this._page = 1;
      this._hasNextPage = false;
      this._loadedNotifications = [];
      this._status.textContent = "Loading activity…";
      this._empty.hidden = true;
      this._markAllButton.hidden = true;
      this._clearReadButton.hidden = true;
      this._loadMoreButton.hidden = true;
      this._list.replaceChildren();
    }

    try {
      const data = await this._api.getNotifications({
        page: this._page,
        limit: this._pageSize,
      });

      const notifications = data.notifications || [];
      const items = notifications
        .map((notification) => this._createItem(notification))
        .filter(Boolean);

      this._loadedNotifications = append
        ? [...this._loadedNotifications, ...notifications]
        : notifications;

      this._status.textContent = "";

      if (!append && !items.length) {
        this._empty.hidden = false;
        this._loadMoreButton.hidden = true;
        return;
      }

      if (items.length) {
        this._list.append(...items);
      }

      this._hasNextPage =
        typeof data.pagination?.hasNextPage === "boolean"
          ? data.pagination.hasNextPage
          : notifications.length === this._pageSize;

      this._loadMoreButton.hidden = !this._hasNextPage;

      const renderedNotifications = Array.from(this._list.children);

      if (!renderedNotifications.length) {
        this._empty.hidden = false;
        this._markAllButton.hidden = true;
        this._clearReadButton.hidden = true;
        this._loadMoreButton.hidden = true;
        return;
      }

      this._empty.hidden = true;

      this._markAllButton.hidden = !this._loadedNotifications.some(
        (notification) => !notification.readAt,
      );

      this._clearReadButton.hidden = !this._loadedNotifications.some(
        (notification) => Boolean(notification.readAt),
      );
    } catch (error) {
      this._status.textContent = append
        ? "Could not load more notifications. Please try again."
        : "Could not load notifications. Please try again.";

      if (append) {
        this._loadMoreButton.hidden = !this._hasNextPage;
        throw error;
      }
    }
  }

  _handleNotificationButtonClick() {
    if (!this._isAuthenticated()) return;

    this._page = 1;
    this._openModal(this._modal, this._button);
    void this.load();
  }

  async _handleLoadMoreClick() {
    if (
      this._loadMoreButton.disabled ||
      !this._hasNextPage ||
      !this._isAuthenticated()
    ) {
      return;
    }

    const previousPage = this._page;

    this._loadMoreButton.disabled = true;
    this._loadMoreButton.setAttribute("aria-busy", "true");
    this._loadMoreButton.textContent = "Loading…";
    this._status.textContent = "";

    this._page += 1;

    try {
      await this.load({ append: true });
    } catch {
      this._page = previousPage;
    } finally {
      this._loadMoreButton.disabled = false;
      this._loadMoreButton.setAttribute("aria-busy", "false");
      this._loadMoreButton.textContent = "Load more";
    }
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

  async _handleClearReadClick() {
    if (this._clearReadButton.disabled) return;

    this._clearReadButton.disabled = true;
    this._clearReadButton.textContent = "Clearing…";
    this._status.textContent = "";

    try {
      await this._api.clearNotifications();
      await this.load();
      await this.refreshUnreadCount();
    } catch {
      this._status.textContent =
        "Could not clear read notifications. Please try again.";
    } finally {
      this._clearReadButton.disabled = false;
      this._clearReadButton.textContent = "Clear read";
    }
  }

  setEventListeners() {
    this._button.addEventListener("click", this._handleNotificationButtonClick);

    this._markAllButton.addEventListener("click", this._handleMarkAllClick);

    this._clearReadButton.addEventListener("click", this._handleClearReadClick);
    this._loadMoreButton.addEventListener("click", this._handleLoadMoreClick);
  }
}

export default Notifications;
