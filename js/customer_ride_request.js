const requestForm = document.querySelector("#ride-request-form");
    const formSection = document.querySelector("#request-form-section");
    const waitingScreen = document.querySelector("#waiting-screen");
    const cancelledScreen = document.querySelector("#cancelled-screen");
    const formError = document.querySelector("#form-error");
    const locationDialog = document.querySelector("#location-dialog");
    const cancelDialog = document.querySelector("#cancel-dialog");
    const requestStorageKey = "islandLinkLatestRideRequest";
    let mockRequest = null;

    function formatOffer(amount) {
      return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 }).format(amount);
    }

    function showLocationState(stateId) {
      document.querySelectorAll("#location-dialog .dialog-content").forEach(state => {
        state.hidden = state.id !== stateId;
      });
    }

    requestForm.addEventListener("submit", event => {
      event.preventDefault();
      formError.textContent = "";

      if (!requestForm.checkValidity()) {
        formError.textContent = "Please enter 1–4 passengers, choose a destination, and add your offer per passenger.";
        requestForm.reportValidity();
        return;
      }

      showLocationState("location-intro-state");
      locationDialog.showModal();
      document.querySelector("#allow-location").focus();
    });

    document.querySelector("#location-not-now").addEventListener("click", () => {
      locationDialog.close();
    });

    document.querySelector("#allow-location").addEventListener("click", () => {
      showLocationState("location-off-state");
      document.querySelector("#turn-on-location").focus();
    });

    document.querySelector("#location-off-back").addEventListener("click", () => {
      showLocationState("location-intro-state");
      document.querySelector("#allow-location").focus();
    });

    document.querySelector("#turn-on-location").addEventListener("click", () => {
      showLocationState("location-received-state");
      document.querySelector("#continue-with-location").focus();
    });

    document.querySelector("#continue-with-location").addEventListener("click", () => {
      const formData = new FormData(requestForm);
      const request = {
        id: `customer-ride-${Date.now()}`,
        passengers: Number(formData.get("passengers")),
        destination: String(formData.get("destination")).trim(),
        offerPerPassenger: Number(formData.get("offerPrice")),
        note: String(formData.get("customerNote")).trim(),
        distance: 1.8
      };

      try {
        localStorage.setItem(requestStorageKey, JSON.stringify(request));
      } catch (error) {
        console.error("Could not save the prototype ride request for the rider screen.", error);
        formError.textContent = "This browser could not save your prototype request. Allow local storage and try again.";
        locationDialog.close();
        formError.focus();
        return;
      }

      mockRequest = request;
      showLocationState("posted-state");
      document.querySelector("#wait-for-rider").focus();
    });

    document.querySelector("#wait-for-rider").addEventListener("click", () => {
      if (!mockRequest) return;

      document.querySelector("#summary-passengers").textContent =
        `${mockRequest.passengers} ${mockRequest.passengers === 1 ? "passenger" : "passengers"}`;
      document.querySelector("#summary-destination").textContent = mockRequest.destination;
      document.querySelector("#summary-offer").textContent =
        `₱${formatOffer(mockRequest.offerPerPassenger)} / tao`;
      document.querySelector("#summary-note").textContent = mockRequest.note;
      document.querySelector("#summary-note-wrap").hidden = !mockRequest.note;
      locationDialog.close();
      formSection.hidden = true;
      waitingScreen.hidden = false;
      document.querySelector("#waiting-title").focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.querySelector("#back-to-form").addEventListener("click", () => {
      waitingScreen.hidden = true;
      formSection.hidden = false;
      document.querySelector("#page-title").focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.querySelector("#open-cancel").addEventListener("click", () => {
      document.querySelector("#cancel-storage-error").hidden = true;
      cancelDialog.showModal();
      document.querySelector("#keep-request").focus();
    });

    document.querySelector("#keep-request").addEventListener("click", () => {
      cancelDialog.close();
      document.querySelector("#open-cancel").focus();
    });

    document.querySelector("#confirm-cancel").addEventListener("click", () => {
      try {
        const storedRequest = localStorage.getItem(requestStorageKey);
        if (storedRequest) {
          const savedRequest = JSON.parse(storedRequest);
          if (mockRequest && savedRequest.id === mockRequest.id) {
            localStorage.removeItem(requestStorageKey);
          }
        }
      } catch (error) {
        console.error("Could not remove the cancelled prototype ride request.", error);
        document.querySelector("#cancel-storage-error").hidden = false;
        return;
      }

      mockRequest = null;
      cancelDialog.close();
      waitingScreen.hidden = true;
      cancelledScreen.hidden = false;
      document.querySelector("#cancelled-title").focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
