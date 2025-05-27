# AstroCarto

A minimal astrocartography web app built with Flask and Leaflet.js.  
Input your birth data, view projected planetary lines on a map.  
No sign-up, no storage, no interpretation.

## What it does

- Takes birth time, date, and location as input  
- Calculates planetary lines (ASC, MC, DSC, IC)  
- Displays them on an interactive map using Leaflet  
- Allows simple exploration of locations in relation to astrological geometry
- Supports multiple inputs for comparing charts in group or family contexts

## Features

- Flask backend  
- Leaflet.js frontend  
- Minimal JavaScript  
- No external APIs beyond map tiles  
- Runs locally or can be hosted as a standalone microservice

## How to run

1. Clone the repo:
    ```bash
    git clone https://github.com/scopalaffairs/astrocarto.git
    cd astrocarto
    ```

2. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3. Run the app:
    ```bash
    flask run
    ```

4. Open in browser:
    ```
    http://127.0.0.1:5000
    ```

## Notes

- Designed for clarity  
- No data is stored or sent anywhere  
- Suitable as a base for further exploration or modification

## License

BSD 2-Clause License
