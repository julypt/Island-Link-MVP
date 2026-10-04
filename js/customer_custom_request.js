const form = document.querySelector("#custom-request-form");
const formSection = document.querySelector("#request-form-section");
const waitingScreen = document.querySelector("#waiting-screen");
const cancelledScreen = document.querySelector("#cancelled-screen");
const successDialog = document.querySelector("#success-dialog");
const cancelDialog = document.querySelector("#cancel-dialog");
const formError = document.querySelector("#form-error");
const requestDescription = document.querySelector("#request-description");
const mainLocation = document.querySelector("#main-location");
const specificTimeField = document.querySelector("#specific-time-field");
const specificTime = document.querySelector("#specific-time");
const timeWindowFields = document.querySelector("#time-window-fields");
const windowStart = document.querySelector("#window-start");
const windowEnd = document.querySelector("#window-end");

function updateScheduleFields() {
  const selectedSchedule = form.querySelector('input[name="scheduleType"]:checked').value;
  const hasSpecificTime = selectedSchedule === "specific";
  const hasTimeWindow = selectedSchedule === "window";

  specificTimeField.hidden = !hasSpecificTime;
  specificTime.disabled = !hasSpecificTime;
  specificTime.required = hasSpecificTime;

  timeWindowFields.hidden = !hasTimeWindow;
  windowStart.disabled = !hasTimeWindow;
  windowEnd.disabled = !hasTimeWindow;
  windowStart.required = hasTimeWindow;
  windowEnd.required = hasTimeWindow;
}

function setFieldError(input, message) {
  const field = input.closest(".field");
  field.classList.add("has-error");
  field.querySelector(".field-error").textContent = message;
}

function clearFieldError(input) {
  const field = input.closest(".field");
  field.classList.remove("has-error");
  const error = field.querySelector(".field-error");
  if (error) error.textContent = "";
}

function validateRequest() {
  let isValid = true;
  formError.textContent = "";
  [requestDescription, mainLocation, specificTime, windowStart, windowEnd].forEach(clearFieldError);

  if (!requestDescription.value.trim()) {
    setFieldError(requestDescription, "Please describe what you need from the rider.");
    isValid = false;
  }

  if (!mainLocation.value.trim()) {
    setFieldError(mainLocation, "Please enter a main location.");
    isValid = false;
  }

  const selectedSchedule = form.querySelector('input[name="scheduleType"]:checked').value;
  if (selectedSchedule === "specific" && !specificTime.value) {
    setFieldError(specificTime, "Please choose when you need this.");
    isValid = false;
  }

  if (selectedSchedule === "window") {
    if (!windowStart.value) {
      setFieldError(windowStart, "Please choose when the time window starts.");
      isValid = false;
    }
    if (!windowEnd.value) {
      setFieldError(windowEnd, "Please choose when the time window ends.");
      isValid = false;
    }
    if (windowStart.value && windowEnd.value && windowEnd.value <= windowStart.value) {
      setFieldError(windowEnd, "Choose an end time after the start time.");
      isValid = false;
    }
  }

  if (!isValid) {
    formError.textContent = "Please review the highlighted fields before posting your request.";
  }
  return isValid;
}

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function scheduleSummary(formData) {
  const selectedSchedule = formData.get("scheduleType");
  if (selectedSchedule === "specific") {
    return `Specific time · ${formatDateTime(formData.get("specificTime"))}`;
  }
  if (selectedSchedule === "window") {
    return `Time window · ${formatDateTime(formData.get("windowStart"))} to ${formatDateTime(formData.get("windowEnd"))}`;
  }
  return selectedSchedule === "asap" ? "ASAP" : "No specific time";
}

function showWaitingScreen() {
  const formData = new FormData(form);
  const additionalLocations = formData.get("additionalLocations").trim();
  const deadline = formData.get("offerDeadline");
  const note = formData.get("optionalNote").trim();

  document.querySelector("#summary-request").textContent = formData.get("requestDescription").trim();
  document.querySelector("#summary-location").textContent = formData.get("mainLocation").trim();
  document.querySelector("#summary-route").textContent = additionalLocations;
  document.querySelector("#summary-route-wrap").hidden = !additionalLocations;
  document.querySelector("#summary-schedule").textContent = scheduleSummary(formData);
  document.querySelector("#summary-deadline").textContent = formatDateTime(deadline);
  document.querySelector("#summary-deadline-wrap").hidden = !deadline;
  document.querySelector("#summary-note").textContent = note;
  document.querySelector("#summary-note-wrap").hidden = !note;

  successDialog.close();
  formSection.hidden = true;
  waitingScreen.hidden = false;
  document.querySelector("#waiting-title").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

form.querySelectorAll('input[name="scheduleType"]').forEach(input => {
  input.addEventListener("change", updateScheduleFields);
});

form.addEventListener("submit", event => {
  event.preventDefault();
  if (!validateRequest()) return;
  successDialog.showModal();
  document.querySelector("#wait-for-driver").focus();
});

document.querySelector("#wait-for-driver").addEventListener("click", showWaitingScreen);

document.querySelector("#open-cancel").addEventListener("click", () => {
  cancelDialog.showModal();
  document.querySelector("#keep-request").focus();
});

document.querySelector("#keep-request").addEventListener("click", () => {
  cancelDialog.close();
  document.querySelector("#open-cancel").focus();
});

document.querySelector("#confirm-cancel").addEventListener("click", () => {
  cancelDialog.close();
  waitingScreen.hidden = true;
  cancelledScreen.hidden = false;
  document.querySelector("#cancelled-title").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

updateScheduleFields();
