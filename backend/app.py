# backend/app.py

import astropy.units as u
import numpy as np
from astro_utils import compute_local_sidereal_time, solve_for_horizon_lat
from astropy.coordinates import EarthLocation, get_body
from astropy.time import Time
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/")
def index():
    return "Astrocartography API is running."


@app.route("/api/compute_rising_lines", methods=["POST"])
def compute_rising_lines():
    """
    Expects a JSON payload with:
      - datetime: ISO 8601 string (e.g., "2025-02-09T12:00:00")
      - birth_lat: Birth latitude in decimal degrees
      - birth_lon: Birth longitude in decimal degrees
      - (optionally) planets: Array of planet names to track.

    Defaults to computing rising lines for all the standard planets except Pluto.
    For each planet, we compute the RA/Dec using Astropy's get_body,
    then iterate over longitudes (-180° to +180°) and, using a finer grid,
    solve for the latitude where the planet is on the horizon.
    """
    data = request.get_json()
    dt_str = data.get("datetime")
    birth_lat = float(data.get("birth_lat"))
    birth_lon = float(data.get("birth_lon"))

    # Use provided planet list or default to the standard set (skipping Pluto)
    planets = data.get("planets")
    if not planets:
        planets = [
            "sun",
            "moon",
            "mercury",
            "venus",
            "mars",
            "jupiter",
            "saturn",
            "uranus",
            "neptune",
        ]
    # Exclude any entries for Pluto, just in case
    planets = [p for p in planets if p.lower() != "pluto"]

    time = Time(dt_str)
    location = EarthLocation(lat=birth_lat * u.deg, lon=birth_lon * u.deg)

    result = {}
    for planet in planets:
        try:
            planet_coord = get_body(planet, time, location)
        except Exception as e:
            # If an error occurs (e.g. Pluto) then skip this planet.
            continue
        planet_ra = planet_coord.ra.deg
        planet_dec = planet_coord.dec.deg

        rising_points = []
        # Use a finer grid (361 points) for smoother curves
        for lon in np.linspace(-180, 180, num=361):
            lst = compute_local_sidereal_time(time, lon)
            # Calculate the Hour Angle (in degrees)
            ha = (lst - (planet_ra / 15)) * 15
            lat = solve_for_horizon_lat(planet_dec, ha)
            rising_points.append({"lat": lat, "lon": lon})
        result[planet] = {
            "rising_line": rising_points,
            "planet_ra": planet_ra,
            "planet_dec": planet_dec,
        }

    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
