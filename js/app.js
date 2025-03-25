const API_KEY = "60a0e5bab7msh8cae9556ead86adp1f39a0jsn34cf68f6923e";
const API_HOST = "spotify23.p.rapidapi.com";

let searchResults = {
    songs: [],
    albums: [],
    artists: []
};

// Función para obtener URL de imagen optimizada
function getOptimizedImageUrl(url, width = 200) {
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
                const releaseYear = albumData.date?.year || "Año desconocido";

                html += `
                    <div class="col">
                        <div class="card h-100">
                            <img src="${coverArtUrl}" class="card-img-top" alt="Portada del álbum">
                            <div class="card-body">
                                <h5 class="card-title">${albumData.name || "Álbum desconocido"}</h5>
                                <p class="card-text">${artistNames}</p>
                                <p class="card-text text-muted">${releaseYear}</p>
                            </div>
                            <div class="card-footer bg-transparent">
                                <button onclick="showAlbumDetails('${albumId}', 'albums')" 
                                        class="btn btn-primary w-100">
                                    <i class="fas fa-music"></i> Ver Canciones
                                </button>
                            </div>
                        </div>
                    </div>`;
            });
            html += '</div>';
        }
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
async function showAlbumDetails(albumId, backButtonType = 'albums') {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><p>Cargando álbum...</p></div>';

    try {
        // Primero obtenemos los metadatos del álbum
        const metadataUrl = `https://${API_HOST}/album_metadata/?id=${albumId}`;
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

        const metadata = await metadataResponse.json();
        const tracksData = await tracksResponse.json();

        // Construimos el HTML para mostrar la información
        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>Detalles del Álbum</h3>
                <button onclick="showResults('${backButtonType}')" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
        `;

        // Mostrar información básica del álbum
        if (metadata.data?.album) {
            const album = metadata.data.album;
            const coverArtUrl = getOptimizedImageUrl(album.coverArt?.sources?.[0]?.url, 300);
            const artistNames = album.artists?.items?.map(artist => artist.profile?.name).join(", ") || "Artista desconocido";
            const spotifyUrl = `https://open.spotify.com/album/${albumId}`;

            html += `
                <div class="row mb-4">
                    <div class="col-md-3 text-center">
                        <img src="${coverArtUrl}" class="img-fluid rounded mb-3" alt="Portada del álbum">
                        <a href="${spotifyUrl}" target="_blank" class="btn btn-sm btn-outline-primary w-100">
                            <i class="fab fa-spotify"></i> Abrir en Spotify
                        </a>
                    </div>
                    <div class="col-md-9">
                        <h2>${album.name || "Álbum desconocido"}</h2>
                        <h5 class="text-muted">${artistNames}</h5>
                        <p class="text-muted">${album.date?.year || "Año desconocido"}</p>
                    </div>
                </div>
            `;
        }

        // Mostrar las pistas del álbum
        html += '<h4 class="mb-3">Canciones</h4><div class="list-group">';
        
        if (tracksData.data?.album?.tracks?.items) {
            tracksData.data.album.tracks.items.forEach((item, index) => {
                const track = item.track;
                const duration = formatDuration(track.duration?.totalMilliseconds);
                const trackId = track.uri?.split(':')[2] || '';
                const spotifyUrl = `https://open.spotify.com/track/${trackId}`;
                
                html += `
                    <div class="list-group-item list-group-item-action">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-secondary me-3">${index + 1}</span>
                                <div>
                                    <strong>${track.name || "Pista desconocida"}</strong>
                                    <div class="text-muted small">${duration}</div>
                                </div>
                            </div>
                            <div class="d-flex gap-2">
                                <a href="${spotifyUrl}" target="_blank" class="btn btn-sm btn-outline-primary">
                                    <i class="fab fa-spotify"></i>
                                </a>
                                <button onclick="playSong('${trackId}')" class="btn btn-sm btn-success">
                                    <i class="fas fa-play"></i>
                                </button>
                            </div>
                        </div>
                    </div>`;
            });
        } else {
            html += '<div class="list-group-item text-muted">No se encontraron pistas en este álbum.</div>';
        }
        
        html += '</div>';
        resultsContainer.innerHTML = html;
        
    } catch (error) {
        console.error("Error al obtener detalles del álbum:", error);
        resultsContainer.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar el álbum: ${error.message}
                <button onclick="showResults('${backButtonType}')" class="btn btn-outline-secondary mt-2">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
        `;
    }
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
                        <button onclick="getArtistTopSongs('${artistId}', '${artistName}')" class="btn btn-sm btn-info w-100">
                            <i class="fas fa-music"></i> Canciones populares
                        </button>
                    </div>
                </div>
            </div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Función para obtener detalles del álbum
async function getArtistAlbums(artistId, artistName) {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><p>Cargando álbumes...</p></div>';

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
                const coverArtUrl = getOptimizedImageUrl(album.coverArt?.sources?.[0]?.url, 200);
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
                                <button onclick="showAlbumDetails('${albumId}', 'artists')" 
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
        resultsContainer.innerHTML = html;
    } catch (error) {
        console.error("Error al obtener álbumes del artista:", error);
        resultsContainer.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar los álbumes: ${error.message}
                <button onclick="showResults('artists')" class="btn btn-outline-secondary mt-2">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
        `;
    }
}


// Función para obtener canciones populares del artista (usando artist_singles)
async function getArtistTopSongs(artistId, artistName) {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><p class="mt-2">Cargando canciones...</p></div>';

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
            <div class="row row-cols-1 row-cols-md-3 g-4">
        `;

        if (data.data?.artist?.discography?.singles?.items) {
            data.data.artist.discography.singles.items.forEach(single => {
                const track = single.releases.items[0];
                const coverArtUrl = getOptimizedImageUrl(track.coverArt?.sources?.[0]?.url);
                const artistNames = track.artists?.items?.map(artist => artist.profile?.name).join(", ") || artistName;
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
        } else {
            html = '<div class="alert alert-info w-100">No se encontraron canciones para este artista.</div>';
        }

        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        console.error("Error al obtener canciones del artista:", error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar las canciones: ${error.message}
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
`;
document.head.appendChild(style);
