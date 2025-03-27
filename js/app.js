const API_KEY = "60a0e5bab7msh8cae9556ead86adp1f39a0jsn34cf68f6923e";
const API_HOST = "spotify23.p.rapidapi.com";

let searchResults = {
    songs: [],
    artists: []
};

// Activar el contexto de audio al primer click
document.addEventListener('click', initializeAudio, { once: true });

function initializeAudio() {
    const audio = new Audio();
    audio.volume = 0;
    audio.src = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...';
    audio.play()
        .then(() => audio.pause())
        .catch(e => console.log("Audio context activated with error:", e));
}

// Función para obtener URL de imagen optimizada
function getOptimizedImageUrl(url, width = 150) {
    if (!url) return `https://via.placeholder.com/${width}`;
    if (url.includes('via.placeholder.com')) return url.replace(/\d+$/, width.toString());
    return url.replace(/\/\d+x\d+\//, `/${width}x${width}/`);
}

// Función para formatear la duración
function formatDuration(ms) {
    if (!ms) return "0:00";
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
}

// Función mejorada para reproducir previsualización
function playSong(previewUrl) {
    const audioPlayer = document.getElementById("audioPlayer");
    const playerContainer = document.getElementById("playerContainer");

    if (!previewUrl || typeof previewUrl !== 'string') {
        alert("Vista previa no disponible para esta canción");
        return;
    }

    // Resetear el reproductor
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    audioPlayer.src = previewUrl;

    // Configurar manejadores de eventos
    audioPlayer.onerror = () => {
        console.error("Error al cargar el audio");
        playerContainer.style.display = 'none';
        alert("Error al cargar la vista previa. Intenta nuevamente.");
    };

    playerContainer.style.display = 'block';
    
    const playPromise = audioPlayer.play();
    
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.error("Error de reproducción:", error);
            const errorMsg = document.createElement('div');
            errorMsg.className = 'alert alert-warning mt-2';
            errorMsg.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                Para escuchar, haz clic primero en cualquier parte de la página
                y luego presiona reproducir nuevamente.
            `;
            playerContainer.appendChild(errorMsg);
        });
    }
}

// Función principal de búsqueda (mejorada)
async function searchSpotify() {
    const query = document.getElementById("searchInput").value.trim();
    if (!query) {
        showAlert("Por favor, ingresa un término de búsqueda", "warning");
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
        showLoading();

        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        searchResults.songs = data.tracks?.items || [];
        searchResults.artists = data.artists?.items || [];

        if (searchResults.songs.length > 0) {
            showResults("songs");
        } else if (searchResults.artists.length > 0) {
            showResults("artists");
        } else {
            showNoResults();
        }

    } catch (error) {
        console.error("Error en la búsqueda:", error);
        showAlert(`Error al buscar: ${error.message}`, "danger");
    }
}

// Funciones auxiliares de UI
function showLoading() {
    document.getElementById("resultsContainer").innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2">Buscando en Spotify...</p>
        </div>
    `;
}

function showAlert(message, type = "info") {
    document.getElementById("resultsContainer").innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;
}

// Función para mostrar resultados
function showResults(type) {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = "";

    if (type === "songs") {
        showSongsResults();
    } else if (type === "artists") {
        showArtistsResults();
    }
}

// Mostrar canciones (versión corregida)
async function showSongsResults() {
    const container = document.getElementById("resultsContainer");
    
    if (searchResults.songs.length === 0) {
        showAlert("No se encontraron canciones", "info");
        return;
    }

    let html = '<h3 class="mb-4">Canciones</h3><div class="row row-cols-1 row-cols-md-3 g-4">';

    searchResults.songs.forEach(song => {
        const track = song.data;
        const coverArtUrl = getOptimizedImageUrl(track.albumOfTrack?.coverArt?.sources?.[0]?.url);
        const artistNames = track.artists?.items?.map(artist => artist.profile?.name).join(", ") || "Artista desconocido";
        const previewUrl = track.preview_url;
        const spotifyUrl = `https://open.spotify.com/track/${track.id}`;

        html += `
            <div class="col">
                <div class="card h-100">
                    <img src="${coverArtUrl}" class="card-img-top img-square" alt="Portada" loading="lazy">
                    <div class="card-body">
                        <h6 class="card-title">${escapeHtml(track.name || "Canción desconocida")}</h6>
                        <p class="card-text small">${escapeHtml(artistNames)}</p>
                    </div>
                    <div class="card-footer bg-transparent">
                        <div class="d-flex gap-2">
                            <a href="${spotifyUrl}" target="_blank" class="btn btn-sm btn-outline-primary flex-grow-1">
                                <i class="fab fa-spotify"></i> Spotify
                            </a>
                            <button onclick="playSong(${JSON.stringify(previewUrl)})" 
                                    class="btn btn-sm btn-success flex-grow-1"
                                    ${!previewUrl ? 'disabled title="No hay vista previa disponible"' : ''}>
                                <i class="fas fa-play"></i> Escuchar
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Función de escape para HTML (seguridad)
function escapeHtml(unsafe) {
    return unsafe?.toString()?.replace(/[&<>"']/g, match => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[match])) || '';
}

// Mostrar artistas (versión corregida)
function showArtistsResults() {
    const container = document.getElementById("resultsContainer");

    if (searchResults.artists.length === 0) {
        showAlert("No se encontraron artistas", "info");
        return;
    }

    let html = '<h3 class="mb-4">Artistas</h3><div class="row row-cols-1 row-cols-md-3 g-4">';

    searchResults.artists.forEach(artist => {
        const artistData = artist.data;
        const imgSrc = getOptimizedImageUrl(artistData.visuals?.avatarImage?.sources?.[0]?.url, 300);
        const artistName = artistData.profile?.name || "Artista desconocido";
        const artistId = artistData.uri.split(':')[2];

        html += `
            <div class="col">
                <div class="card h-100">
                    <img src="${imgSrc}" class="card-img-top img-square" alt="${escapeHtml(artistName)}" loading="lazy">
                    <div class="card-body text-center">
                        <h5 class="card-title">${escapeHtml(artistName)}</h5>
                    </div>
                    <div class="card-footer bg-transparent">
                        <div class="d-flex flex-column gap-2">
                            <button onclick="getArtistAlbums('${artistId}', ${JSON.stringify(artistName)})" 
                                    class="btn btn-info w-100">
                                <i class="fas fa-compact-disc me-1"></i> Álbumes
                            </button>
                            <button onclick="getArtistTopSongs('${artistId}', ${JSON.stringify(artistName)})" 
                                    class="btn btn-primary w-100">
                                <i class="fas fa-music me-1"></i> Top Canciones
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Función para obtener álbumes de un artista (corregida)
async function getArtistAlbums(artistId, artistName) {
    showLoading();
    
    try {
        const url = `https://${API_HOST}/artist_albums/?id=${artistId}&offset=0&limit=50`;
        const options = {
            method: "GET",
            headers: {
                "x-rapidapi-key": API_KEY,
                "x-rapidapi-host": API_HOST
            }
        };

        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        const albums = data.data?.artist?.discography?.albums?.items || [];

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>Álbumes de ${escapeHtml(artistName)}</h3>
                <button onclick="showResults('artists')" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
            <div class="row row-cols-1 row-cols-md-3 g-4">
        `;

        albums.forEach(item => {
            const album = item.releases.items[0];
            if (!album) return;
            
            const coverArtUrl = getOptimizedImageUrl(album.coverArt?.sources?.[0]?.url);
            const albumId = album.id;
            const releaseYear = album.date?.year || "Año desconocido";

            html += `
                <div class="col">
                    <div class="card h-100">
                        <img src="${coverArtUrl}" class="card-img-top" alt="Portada del álbum" loading="lazy">
                        <div class="card-body">
                            <h5 class="card-title">${escapeHtml(album.name || "Álbum")}</h5>
                            <p class="card-text text-muted">${releaseYear}</p>
                        </div>
                        <div class="card-footer bg-transparent">
                            <button onclick="getAlbumTracks('${albumId}', ${JSON.stringify(artistName)}, '${artistId}')" 
                                    class="btn btn-primary w-100">
                                <i class="fas fa-music"></i> Ver Canciones
                            </button>
                        </div>
                    </div>
                </div>`;
        });

        if (albums.length === 0) {
            html += '<div class="col-12"><p class="text-muted">No se encontraron álbumes.</p></div>';
        }

        html += '</div>';
        document.getElementById("resultsContainer").innerHTML = html;

    } catch (error) {
        console.error("Error al obtener álbumes:", error);
        showAlert(`Error al cargar álbumes: ${error.message}`, "danger");
    }
}

// Función para obtener canciones populares del artista (corregida)
async function getArtistTopSongs(artistId, artistName) {
    showLoading();

    try {
        const url = `https://${API_HOST}/artist_singles/?id=${artistId}&offset=0&limit=10`;
        const options = {
            method: "GET",
            headers: {
                "x-rapidapi-key": API_KEY,
                "x-rapidapi-host": API_HOST
            }
        };

        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        const singles = data.data?.artist?.discography?.singles?.items || [];

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>Top canciones de ${escapeHtml(artistName)}</h3>
                <button onclick="showResults('artists')" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
            <div class="row row-cols-1 row-cols-md-3 g-4">
        `;

        singles.forEach(item => {
            const track = item.releases.items[0];
            if (!track) return;
            
            const coverArtUrl = getOptimizedImageUrl(track.coverArt?.sources?.[0]?.url);
            const trackId = track.id;
            const previewUrl = track.tracks?.items[0]?.track?.preview_url;
            const spotifyUrl = `https://open.spotify.com/track/${trackId}`;

            html += `
                <div class="col">
                    <div class="card h-100">
                        <img src="${coverArtUrl}" class="card-img-top" alt="Portada" loading="lazy">
                        <div class="card-body">
                            <h5 class="card-title">${escapeHtml(track.name || "Canción")}</h5>
                        </div>
                        <div class="card-footer bg-transparent">
                            <div class="d-flex gap-2">
                                <a href="${spotifyUrl}" target="_blank" class="btn btn-sm btn-outline-primary flex-grow-1">
                                    <i class="fab fa-spotify"></i> Spotify
                                </a>
                                <button onclick="playSong(${JSON.stringify(previewUrl)})" 
                                        class="btn btn-sm btn-success flex-grow-1"
                                        ${!previewUrl ? 'disabled title="No hay vista previa"' : ''}>
                                    <i class="fas fa-play"></i> Escuchar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;
        });

        if (singles.length === 0) {
            html += '<div class="col-12"><p class="text-muted">No se encontraron canciones populares.</p></div>';
        }

        html += '</div>';
        document.getElementById("resultsContainer").innerHTML = html;

    } catch (error) {
        console.error("Error al obtener canciones:", error);
        showAlert(`Error al cargar canciones: ${error.message}`, "danger");
    }
}

// Función para obtener canciones de un álbum (completamente corregida)
async function getAlbumTracks(albumId, artistName, artistId) {
    showLoading();

    try {
        const [metadata, tracksData] = await Promise.all([
            fetch(`https://${API_HOST}/albums/?ids=${albumId}`, {
                headers: {
                    "x-rapidapi-key": API_KEY,
                    "x-rapidapi-host": API_HOST
                }
            }).then(res => res.json()),
            fetch(`https://${API_HOST}/album_tracks/?id=${albumId}&offset=0&limit=50`, {
                headers: {
                    "x-rapidapi-key": API_KEY,
                    "x-rapidapi-host": API_HOST
                }
            }).then(res => res.json())
        ]);

        const albumCover = metadata.albums?.[0]?.images?.[0]?.url || 
                         tracksData.data?.album?.coverArt?.sources?.[0]?.url;
        const albumData = tracksData.data?.album;
        const coverArtUrl = getOptimizedImageUrl(albumCover, 300);

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>${escapeHtml(albumData?.name || 'Álbum')} - ${escapeHtml(artistName)}</h3>
                <button onclick="getArtistAlbums('${artistId}', ${JSON.stringify(artistName)})" 
                        class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
            <div class="row">
                <div class="col-md-3 text-center mb-4">
                    <img src="${coverArtUrl}" class="img-fluid rounded shadow" alt="Portada" loading="lazy">
                    <h5 class="mt-3">${escapeHtml(albumData?.name || 'Álbum')}</h5>
                    <p class="text-muted">${escapeHtml(artistName)}</p>
                    ${albumData?.date?.year ? `<p class="text-muted">${albumData.date.year}</p>` : ''}
                </div>
                <div class="col-md-9">
                    <div class="list-group">
        `;

        if (albumData?.tracks?.items) {
            albumData.tracks.items.forEach((item, index) => {
                const track = item.track;
                const duration = formatDuration(track.duration?.totalMilliseconds);
                const previewUrl = track.preview_url;
                const spotifyUrl = `https://open.spotify.com/track/${track.uri?.split(':')[2] || ''}`;

                html += `
                    <div class="list-group-item list-group-item-action">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge bg-secondary me-2">${index + 1}</span>
                                <strong>${escapeHtml(track.name || "Pista")}</strong>
                                <small class="text-muted ms-2">${duration}</small>
                            </div>
                            <div class="d-flex gap-2">
                                <a href="${spotifyUrl}" target="_blank" class="btn btn-sm btn-outline-primary">
                                    <i class="fab fa-spotify"></i>
                                </a>
                                <button onclick="playSong(${JSON.stringify(previewUrl)})" 
                                        class="btn btn-sm btn-success"
                                        ${!previewUrl ? 'disabled title="No hay vista previa"' : ''}>
                                    <i class="fas fa-play"></i>
                                </button>
                            </div>
                        </div>
                    </div>`;
            });
        } else {
            html += '<div class="list-group-item text-muted">No se encontraron pistas.</div>';
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        document.getElementById("resultsContainer").innerHTML = html;

    } catch (error) {
        console.error("Error al obtener pistas:", error);
        showAlert(`Error al cargar las canciones: ${error.message}`, "danger");
    }
}

// Función para cuando no hay resultados
function showNoResults() {
    showAlert("No se encontraron resultados para tu búsqueda", "info");
}

// Estilos dinámicos
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
        background-color: #181818;
    }
    .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.15);
        background-color: #282828;
    }
    .card-title {
        font-size: 0.95rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: white;
    }
    .card-text {
        color: #b3b3b3;
        font-size: 0.85rem;
    }
    #resultsContainer {
        min-height: 300px;
    }
    .list-group-item {
        background-color: #181818;
        color: white;
        border-color: #333;
    }
    #playerContainer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0,0,0,0.8);
        backdrop-filter: blur(5px);
        padding: 10px;
        z-index: 1000;
        display: none;
    }
    #audioPlayer {
        width: 100%;
        max-width: 500px;
        margin: 0 auto;
        display: block;
    }
`;
document.head.appendChild(style);

// Inicialización del reproductor de audio
document.addEventListener('DOMContentLoaded', () => {
    const playerHTML = `
        <div id="playerContainer">
            <audio id="audioPlayer" controls></audio>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', playerHTML);
});