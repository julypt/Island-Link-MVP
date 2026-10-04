const requests = {
      "ride-1": {
        type: "Passenger request",
        pickup: "Mahayahay",
        destination: "Cuarinta",
        details: "3 passengers",
        distance: "Approx. 2.4 km"
      },
      "ride-2": {
        type: "Passenger request",
        pickup: "Poblacion",
        destination: "Mahayahay",
        details: "2 passengers",
        distance: "Approx. 4.8 km"
      },
      "delivery-1": {
        type: "Delivery request",
        pickup: "Cuarinta",
        destination: "Poblacion",
        details: "Package pickup and drop-off",
        distance: "Approx. 5.2 km"
      },
      "delivery-2": {
        type: "Delivery request",
        pickup: "Mahayahay",
        destination: "Other barangay A (placeholder)",
        details: "Package pickup and drop-off",
        distance: "Approx. 7.1 km"
      },
      "custom-1": {
        type: "Custom rider request",
        pickup: "Poblacion",
        destination: "Cuarinta",
        details: "Specific rider task",
        distance: "Approx. 3.6 km"
      }
    };

    const filterToggle = document.querySelector("#filter-toggle");
    const filterPanel = document.querySelector("#filter-panel");
    const mapMarkers = [...document.querySelectorAll(".request-marker")];
    const mapEmpty = document.querySelector("#map-empty");
    const resultsCount = document.querySelector("#results-count");
    const detailsDialog = document.querySelector("#request-details");
    const detailTitle = document.querySelector("#detail-title");
    const detailFields = document.querySelector("#detail-fields");

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

      let visibleCount = 0;
      mapMarkers.forEach(marker => {
        const matchesDistance = Number(marker.dataset.distance) <= maxDistance;
        const matchesDestination = selectedDestinations.size === 0 || selectedDestinations.has(marker.dataset.destination);
        marker.hidden = !(matchesDistance && matchesDestination);
        if (!marker.hidden) visibleCount += 1;
      });

      mapEmpty.hidden = visibleCount > 0;
      resultsCount.textContent = `${visibleCount} mock ${visibleCount === 1 ? "request" : "requests"} shown`;
      filterPanel.hidden = true;
      filterToggle.setAttribute("aria-expanded", "false");
      filterToggle.focus();
    });

    document.querySelector("#clear-filters").addEventListener("click", () => {
      filterPanel.reset();
      filterPanel.querySelector('input[name="distance"][value="10"]').checked = true;
      mapMarkers.forEach(marker => {
        marker.hidden = false;
      });
      mapEmpty.hidden = true;
      resultsCount.textContent = `${mapMarkers.length} mock requests shown`;
    });

    mapMarkers.forEach(marker => {
      marker.querySelector(".marker-button").addEventListener("click", () => {
        const request = requests[marker.dataset.requestId];
        detailTitle.textContent = request.type;
        detailFields.replaceChildren();
        [
          ["Pickup", request.pickup],
          ["Drop-off / destination", request.destination],
          ["Request details", request.details],
          ["Distance from you", request.distance]
        ].forEach(([label, value]) => {
          const row = document.createElement("div");
          const term = document.createElement("dt");
          const description = document.createElement("dd");
          term.textContent = label;
          description.textContent = value;
          row.append(term, description);
          detailFields.append(row);
        });
        detailsDialog.showModal();
      });
    });

    document.querySelector("#close-details").addEventListener("click", () => {
      detailsDialog.close();
    });

    detailsDialog.addEventListener("click", event => {
      if (event.target === detailsDialog) detailsDialog.close();
    });
