const API_KEY = "60a0e5bab7msh8cae9556ead86adp1f39a0jsn34cf68f6923e";
const API_HOST = "spotify23.p.rapidapi.com";

let searchResults = {
    songs: [],
    albums: [],
    artists: []
};

// Función para obtener URL de imagen optimizada
function getOptimizedImageUrl(url, width = 150) {
    if (!url) return `https://via.placeholder.com/${width}`;
    if (url.includes('via.placeholder.com')) return url.replace(/\d+$/, width);
    return url;
}

// Función para formatear la duración
function formatDuration(ms) {
    if (!ms) return "0:00";
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Función principal de búsqueda
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
        
        searchResults.songs = data.tracks?.items || [];
        searchResults.albums = data.albums?.items || [];
        searchResults.artists = data.artists?.items || [];

        if (searchResults.songs.length > 0) showResults("songs");
        else if (searchResults.albums.length > 0) showResults("albums");
        else if (searchResults.artists.length > 0) showResults("artists");
        else document.getElementById("resultsContainer").innerHTML = "<p>No se encontraron resultados.</p>";
    } catch (error) {
        console.error("Error en la búsqueda:", error);
        document.getElementById("resultsContainer").innerHTML = "<p class='text-danger'>Error al obtener datos.</p>";
    }
}

