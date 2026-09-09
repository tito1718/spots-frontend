class Comments {
  constructor({
    api,
    root,
    list,
    status,
    empty,
    count,
    form,
    input,
    submitButton,
    error,
    loginMessage,
    avatarFallback,
    isAuthenticated,
    getCurrentUserId,
    openPublicProfile,
  }) {
    this._api = api;
    this._root = root;
    this._list = list;
    this._status = status;
    this._empty = empty;
    this._count = count;
    this._form = form;
    this._input = input;
    this._submitButton = submitButton;
    this._error = error;
    this._loginMessage = loginMessage;
    this._avatarFallback = avatarFallback;
    this._isAuthenticated = isAuthenticated;
    this._getCurrentUserId = getCurrentUserId;
    this._openPublicProfile = openPublicProfile;

    this._activePost = null;
    this._comments = [];
    this._loading = false;
    this._submitting = false;

    this._handleSubmit = this._handleSubmit.bind(this);
  }

  _getId(value) {
    if (!value) return null;
    return typeof value === "object" ? value._id : value;
  }

  _getPostOwnerId() {
    return this._getId(this._activePost?.owner);
  }

  _formatTime(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 1000),
    );

    if (elapsedSeconds < 60) {
      return "Just now";
    }

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    if (elapsedMinutes < 60) {
      return `${elapsedMinutes}m`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);

    if (elapsedHours < 24) {
      return `${elapsedHours}h`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);

    if (elapsedDays < 7) {
      return `${elapsedDays}d`;
    }

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
    });
  }

  _setCount(value) {
    const safeCount = Math.max(0, Number(value) || 0);

    this._count.textContent = String(safeCount);
    this._count.setAttribute(
      "aria-label",
      `${safeCount} ${safeCount === 1 ? "comment" : "comments"}`,
    );
  }

  _setComposerState() {
    const authenticated = this._isAuthenticated();

    this._form.hidden = !authenticated;
    this._loginMessage.hidden = authenticated;

    if (!authenticated) {
      this._input.value = "";
      this._error.textContent = "";
    }
  }

  _setSubmitting(submitting) {
    this._submitting = submitting;
    this._submitButton.disabled = submitting;
    this._input.disabled = submitting;
    this._submitButton.setAttribute("aria-busy", submitting ? "true" : "false");
    this._submitButton.textContent = submitting ? "Posting…" : "Post";
  }

  _createOwnerButton(owner) {
    const ownerId = this._getId(owner);

    const button = document.createElement("button");
    button.className = "comment__owner";
    button.type = "button";
    button.setAttribute(
      "aria-label",
      `View ${owner?.name || "Spots user"}'s profile`,
    );

    const avatar = document.createElement("img");
    avatar.className = "comment__avatar";
    avatar.src = owner?.avatar || this._avatarFallback;
    avatar.alt = owner?.name
      ? `${owner.name}'s profile picture`
      : "Spots user profile picture";

    avatar.addEventListener("error", () => {
      const fallbackUrl = new URL(this._avatarFallback, document.baseURI).href;

      if (avatar.src !== fallbackUrl) {
        avatar.src = this._avatarFallback;
      }
    });

    const name = document.createElement("span");
    name.className = "comment__name";
    name.textContent = owner?.name || "Spots user";

    button.append(avatar, name);

    if (ownerId) {
      button.addEventListener("click", () => {
        this._openPublicProfile(ownerId, button);
      });
    } else {
      button.disabled = true;
    }

    return button;
  }

  _createEditForm(comment, item, bodyElement) {
    const form = document.createElement("form");
    form.className = "comment__edit-form";

    const textarea = document.createElement("textarea");
    textarea.className = "comment__edit-input";
    textarea.value = comment.body || "";
    textarea.maxLength = 2000;
    textarea.rows = 2;
    textarea.required = true;
    textarea.setAttribute("aria-label", "Edit comment");

    const actions = document.createElement("div");
    actions.className = "comment__edit-actions";

    const saveButton = document.createElement("button");
    saveButton.className = "comment__action comment__action_type_save";
    saveButton.type = "submit";
    saveButton.textContent = "Save";

    const cancelButton = document.createElement("button");
    cancelButton.className = "comment__action";
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";

    const error = document.createElement("span");
    error.className = "comment__edit-error";
    error.setAttribute("role", "alert");

    const setLoading = (loading) => {
      textarea.disabled = loading;
      saveButton.disabled = loading;
      cancelButton.disabled = loading;
      saveButton.textContent = loading ? "Saving…" : "Save";
    };

    cancelButton.addEventListener("click", () => {
      form.replaceWith(bodyElement);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const text = textarea.value.trim();

      if (!text) {
        error.textContent = "Comment cannot be empty.";
        textarea.focus();
        return;
      }

      error.textContent = "";
      setLoading(true);

      try {
        const updatedComment = await this._api.updateComment(comment._id, text);

        const index = this._comments.findIndex(
          (entry) => entry._id === comment._id,
        );

        if (index !== -1) {
          this._comments[index] = updatedComment;
        }

        const replacement = this._createCommentItem(updatedComment);
        item.replaceWith(replacement);
      } catch {
        error.textContent = "Could not update this comment. Please try again.";
        setLoading(false);
      }
    });

    actions.append(saveButton, cancelButton);
    form.append(textarea, actions, error);

    return form;
  }

  _createLikeControl(comment) {
    const wrapper = document.createElement("div");
    wrapper.className = "comment__like";

    const button = document.createElement("button");
    button.className = "comment__like-button";
    button.type = "button";

    const icon = document.createElement("span");
    icon.className = "comment__like-icon";
    icon.setAttribute("aria-hidden", "true");

    const count = document.createElement("span");
    count.className = "comment__like-count";

    let isLiked = Boolean(comment.isLiked);
    let likesCount =
      typeof comment.likesCount === "number" ? comment.likesCount : 0;
    let pending = false;

    const render = () => {
      likesCount = Math.max(0, likesCount);

      icon.textContent = isLiked ? "♥" : "♡";

      button.classList.toggle("comment__like-button_active", isLiked);
      button.setAttribute("aria-pressed", isLiked ? "true" : "false");
      button.setAttribute(
        "aria-label",
        `${isLiked ? "Unlike" : "Like"} comment. ${likesCount} ${
          likesCount === 1 ? "like" : "likes"
        }`,
      );

      count.textContent = String(likesCount);
    };

    button.addEventListener("click", async () => {
      if (pending) return;

      if (!this._isAuthenticated()) {
        this._status.textContent = "Log in to like comments.";
        return;
      }

      pending = true;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      this._status.textContent = "";

      try {
        const updatedComment = isLiked
          ? await this._api.unlikeComment(comment._id)
          : await this._api.likeComment(comment._id);

        isLiked = Boolean(updatedComment.isLiked);
        likesCount =
          typeof updatedComment.likesCount === "number"
            ? updatedComment.likesCount
            : likesCount;

        comment.isLiked = isLiked;
        comment.likesCount = likesCount;

        const index = this._comments.findIndex(
          (entry) => entry._id === comment._id,
        );

        if (index !== -1) {
          this._comments[index] = {
            ...this._comments[index],
            isLiked,
            likesCount,
          };
        }

        render();
      } catch {
        this._status.textContent =
          "Could not update this comment like. Please try again.";
      } finally {
        pending = false;
        button.disabled = false;
        button.setAttribute("aria-busy", "false");
      }
    });

    button.append(icon, count);
    wrapper.append(button);

    render();

    return wrapper;
  }

  _createCommentItem(comment) {
    const owner = comment.owner || {};
    const ownerId = this._getId(owner);
    const currentUserId = this._getCurrentUserId();
    const postOwnerId = this._getPostOwnerId();

    const isAuthor =
      Boolean(currentUserId) && Boolean(ownerId) && currentUserId === ownerId;

    const canDelete =
      this._isAuthenticated() &&
      (isAuthor ||
        (Boolean(currentUserId) &&
          Boolean(postOwnerId) &&
          currentUserId === postOwnerId));

    const item = document.createElement("li");
    item.className = "comment";
    item.dataset.commentId = comment._id;

    const header = document.createElement("div");
    header.className = "comment__header";

    const ownerButton = this._createOwnerButton(owner);

    const meta = document.createElement("div");
    meta.className = "comment__meta";

    const time = document.createElement("time");
    time.className = "comment__time";
    time.dateTime = comment.createdAt || "";
    time.textContent = this._formatTime(comment.createdAt);

    meta.append(time);

    if (comment.editedAt) {
      const edited = document.createElement("span");
      edited.className = "comment__edited";
      edited.textContent = "Edited";
      meta.append(edited);
    }

    const headerActions = document.createElement("div");
    headerActions.className = "comment__header-actions";

    const likeControl = this._createLikeControl(comment);

    headerActions.append(meta, likeControl);
    header.append(ownerButton, headerActions);

    const body = document.createElement("p");
    body.className = "comment__body";
    body.textContent = comment.body || "";

    item.append(header, body);

    const footer = document.createElement("div");
    footer.className = "comment__footer";

    const actions = document.createElement("div");
    actions.className = "comment__actions";

    if (isAuthor || canDelete) {
      if (isAuthor) {
        const editButton = document.createElement("button");
        editButton.className = "comment__action";
        editButton.type = "button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
          const editForm = this._createEditForm(comment, item, body);
          body.replaceWith(editForm);

          const textarea = editForm.querySelector(".comment__edit-input");
          textarea.focus();
          textarea.setSelectionRange(
            textarea.value.length,
            textarea.value.length,
          );
        });

        actions.append(editButton);
      }

      if (canDelete) {
        const deleteButton = document.createElement("button");
        deleteButton.className = "comment__action comment__action_type_delete";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", async () => {
          if (deleteButton.disabled) return;

          deleteButton.disabled = true;
          deleteButton.textContent = "Deleting…";
          this._status.textContent = "";

          try {
            await this._api.deleteComment(comment._id);

            this._comments = this._comments.filter(
              (entry) => entry._id !== comment._id,
            );

            item.remove();
            this._renderCollectionState();
          } catch {
            this._status.textContent =
              "Could not delete this comment. Please try again.";
            deleteButton.disabled = false;
            deleteButton.textContent = "Delete";
          }
        });

        actions.append(deleteButton);
      }
    }

    if (actions.childElementCount > 0) {
      footer.append(actions);
      item.append(footer);
    }

    return item;
  }

  _renderCollectionState() {
    this._setCount(this._comments.length);
    this._empty.hidden = this._comments.length !== 0;

    if (this._comments.length === 0) {
      this._list.replaceChildren();
    }
  }

  _renderComments() {
    const items = this._comments.map((comment) =>
      this._createCommentItem(comment),
    );

    this._list.replaceChildren(...items);
    this._renderCollectionState();
  }

  async _handleSubmit(event) {
    event.preventDefault();

    if (
      !this._activePost?._id ||
      !this._isAuthenticated() ||
      this._submitting
    ) {
      return;
    }

    const text = this._input.value.trim();

    if (!text) {
      this._error.textContent = "Comment cannot be empty.";
      this._input.focus();
      return;
    }

    if (text.length > 2000) {
      this._error.textContent = "Comments must be 2,000 characters or fewer.";
      this._input.focus();
      return;
    }

    this._error.textContent = "";
    this._status.textContent = "";
    this._setSubmitting(true);

    try {
      const comment = await this._api.createComment(this._activePost._id, text);

      this._comments.unshift(comment);
      this._renderComments();

      this._input.value = "";
      this._input.focus();
    } catch {
      this._error.textContent =
        "Could not post this comment. Please try again.";
    } finally {
      this._setSubmitting(false);
    }
  }

  async show(post, { targetCommentId = null } = {}) {
    if (!post?._id) {
      this.hide();
      return;
    }

    this._activePost = post;
    this._comments = [];
    this._loading = true;

    this._root.hidden = false;
    this._status.textContent = "Loading comments…";
    this._list.replaceChildren();
    this._empty.hidden = true;
    this._error.textContent = "";
    this._input.value = "";

    this._setCount(post.commentCount ?? 0);
    this._setComposerState();

    try {
      this._comments = await this._api.getComments(post._id);
      this._status.textContent = "";
      this._renderComments();

      if (targetCommentId) {
        const target = Array.from(this._list.querySelectorAll(".comment")).find(
          (item) => item.dataset.commentId === String(targetCommentId),
        );

        if (target) {
          window.requestAnimationFrame(() => {
            target.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

            target.classList.add("comment_type_target");

            window.setTimeout(() => {
              target.classList.remove("comment_type_target");
            }, 2200);
          });
        }
      }
    } catch {
      this._status.textContent = "Could not load comments. Please try again.";
      this._comments = [];
      this._setCount(post.commentCount ?? 0);
      this._empty.hidden = true;
    } finally {
      this._loading = false;
    }
  }

  hide() {
    this._activePost = null;
    this._comments = [];
    this._loading = false;

    this._root.hidden = true;
    this._status.textContent = "";
    this._list.replaceChildren();
    this._empty.hidden = true;
    this._error.textContent = "";
    this._input.value = "";
    this._setCount(0);
  }

  refreshAuthenticationState() {
    if (this._root.hidden) return;
    this._setComposerState();
  }

  setEventListeners() {
    this._form.addEventListener("submit", this._handleSubmit);
  }
}

export default Comments;
