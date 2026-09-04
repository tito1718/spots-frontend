// API CLIENT //

class Api {
  constructor({ baseUrl, headers }) {
    this._baseUrl = baseUrl;
    this._headers = headers;
  }

  // RESPONSE HANDLING //

  _handleResponse(res) {
    if (res.ok) {
      return res.json();
    }

    return Promise.reject(new Error(`Error: ${res.status}`));
  }

  // REQUEST HANDLING //

  _request(endpoint, options = {}) {
    return fetch(`${this._baseUrl}${endpoint}`, {
      headers: this._headers,
      ...options,

      body: options.body ? JSON.stringify(options.body) : undefined,
    }).then((res) => {
      return this._handleResponse(res);
    });
  }

  // INITIAL APPLICATION DATA //

  getAppInfo() {
    return Promise.all([this.getInitialCards(), this.getUserInfo()]);
  }

  // CARD REQUESTS //

  getInitialCards() {
    return this._request("/cards");
  }

  addNewCard({ name, link }) {
    return this._request("/cards", {
      method: "POST",

      body: {
        name,
        link,
      },
    });
  }

  deleteCard(cardId) {
    return this._request(`/cards/${cardId}`, {
      method: "DELETE",
    });
  }

  // LIKE REQUESTS //

  likeCard(cardId) {
    return this._request(`/cards/${cardId}/likes`, {
      method: "PUT",
    });
  }

  unlikeCard(cardId) {
    return this._request(`/cards/${cardId}/likes`, {
      method: "DELETE",
    });
  }

  // PROFILE REQUESTS //

  getUserInfo() {
    return this._request("/users/me");
  }

  editUserInfo({ name, about }) {
    return this._request("/users/me", {
      method: "PATCH",

      body: {
        name,
        about,
      },
    });
  }

  editAvatar({ avatar }) {
    return this._request("/users/me/avatar", {
      method: "PATCH",

      body: {
        avatar,
      },
    });
  }
}

// EXPORT //

export default Api;
