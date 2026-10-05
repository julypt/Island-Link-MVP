    const rideStorageKey = "islandLinkLatestRideRequest";
    const deliveryStorageKey = "islandLinkLatestDeliveryRequest";
    const customStorageKey = "islandLinkLatestCustomRequest";
    const offersStorageKey = "islandLinkRiderOffers";
    const requests = {
      "ride-1": {
        type: "Passenger request",
        requestLocation: "Justiniana",
        destination: "Wilson",
        passengers: 3,
        offerPerPassenger: 100,
        details: "3 passengers",
        distance: 2.4,
        note: "Naa sa waiting shed."
      },
      "ride-2": {
        type: "Passenger request",
        requestLocation: "Wilson",
        destination: "Luna",
        passengers: 2,
        offerPerPassenger: 80,
        details: "2 passengers",
        distance: 4.8,
        note: ""
      },
      "delivery-1": {
        type: "Delivery request",
        requestLocation: "Justiniana",
        destination: "Wilson",
        item: "Documents",
        packageSize: "Small",
        note: "Palihog ayaw pilo-a ang mga dokumento.",
        distance: 2.1
      },
      "delivery-2": {
        type: "Delivery request",
        requestLocation: "Wilson",
        destination: "Luna",
        item: "Groceries",
        packageSize: "Medium",
        note: "",
        distance: 3.4
      },
      "custom-1": {
        type: "Custom rider request",
        requestLocation: "Luna",
        description: "Ihire for 3 days",
        rate: "₱1,200 per day",
        paymentType: "Pakyaw",
        fuel: "Kami mugasolina",
        schedule: "ASAP",
        distance: 1.9
      }
    };

    const filterToggle = document.querySelector("#filter-toggle");
    const filterPanel = document.querySelector("#filter-panel");
    const mapCanvas = document.querySelector("#map-canvas");
    const mapEmpty = document.querySelector("#map-empty");
    const resultsCount = document.querySelector("#results-count");
    const requestCardsContainer = document.querySelector("#passenger-request-cards");
    const requestLoadError = document.querySelector("#request-load-error");
    const pendingOffersStatus = document.querySelector("#pending-offers-status");
    const detailsDialog = document.querySelector("#request-details");
    const detailTitle = document.querySelector("#detail-title");
    const detailFields = document.querySelector("#detail-fields");
    const offerButton = document.querySelector("#offer-request");
    const offerFeedback = document.querySelector("#offer-feedback");
    const offeredRequestIds = new Set();
    let activeRequestId = null;
    let mapMarkers = [];
    let requestCards = [];

    function formatOffer(amount) {
      return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 }).format(amount);
    }

    function formatDistance(distance) {
      return `Approx. ${Number(distance).toFixed(1)} km`;
    }

    function addSavedRideRequest() {
      let savedRequest;
      try {
        const storedValue = localStorage.getItem(rideStorageKey);
        if (!storedValue) return null;
        savedRequest = JSON.parse(storedValue);
      } catch (error) {
        console.error("Could not read the saved prototype ride request.", error);
        requestLoadError.textContent = "A saved passenger request could not be loaded from this browser.";
        requestLoadError.hidden = false;
        return null;
      }

      const validRequest = savedRequest &&
        typeof savedRequest.id === "string" &&
        /^customer-ride-\d+$/.test(savedRequest.id) &&
        Number.isInteger(savedRequest.passengers) &&
        savedRequest.passengers >= 1 &&
        savedRequest.passengers <= 4 &&
        typeof savedRequest.destination === "string" &&
        savedRequest.destination.trim() !== "" &&
        Number.isFinite(savedRequest.offerPerPassenger) &&
        savedRequest.offerPerPassenger >= 0 &&
        Number.isFinite(savedRequest.distance) &&
        savedRequest.distance >= 0;

      if (!validRequest) {
        console.error("The saved prototype ride request has an invalid format.");
        requestLoadError.textContent = "A saved passenger request has invalid details and could not be shown.";
        requestLoadError.hidden = false;
        return null;
      }

      requests[savedRequest.id] = {
        type: "Passenger request",
        requestLocation: "Customer's simulated location",
        destination: savedRequest.destination.trim(),
        passengers: savedRequest.passengers,
        offerPerPassenger: savedRequest.offerPerPassenger,
        details: `${savedRequest.passengers} ${savedRequest.passengers === 1 ? "passenger" : "passengers"}`,
        note: typeof savedRequest.note === "string" ? savedRequest.note : "",
        distance: savedRequest.distance
      };
      return savedRequest.id;
    }

    function readSavedFormRequest(storageKey, idPrefix, type) {
      let savedRequest;
      try {
        const storedValue = localStorage.getItem(storageKey);
        if (!storedValue) return null;
        savedRequest = JSON.parse(storedValue);
      } catch (error) {
        console.error(`Could not read the saved prototype ${type.toLowerCase()}.`, error);
        requestLoadError.textContent = `A saved ${type.toLowerCase()} could not be loaded from this browser.`;
        requestLoadError.hidden = false;
        return null;
      }

      if (!savedRequest || typeof savedRequest.id !== "string" ||
          !savedRequest.id.startsWith(idPrefix) ||
          typeof savedRequest.requestLocation !== "string" ||
          !savedRequest.requestLocation.trim()) {
        console.error(`The saved prototype ${type.toLowerCase()} has an invalid format.`);
        requestLoadError.textContent = `A saved ${type.toLowerCase()} has invalid details and could not be shown.`;
        requestLoadError.hidden = false;
        return null;
      }

      return savedRequest;
    }

    function addSavedDeliveryRequest() {
      const savedRequest = readSavedFormRequest(deliveryStorageKey, "customer-delivery-", "Delivery request");
      if (!savedRequest) return null;

      const id = savedRequest.id;
      requests[id] = {
        type: "Delivery request",
        requestLocation: savedRequest.requestLocation.trim(),
        destination: String(savedRequest.destination || "").trim(),
        item: String(savedRequest.item || "").trim(),
        packageSize: String(savedRequest.packageSize || "").trim(),
        note: String(savedRequest.note || "").trim(),
        distance: 2.1
      };
      return id;
    }

    function addSavedCustomRequest() {
      const savedRequest = readSavedFormRequest(customStorageKey, "customer-custom-", "Custom request");
      if (!savedRequest) return null;

      const id = savedRequest.id;
      requests[id] = {
        type: "Custom rider request",
        requestLocation: savedRequest.requestLocation.trim(),
        description: String(savedRequest.description || "").trim(),
        additionalLocations: String(savedRequest.additionalLocations || "").trim(),
        schedule: String(savedRequest.schedule || "").trim(),
        offerDeadline: String(savedRequest.offerDeadline || "").trim(),
        note: String(savedRequest.note || "").trim(),
        distance: 1.9
      };
      return id;
    }

    function loadOfferedRequestIds() {
      try {
        const storedValue = localStorage.getItem(offersStorageKey);
        if (!storedValue) return;
        const storedIds = JSON.parse(storedValue);
        if (!Array.isArray(storedIds) || !storedIds.every(id => typeof id === "string")) {
          throw new Error("The saved offer list has an invalid format.");
        }
        storedIds.filter(id => Object.hasOwn(requests, id)).forEach(id => offeredRequestIds.add(id));
        if (offeredRequestIds.size !== storedIds.length) {
          localStorage.setItem(offersStorageKey, JSON.stringify([...offeredRequestIds]));
        }
      } catch (error) {
        console.error("Could not read rider offer states from this browser.", error);
        requestLoadError.textContent = "Saved offer states could not be loaded. Please check this browser's local storage.";
        requestLoadError.hidden = false;
      }
    }

    function createPeopleIcon() {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      const paths = [
        ["circle", "cx", "9", "cy", "7", "r", "2.5"],
        ["circle", "cx", "16.5", "cy", "8", "r", "2"],
        ["path", "d", "M4.5 18v-1a4.5 4.5 0 0 1 9 0v1M14 13a3.5 3.5 0 0 1 5.5 2.8V17"]
      ];

      paths.forEach(([tagName, ...attributes]) => {
        const shape = document.createElementNS("http://www.w3.org/2000/svg", tagName);
        for (let index = 0; index < attributes.length; index += 2) {
          shape.setAttribute(attributes[index], attributes[index + 1]);
        }
        svg.append(shape);
      });
      return svg;
    }

    function markOffer(requestId) {
      if (!requests[requestId]) return;

      const updatedIds = new Set(offeredRequestIds);
      const cancelling = updatedIds.has(requestId);
      if (cancelling) updatedIds.delete(requestId);
      else updatedIds.add(requestId);

      try {
        localStorage.setItem(offersStorageKey, JSON.stringify([...updatedIds]));
      } catch (error) {
        console.error("Could not save this prototype offer state.", error);
        offerFeedback.textContent = "This browser could not save the offer state. Check local storage and try again.";
        offerFeedback.hidden = false;
        return;
      }

      offeredRequestIds.clear();
      updatedIds.forEach(id => offeredRequestIds.add(id));
      updateOfferPresentation();

      if (activeRequestId === requestId) {
        offerButton.textContent = cancelling ? "OFFER TO TAKE" : "CANCEL OFFER";
        offerFeedback.textContent = cancelling
          ? "Offer cancelled. The map marker is back to its normal state."
          : "Offer recorded in this prototype only.";
        offerFeedback.hidden = false;
      }
      return cancelling ? "cancelled" : "offered";
    }

    function openRequestDetails(requestId) {
      const request = requests[requestId];
      if (!request) return;

      activeRequestId = requestId;
      detailTitle.textContent = request.type;
      detailFields.replaceChildren();
      offerFeedback.hidden = true;
      offerButton.hidden = false;
      offerButton.textContent = offeredRequestIds.has(requestId) ? "CANCEL OFFER" : "OFFER TO TAKE";

      let fields;
      if (request.type === "Passenger request") {
        fields = [
          ["Person / current location", request.requestLocation],
          ["Destination", request.destination],
          ["Passengers", `${request.passengers} PASAHERO`],
          ["Offer", `₱${formatOffer(request.offerPerPassenger)} / tao`]
        ];
      } else if (request.type === "Delivery request") {
        fields = [
          ["Pickup", request.requestLocation],
          ["Drop-off", request.destination],
          ["Item", request.item],
          ["Package size", request.packageSize],
          ["Distance from rider to pickup", `${formatDistance(request.distance)} away`]
        ];
      } else {
        const parsedDetails = {};
        const description = String(request.description || "");
        const detailPattern = /\b(Rate|Payment type|Fuel)\s*:\s*(.*?)(?=\s+\b(?:Rate|Payment type|Fuel)\s*:|$)/gi;
        for (const detail of description.matchAll(detailPattern)) {
          const key = detail[1].toLowerCase();
          const label = key === "rate" ? "rate" : key === "fuel" ? "fuel" : "paymentType";
          parsedDetails[label] = detail[2].trim();
        }
        const requestDescription = description.replace(detailPattern, "").trim();
        fields = [
          ["Request location", request.requestLocation],
          ["Request", requestDescription],
          ["Distance from rider to request", `${formatDistance(request.distance)} away`]
        ];
        if (request.rate || parsedDetails.rate) fields.splice(2, 0, ["Rate", request.rate || parsedDetails.rate]);
        if (request.paymentType || parsedDetails.paymentType) {
          fields.splice(3, 0, ["Payment type", request.paymentType || parsedDetails.paymentType]);
        }
        if (request.fuel || parsedDetails.fuel) fields.splice(4, 0, ["Fuel", request.fuel || parsedDetails.fuel]);
        if (request.additionalLocations) fields.push(["Additional locations / route", request.additionalLocations]);
        if (request.schedule) fields.push(["When", request.schedule]);
        if (request.offerDeadline) fields.push(["Accept offers until", request.offerDeadline]);
      }
      if (request.type === "Passenger request") {
        fields.push(
          ["Distance from rider to passenger", `${formatDistance(request.distance)} away`],
          ["Request details", request.details]
        );
      }
      if (request.note) fields.push(["Customer note", request.note]);

      fields.forEach(([label, value]) => {
        if (!value) return;
        const row = document.createElement("div");
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = value;
        row.append(term, description);
        detailFields.append(row);
      });
      detailsDialog.showModal();
    }

    function updateOfferPresentation() {
      mapMarkers.forEach(marker => {
        const isOffered = offeredRequestIds.has(marker.dataset.requestId);
        marker.classList.toggle("has-offer", isOffered);
        const button = marker.querySelector(".marker-button");
        const request = requests[marker.dataset.requestId];
        if (request) {
          const baseLabel = request.type === "Passenger request"
            ? `Passenger request heading to ${request.destination}`
            : request.type === "Delivery request"
              ? `Delivery package from ${request.requestLocation} to ${request.destination}`
              : `Custom rider request at ${request.requestLocation} — tap for details`;
          button.setAttribute("aria-label", isOffered ? `${baseLabel}; offer saved` : baseLabel);
        }
      });

      requestCards.forEach(card => {
        const isOffered = offeredRequestIds.has(card.dataset.requestId);
        const button = card.querySelector("[data-offer-id]");
        button.textContent = isOffered ? "CANCEL OFFER" : "OFFER TO TAKE";
        button.classList.toggle("is-offered", isOffered);
      });

      pendingOffersStatus.textContent = offeredRequestIds.size
        ? `${offeredRequestIds.size} ${offeredRequestIds.size === 1 ? "offer" : "offers"} saved in this browser.`
        : "No offers yet";
    }

    function updateMapCaption(marker, request) {
      const caption = marker.querySelector(".marker-caption");
      if (!caption) return;

      caption.replaceChildren();
      caption.hidden = request.type === "Custom rider request";
      const addLine = (text, strong = false) => {
        const line = document.createElement(strong ? "strong" : "span");
        if (!strong) line.className = "destination";
        line.textContent = text;
        caption.append(line);
      };

      if (request.type === "Passenger request") {
        addLine(`→ ${request.destination}`, true);
      } else if (request.type === "Delivery request") {
        addLine(`${request.requestLocation} → ${request.destination}`, true);
      }
    }

    function createPassengerCard(requestId, request) {
      const card = document.createElement("article");
      card.className = "passenger-request-card";
      card.dataset.requestId = requestId;
      card.dataset.distance = String(request.distance);
      card.dataset.destination = request.destination;

      const header = document.createElement("div");
      header.className = "passenger-card-header";
      const icon = document.createElement("span");
      icon.className = "passenger-card-icon";
      icon.append(createPeopleIcon());
      const identity = document.createElement("div");
      const count = document.createElement("p");
      count.className = "passenger-card-count";
      count.textContent = `${request.passengers} PASAHERO`;
      const distance = document.createElement("p");
      distance.className = "passenger-card-distance";
      distance.textContent = `${formatDistance(request.distance)} away`;
      identity.append(count, distance);
      header.append(icon, identity);

      const destination = document.createElement("p");
      destination.className = "passenger-card-destination";
      const destinationLabel = document.createElement("span");
      destinationLabel.textContent = "Destination";
      destination.append(destinationLabel, document.createTextNode(`📍 ${request.destination}`));

      const price = document.createElement("p");
      price.className = "passenger-card-price";
      price.append(
        document.createTextNode(`₱${formatOffer(request.offerPerPassenger)} `)
      );
      const priceUnit = document.createElement("span");
      priceUnit.textContent = "/ tao";
      price.append(priceUnit);

      const action = document.createElement("div");
      action.className = "passenger-card-action";
      const prompt = document.createElement("p");
      prompt.className = "passenger-card-prompt";
      prompt.textContent = "Kuhaon ni?";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button-primary take-request-button";
      button.dataset.offerId = requestId;
      button.textContent = offeredRequestIds.has(requestId) ? "CANCEL OFFER" : "OFFER TO TAKE";
      button.addEventListener("click", () => markOffer(requestId));
      action.append(prompt, button);

      card.append(header, destination, price, action);
      return card;
    }

    function createSavedRideMarker(requestId, request) {
      const marker = document.createElement("div");
      marker.className = "request-marker";
      marker.dataset.requestId = requestId;
      marker.dataset.requestType = "passenger";
      marker.dataset.requestLocation = request.requestLocation;
      marker.dataset.distance = String(request.distance);
      marker.dataset.destination = request.destination;
      marker.style.left = "51%";
      marker.style.top = "21%";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "marker-button passenger";
      button.setAttribute(
        "aria-label",
        `Passenger request heading to ${request.destination}`
      );
      button.append(createPeopleIcon());

      const caption = document.createElement("span");
      caption.className = "marker-caption";
      marker.append(button, caption);
      updateMapCaption(marker, request);
      return marker;
    }

    function createDeliveryIcon() {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      [
        ["path", "d", "m3 7 9-4 9 4v10l-9 4-9-4z"],
        ["path", "d", "m3 7 9 4 9-4M12 11v10"]
      ].forEach(([tagName, attribute, value]) => {
        const shape = document.createElementNS("http://www.w3.org/2000/svg", tagName);
        shape.setAttribute(attribute, value);
        svg.append(shape);
      });
      return svg;
    }

    function createCustomIcon() {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      const star = document.createElementNS("http://www.w3.org/2000/svg", "path");
      star.setAttribute("d", "m12 2.8 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.5 6.3-.9z");
      svg.append(star);
      return svg;
    }

    function createSavedRequestMarker(requestId, request, offset = 0) {
      const marker = document.createElement("div");
      const requestType = request.type === "Passenger request"
        ? "passenger"
        : request.type === "Delivery request" ? "delivery" : "custom";
      const mapPositions = {
        Justiniana: { left: 14, top: 20 },
        Wilson: { left: 64, top: 55 },
        Luna: { left: 25, top: 76 }
      };
      const position = mapPositions[request.requestLocation] || { left: 51, top: 52 };
      marker.className = "request-marker";
      marker.dataset.requestId = requestId;
      marker.dataset.requestType = requestType;
      marker.dataset.requestLocation = request.requestLocation;
      marker.dataset.distance = String(request.distance);
      marker.dataset.destination = requestType === "custom" ? request.requestLocation : request.destination;
      marker.style.left = `${Math.min(88, position.left + offset * 4)}%`;
      marker.style.top = `${Math.min(82, position.top + offset * 4)}%`;

      const button = document.createElement("button");
      button.type = "button";
      button.className = `marker-button ${requestType}`;
      button.setAttribute("aria-label", requestType === "passenger"
        ? `Passenger request heading to ${request.destination}`
        : requestType === "delivery"
          ? `Delivery package from ${request.requestLocation} to ${request.destination}`
          : `Custom rider request at ${request.requestLocation} — tap for details`);
      button.append(requestType === "passenger"
        ? createPeopleIcon()
        : requestType === "delivery" ? createDeliveryIcon() : createCustomIcon());

      const caption = document.createElement("span");
      caption.className = "marker-caption";
      marker.append(button, caption);
      updateMapCaption(marker, request);
      return marker;
    }

    const savedRequestId = addSavedRideRequest();
    if (savedRequestId) {
      mapCanvas.append(createSavedRideMarker(savedRequestId, requests[savedRequestId]));
    }

    const savedDeliveryId = addSavedDeliveryRequest();
    if (savedDeliveryId) {
      mapCanvas.append(createSavedRequestMarker(savedDeliveryId, requests[savedDeliveryId], 1));
    }

    const savedCustomId = addSavedCustomRequest();
    if (savedCustomId) {
      mapCanvas.append(createSavedRequestMarker(savedCustomId, requests[savedCustomId], 1));
    }

    Object.entries(requests)
      .filter(([, request]) => request.type === "Passenger request")
      .forEach(([requestId, request]) => {
        requestCardsContainer.append(createPassengerCard(requestId, request));
      });

    mapMarkers = [...document.querySelectorAll(".request-marker")];
    requestCards = [...requestCardsContainer.querySelectorAll(".passenger-request-card")];

    loadOfferedRequestIds();
    mapMarkers.forEach(marker => {
      const request = requests[marker.dataset.requestId];
      if (!request) return;
      marker.dataset.requestLocation = request.requestLocation;
      marker.dataset.requestType = request.type === "Passenger request"
        ? "passenger"
        : request.type === "Delivery request" ? "delivery" : "custom";
      const button = marker.querySelector(".marker-button");
      button.setAttribute(
        "aria-label",
        request.type === "Passenger request"
          ? `Passenger request heading to ${request.destination}`
          : request.type === "Delivery request"
            ? `Delivery package from ${request.requestLocation} to ${request.destination}`
            : "Custom rider request — tap for details"
      );
      updateMapCaption(marker, request);
    });
    updateOfferPresentation();

    function applyFilters(maxDistance, selectedDestinations) {
      let visibleCount = 0;
      mapMarkers.forEach(marker => {
        const matchesDistance = Number(marker.dataset.distance) <= maxDistance;
        const matchesDestination = selectedDestinations.size === 0 || selectedDestinations.has(marker.dataset.destination);
        marker.hidden = !(matchesDistance && matchesDestination);
        if (!marker.hidden) visibleCount += 1;
      });

      requestCards.forEach(card => {
        const matchesDistance = Number(card.dataset.distance) <= maxDistance;
        const matchesDestination = selectedDestinations.size === 0 || selectedDestinations.has(card.dataset.destination);
        card.hidden = !(matchesDistance && matchesDestination);
      });

      mapEmpty.hidden = visibleCount > 0;
      resultsCount.textContent = `${visibleCount} mock ${visibleCount === 1 ? "request" : "requests"} shown`;
    }

    applyFilters(10, new Set());

    filterToggle.addEventListener("click", () => {
      const isOpen = filterToggle.getAttribute("aria-expanded") === "true";
      filterToggle.setAttribute("aria-expanded", String(!isOpen));
      filterPanel.hidden = isOpen;
    });

    filterPanel.addEventListener("submit", event => {
      event.preventDefault();
      const maxDistance = Number(new FormData(filterPanel).get("distance"));
      const selectedDestinations = new Set(
        [...filterPanel.querySelectorAll('input[name="destination"]:checked')].map(input => input.value)
      );

      applyFilters(maxDistance, selectedDestinations);
      filterPanel.hidden = true;
      filterToggle.setAttribute("aria-expanded", "false");
      filterToggle.focus();
    });

    document.querySelector("#clear-filters").addEventListener("click", () => {
      filterPanel.reset();
      filterPanel.querySelector('input[name="distance"][value="10"]').checked = true;
      applyFilters(10, new Set());
    });

    mapMarkers.forEach(marker => {
      marker.querySelector(".marker-button").addEventListener("click", () => {
        openRequestDetails(marker.dataset.requestId);
      });
    });

    offerButton.addEventListener("click", () => {
      if (!activeRequestId) return;
      const result = markOffer(activeRequestId);
      if (result === "offered") {
        detailsDialog.close();
        mapMarkers.find(marker => marker.dataset.requestId === activeRequestId)
          ?.querySelector(".marker-button").focus();
      }
    });

    document.querySelector("#close-details").addEventListener("click", () => {
      detailsDialog.close();
    });

    detailsDialog.addEventListener("click", event => {
      if (event.target === detailsDialog) detailsDialog.close();
    });
