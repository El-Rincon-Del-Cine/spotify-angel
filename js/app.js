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
        document.getElementById("resultsContainer").innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div></div>';
        
        const response = await fetch(url, options);
        const data = await response.json();
        
        searchResults.songs = data.tracks?.items || [];
        searchResults.albums = data.albums?.items || [];
        searchResults.artists = data.artists?.items || [];

        if (searchResults.songs.length > 0) showResults("songs");
        else if (searchResults.albums.length > 0) showResults("albums");
        else if (searchResults.artists.length > 0) showResults("artists");
        else showNoResults();
        
    } catch (error) {
        console.error("Error en la búsqueda:", error);
        document.getElementById("resultsContainer").innerHTML = `
            <div class="alert alert-danger">
                Error al buscar: ${error.message}
            </div>
        `;
    }
}

// Función para mostrar resultados
function showResults(type) {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = "";

    if (type === "songs") {
        showSongsResults();
    } else if (type === "albums") {
        showAlbumsResults();
    } else if (type === "artists") {
        showArtistsResults();
    }
}

// Mostrar canciones
async function showSongsResults() {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div></div>';

    if (searchResults.songs.length === 0) {
        container.innerHTML = "<p>No se encontraron canciones</p>";
        return;
    }

    let html = '<h3 class="mb-4">Canciones</h3><div class="row row-cols-1 row-cols-md-3 g-4">';
    
    searchResults.songs.forEach(song => {
        const track = song.data;
        const coverArtUrl = getOptimizedImageUrl(track.albumOfTrack?.coverArt?.sources?.[0]?.url);
        const artistNames = track.artists?.items?.map(artist => artist.profile?.name).join(", ") || "Artista desconocido";
        const spotifyUrl = `https://open.spotify.com/track/${track.id}`;
        const trackId = track.id;

        html += `
            <div class="col">
                <div class="card h-100">
                    <img src="${coverArtUrl}" class="card-img-top img-square" alt="Portada">
                    <div class="card-body">
                        <h6 class="card-title">${track.name || "Canción desconocida"}</h6>
                        <p class="card-text small">${artistNames}</p>
                    </div>
                    <div class="card-footer bg-transparent">
                        <div class="d-flex gap-2">
                            <a href="${spotifyUrl}" target="_blank" class="btn btn-sm btn-outline-primary flex-grow-1">
                                <i class="fab fa-spotify"></i> Spotify
                            </a>
                            <button onclick="playSong('${trackId}')" class="btn btn-sm btn-success flex-grow-1">
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

// Mostrar álbumes
function showAlbumsResults() {
    const container = document.getElementById("resultsContainer");
    
    if (searchResults.albums.length === 0) {
        container.innerHTML = "<p>No se encontraron álbumes</p>";
        return;
    }

    let html = '<h3 class="mb-4">Álbumes</h3><div class="row row-cols-1 row-cols-md-3 g-4">';
    
    searchResults.albums.forEach(album => {
        const albumData = album.data;
        const coverArtUrl = getOptimizedImageUrl(albumData.coverArt?.sources?.[0]?.url);
        const artistNames = albumData.artists?.items?.map(artist => artist.profile?.name).join(", ") || "Artista desconocido";
        const albumId = albumData.id;

        html += `
            <div class="col">
                <div class="card h-100">
                    <img src="${coverArtUrl}" class="card-img-top img-square" alt="Portada del álbum">
                    <div class="card-body">
                        <h6 class="card-title">${albumData.name || "Álbum desconocido"}</h6>
                        <p class="card-text small">${artistNames}</p>
                        <p class="card-text small text-muted">${albumData.date?.year || ""}</p>
                    </div>
                    <div class="card-footer bg-transparent">
                        <button onclick="showAlbumDetails('${albumId}', 'albums')" class="btn btn-sm btn-primary w-100">
                            <i class="fas fa-list"></i> Ver canciones
                        </button>
                    </div>
                </div>
            </div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Mostrar artistas
function showArtistsResults() {
    const container = document.getElementById("resultsContainer");
    
    if (searchResults.artists.length === 0) {
        container.innerHTML = "<p>No se encontraron artistas</p>";
        return;
    }

    let html = '<h3 class="mb-4">Artistas</h3><div class="row row-cols-1 row-cols-md-3 g-4">';
    
    searchResults.artists.forEach(artist => {
        const artistData = artist.data;
        const imgSrc = getOptimizedImageUrl(artistData.visuals?.avatarImage?.sources?.[0]?.url);
        const artistName = artistData.profile?.name || "Artista desconocido";
        const artistId = artistData.uri.split(':')[2];

        html += `
            <div class="col">
                <div class="card h-100">
                    <img src="${imgSrc}" class="card-img-top img-square" alt="Imagen del artista">
                    <div class="card-body text-center">
                        <h6 class="card-title">${artistName}</h6>
                    </div>
                    <div class="card-footer bg-transparent">
                        <button onclick="getArtistAlbums('${artistId}', '${artistName}')" class="btn btn-sm btn-info w-100">
                            <i class="fas fa-music"></i> Ver Álbumes
                        </button>
                    </div>
                </div>
            </div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Función unificada para obtener información completa de un álbum
async function getFullAlbumData(albumId) {
    const endpoints = {
        albumMetadata: `https://${API_HOST}/albums/?ids=${albumId}`,
        albumTracks: `https://${API_HOST}/album_tracks/?id=${albumId}&offset=0&limit=50`
    };

    const options = {
        method: "GET",
        headers: {
            "x-rapidapi-key": API_KEY,
            "x-rapidapi-host": API_HOST
        }
    };

    try {
        const [metadataResponse, tracksResponse] = await Promise.all([
            fetch(endpoints.albumMetadata, options),
            fetch(endpoints.albumTracks, options)
        ]);

        if (!metadataResponse.ok || !tracksResponse.ok) {
            throw new Error('Error al obtener datos del álbum');
        }

        const [metadata, tracks] = await Promise.all([
            metadataResponse.json(),
            tracksResponse.json()
        ]);

        return {
            metadata: metadata.albums?.[0] || null,
            tracks: tracks.data?.album?.tracks?.items || []
        };
    } catch (error) {
        console.error('Error en getFullAlbumData:', error);
        throw error;
    }
}

// Función para mostrar detalles del álbum y sus canciones
async function showAlbumDetails(albumId, backTo = 'albums') {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><p>Cargando álbum...</p></div>';

    try {
        const { metadata, tracks } = await getFullAlbumData(albumId);

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>${metadata?.name || 'Álbum'}</h3>
                <button onclick="showResults('${backTo}')" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
            <div class="row">
                <div class="col-md-4">
                    <div class="sticky-top" style="top: 20px;">
                        <img src="${getOptimizedImageUrl(metadata?.images?.[0]?.url, 300)}" 
                             class="img-fluid rounded shadow mb-3" alt="Portada del álbum">
                        <h4>${metadata?.name || 'Álbum desconocido'}</h4>
                        <p class="text-muted">${metadata?.artists?.map(a => a.name).join(', ') || 'Artista desconocido'}</p>
                        <p>${metadata?.release_date || ''} • ${tracks.length} canciones</p>
                        <a href="https://open.spotify.com/album/${albumId}" target="_blank" 
                           class="btn btn-sm btn-outline-success w-100 mb-2">
                            <i class="fab fa-spotify"></i> Abrir en Spotify
                        </a>
                    </div>
                </div>
                <div class="col-md-8">
                    <h4 class="mb-3">Canciones</h4>
                    <div class="list-group">
        `;

        if (tracks.length > 0) {
            tracks.forEach((item, index) => {
                const track = item.track || item;
                const duration = formatDuration(track.duration_ms || track.duration?.totalMilliseconds);
                const trackId = track.id || track.uri?.split(':')[2];
                
                html += `
                    <div class="list-group-item list-group-item-action">
                        <div class="d-flex justify-content-between align-items-center">
                            <div style="min-width: 30px;" class="me-3 text-muted">${index + 1}</div>
                            <div class="flex-grow-1">
                                <div class="fw-bold">${track.name || 'Canción desconocida'}</div>
                                <small class="text-muted">${track.artists?.map(a => a.name).join(', ') || ''}</small>
                            </div>
                            <div class="ms-3 text-muted">${duration}</div>
                            <div class="ms-3">
                                ${trackId ? `
                                <button onclick="playSong('${trackId}')" class="btn btn-sm btn-outline-success ms-2">
                                    <i class="fas fa-play"></i>
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            html += '<div class="list-group-item text-muted">No se encontraron canciones en este álbum.</div>';
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar el álbum: ${error.message}
                <button onclick="showResults('${backTo}')" class="btn btn-outline-secondary mt-2">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
        `;
    }
}

// Función para obtener álbumes de un artista
async function getArtistAlbums(artistId, artistName) {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><p>Cargando álbumes...</p></div>';

    const url = `https://${API_HOST}/artist_albums/?id=${artistId}&offset=0&limit=100`;
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

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>Álbumes de ${artistName}</h3>
                <button onclick="showResults('artists')" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
            <div class="row row-cols-1 row-cols-md-3 g-4">
        `;

        if (data.data?.artist?.discography?.albums?.items) {
            const albums = data.data.artist.discography.albums.items;
            
            albums.forEach(item => {
                const album = item.releases.items[0];
                const coverArtUrl = getOptimizedImageUrl(album.coverArt?.sources?.[0]?.url);
                const albumId = album.id;
                const releaseYear = album.date?.year || "Año desconocido";

                html += `
                    <div class="col">
                        <div class="card h-100">
                            <img src="${coverArtUrl}" class="card-img-top img-square" alt="Portada del álbum">
                            <div class="card-body">
                                <h6 class="card-title">${album.name || "Álbum desconocido"}</h6>
                                <p class="card-text small">${releaseYear}</p>
                            </div>
                            <div class="card-footer bg-transparent">
                                <button onclick="showAlbumDetails('${albumId}', 'artists')" class="btn btn-sm btn-primary w-100">
                                    <i class="fas fa-music"></i> Ver Canciones
                                </button>
                            </div>
                        </div>
                    </div>`;
            });
        } else {
            html += '<div class="col-12"><p class="text-muted">No se encontraron álbumes para este artista.</p></div>';
        }

        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        console.error("Error al obtener álbumes del artista:", error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar los álbumes: ${error.message}
                <button onclick="showResults('artists')" class="btn btn-outline-secondary mt-2">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
        `;
    }
}

// Función para reproducir canción
function playSong(trackId) {
    alert(`Reproduciendo canción con ID: ${trackId}\n\nEn una implementación real, aquí se integraría con la API de Spotify`);
}

// Función para mostrar "no hay resultados"
function showNoResults() {
    document.getElementById("resultsContainer").innerHTML = `
        <div class="alert alert-info">
            No se encontraron resultados para tu búsqueda.
        </div>
    `;
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
    .sticky-top {
        z-index: 1;
    }
`;
document.head.appendChild(style);
