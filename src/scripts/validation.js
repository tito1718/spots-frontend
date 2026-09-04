// VALIDATION SETTINGS //

export const settings = {
  formSelector: ".modal__form",
  inputSelector: ".modal__input",
  submitButtonSelector: ".modal__submit-btn",
  inactiveButtonClass: "modal__submit-btn_disabled",
  inputErrorClass: "modal__input_type_error",
};

// FIELD ERRORS //

function showError(form, input, message, config) {
  const error = form.querySelector(`#${input.id}-error`);
  if (!error) return;

  input.classList.add(config.inputErrorClass);
  error.textContent = message;
}

function hideError(form, input, config) {
  const error = form.querySelector(`#${input.id}-error`);
  if (!error) return;

  input.classList.remove(config.inputErrorClass);
  error.textContent = "";
}

// INPUT VALIDITY //

function checkInput(form, input, config) {
  if (!input.validity.valid) {
    showError(form, input, input.validationMessage, config);
  } else {
    hideError(form, input, config);
  }
}

function hasInvalid(inputs) {
  return inputs.some((i) => !i.validity.valid);
}

// SUBMIT BUTTON STATE //

function toggleButton(inputs, button, config) {
  if (!button) return;

  if (hasInvalid(inputs)) {
    button.disabled = true;
    button.classList.add(config.inactiveButtonClass);
  } else {
    button.disabled = false;
    button.classList.remove(config.inactiveButtonClass);
  }
}

// RESET VALIDATION //

export function resetValidation(form, inputs = [], config) {
  const button = form.querySelector(config.submitButtonSelector);

  inputs.forEach((input) => hideError(form, input, config));
  toggleButton(inputs, button, config);
}

// VALIDATION INITIALIZATION //

function setListeners(form, config) {
  const inputs = [...form.querySelectorAll(config.inputSelector)];
  const button = form.querySelector(config.submitButtonSelector);

  toggleButton(inputs, button, config);

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      checkInput(form, input, config);
      toggleButton(inputs, button, config);
    });
  });
}

export function enableValidation(config) {
  document.querySelectorAll(config.formSelector).forEach((form) => {
    setListeners(form, config);
  });
}
