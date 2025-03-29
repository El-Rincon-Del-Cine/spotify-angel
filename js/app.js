const API_KEY = "4e31a0b780mshc91bb9f90dd6fadp1dd141jsncba4ecac40cb";
const API_HOST = "spotify23.p.rapidapi.com";

// Variables globales
let searchResults = {
    songs: [],
    artists: []
};

let currentAudio = null;
let currentPlayingButton = null;

// ==================== FUNCIONES DE REPRODUCCIÓN ====================
function playPreview(previewUrl, button) {
    if (!previewUrl) {
        alert("Preview no disponible para esta canción");
        return;
    }

    // Detener reproducción actual
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        currentPlayingButton.innerHTML = '<i class="fas fa-play"></i>';
    }

    // Iniciar nueva reproducción
    if (!currentAudio || currentAudio.src !== previewUrl) {
        currentAudio = new Audio(previewUrl);
        currentPlayingButton = button;
        
        currentAudio.play()
            .then(() => {
                button.innerHTML = '<i class="fas fa-pause"></i>';
                button.classList.add('playing');
            })
            .catch(error => {
                console.error("Error de reproducción:", error);
                button.innerHTML = '<i class="fas fa-play"></i>';
            });

        // Restablecer al finalizar
        currentAudio.onended = () => {
            button.innerHTML = '<i class="fas fa-play"></i>';
            button.classList.remove('playing');
            currentAudio = null;
            currentPlayingButton = null;
        };
    }
}

// ==================== FUNCIONES AUXILIARES ====================
function getOptimizedImageUrl(url, width = 300) {
    return url?.replace(/w\d+-h\d+/, `w${width}-h${width}`) || `https://via.placeholder.com/${width}`;
}

function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
}

// ==================== BÚSQUEDA PRINCIPAL ====================
async function searchSpotify() {
    const query = document.getElementById("searchInput").value.trim();
    if (!query) {
        showNoResults("❌ Ingresa un término de búsqueda");
        return;
    }

    try {
        document.getElementById("resultsContainer").innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Buscando "${query}"...</p>
            </div>`;

        const response = await fetch(
            `https://${API_HOST}/search/?q=${encodeURIComponent(query)}&type=track,artist&limit=15&numberOfTopResults=5`,
            {
                method: "GET",
                headers: {
                    "x-rapidapi-key": API_KEY,
                    "x-rapidapi-host": API_HOST
                }
            }
        );

        const data = await response.json();
        
        // Procesar resultados
        searchResults.songs = data.tracks?.items?.filter(track => 
            track.data?.preview_url && track.data?.name
        ) || [];
        
        searchResults.artists = data.artists?.items?.filter(artist => 
            artist.data?.profile?.name && artist.data?.visuals?.avatarImage
        ) || [];

        // Mostrar resultados
        if (searchResults.songs.length > 0) showSongsResults();
        else if (searchResults.artists.length > 0) showArtistsResults();
        else showNoResults("🔍 No se encontraron resultados");

    } catch (error) {
        console.error("Error en búsqueda:", error);
        showNoResults("🚨 Error al conectar con Spotify");
    }
}

// ==================== VISTA DE RESULTADOS ====================
function showSongsResults() {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = '<h2 class="section-title">🎵 Canciones</h2><div class="tracks-grid">';

    searchResults.songs.forEach((song, index) => {
        const track = song.data;
        const artists = track.artists?.items?.map(a => a.profile.name).join(", ") || "Artista desconocido";
        
        container.innerHTML += `
            <div class="track-card">
                <img src="${getOptimizedImageUrl(track.albumOfTrack?.coverArt?.sources?.[0]?.url)}" 
                     class="track-cover" 
                     alt="${track.name}">
                <div class="track-info">
                    <h3 class="track-title">${track.name}</h3>
                    <p class="track-artist">${artists}</p>
                    <div class="track-controls">
                        <button class="play-button" 
                                onclick="playPreview('${track.preview_url}', this)"
                                ${!track.preview_url ? 'disabled' : ''}>
                            <i class="fas fa-${track.preview_url ? 'play' : 'ban'}"></i>
                        </button>
                        <a href="https://open.spotify.com/track/${track.id}" 
                           target="_blank" 
                           class="spotify-link">
                            <i class="fab fa-spotify"></i>
                        </a>
                    </div>
                </div>
            </div>`;
    });

    container.innerHTML += '</div>';
}

function showArtistsResults() {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = '<h2 class="section-title">🎤 Artistas</h2><div class="artists-grid">';

    searchResults.artists.forEach(artist => {
        const artistData = artist.data;
        const imageUrl = getOptimizedImageUrl(artistData.visuals?.avatarImage?.sources?.[0]?.url);

        container.innerHTML += `
            <div class="artist-card">
                <img src="${imageUrl}" 
                     class="artist-image" 
                     alt="${artistData.profile.name}">
                <h3 class="artist-name">${artistData.profile.name}</h3>
                <div class="artist-actions">
                    <button class="btn-albums" 
                            onclick="getArtistAlbums('${artistData.uri.split(':')[2]}', '${artistData.profile.name}')">
                        <i class="fas fa-compact-disc"></i> Álbumes
                    </button>
                    <button class="btn-tracks"
                            onclick="getArtistTopTracks('${artistData.uri.split(':')[2]}', '${artistData.profile.name}')">
                        <i class="fas fa-music"></i> Top Canciones
                    </button>
                </div>
            </div>`;
    });

    container.innerHTML += '</div>';
}

