// API CLIENT //

class Api {
  constructor({ baseUrl }) {
    this._baseUrl = baseUrl.replace(/\/$/, "");
    this._accessToken = null;
    this._refreshPromise = null;
  }

  // RESPONSE HANDLING //

  async _handleResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    const hasJson = contentType.includes("application/json");
    const data = hasJson ? await response.json() : null;

    if (response.ok) {
      return data;
    }

    const error = new Error(
      data?.message || `Request failed with status ${response.status}`,
    );

    error.status = response.status;
    error.details = data;
    throw error;
  }

  // REQUEST HANDLING //

  async _request(
    endpoint,
    { body, headers = {}, ...options } = {},
    { authenticated = true, retry = true } = {},
  ) {
    const requestHeaders = new Headers(headers);

    if (body !== undefined) {
      requestHeaders.set("Content-Type", "application/json");
    }

    if (authenticated && this._accessToken) {
      requestHeaders.set("Authorization", `Bearer ${this._accessToken}`);
    }

    const response = await fetch(`${this._baseUrl}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (
      response.status === 401 &&
      authenticated &&
      retry &&
      !endpoint.startsWith("/auth/")
    ) {
      await this.refreshSession();

      return this._request(
        endpoint,
        { body, headers, ...options },
        { authenticated, retry: false },
      );
    }

    return this._handleResponse(response);
  }

  // SESSION REQUESTS //

  register({ name, about, avatar, email, password }) {
    return this._request(
      "/auth/register",
      {
        method: "POST",
        body: {
          name,
          about,
          avatar,
          email,
          password,
        },
      },
      { authenticated: false, retry: false },
    );
  }

  async login({ email, password }) {
    const data = await this._request(
      "/auth/login",
      {
        method: "POST",
        body: { email, password },
      },
      { authenticated: false, retry: false },
    );

    this._accessToken = data.accessToken;
    return data;
  }

  refreshSession() {
    if (!this._refreshPromise) {
      this._refreshPromise = this._request(
        "/auth/refresh",
        { method: "POST" },
        { authenticated: false, retry: false },
      )
        .then((data) => {
          this._accessToken = data.accessToken;
          return data;
        })
        .finally(() => {
          this._refreshPromise = null;
        });
    }

    return this._refreshPromise;
  }

  async logout() {
    try {
      await this._request(
        "/auth/logout",
        { method: "POST" },
        { authenticated: false, retry: false },
      );
    } finally {
      this._accessToken = null;
    }
  }

  // DATA ADAPTERS //

  _toCard(post) {
    return {
      ...post,
      name: post.caption,
      link: post.image?.url,
      likesCount: post.likesCount ?? post.likeCount ?? 0,
    };
  }

  _unwrapPost(response) {
    return this._toCard(response?.post || response);
  }

  // INITIAL APPLICATION DATA //

  async getAppInfo() {
    const session = this._accessToken ? null : await this.refreshSession();

    const [cards, user] = await Promise.all([
      this.getInitialCards(),
      this.getUserInfo(),
    ]);

    return [cards, user || session?.user];
  }

  // POST REQUESTS //

  async getInitialCards() {
    const data = await this._request("/posts?limit=50");
    return (data.posts || []).map((post) => this._toCard(post));
  }

  async addNewCard({ name, link }) {
    const data = await this._request("/posts", {
      method: "POST",
      body: {
        caption: name,
        image: {
          url: link,
          altText: name,
        },
        visibility: "public",
      },
    });

    return this._unwrapPost(data);
  }

  deleteCard(postId) {
    return this._request(`/posts/${postId}`, {
      method: "DELETE",
    });
  }

  // LIKE REQUESTS //

  async likeCard(postId) {
    const data = await this._request(`/posts/${postId}/likes`, {
      method: "PUT",
    });

    return this._unwrapPost(data);
  }

  async unlikeCard(postId) {
    const data = await this._request(`/posts/${postId}/likes`, {
      method: "DELETE",
    });

    return this._unwrapPost(data);
  }

  // PROFILE REQUESTS //

  async getUserInfo() {
    const data = await this._request("/users/me");
    return data.user;
  }

  async editUserInfo({ name, about }) {
    const data = await this._request("/users/me", {
      method: "PATCH",
      body: { name, about },
    });

    return data.user;
  }

  async editAvatar({ avatar }) {
    const data = await this._request("/users/me", {
      method: "PATCH",
      body: { avatar },
    });

    return data.user;
  }

  async getUserProfile(userId) {
    const data = await this._request(`/users/${userId}`);
    return data.user;
  }

  async getFollowers() {
    const data = await this._request("/follows/followers?limit=50");
    return data.followers || data.users || [];
  }

  async getFollowing() {
    const data = await this._request("/follows/following?limit=50");
    return data.following || data.users || [];
  }

  async followUser(userId) {
    const data = await this._request(`/follows/users/${userId}`, {
      method: "POST",
    });

    return data.follow;
  }

  unfollowUser(userId) {
    return this._request(`/follows/users/${userId}`, {
      method: "DELETE",
    });
  }

  async getUserPosts(userId) {
    const data = await this._request(`/users/${userId}/posts?limit=50`);
    return (data.posts || []).map((post) => this._toCard(post));
  }

  // FOLLOW REQUESTS //

  async getFollowRequests() {
    const data = await this._request("/follows/requests?limit=50");
    return data.requests || [];
  }

  async acceptFollowRequest(followId) {
    const data = await this._request(`/follows/requests/${followId}/accept`, {
      method: "POST",
    });

    return data.follow;
  }

  rejectFollowRequest(followId) {
    return this._request(`/follows/requests/${followId}`, {
      method: "DELETE",
    });
  }

  removeFollower(userId) {
    return this._request(`/follows/followers/${userId}`, {
      method: "DELETE",
    });
  }

  async getFollowSummary() {
    return this._request("/follows/summary");
  }

  // COMMENT REQUESTS //

  async getComments(postId) {
    const data = await this._request(`/posts/${postId}/comments?limit=50`);
    return data.comments || [];
  }

  async createComment(postId, text) {
    const data = await this._request(`/posts/${postId}/comments`, {
      method: "POST",
      body: { body: text },
    });

    return data.comment;
  }

  async updateComment(commentId, text) {
    const data = await this._request(`/comments/${commentId}`, {
      method: "PATCH",
      body: { body: text },
    });

    return data.comment;
  }

  deleteComment(commentId) {
    return this._request(`/comments/${commentId}`, {
      method: "DELETE",
    });
  }

  async likeComment(commentId) {
    const data = await this._request(`/comments/${commentId}/likes`, {
      method: "PUT",
    });

    return data.comment;
  }

  async unlikeComment(commentId) {
    const data = await this._request(`/comments/${commentId}/likes`, {
      method: "DELETE",
    });

    return data.comment;
  }

  // NOTIFICATION REQUESTS //

  async getNotifications({ page = 1, limit = 50, unreadOnly = false } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      unreadOnly: String(unreadOnly),
    });

    const data = await this._request(`/notifications?${params.toString()}`);
    return data;
  }

  async getUnreadNotificationCount() {
    const data = await this._request("/notifications/unread-count");
    return data.unreadCount ?? 0;
  }

  async markNotificationRead(notificationId) {
    const data = await this._request(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    });

    return data.notification;
  }

  async markAllNotificationsRead() {
    return this._request("/notifications/read-all", {
      method: "PATCH",
    });
  }

  deleteNotification(notificationId) {
    return this._request(`/notifications/${notificationId}`, {
      method: "DELETE",
    });
  }

  clearNotifications() {
    return this._request("/notifications", {
      method: "DELETE",
    });
  }
}

// EXPORT //

export default Api;