// Función para mostrar resultados
function showResults(type) {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "";

    let html = "";

    if (type === "songs") {
        html += "<h3 class='mb-4'>Resultados de Canciones</h3>";
        if (searchResults.songs.length === 0) {
            html += "<p>No se encontraron canciones.</p>";
        } else {
            html += '<div class="row row-cols-1 row-cols-md-3 g-4">';
            searchResults.songs.forEach(song => {
                const track = song.data;
                const coverArtUrl = getOptimizedImageUrl(track.albumOfTrack?.coverArt?.sources?.[0]?.url);
                const artistNames = track.artists?.items?.map(artist => artist.profile?.name).join(", ") || "Artista desconocido";
                const spotifyUrl = `https://open.spotify.com/track/${track.id}`;

                html += `
                    <div class="col">
                        <div class="card h-100">
                            <img src="${coverArtUrl}" alt="Album Cover" class="card-img-top">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${track.name || "Canción desconocida"}</h5>
                                <p class="card-text">Artista: ${artistNames}</p>
                                <div class="mt-auto d-flex gap-2">
                                    <a href="${spotifyUrl}" target="_blank" class="btn btn-sm btn-outline-primary">Ver en Spotify</a>
                                    <button onclick="playSong('${track.id}')" class="btn btn-sm btn-success">Escuchar</button>
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
            html += '</div>';
        }
    } else if (type === "albums") {
        html += "<h3 class='mb-4'>Resultados de Álbumes</h3>";
        if (searchResults.albums.length === 0) {
            html += "<p>No se encontraron álbumes.</p>";
        } else {
            html += '<div class="row row-cols-1 row-cols-md-3 g-4">';
            searchResults.albums.forEach(album => {
                const albumData = album.data;
                const coverArtUrl = getOptimizedImageUrl(albumData.coverArt?.sources?.[0]?.url, 200);
                const artistNames = albumData.artists?.items?.map(artist => artist.profile?.name).join(", ") || "Artista desconocido";
                const albumId = albumData.id;

                html += `
                    <div class="col">
                        <div class="card h-100">
                            <img src="${coverArtUrl}" alt="Album Cover" class="card-img-top">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${albumData.name || "Álbum desconocido"}</h5>
                                <p class="card-text">Artista: ${artistNames}</p>
                                <p class="card-text">Año: ${albumData.date?.year || "Desconocido"}</p>
                                <div class="mt-auto">
                                    <button onclick="getAlbumTracks('${albumId}', this)" 
                                            class="btn btn-sm btn-primary w-100">
                                        Ver canciones del álbum
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
            html += '</div>';
        }
    } else if (type === "artists") {
        html += "<h3 class='mb-4'>Resultados de Artistas</h3>";
        if (searchResults.artists.length === 0) {
            html += "<p>No se encontraron artistas.</p>";
        } else {
            html += '<div class="row row-cols-1 row-cols-md-3 g-4">';
            searchResults.artists.forEach(artist => {
                const artistData = artist.data;
                const imgSrc = getOptimizedImageUrl(artistData.visuals?.avatarImage?.sources?.[0]?.url, 200);
                const artistName = artistData.profile?.name || "Artista desconocido";
                const artistId = artistData.uri.split(':')[2];

                html += `
                    <div class="col">
                        <div class="card h-100">
                            <img src="${imgSrc}" alt="Artist Image" class="card-img-top">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${artistName}</h5>
                                <div class="mt-auto">
                                    <button onclick="getArtistTopTracks('${artistId}', '${artistName}')" 
                                            class="btn btn-sm btn-info w-100">
                                        Ver canciones populares
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

// Función para obtener canciones de un álbum
async function getAlbumTracks(albumId, buttonElement = null) {
    const resultsContainer = document.getElementById("resultsContainer");
    if (buttonElement) {
        buttonElement.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cargando...';
        buttonElement.disabled = true;
    }

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

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>Canciones del Álbum</h3>
                <button onclick="showResults('albums')" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left me-2"></i>Volver a álbumes
                </button>
            </div>
            <div class="list-group">
        `;
        
        if (data.data?.album?.tracks?.items) {
            data.data.album.tracks.items.forEach((item, index) => {
                const track = item.track;
                const duration = formatDuration(track.duration?.totalMilliseconds);
                const trackId = track.uri?.split(':')[2] || '';
                
                html += `
                    <div class="list-group-item list-group-item-action">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge bg-secondary me-2">${index + 1}</span>
                                <strong>${track.name || "Pista desconocida"}</strong>
                                <small class="text-muted ms-2">${duration}</small>
                            </div>
                            ${trackId ? `
                            <div class="btn-group">
                                <button onclick="playSong('${trackId}')" class="btn btn-sm btn-outline-success">
                                    <i class="fas fa-play"></i> Escuchar
                                </button>
                            </div>` : ''}
                        </div>
                    </div>`;
            });
        } else {
            html += '<div class="list-group-item text-muted">No se encontraron pistas en este álbum.</div>';
        }
        
        html += '</div>';
        resultsContainer.innerHTML = html;
    } catch (error) {
        console.error("Error al obtener las pistas del álbum:", error);
        resultsContainer.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar las pistas: ${error.message}
                <button onclick="showResults('albums')" class="btn btn-sm btn-outline-secondary mt-2">
                    <i class="fas fa-arrow-left me-1"></i>Volver
                </button>
            </div>
        `;
    }
}

// Función para obtener canciones populares de un artista
async function getArtistTopTracks(artistId, artistName) {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2">Cargando canciones de ${artistName}...</p>
        </div>
    `;

    const url = `https://${API_HOST}/artist_top_tracks/?id=${artistId}`;
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
        console.log("Canciones populares del artista:", data);

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>Canciones populares de ${artistName}</h3>
                <button onclick="showResults('artists')" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left me-2"></i>Volver a artistas
                </button>
            </div>
            <div class="row row-cols-1 row-cols-md-3 g-4">
        `;
        
        if (data.tracks && data.tracks.length > 0) {
            data.tracks.forEach(track => {
                const coverArtUrl = getOptimizedImageUrl(track.album?.images?.[0]?.url);
                const duration = formatDuration(track.duration_ms);
                
                html += `
                    <div class="col">
                        <div class="card h-100">
                            <img src="${coverArtUrl}" alt="Album Cover" class="card-img-top">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${track.name || "Canción desconocida"}</h5>
                                <p class="card-text">Álbum: ${track.album?.name || "Desconocido"}</p>
                                <p class="card-text">Duración: ${duration}</p>
                                <div class="mt-auto">
                                    <button onclick="playSong('${track.id}')" class="btn btn-sm btn-success w-100">
                                        <i class="fas fa-play me-1"></i> Escuchar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
        } else {
            html = `
                <div class="alert alert-info">
                    No se encontraron canciones populares para este artista.
                    <button onclick="showResults('artists')" class="btn btn-sm btn-outline-secondary mt-2">
                        <i class="fas fa-arrow-left me-1"></i>Volver
                    </button>
                </div>
            `;
        }
        
        html += '</div>';
        resultsContainer.innerHTML = html;
    } catch (error) {
        console.error("Error al obtener las canciones del artista:", error);
        resultsContainer.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar las canciones: ${error.message}
                <button onclick="showResults('artists')" class="btn btn-sm btn-outline-secondary mt-2">
                    <i class="fas fa-arrow-left me-1"></i>Volver
                </button>
            </div>
        `;
    }
}

// Función para reproducir canción
function playSong(trackId) {
    alert(`Reproduciendo canción con ID: ${trackId}\n\nEn una implementación real, aquí se integraría con la API de reproducción de Spotify.`);
}
