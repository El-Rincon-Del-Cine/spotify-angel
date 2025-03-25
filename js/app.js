const API_KEY = "60a0e5bab7msh8cae9556ead86adp1f39a0jsn34cf68f6923e";
const API_HOST = "spotify23.p.rapidapi.com";

// Variable global para almacenar los resultados de la búsqueda
let searchResults = {
    songs: [],
    albums: [],
    artists: []
};

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

        // Mostrar automáticamente la primera pestaña (canciones)
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
    resultsContainer.innerHTML = ""; // Limpiar antes de agregar nuevos resultados

    let html = "";

    if (type === "songs") {
        html += "<h3>Resultados de Canciones</h3>";
        if (searchResults.songs.length === 0) {
            html += "<p>No se encontraron canciones.</p>";
        } else {
            html += '<div class="row">';
            searchResults.songs.forEach(song => {
                const track = song.data;
                const coverArtUrl = track.albumOfTrack?.coverArt?.sources?.[0]?.url || "https://via.placeholder.com/150"; // Imagen predeterminada si no hay coverArt
                const artistNames = track.artists?.items?.map(artist => artist.profile?.name).join(", ") || "Artista desconocido"; // Artista predeterminado si no hay datos

                html += `
                    <div class="col-md-4">
                        <div class="card mb-2">
                            <img src="${coverArtUrl}" alt="Album Cover" class="card-img-top">
                            <div class="card-body">
                                <h5 class="card-title">${track.name || "Canción desconocida"}</h5>
                                <p class="card-text">Artista: ${artistNames}</p>
                                <button onclick="playSong('${track.id}')" class="btn btn-sm btn-success">Escuchar</button>
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
            const coverArtUrl = albumData.coverArt?.sources?.[0]?.url || "https://via.placeholder.com/150"; // Imagen predeterminada si no hay coverArt
            const artistNames = albumData.artists?.items?.map(artist => artist.profile?.name).join(", ") || "Artista desconocido"; // Artista predeterminado si no hay datos
            const albumId = albumData.id; // ID del álbum
            const spotifyUrl = `https://open.spotify.com/album/${albumId}`; // Enlace a Spotify

            html += `
                <div class="col-md-4">
                    <div class="card mb-2">
                        <img src="${coverArtUrl}" alt="Album Cover" class="card-img-top">
                        <div class="card-body">
                            <h5 class="card-title">${albumData.name || "Álbum desconocido"}</h5>
                            <p class="card-text">Artista: ${artistNames}</p>
                            <p class="card-text">Año: ${albumData.date?.year || "Desconocido"}</p>
                            <a href="${spotifyUrl}" target="_blank" class="btn btn-sm btn-primary">Ver en Spotify</a>
                            <button onclick="showAlbumDetails('${albumId}')" class="btn btn-sm btn-secondary">Ver Detalles</button>
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
                const imgSrc = artistData.visuals?.avatarImage?.sources?.[0]?.url || "https://via.placeholder.com/150"; // Imagen predeterminada si no hay avatar
                const artistName = artistData.profile?.name || "Artista desconocido"; // Nombre predeterminado si no hay datos

                html += `
                    <div class="col-md-4">
                        <div class="card mb-2">
                            <img src="${imgSrc}" alt="Artist Image" class="card-img-top">
                            <div class="card-body">
                                <h5 class="card-title">${artistName}</h5>
                                <button onclick="showArtistTopTracks('${artistData.uri.split(':')[2]}')" class="btn btn-sm btn-info">Ver Canciones Populares</button>
                            </div>
                        </div>
                    </div>`;
            });
            html += '</div>';
        }
    }

    resultsContainer.innerHTML = html;
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
        let html = "<h3>Canciones Populares</h3>";
        if (result.data && result.data.artist && result.data.artist.discography && result.data.artist.discography.singles && result.data.artist.discography.singles.items) {
            const singles = result.data.artist.discography.singles.items;
            html += '<div class="row">';
            singles.forEach(single => {
                const singleData = single.releases.items[0];
                const coverArtUrl = singleData.coverArt?.sources?.[0]?.url || "https://via.placeholder.com/150"; // Imagen predeterminada si no hay coverArt
                const artistNames = singleData.artists?.items?.map(artist => artist.profile?.name).join(", ") || "Artista desconocido"; // Artista predeterminado si no hay datos

                html += `
                    <div class="col-md-4">
                        <div class="card mb-2">
                            <img src="${coverArtUrl}" alt="Single Cover" class="card-img-top">
                            <div class="card-body">
                                <h5 class="card-title">${singleData.name || "Canción desconocida"}</h5>
                                <p class="card-text">Artista: ${artistNames}</p>
                                <button onclick="playSong('${singleData.id}')" class="btn btn-sm btn-success">Escuchar</button>
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

// Función para mostrar los detalles de un álbum
async function showAlbumDetails(albumId) {
    const url = `https://${API_HOST}/album_tracks/?id=${albumId}&offset=0&limit=300`;
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
        console.log("Detalles del álbum:", data);

        const resultsContainer = document.getElementById("resultsContainer");
        let html = "<h3>Detalles del Álbum</h3>";

        // Obtener las canciones correctamente
        const tracks = data.data?.album?.tracks?.items || [];

        // Mostrar información del álbum
        const album = searchResults.albums.find(album => album.data.id === albumId);
        if (album) {
            const albumData = album.data;
            const coverArtUrl = albumData.coverArt?.sources?.[0]?.url || "https://via.placeholder.com/150";
            const artistNames = albumData.artists?.items?.map(artist => artist.profile?.name).join(", ") || "Artista desconocido";

            html += `
                <div class="row">
                    <div class="col-md-4">
                        <div class="card mb-2">
                            <img src="${coverArtUrl}" alt="Album Cover" class="card-img-top">
                            <div class="card-body">
                                <h5 class="card-title">${albumData.name || "Álbum desconocido"}</h5>
                                <p class="card-text">Artista: ${artistNames}</p>
                                <p class="card-text">Año: ${albumData.date?.year || "Desconocido"}</p>
                            </div>
                        </div>
                    </div>
                </div>`;
        }

        // Mostrar las pistas del álbum
        if (tracks.length > 0) {
            html += '<div class="row">';
            tracks.forEach(track => {
                const trackName = track.name || "Canción desconocida";
                const artistNames = track.artists?.map(artist => artist.name).join(", ") || "Artista desconocido";

                html += `
                    <div class="col-md-4">
                        <div class="card mb-2">
                            <div class="card-body">
                                <h5 class="card-title">${trackName}</h5>
                                <p class="card-text">Artista: ${artistNames}</p>
                                <button onclick="playSong('${track.id || track.data?.id}')" class="btn btn-sm btn-success">Escuchar</button>
                            </div>
                        </div>
                    </div>`;
            });
            html += '</div>';
        } else {
            html += "<p>No se encontraron pistas en este álbum.</p>";
        }

        resultsContainer.innerHTML = html;
    } catch (error) {
        console.error("Error al obtener los detalles del álbum:", error);
        resultsContainer.innerHTML = "<p class='text-danger'>Error al obtener los detalles del álbum.</p>";
    }
}

// Función para simular la reproducción de una canción
function playSong(trackId) {
    alert(`Reproduciendo canción con ID: ${trackId}`);
}
