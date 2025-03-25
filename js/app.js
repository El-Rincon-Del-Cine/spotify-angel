const API_KEY = "60a0e5bab7msh8cae9556ead86adp1f39a0jsn34cf68f6923e";
const API_HOST = "spotify23.p.rapidapi.com";

let searchResults = {
    songs: [],
    albums: [],
    artists: []
};

// Función para obtener URL de imagen optimizada (200x200)
function getOptimizedImageUrl(url) {
    if (!url) return `https://via.placeholder.com/200`;
    if (url.includes('via.placeholder.com')) return url.replace(/\d+$/, '200');
    // Intenta forzar tamaño cuadrado para imágenes de Spotify
    if (url.includes('spotify')) {
        return url.replace(/(\/[a-zA-Z]+\/)([a-zA-Z0-9]+)$/, '$1200x200$2');
    }
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
            html += '<div class="row row-cols-2 row-cols-md-4 g-4">';
            searchResults.songs.forEach(song => {
                const track = song.data;
                const coverArtUrl = getOptimizedImageUrl(track.albumOfTrack?.coverArt?.sources?.[0]?.url);
                const artistNames = track.artists?.items?.map(artist => artist.profile?.name).join(", ") || "Artista desconocido";
                const spotifyUrl = `https://open.spotify.com/track/${track.id}`;

                html += `
                    <div class="col">
                        <div class="card h-100">
                            <img src="${coverArtUrl}" alt="Album Cover" class="card-img-top img-square">
                            <div class="card-body">
                                <h6 class="card-title">${track.name || "Canción desconocida"}</h6>
                                <p class="card-text small">${artistNames}</p>
                                <button onclick="playSong('${track.id}')" class="btn btn-sm btn-success w-100 mt-2">
                                    <i class="fas fa-play"></i> Escuchar
                                </button>
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
            html += '<div class="row row-cols-2 row-cols-md-4 g-4">';
            searchResults.albums.forEach(album => {
                const albumData = album.data;
                const coverArtUrl = getOptimizedImageUrl(albumData.coverArt?.sources?.[0]?.url);
                const artistNames = albumData.artists?.items?.map(artist => artist.profile?.name).join(", ") || "Artista desconocido";
                const albumId = albumData.id;

                html += `
                    <div class="col">
                        <div class="card h-100">
                            <img src="${coverArtUrl}" alt="Album Cover" class="card-img-top img-square">
                            <div class="card-body">
                                <h6 class="card-title">${albumData.name || "Álbum desconocido"}</h6>
                                <p class="card-text small">${artistNames}</p>
                                <button onclick="getAlbumTracks('${albumId}')" class="btn btn-sm btn-primary w-100 mt-2">
                                    <i class="fas fa-list"></i> Canciones
                                </button>
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
            html += '<div class="row row-cols-2 row-cols-md-4 g-4">';
            searchResults.artists.forEach(artist => {
                const artistData = artist.data;
                const imgSrc = getOptimizedImageUrl(artistData.visuals?.avatarImage?.sources?.[0]?.url);
                const artistName = artistData.profile?.name || "Artista desconocido";
                const artistId = artistData.uri.split(':')[2];

                html += `
                    <div class="col">
                        <div class="card h-100">
                            <img src="${imgSrc}" alt="Artist Image" class="card-img-top img-square">
                            <div class="card-body text-center">
                                <h6 class="card-title">${artistName}</h6>
                                <button onclick="getArtistTopSongs('${artistId}', '${artistName}')" class="btn btn-sm btn-info w-100 mt-2">
                                    <i class="fas fa-music"></i> Canciones
                                </button>
                            </div>
                        </div>
                    </div>`;
            });
            html += '</div>';
        }
    }

    resultsContainer.innerHTML = html;
}

// Función para obtener canciones populares del artista (usando artist_singles)
async function getArtistTopSongs(artistId, artistName) {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><p class="mt-2">Cargando canciones...</p></div>';

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
        const data = await response.json();
        console.log("Canciones del artista:", data);

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>Canciones de ${artistName}</h3>
                <button onclick="showResults('artists')" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
            <div class="row row-cols-2 row-cols-md-4 g-4">
        `;

        if (data.data?.artist?.discography?.singles?.items) {
            data.data.artist.discography.singles.items.forEach(single => {
                const track = single.releases.items[0];
                const coverArtUrl = getOptimizedImageUrl(track.coverArt?.sources?.[0]?.url);
                const artistNames = track.artists?.items?.map(artist => artist.profile?.name).join(", ") || artistName;

                html += `
                    <div class="col">
                        <div class="card h-100">
                            <img src="${coverArtUrl}" alt="Single Cover" class="card-img-top img-square">
                            <div class="card-body">
                                <h6 class="card-title">${track.name || "Canción desconocida"}</h6>
                                <p class="card-text small">${artistNames}</p>
                                <button onclick="playSong('${track.id}')" class="btn btn-sm btn-success w-100 mt-2">
                                    <i class="fas fa-play"></i> Escuchar
                                </button>
                            </div>
                        </div>
                    </div>`;
            });
        } else {
            html = '<div class="alert alert-info w-100">No se encontraron canciones para este artista.</div>';
        }

        html += '</div>';
        resultsContainer.innerHTML = html;
    } catch (error) {
        console.error("Error al obtener canciones del artista:", error);
        resultsContainer.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar las canciones: ${error.message}
                <button onclick="showResults('artists')" class="btn btn-outline-secondary mt-2">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
        `;
    }
}

// Función para obtener canciones de un álbum
async function getAlbumTracks(albumId) {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><p class="mt-2">Cargando canciones...</p></div>';

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
                    <i class="fas fa-arrow-left"></i> Volver
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
                            <button onclick="playSong('${trackId}')" class="btn btn-sm btn-outline-success">
                                <i class="fas fa-play"></i>
                            </button>
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
                <button onclick="showResults('albums')" class="btn btn-outline-secondary mt-2">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
        `;
    }
}

// Función para reproducir canción
function playSong(trackId) {
    alert(`Reproduciendo canción con ID: ${trackId}`);
}

// Añadir estilos CSS
const style = document.createElement('style');
style.textContent = `
    .img-square {
        width: 100%;
        height: 200px;
        object-fit: cover;
        aspect-ratio: 1/1;
    }
    .card {
        transition: all 0.3s ease;
        border: none;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.15);
    }
    .card-title {
        font-size: 0.95rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .card-text.small {
        font-size: 0.8rem;
        color: #6c757d;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    #resultsContainer {
        min-height: 300px;
    }
    .list-group-item {
        border-left: none;
        border-right: none;
    }
`;
document.head.appendChild(style);
