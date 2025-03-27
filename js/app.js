const API_KEY = "60a0e5bab7msh8cae9556ead86adp1f39a0jsn34cf68f6923e";
const API_HOST = "spotify23.p.rapidapi.com";

// Variable global para almacenar los resultados de la búsqueda
let searchResults = {
    songs: [],
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
        searchResults.artists = data.artists?.items || [];

        if (searchResults.songs.length > 0) showResults("songs");
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
        const previewUrl = track.preview_url;  // Aquí obtenemos el preview_url

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
                            <button onclick="playSong('${previewUrl}')" class="btn btn-sm btn-success flex-grow-1" ${previewUrl ? '' : 'disabled'}>
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
                        <div class="d-flex flex-column gap-2">
                            <button onclick="getArtistAlbums('${artistId}', '${artistName}')" 
                                    class="btn btn-info w-100">
                                <i class="fas fa-compact-disc me-1"></i> Álbumes
                            </button>
                            <button onclick="getArtistTopSongs('${artistId}', '${artistName}')" 
                                    class="btn btn-primary w-100">
                                <i class="fas fa-music me-1"></i> Canciones Populares
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Función para obtener álbumes de un artista
async function getArtistAlbums(artistId, artistName) {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><p>Cargando álbumes...</p></div>';

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
                            <img src="${coverArtUrl}" class="card-img-top" alt="Portada del álbum">
                            <div class="card-body">
                                <h5 class="card-title">${album.name || "Álbum desconocido"}</h5>
                                <p class="card-text text-muted">${releaseYear}</p>
                            </div>
                            <div class="card-footer bg-transparent">
                                <button onclick="getAlbumTracks('${albumId}', '${artistName}', '${artistId}')" 
                                        class="btn btn-primary w-100">
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

// Función para obtener canciones populares del artista
async function getArtistTopSongs(artistId, artistName) {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><p>Cargando canciones populares...</p></div>';

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
        const data = await response.json();

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>Canciones populares de ${artistName}</h3>
                <button onclick="showResults('artists')" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
            <div class="row row-cols-1 row-cols-md-3 g-4">
        `;

        if (data.data?.artist?.discography?.singles?.items) {
            data.data.artist.discography.singles.items.forEach(item => {
                const track = item.releases.items[0];
                const coverArtUrl = getOptimizedImageUrl(track.coverArt?.sources?.[0]?.url);
                const trackId = track.id;
                const spotifyUrl = `https://open.spotify.com/track/${trackId}`;

                html += `
                    <div class="col">
                        <div class="card h-100">
                            <img src="${coverArtUrl}" class="card-img-top" alt="Portada del single">
                            <div class="card-body">
                                <h5 class="card-title">${track.name || "Canción desconocida"}</h5>
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
        } else {
            html += '<div class="col-12"><p class="text-muted">No se encontraron canciones populares.</p></div>';
        }

        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        console.error("Error al obtener canciones populares:", error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar las canciones populares: ${error.message}
                <button onclick="showResults('artists')" class="btn btn-outline-secondary mt-2">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
        `;
    }
}

// Función para obtener canciones de un álbum
async function getAlbumTracks(albumId, artistName, artistId) {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><p>Cargando canciones...</p></div>';

    try {
        // Primero obtenemos los metadatos del álbum para la portada
        const metadataUrl = `https://${API_HOST}/albums/?ids=${albumId}`;
        // Luego las pistas del álbum
        const tracksUrl = `https://${API_HOST}/album_tracks/?id=${albumId}&offset=0&limit=50`;
        
        const options = {
            method: "GET",
            headers: {
                "x-rapidapi-key": API_KEY,
                "x-rapidapi-host": API_HOST
            }
        };

        // Hacemos ambas peticiones en paralelo
        const [metadataResponse, tracksResponse] = await Promise.all([
            fetch(metadataUrl, options),
            fetch(tracksUrl, options)
        ]);

        const [metadata, tracksData] = await Promise.all([
            metadataResponse.json(),
            tracksResponse.json()
        ]);

        // Obtenemos la portada del álbum
        const albumCover = metadata.albums?.[0]?.images?.[0]?.url || 
                         tracksData.data?.album?.coverArt?.sources?.[0]?.url;

        const albumData = tracksData.data?.album;
        const coverArtUrl = getOptimizedImageUrl(albumCover, 300);

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>${albumData?.name || 'Álbum'} - ${artistName}</h3>
                <button onclick="getArtistAlbums('${artistId}', '${artistName}')" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
            <div class="row">
                <div class="col-md-3 text-center mb-4">
                    <img src="${coverArtUrl}" class="img-fluid rounded shadow" alt="Portada del álbum">
                    <h5 class="mt-3">${albumData?.name || 'Álbum'}</h5>
                    <p class="text-muted">${artistName}</p>
                    ${albumData?.date?.year ? `<p class="text-muted">${albumData.date.year}</p>` : ''}
                </div>
                <div class="col-md-9">
                    <div class="list-group">
        `;

        if (albumData?.tracks?.items) {
            albumData.tracks.items.forEach((item, index) => {
                const track = item.track;
                const duration = formatDuration(track.duration?.totalMilliseconds);
                const trackId = track.uri?.split(':')[2] || '';
                const spotifyUrl = `https://open.spotify.com/track/${trackId}`;
                
                html += `
                    <div class="list-group-item list-group-item-action">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge bg-secondary me-2">${index + 1}</span>
                                <strong>${track.name || "Pista desconocida"}</strong>
                                <small class="text-muted ms-2">${duration}</small>
                            </div>
                            <div class="d-flex gap-2">
                                <a href="${spotifyUrl}" target="_blank" class="btn btn-sm btn-outline-primary">
                                    <i class="fab fa-spotify"></i>
                                </a>
                                ${trackId ? `
                                <button onclick="playSong('${trackId}')" class="btn btn-sm btn-success">
                                    <i class="fas fa-play"></i>
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>`;
            });
        } else {
            html += '<div class="list-group-item text-muted">No se encontraron pistas en este álbum.</div>';
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        console.error("Error al obtener las pistas del álbum:", error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar las canciones: ${error.message}
                <button onclick="getArtistAlbums('${artistId}', '${artistName}')" class="btn btn-outline-secondary mt-2">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
        `;
    }
}

// Función para simular la reproducción de la canción, aunque en si fue para obtener las id para las pruebas
/*function playSong(trackId) {
    alert(`Reproduciendo canción con ID: ${trackId}\n\nEn una implementación real, aquí se integraría con la API de Spotify`);
}*/
let currentAudio = null;

function playSong(previewUrl) {
    if (!previewUrl) {
        alert("No hay vista previa disponible para esta canción.");
        return;
    }

    // Detener cualquier otra reproducción en curso
    if (currentAudio) {
        currentAudio.pause();
    }

    // Crear y reproducir el audio
    currentAudio = new Audio(previewUrl);
    currentAudio.play();
}


// Función para cuando un resultado no existe
function showNoResults() {
    document.getElementById("resultsContainer").innerHTML = `
        <div class="alert alert-info">
            No se encontraron resultados para tu búsqueda.
        </div>
    `;
}

// Estilos para las imagenes y tarjetas de la pagina
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
    .text-muted {
        color: #b3b3b3 !important;
    }
    #resultsContainer {
        min-height: 300px;
    }
    .list-group-item {
        border-left: none;
        border-right: none;
        background-color: #181818;
        color: white;
        border-color: #333;
    }
    .list-group-item:hover {
        background-color: #282828;
    }
    .alert {
        background-color: #282828;
        color: white;
        border: none;
    }
    .alert-danger {
        background-color: #3e1e1e;
    }
    .alert-info {
        background-color: #1e3e3e;
    }
    .badge.bg-secondary {
        background-color: #535353 !important;
    }
    h1, h2, h3, h4, h5, h6 {
        color: white;
    }
`;
document.head.appendChild(style);
