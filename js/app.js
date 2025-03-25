const API_KEY = "60a0e5bab7msh8cae9556ead86adp1f39a0jsn34cf68f6923e";
const API_HOST = "spotify23.p.rapidapi.com";

// Variable global para almacenar los resultados de la búsqueda
let searchResults = {
    songs: [],
    albums: [],
    artists: []
};

// Función para obtener URL de imagen optimizada
function getOptimizedImageUrl(url, width = 150) {
    if (!url) return `https://via.placeholder.com/${width}`;
    if (url.includes('via.placeholder.com')) return url.replace(/\d+$/, width);
    // Intenta reducir el tamaño para imágenes de Spotify (puede no funcionar en todos los casos)
    try {
        const urlObj = new URL(url);
        if (urlObj.host.includes('spotify')) {
            return url.replace(/(\/[a-zA-Z0-9]+)$/, `/${width}x${width}$1`);
        }
    } catch (e) {
        console.warn("Error al procesar URL de imagen:", e);
    }
    return url;
}

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
        console.log("Datos recibidos:", data);

        // Guardar los resultados en la variable global
        searchResults.songs = data.tracks?.items || [];
        searchResults.albums = data.albums?.items || [];
        searchResults.artists = data.artists?.items || [];

        // Mostrar automáticamente la primera pestaña con resultados
        if (searchResults.songs.length > 0) {
            showResults("songs");
        } else if (searchResults.albums.length > 0) {
            showResults("albums");
        } else if (searchResults.artists.length > 0) {
            showResults("artists");
        } else {
            document.getElementById("resultsContainer").innerHTML = "<p>No se encontraron resultados.</p>";
        }
    } catch (error) {
        console.error("Error en la búsqueda de Spotify:", error);
        document.getElementById("resultsContainer").innerHTML = "<p class='text-danger'>Error al obtener datos.</p>";
    }
}

