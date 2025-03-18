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

        // Llenar los resultados en cada pestaña
        displaySongs(data.tracks?.items || []);
        displayAlbums(data.albums?.items || []);
        displayArtists(data.artists?.items || []);

    } catch (error) {
        console.error("Error en la búsqueda de Spotify:", error);
        document.getElementById("songs").innerHTML = "<p class='text-danger'>Error al obtener datos.</p>";
        document.getElementById("albums").innerHTML = "<p class='text-danger'>Error al obtener datos.</p>";
        document.getElementById("artists").innerHTML = "<p class='text-danger'>Error al obtener datos.</p>";
    }
}

// Función para mostrar las canciones en el HTML
function displaySongs(songs) {
    let html = "<h3>Resultados de Canciones</h3>";

    if (songs.length === 0) {
        html += "<p>No se encontraron canciones.</p>";
    } else {
        songs.forEach(song => {
            const track = song.data;
            html += `
                <div class="card mb-2">
                    <div class="card-body d-flex align-items-center">
                        <img src="${track.albumOfTrack.coverArt.sources[0].url}" alt="Album Cover" class="me-3" width="50">
                        <div>
                            <h5>${track.name}</h5>
                            <p>Artista: ${track.artists.items.map(artist => artist.profile.name).join(", ")}</p>
                            <a href="https://open.spotify.com/track/${track.id}" target="_blank" class="btn btn-sm btn-success">Escuchar</a>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    document.getElementById("songs").innerHTML = html;
}

// Función para mostrar los álbumes en el HTML
function displayAlbums(albums) {
    let html = "<h3>Resultados de Álbumes</h3>";

    if (albums.length === 0) {
        html += "<p>No se encontraron álbumes.</p>";
    } else {
        albums.forEach(album => {
            const albumData = album.data;
            html += `
                <div class="card mb-2">
                    <div class="card-body d-flex align-items-center">
                        <img src="${albumData.coverArt.sources[0].url}" alt="Album Cover" class="me-3" width="50">
                        <div>
                            <h5>${albumData.name}</h5>
                            <p>Artista: ${albumData.artists.items.map(artist => artist.profile.name).join(", ")}</p>
                            <p>Año: ${albumData.date.year}</p>
                            <a href="https://open.spotify.com/album/${albumData.id}" target="_blank" class="btn btn-sm btn-primary">Ver en Spotify</a>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    document.getElementById("albums").innerHTML = html;
}

// Función para mostrar los artistas en el HTML
function displayArtists(artists) {
    let html = "<h3>Resultados de Artistas</h3>";

    if (artists.length === 0) {
        html += "<p>No se encontraron artistas.</p>";
    } else {
        artists.forEach(artist => {
            const artistData = artist.data;
            const imgSrc = artistData.visuals.avatarImage?.sources[0].url || "https://via.placeholder.com/50";
            
            html += `
                <div class="card mb-2">
                    <div class="card-body d-flex align-items-center">
                        <img src="${imgSrc}" alt="Artist Image" class="me-3" width="50">
                        <div>
                            <h5>${artistData.profile.name}</h5>
                            <a href="https://open.spotify.com/artist/${artistData.uri.split(':')[2]}" target="_blank" class="btn btn-sm btn-info">Ver en Spotify</a>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    document.getElementById("artists").innerHTML = html;
}