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

// Función principal de búsqueda (se mantiene igual)
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

// Función para mostrar resultados (adaptada para la nueva estructura)
function showResults(type) {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "";

    let html = "";

    if (type === "songs") {
        // ... (se mantiene igual)
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
                                    <button onclick="getAlbumTracks('${albumId}', this)" 
                                            class="btn btn-sm btn-primary w-100">
                                        Ver canciones
                                    </button>
                                </div>
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
            html += '<div class="row">';
            searchResults.artists.forEach(artist => {
                const artistData = artist.data;
                const imgSrc = getOptimizedImageUrl(artistData.visuals?.avatarImage?.sources?.[0]?.url, 200);
                const artistName = artistData.profile?.name || "Artista desconocido";
                const artistId = artistData.uri.split(':')[2];

                html += `
                    <div class="col-md-4 mb-3">
                        <div class="card h-100">
                            <img src="${imgSrc}" alt="Artist Image" class="card-img-top">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${artistName}</h5>
                                <div class="mt-auto">
                                    <button onclick="getArtistAlbums('${artistId}', '${artistName}')" 
                                            class="btn btn-sm btn-info w-100">
                                        Ver Álbumes
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

// Nueva función para obtener álbumes de un artista
async function getArtistAlbums(artistId, artistName) {
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
        console.log("Álbumes del artista:", data);

        const resultsContainer = document.getElementById("resultsContainer");
        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="mb-0">Álbumes de ${artistName}</h3>
                <button onclick="showResults('artists')" class="btn btn-sm btn-outline-secondary">Volver</button>
            </div>
        `;

        if (data.data?.artist?.discography?.albums?.items) {
            const albums = data.data.artist.discography.albums.items;
            html += '<div class="row">';
            
            albums.forEach(item => {
                const album = item.releases.items[0];
                const coverArtUrl = getOptimizedImageUrl(album.coverArt?.sources?.[0]?.url, 200);
                const albumId = album.id;

                html += `
                    <div class="col-md-4 mb-3">
                        <div class="card h-100">
                            <img src="${coverArtUrl}" alt="Album Cover" class="card-img-top">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${album.name || "Álbum desconocido"}</h5>
                                <p class="card-text">Año: ${album.date?.year || "Desconocido"}</p>
                                <div class="mt-auto">
                                    <button onclick="getAlbumTracks('${albumId}', this)" 
                                            class="btn btn-sm btn-primary w-100">
                                        Ver canciones
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
            
            html += '</div>';
        } else {
            html += "<p>No se encontraron álbumes para este artista.</p>";
        }
        
        resultsContainer.innerHTML = html;
    } catch (error) {
        console.error("Error al obtener álbumes del artista:", error);
        document.getElementById("resultsContainer").innerHTML = `
            <div class="alert alert-danger">
                Error al cargar los álbumes: ${error.message}
            </div>
            <button onclick="showResults('artists')" class="btn btn-sm btn-outline-secondary">Volver</button>
        `;
    }
}

// Función para obtener canciones de un álbum (adaptada)
async function getAlbumTracks(albumId, buttonElement = null) {
    const resultsContainer = document.getElementById("resultsContainer");
    if (buttonElement) {
        buttonElement.textContent = "Cargando...";
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
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="mb-0">Canciones del Álbum</h3>
                <button onclick="showResults('albums')" class="btn btn-sm btn-outline-secondary">Volver</button>
            </div>
            <div class="list-group">
        `;
        
        if (data.data?.album?.tracks?.items) {
            data.data.album.tracks.items.forEach((item, index) => {
                const track = item.track;
                const duration = formatDuration(track.duration?.totalMilliseconds);
                const trackId = track.uri?.split(':')[2] || '';
                
                html += `
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
            html += '<div class="list-group-item text-muted">No se encontraron pistas en este álbum.</div>';
        }
        
        html += '</div>';
        resultsContainer.innerHTML = html;
    } catch (error) {
        console.error("Error al obtener las pistas del álbum:", error);
        resultsContainer.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar las pistas: ${error.message}
            </div>
            <button onclick="showResults('albums')" class="btn btn-sm btn-outline-secondary">Volver</button>
        `;
    }
}

// Función para reproducir canción (se mantiene igual)
function playSong(trackId) {
    alert(`Reproduciendo canción con ID: ${trackId}`);
}

// Añadir estilos CSS
const style = document.createElement('style');
style.textContent = `
    .card-img-top {
        width: 100%;
        height: 150px;
        object-fit: cover;
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