document.addEventListener("DOMContentLoaded", () => {
  const map = L.map("map").setView([0, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);

  window.submissionLayers = [];

  const planetInfo = {
    sun: {
      color: "#FDB813",
      influence: "Vitality, leadership, self-expression",
    },
    moon: { color: "#A0C1D1", influence: "Emotions, intuition, habits" },
    mercury: {
      color: "#CCCCCC",
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

  const legend = L.control({ position: "bottomright" });
  legend.onAdd = function (map) {
    const div = L.DomUtil.create("div", "info legend");
    div.style.background = "rgba(255,255,255,0.8)";
    div.style.padding = "10px";
    div.style.borderRadius = "5px";
    div.innerHTML += "<h4>Planet Influences</h4>";
    for (const planet in planetInfo) {
      const info = planetInfo[planet];
      div.innerHTML += `<i style="background:${info.color};"></i> ${
        planet.charAt(0).toUpperCase() + planet.slice(1)
      }: ${info.influence}<br>`;
    }
    return div;
  };
  legend.addTo(map);

  const form = document.getElementById("form");
  const errorDiv = document.getElementById("error");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorDiv.textContent = "";

    const datetime = document.getElementById("datetime").value;
    const birth_lat = document.getElementById("birth_lat").value;
    const birth_lon = document.getElementById("birth_lon").value;

    if (!datetime || !birth_lat || !birth_lon) {
      errorDiv.textContent = "Please fill out all required fields.";
      return;
    }

    const payload = {
      datetime: datetime,
      birth_lat: birth_lat,
      birth_lon: birth_lon,
      planets: [
        "sun",
        "moon",
        "mercury",
        "venus",
        "mars",
        "jupiter",
        "saturn",
        "uranus",
        "neptune",
      ],
    };

    console.log("Sending payload:", payload);

    fetch("http://127.0.0.1:5000/api/compute_rising_lines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network error: " + response.statusText);
        }
        return response.json();
      })
      .then((data) => {
        console.log("API response:", data);
        const submissionLayer = L.layerGroup();
        for (const planet in data) {
          if (data.hasOwnProperty(planet)) {
            const planetData = data[planet];
            const coords = planetData.rising_line.map((point) => [
              point.lat,
              point.lon,
            ]);
            const polyline = L.polyline(coords, {
              color: planetInfo[planet].color,
              weight: 1,
              smoothFactor: 0.3,
            }).bindTooltip(
              `${planet.charAt(0).toUpperCase() + planet.slice(1)}: ${
                planetInfo[planet].influence
              }`,
              { permanent: false, direction: "top" }
            );
            submissionLayer.addLayer(polyline);
          }
        }
        submissionLayer.addTo(map);
        window.submissionLayers.push(submissionLayer);
        map.fitBounds(submissionLayer.getBounds());
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        errorDiv.textContent = "Error: " + error.message;
      });
  });
});
