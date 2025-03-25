const API_KEY = "60a0e5bab7msh8cae9556ead86adp1f39a0jsn34cf68f6923e";
const API_HOST = "spotify23.p.rapidapi.com";

let searchResults = {
    songs: [],
    albums: [],
    artists: []
};

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

        searchResults.songs = data.tracks?.items || [];
        searchResults.albums = data.albums?.items || [];
        searchResults.artists = data.artists?.items || [];

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

function showResults(type) {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "";

    let html = "";
    if (type === "albums") {
        html += "<h3>Resultados de Álbumes</h3>";
        if (searchResults.albums.length === 0) {
            html += "<p>No se encontraron álbumes.</p>";
        } else {
            html += '<div class="row">';
            searchResults.albums.forEach(album => {
                const albumData = album.data;
                const coverArtUrl = albumData.coverArt?.sources?.[0]?.url || "https://via.placeholder.com/150";
                const artistNames = albumData.artists?.items?.map(artist => artist.profile?.name).join(", ") || "Artista desconocido";
                const albumId = albumData.id;

                html += `
                    <div class="col-md-4">
                        <div class="card mb-2">
                            <img src="${coverArtUrl}" alt="Album Cover" class="card-img-top">
                            <div class="card-body">
                                <h5 class="card-title">${albumData.name || "Álbum desconocido"}</h5>
                                <p class="card-text">Artista: ${artistNames}</p>
                                <p class="card-text">Año: ${albumData.date?.year || "Desconocido"}</p>
                                <button onclick="showAlbumTracks('${albumId}', this)" 
                                        class="btn btn-sm btn-primary">
                                    Mostrar canciones
                                </button>
                            </div>
                            <div id="tracks-${albumId}" class="album-tracks-container" style="display:none;"></div>
                        </div>
                    </div>`;
            });
            html += '</div>';
        }
    }
    resultsContainer.innerHTML = html;
}

async function showAlbumTracks(albumId, buttonElement) {
    const tracksContainer = document.getElementById(`tracks-${albumId}`);
    if (tracksContainer.style.display === "block") {
        tracksContainer.style.display = "none";
        tracksContainer.innerHTML = "";
        buttonElement.textContent = "Mostrar canciones";
        return;
    }

    tracksContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div></div>';
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
        if (data.data && data.data.album && data.data.album.tracks && data.data.album.tracks.items) {
            data.data.album.tracks.items.forEach((item, index) => {
                const track = item.track;
                const durationMs = track.duration?.totalMilliseconds || 0;
                const duration = new Date(durationMs).toISOString().substr(14, 5);
                const trackId = track.uri ? track.uri.split(':')[2] : '';
                
                tracksHtml += `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge bg-secondary me-2">${index + 1}</span>
                                ${track.name || "Pista desconocida"}
                                <small class="text-muted ms-2">${duration}</small>
                            </div>
                            ${trackId ? `<button onclick="playSong('${trackId}')" class="btn btn-sm btn-outline-success">Escuchar</button>` : ''}
                        </div>
                    </div>`;
            });
        } else {
            tracksHtml += '<div class="list-group-item">No se encontraron pistas en este álbum.</div>';
        }
        tracksHtml += '</div>';
        tracksContainer.innerHTML = tracksHtml;
        buttonElement.textContent = "Ocultar canciones";
    } catch (error) {
        console.error("Error al obtener las pistas del álbum:", error);
        tracksContainer.innerHTML = `<div class="alert alert-danger">Error al cargar las pistas.</div>`;
        buttonElement.textContent = "Intentar de nuevo";
    }
}

function playSong(trackId) {
    alert(`Reproduciendo canción con ID: ${trackId}`);
}
