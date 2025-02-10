# backend/astro_utils.py

import astropy.units as u
import numpy as np
from astropy.coordinates import AltAz, EarthLocation, SkyCoord
from astropy.time import Time
from scipy.optimize import brentq


def compute_local_sidereal_time(time, longitude):
    """
    Compute the Local Sidereal Time (LST) in hours.
    time: an astropy Time object.
    longitude: in degrees (positive east).
    """
    lst = time.sidereal_time("mean", longitude * u.deg)
    return lst.hour


def ra_dec_to_altaz(time, lat, lon, ra, dec):
    """
    Convert equatorial coordinates (RA, Dec) to horizontal coordinates (altitude, azimuth)
    for a given observer position (lat, lon) and time.
    """
    location = EarthLocation(lat=lat * u.deg, lon=lon * u.deg)
    sky_coord = SkyCoord(ra=ra * u.deg, dec=dec * u.deg)
    altaz = sky_coord.transform_to(AltAz(obstime=time, location=location))
    return altaz.alt.degree, altaz.az.degree


def horizon_condition(phi, dec, ha):
    return np.sin(np.deg2rad(phi)) * np.sin(np.deg2rad(dec)) + np.cos(
        np.deg2rad(phi)
    ) * np.cos(np.deg2rad(dec)) * np.cos(np.deg2rad(ha))


def solve_for_horizon_lat(planet_dec, hour_angle):
    try:
        phi = brentq(horizon_condition, -90, 90, args=(planet_dec, hour_angle))
    except ValueError:
        phi = np.nan
    return phi
