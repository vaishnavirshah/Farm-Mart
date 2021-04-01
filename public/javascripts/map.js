mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10', // stylesheet location
    center: [72.8561,19.0222], // starting position [lng, lat]
    zoom: 13 // starting zoom
});

new mapboxgl.Marker()
    .setLngLat([72.8561,19.0222])
    .setPopup(
        new mapboxgl.Popup({ offset: 25 })
            .setHTML(
                `<p>VJTI,Matunga,Mumbai</p>`
            )
    )
    .addTo(map)

