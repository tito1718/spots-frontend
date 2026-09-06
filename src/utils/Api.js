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
    const session = await this.refreshSession();
    const [cards, user] = await Promise.all([
      this.getInitialCards(),
      this.getUserInfo(),
    ]);

    return [cards, user || session.user];
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
}

// EXPORT //

export default Api;