// ==================== VISTAS DE ARTISTA ====================
async function getArtistTopTracks(artistId, artistName) {
    try {
        document.getElementById("resultsContainer").innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Cargando canciones de ${artistName}...</p>
            </div>`;

        const response = await fetch(
            `https://${API_HOST}/artist_top_tracks/?id=${artistId}`,
            {
                method: "GET",
                headers: {
                    "x-rapidapi-key": API_KEY,
                    "x-rapidapi-host": API_HOST
                }
            }
        );

        const data = await response.json();
        const container = document.getElementById("resultsContainer");
        container.innerHTML = `
            <h2 class="section-title"> Top Canciones - ${artistName}</h2>
            <button class="back-button" onclick="showArtistsResults()">
                <i class="fas fa-arrow-left"></i> Volver
            </button>
            <div class="tracks-grid">`;

        data.tracks?.forEach(track => {
            container.innerHTML += `
                <div class="track-card">
                    <img src="${getOptimizedImageUrl(track.album?.images?.[0]?.url)}" 
                         class="track-cover" 
                         alt="${track.name}">
                    <div class="track-info">
                        <h3 class="track-title">${track.name}</h3>
                        <p class="track-duration">${formatDuration(track.duration_ms)}</p>
                        <div class="track-controls">
                            <button class="play-button" 
                                    onclick="playPreview('${track.preview_url}', this)"
                                    ${!track.preview_url ? 'disabled' : ''}>
                                <i class="fas fa-${track.preview_url ? 'play' : 'ban'}"></i>
                            </button>
                            <a href="${track.external_urls.spotify}" 
                               target="_blank" 
                               class="spotify-link">
                                <i class="fab fa-spotify"></i>
                            </a>
                        </div>
                    </div>
                </div>`;
        });

        container.innerHTML += '</div>';
    } catch (error) {
        console.error("Error al cargar top canciones:", error);
        showNoResults("Error al cargar las canciones populares");
    }
}

async function getArtistAlbums(artistId, artistName) {
    try {
        document.getElementById("resultsContainer").innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Cargando álbumes de ${artistName}...</p>
            </div>`;

        const response = await fetch(
            `https://${API_HOST}/artist_albums/?id=${artistId}&limit=10`,
            {
                method: "GET",
                headers: {
                    "x-rapidapi-key": API_KEY,
                    "x-rapidapi-host": API_HOST
                }
            }
        );

        const data = await response.json();
        const container = document.getElementById("resultsContainer");
        container.innerHTML = `
            <h2 class="section-title"> Álbumes - ${artistName}</h2>
            <button class="back-button" onclick="showArtistsResults()">
                <i class="fas fa-arrow-left"></i> Volver
            </button>
            <div class="albums-grid">`;

        data.data?.artist?.discography?.albums?.items?.forEach(album => {
            const albumData = album.releases.items[0];
            container.innerHTML += `
                <div class="album-card">
                    <img src="${getOptimizedImageUrl(albumData.coverArt?.sources?.[0]?.url)}" 
                         class="album-cover" 
                         alt="${albumData.name}">
                    <h3 class="album-title">${albumData.name}</h3>
                    <p class="album-year">${albumData.date?.year || 'Año desconocido'}</p>
                    <button class="btn-tracks" 
                            onclick="getAlbumTracks('${albumData.id}', '${artistName}', '${artistId}')">
                        <i class="fas fa-list"></i> Ver canciones
                    </button>
                </div>`;
        });

        container.innerHTML += '</div>';
    } catch (error) {
        console.error("Error al cargar álbumes:", error);
        showNoResults(" Error al cargar los álbumes");
    }
}

// ==================== FUNCIONES ADICIONALES ====================
function showNoResults(message = "🔍 No se encontraron resultados") {
    document.getElementById("resultsContainer").innerHTML = `
        <div class="no-results">
            <i class="fas fa-search-minus"></i>
            <p>${message}</p>
        </div>`;
}

// ==================== ESTILOS ====================
const style = document.createElement('style');
style.textContent = `
    :root {
        --primary-color: #1DB954;
        --background-color: #121212;
        --card-color: #181818;
        --text-color: #FFFFFF;
    }

    body {
        background: var(--background-color);
        color: var(--text-color);
        font-family: 'Arial', sans-serif;
        padding: 20px;
    }

    .loading-spinner {
        text-align: center;
        padding: 50px;
    }

    .spinner {
        border: 4px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: var(--primary-color);
        width: 40px;
        height: 40px;
        margin: 20px auto;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .tracks-grid, .artists-grid, .albums-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 20px;
    }

    .track-card, .artist-card, .album-card {
        background: var(--card-color);
        border-radius: 10px;
        padding: 15px;
        transition: transform 0.3s ease;
    }

    .track-card:hover, .artist-card:hover, .album-card:hover {
        transform: translateY(-5px);
    }

    .track-cover, .artist-image, .album-cover {
        width: 100%;
        border-radius: 8px;
        aspect-ratio: 1;
        object-fit: cover;
        margin-bottom: 15px;
    }

    .track-controls, .artist-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
    }

    .play-button {
        background: var(--primary-color);
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        color: white;
        cursor: pointer;
        transition: opacity 0.3s;
    }

    .play-button:disabled {
        background: #535353;
        cursor: not-allowed;
    }

    .play-button.playing {
        background: #e74c3c;
    }

    .spotify-link {
        background: transparent;
        border: 1px solid var(--primary-color);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--primary-color);
        text-decoration: none;
    }

    .back-button {
        background: transparent;
        border: none;
        color: var(--text-color);
        cursor: pointer;
        margin-bottom: 20px;
    }
`;
document.head.appendChild(style);