// Función para mostrar los resultados según la pestaña seleccionada
function showResults(type) {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "";

    let html = "";

    if (type === "songs") {
        html += "<h3>Resultados de Canciones</h3>";
        if (searchResults.songs.length === 0) {
            html += "<p>No se encontraron canciones.</p>";
        } else {
            html += '<div class="row">';
            searchResults.songs.forEach(song => {
                const track = song.data;
                const coverArtUrl = getOptimizedImageUrl(track.albumOfTrack?.coverArt?.sources?.[0]?.url);
                const artistNames = track.artists?.items?.map(artist => artist.profile?.name).join(", ") || "Artista desconocido";
                const spotifyUrl = `https://open.spotify.com/track/${track.id}`;

                html += `
                    <div class="col-md-4 mb-3">
                        <div class="card h-100">
                            <img src="${coverArtUrl}" alt="Album Cover" class="card-img-top">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${track.name || "Canción desconocida"}</h5>
                                <p class="card-text">Artista: ${artistNames}</p>
                                <div class="mt-auto">
                                    <a href="${spotifyUrl}" target="_blank" class="btn btn-sm btn-primary me-2">Ver en Spotify</a>
                                    <button onclick="playSong('${track.id}')" class="btn btn-sm btn-success">Escuchar</button>
                                </div>
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
                const coverArtUrl = getOptimizedImageUrl(albumData.coverArt?.sources?.[0]?.url, 200);
                const artistNames = albumData.artists?.items?.map(artist => artist.profile?.name).join(", ") || "Artista desconocido";
                const albumId = albumData.id;

                html += `
                    <div class="col-md-4 mb-3">
                        <div class="card h-100">
                            <img src="${coverArtUrl}" alt="Album Cover" class="card-img-top">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${albumData.name || "Álbum desconocido"}</h5>
                                <p class="card-text">Artista: ${artistNames}</p>
                                <p class="card-text">Año: ${albumData.date?.year || "Desconocido"}</p>
                                <div class="mt-auto">
                                    <button onclick="showAlbumTracks('${albumId}', this)" 
                                            class="btn btn-sm btn-primary w-100">
                                        Mostrar canciones
                                    </button>
                                </div>
                            </div>
                            <div id="tracks-${albumId}" class="album-tracks-container" style="display:none;"></div>
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
            html += '<div class="row">';
            searchResults.artists.forEach(artist => {
                const artistData = artist.data;
                const imgSrc = getOptimizedImageUrl(artistData.visuals?.avatarImage?.sources?.[0]?.url, 200);
                const artistName = artistData.profile?.name || "Artista desconocido";

                html += `
                    <div class="col-md-4 mb-3">
                        <div class="card h-100">
                            <img src="${imgSrc}" alt="Artist Image" class="card-img-top">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${artistName}</h5>
                                <div class="mt-auto">
                                    <button onclick="showArtistTopTracks('${artistData.uri.split(':')[2]}')" 
                                            class="btn btn-sm btn-info w-100">
                                        Ver Canciones Populares
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
            html += '</div>';
        }
    }

    resultsContainer.innerHTML = html;
}

// Función para mostrar las canciones de un álbum
async function showAlbumTracks(albumId, buttonElement) {
    const tracksContainer = document.getElementById(`tracks-${albumId}`);
    
    if (tracksContainer.style.display === "block") {
        tracksContainer.style.display = "none";
        tracksContainer.innerHTML = "";
        buttonElement.textContent = "Mostrar canciones";
        return;
    }

    tracksContainer.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-primary" role="status"></div></div>';
    tracksContainer.style.display = "block";
    buttonElement.textContent = "Cargando...";

    const url = `https://${API_HOST}/album_tracks/?id=${albumId}&offset=0&limit=50`;
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
        console.log("Pistas del álbum:", data);

        let tracksHtml = '<div class="list-group list-group-flush">';
        
        if (data.data?.album?.tracks?.items) {
            data.data.album.tracks.items.forEach((item, index) => {
                const track = item.track;
                const durationMs = track.duration?.totalMilliseconds || 0;
                const duration = new Date(durationMs).toISOString().substr(14, 5);
                const trackId = track.uri?.split(':')[2] || '';
                
                tracksHtml += `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge bg-secondary me-2">${index + 1}</span>
                                ${track.name || "Pista desconocida"}
                                <small class="text-muted ms-2">${duration}</small>
                            </div>
                            ${trackId ? `<button onclick="playSong('${trackId}')" 
                                    class="btn btn-sm btn-outline-success">
                                Escuchar
                            </button>` : ''}
                        </div>
                    </div>`;
            });
        } else {
            tracksHtml += '<div class="list-group-item text-muted">No se encontraron pistas en este álbum.</div>';
        }
        
        tracksHtml += '</div>';
        tracksContainer.innerHTML = tracksHtml;
        buttonElement.textContent = "Ocultar canciones";
    } catch (error) {
        console.error("Error al obtener las pistas del álbum:", error);
        tracksContainer.innerHTML = `
            <div class="alert alert-danger m-2">
                Error al cargar las pistas: ${error.message}
            </div>`;
        buttonElement.textContent = "Intentar de nuevo";
    }
}

// Función para obtener y mostrar las canciones populares de un artista
async function showArtistTopTracks(artistId) {
    const url = `https://${API_HOST}/artist_singles/?id=${artistId}&offset=0&limit=20`;
    const options = {
        method: "GET",
        headers: {
            "x-rapidapi-key": API_KEY,
            "x-rapidapi-host": API_HOST
        }
    };

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        console.log("Datos de singles:", result);

        const resultsContainer = document.getElementById("resultsContainer");
        let html = '<div class="d-flex justify-content-between align-items-center mb-3">';
        html += '<h3 class="mb-0">Canciones Populares</h3>';
        html += '<button onclick="showResults(\'artists\')" class="btn btn-sm btn-outline-secondary">Volver a artistas</button>';
        html += '</div>';
        
        if (result.data?.artist?.discography?.singles?.items) {
            const singles = result.data.artist.discography.singles.items;
            html += '<div class="row">';
            singles.forEach(single => {
                const singleData = single.releases.items[0];
                const coverArtUrl = getOptimizedImageUrl(singleData.coverArt?.sources?.[0]?.url);
                const artistNames = singleData.artists?.items?.map(artist => artist.profile?.name).join(", ") || "Artista desconocido";

                html += `
                    <div class="col-md-4 mb-3">
                        <div class="card h-100">
                            <img src="${coverArtUrl}" alt="Single Cover" class="card-img-top">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${singleData.name || "Canción desconocida"}</h5>
                                <p class="card-text">Artista: ${artistNames}</p>
                                <div class="mt-auto">
                                    <button onclick="playSong('${singleData.id}')" 
                                            class="btn btn-sm btn-success w-100">
                                        Escuchar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
            html += '</div>';
        } else {
            html += "<p>No se encontraron singles para este artista.</p>";
        }
        resultsContainer.innerHTML = html;
    } catch (error) {
        console.error("Error al obtener los singles del artista:", error);
        resultsContainer.innerHTML = "<p class='text-danger'>Error al obtener los singles del artista.</p>";
    }
}

// Función para simular la reproducción de una canción
function playSong(trackId) {
    alert(`Reproduciendo canción con ID: ${trackId}`);
}

// Añadir estilos CSS para mejorar la visualización
const style = document.createElement('style');
style.textContent = `
    .card-img-top {
        width: 100%;
        height: 150px;
        object-fit: cover;
    }
    .album-tracks-container {
        max-height: 300px;
        overflow-y: auto;
    }
    .card {
        transition: transform 0.2s;
    }
    .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .list-group-item {
        border-left: 0;
        border-right: 0;
    }
    #resultsContainer {
        min-height: 300px;
    }
`;
document.head.appendChild(style);
