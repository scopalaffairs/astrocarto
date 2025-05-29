document.addEventListener("DOMContentLoaded", () => {
  // Panel management
  const panels = ["formPanel", "usersPanel", "legendPanel"];
  const burgers = ["formBurger", "usersBurger", "legendBurger"];

  function closeAllPanels() {
    panels.forEach((panelId) => {
      document.getElementById(panelId).classList.remove("open");
    });
    burgers.forEach((burgerId) => {
      document.getElementById(burgerId).classList.remove("active");
    });
  }

  function togglePanel(panelId, burgerId) {
    const panel = document.getElementById(panelId);
    const burger = document.getElementById(burgerId);

    if (panel.classList.contains("open")) {
      closeAllPanels();
    } else {
      closeAllPanels();
      panel.classList.add("open");
      burger.classList.add("active");
    }
  }

  // Burger button event listeners
  document.getElementById("formBurger").addEventListener("click", () => {
    togglePanel("formPanel", "formBurger");
  });

  document.getElementById("usersBurger").addEventListener("click", () => {
    togglePanel("usersPanel", "usersBurger");
  });

  document.getElementById("legendBurger").addEventListener("click", () => {
    togglePanel("legendPanel", "legendBurger");
  });

  // Close panels when clicking on map
  document.getElementById("map").addEventListener("click", (e) => {
    // Only close if clicking directly on map, not on map controls
    if (e.target.id === "map") {
      closeAllPanels();
    }
  });

  // Your existing astrocartography code starts here
  const userListContainer = document.getElementById("userList");

  // Use in-memory storage instead of localStorage for Claude.ai compatibility
  let userSubmissions = [];

  // Global object to store planet lines (for filtering via legend).
  const planetLines = {};
  // Predefined planet information: color and interpretative influence.
  const planetInfo = {
    sun: {
      color: "#FDB813",
      influence: "Vitality, leadership, self-expression",
    },
    moon: { color: "#A0C1D1", influence: "Emotions, intuition, habits" },
    mercury: {
      color: "#8c8c94",
      influence: "Communication, learning, reasoning",
    },
    venus: { color: "#FF69B4", influence: "Love, beauty, harmony" },
    mars: { color: "#FF4500", influence: "Energy, drive, passion" },
    jupiter: { color: "#8FBC8F", influence: "Expansion, luck, wisdom" },
    saturn: {
      color: "#708090",
      influence: "Discipline, structure, responsibility",
    },
    uranus: { color: "#7FFFD4", influence: "Innovation, change, originality" },
    neptune: { color: "#4169E1", influence: "Spirituality, dreams, mysticism" },
  };

  // Initialize an array for each planet.
  for (const planet in planetInfo) {
    planetLines[planet] = [];
  }

  // Initialize the map.
  const map = L.map("map").setView([0, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);

  // Global array to store submission layers.
  window.submissionLayers = [];

  // Create legend content
  function createLegendContent() {
    const legendContainer = document.getElementById("legendContent");
    let legendHtml = `<div class="legend-buttons">
                    <button id="selectAll">Select All</button>
                    <button id="selectNone">Select None</button>
                </div>`;

    for (const planet in planetInfo) {
      const info = planetInfo[planet];
      legendHtml += `<label>
                        <input type="checkbox" checked data-planet="${planet}" /> 
                        <span style="color:${info.color};">
                            ${planet.charAt(0).toUpperCase() + planet.slice(1)}
                        </span>
                        - ${info.influence}
                    </label>`;
    }

    legendContainer.innerHTML = legendHtml;

    // Attach event listeners to legend checkboxes and select all/none buttons.
    const checkboxes = legendContainer.querySelectorAll(
      'input[type="checkbox"]'
    );
    checkboxes.forEach((chk) => {
      chk.addEventListener("change", (e) => {
        const planet = e.target.getAttribute("data-planet");
        const checked = e.target.checked;
        planetLines[planet].forEach((polyline) => {
          polyline.setStyle({ opacity: checked ? 1 : 0 });
        });
      });
    });

    const selectAllBtn = document.getElementById("selectAll");
    const selectNoneBtn = document.getElementById("selectNone");

    if (selectAllBtn) {
      selectAllBtn.addEventListener("click", () => {
        checkboxes.forEach((chk) => {
          chk.checked = true;
          const planet = chk.getAttribute("data-planet");
          planetLines[planet].forEach((polyline) => {
            polyline.setStyle({ opacity: 1 });
          });
        });
      });
    }

    if (selectNoneBtn) {
      selectNoneBtn.addEventListener("click", () => {
        checkboxes.forEach((chk) => {
          chk.checked = false;
          const planet = chk.getAttribute("data-planet");
          planetLines[planet].forEach((polyline) => {
            polyline.setStyle({ opacity: 0 });
          });
        });
      });
    }
  }

  // Initialize legend
  createLegendContent();

  // --- Smoothing Function (Catmull-Rom spline interpolation) ---
  function catmullRomSpline(points, numSegments) {
    let result = [];
    if (points.length < 2) return points;
    for (let i = 0; i < points.length - 1; i++) {
      let p0 = i === 0 ? points[i] : points[i - 1];
      let p1 = points[i];
      let p2 = points[i + 1];
      let p3 = i + 2 < points.length ? points[i + 2] : points[i + 1];

      for (let j = 0; j < numSegments; j++) {
        let t = j / numSegments;
        let t2 = t * t;
        let t3 = t2 * t;
        let lat =
          0.5 *
          (2 * p1[0] +
            (-p0[0] + p2[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
        let lon =
          0.5 *
          (2 * p1[1] +
            (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
        result.push([lat, lon]);
      }
    }
    result.push(points[points.length - 1]);
    return result;
  }

  const form = document.getElementById("form");
  const errorDiv = document.getElementById("error");

  // Helper function: add a user entry to the UI.
  function addUserEntryToUI(entry) {
    const userEntry = document.createElement("div");
    userEntry.className = "user-entry";
    userEntry.innerHTML = `<strong>${entry.userName}</strong><br>
                    ${entry.datetime}<br>
                    ${entry.birth_lat}, ${entry.birth_lon}<br>
                    ${entry.birth_place || "no city"}
                    <div style="margin-top: 5px;">
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </div>`;
    userListContainer.appendChild(userEntry);

    userEntry.querySelector(".delete-btn").addEventListener("click", () => {
      userEntry.remove();
      userSubmissions = userSubmissions.filter((e) => e.id !== entry.id);
    });

    userEntry.querySelector(".edit-btn").addEventListener("click", () => {
      document.getElementById("name").value = entry.userName;
      document.getElementById("datetime").value = entry.datetime;
      document.getElementById("birth_lat").value = entry.birth_lat;
      document.getElementById("birth_lon").value = entry.birth_lon;
      document.getElementById("birth_place").value = entry.birth_place || "";
      togglePanel("formPanel", "formBurger");
    });
  }

  // Define a function to process a submission (either new or from memory).
  function loadSubmission(submissionData) {
    // Mock API response for demonstration - replace with your actual API call
    // This simulates the astro computation API
    setTimeout(() => {
      console.log("Loading submission payload:", submissionData);

      // Mock data - replace this with actual API call
      const mockData = {};
      const planets = [
        "sun",
        "moon",
        "mercury",
        "venus",
        "mars",
        "jupiter",
        "saturn",
        "uranus",
        "neptune",
      ];

      planets.forEach((planet) => {
        // Generate mock rising line data
        const mockRisingLine = [];
        for (let i = 0; i < 50; i++) {
          mockRisingLine.push({
            lat: Math.random() * 180 - 90,
            lon: Math.random() * 360 - 180,
          });
        }
        mockData[planet] = { rising_line: mockRisingLine };
      });

      const submissionLayer = L.featureGroup();
      for (const planet in mockData) {
        if (mockData.hasOwnProperty(planet)) {
          const planetData = mockData[planet];
          const rawCoords = planetData.rising_line.map((point) => [
            point.lat,
            point.lon,
          ]);
          const smoothedCoords = catmullRomSpline(rawCoords, 5);
          const polyline = L.polyline(smoothedCoords, {
            color: planetInfo[planet].color,
            weight: 2,
            smoothFactor: 0.1,
            opacity: 1,
          }).bindTooltip(
            `${submissionData.userName}: ${
              planet.charAt(0).toUpperCase() + planet.slice(1)
            } — ${planetInfo[planet].influence}`,
            { permanent: false, sticky: true, direction: "top" }
          );
          polyline.options.planet = planet;
          polyline.on("click", function () {
            const clickedId = polyline._leaflet_id;
            map.eachLayer(function (layer) {
              if (layer instanceof L.Polyline) {
                layer.setStyle({
                  opacity: layer._leaflet_id === clickedId ? 1 : 0.2,
                });
              }
            });
          });
          submissionLayer.addLayer(polyline);
          planetLines[planet].push(polyline);
        }
      }
      submissionLayer.addTo(map);
      window.submissionLayers.push(submissionLayer);
    }, 500);
  }

  // On form submission:
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorDiv.textContent = "";

    const userName = document.getElementById("name").value;
    const datetime = document.getElementById("datetime").value;
    let birth_lat = document.getElementById("birth_lat").value;
    let birth_lon = document.getElementById("birth_lon").value;
    const birth_place = document.getElementById("birth_place").value.trim();

    if (
      !userName ||
      !datetime ||
      (!birth_lat && !birth_place) ||
      (!birth_lon && !birth_place)
    ) {
      errorDiv.textContent =
        "Please fill out all required fields (or provide a valid city name).";
      return;
    }

    // Function to proceed with submission processing.
    function proceedSubmission(coords) {
      if (coords) {
        birth_lat = coords.lat;
        birth_lon = coords.lon;
        document.getElementById("birth_lat").value = birth_lat;
        document.getElementById("birth_lon").value = birth_lon;
      }
      const submissionId = Date.now();
      const submissionData = {
        id: submissionId,
        userName,
        datetime,
        birth_lat,
        birth_lon,
        birth_place,
      };

      userSubmissions.push(submissionData);
      addUserEntryToUI(submissionData);
      loadSubmission(submissionData);

      // Close form panel and show users panel
      closeAllPanels();
      setTimeout(() => {
        togglePanel("usersPanel", "usersBurger");
      }, 300);
    }

    // If a city name is provided, fetch its coordinates via Nominatim.
    if (birth_place !== "") {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        birth_place
      )}`;
      fetch(url)
        .then((response) => response.json())
        .then((results) => {
          if (results && results.length > 0) {
            const result = results[0];
            const coords = { lat: result.lat, lon: result.lon };
            proceedSubmission(coords);
          } else {
            errorDiv.textContent = "City not found. Please check your input.";
          }
        })
        .catch((error) => {
          console.error("Geocoding error:", error);
          errorDiv.textContent = "Error fetching city data.";
        });
    } else {
      proceedSubmission();
    }
  });
});
