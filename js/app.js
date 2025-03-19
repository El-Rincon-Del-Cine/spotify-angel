if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('../sw.js')
            .then((registration) => {
                console.log('Service Worker registrado', registration.scope);

                // Solicita permiso para las notificaciones al cargar la página
                if (Notification.permission === "default") {
                    Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                            registration.active?.postMessage({ type: 'SHOW_NOTIFICATION' });
                        }
                    });
                } else if (Notification.permission === "granted") {
                    registration.active?.postMessage({ type: 'SHOW_NOTIFICATION' });
                }
            })
            .catch((error) => {
                console.log('Error al registrar el Service Worker:', error);
            });
    });
}

const API_KEY = "60a0e5bab7msh8cae9556ead86adp1f39a0jsn34cf68f6923e";
const API_HOST = "spotify23.p.rapidapi.com";

// Variable global para almacenar los resultados
let searchResults = {
    songs: [],
    albums: [],
    artists: []
};

// Función para realizar la búsqueda en Spotify
async function searchSpotify() {
    const query = document.getElementById("searchInput").value.trim();
    if (query === "") {
        alert("Por favor, ingresa un término de búsqueda.");
        return;
    }

    const url = `https://${API_HOST}/search/?q=${encodeURIComponent(query)}&type=multi&offset=0&limit=10&numberOfTopResults=5`;

    const options = {
        method: "GET",
        headers: {
            "x-rapidapi-key": API_KEY,
            "x-rapidapi-host": API_HOST
        }
    };

    try {
        const response = await fetch(url, options);
        const data = await response.json();

        // Verificar estructura de datos
        console.log("Datos recibidos:", data);

        // Guardar los resultados en la variable global
        searchResults.songs = data.tracks?.items || [];
        searchResults.albums = data.albums?.items || [];
        searchResults.artists = data.artists?.items || [];

        // Mostrar automáticamente la primera pestaña (canciones)
        showResults("songs");

    } catch (error) {
        console.error("Error en la búsqueda de Spotify:", error);
        document.getElementById("resultsContainer").innerHTML = "<p class='text-danger'>Error al obtener datos.</p>";
    }
}

// Función para mostrar los resultados según la pestaña seleccionada
function showResults(type) {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = ""; // Limpiar antes de agregar nuevos resultados

    let html = "";

    if (type === "songs") {
        html += "<h3>Resultados de Canciones</h3>";
        if (searchResults.songs.length === 0) {
            html += "<p>No se encontraron canciones.</p>";
        } else {
            html += '<div class="row">';
            searchResults.songs.forEach(song => {
                const track = song.data;
                html += `
                    <div class="col-md-4">
                        <div class="card mb-2">
                            <img src="${track.albumOfTrack.coverArt.sources[0].url}" alt="Album Cover" class="card-img-top">
                            <div class="card-body">
                                <h5 class="card-title">${track.name}</h5>
                                <p class="card-text">Artista: ${track.artists.items.map(artist => artist.profile.name).join(", ")}</p>
                                <a href="https://open.spotify.com/track/${track.id}" target="_blank" class="btn btn-sm btn-success">Escuchar</a>
                            </div>
                        </div>
                    </div>`;
            });
            html += '</div>';
        }
    } else if (type === "albums") {
        html += "<h3>Resultados de Álbumes</h3>";
        if (searchResults.albums.length === 0) {
            html += "<p>No se encontraron álbumes.</p>";
        } else {
            html += '<div class="row">';
            searchResults.albums.forEach(album => {
                const albumData = album.data;
                html += `
                    <div class="col-md-4">
                        <div class="card mb-2">
                            <img src="${albumData.coverArt.sources[0].url}" alt="Album Cover" class="card-img-top">
                            <div class="card-body">
                                <h5 class="card-title">${albumData.name}</h5>
                                <p class="card-text">Artista: ${albumData.artists.items.map(artist => artist.profile.name).join(", ")}</p>
                                <p class="card-text">Año: ${albumData.date.year}</p>
                                <a href="https://open.spotify.com/album/${albumData.id}" target="_blank" class="btn btn-sm btn-primary">Ver en Spotify</a>
                            </div>
                        </div>
                    </div>`;
            });
            html += '</div>';
        }
    } else if (type === "artists") {
        html += "<h3>Resultados de Artistas</h3>";
        if (searchResults.artists.length === 0) {
            html += "<p>No se encontraron artistas.</p>";
        } else {
            const artistData = searchResults.artists[0].data;
            const imgSrc = artistData.visuals?.avatarImage?.sources?.[0]?.url || "https://via.placeholder.com/50";

            html += `
                <div class="row">
                    <div class="col-md-4">
                        <div class="card mb-2">
                            <img src="${imgSrc}" alt="Artist Image" class="card-img-top">
                            <div class="card-body">
                                <h5 class="card-title">${artistData.profile.name}</h5>
                                <a href="https://open.spotify.com/artist/${artistData.uri.split(':')[2]}" target="_blank" class="btn btn-sm btn-info">Ver en Spotify</a>
                            </div>
                        </div>
                    </div>
                </div>`;
        }
    }

    resultsContainer.innerHTML = html;
}
