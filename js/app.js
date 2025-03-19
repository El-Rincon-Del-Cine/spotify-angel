if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('../sw.js')
            .then((registration) => {
                console.log('Service Worker registrado', registration.scope);

                // Solicita permiso para las notificaciones al cargar la página
                if (Notification.permission === "default") {
                    Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                            registration.active?.postMessage({ type: 'SHOW_NOTIFICATION' });
                        }
                    });
                } else if (Notification.permission === "granted") {
                    registration.active?.postMessage({ type: 'SHOW_NOTIFICATION' });
                }
            })
            .catch((error) => {
                console.log('Error al registrar el Service Worker:', error);
            });
    });
}

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

        // Obtener el ID del artista si existe
        if (data.artists?.items.length > 0) {
            const artist = data.artists.items[0].data; // Primer artista encontrado
            const artistId = artist.uri.split(":")[2]; // Extrae el ID del URI
            
            console.log("ID del artista encontrado:", artistId);

            // Llamar a la función para buscar los álbumes del artista
            getArtistAlbums(artistId, artist.profile.name);
        } else {
            console.warn("No se encontró el artista.");
            document.getElementById("resultsContainer").innerHTML = "<p class='text-danger'>No se encontró el artista.</p>";
        }

    } catch (error) {
        console.error("Error en la búsqueda de Spotify:", error);
        document.getElementById("resultsContainer").innerHTML = "<p class='text-danger'>Error al obtener datos.</p>";
    }
}

function showResults(type) {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "<div class='row'>";
    let html = "";

    if (type === "songs") {
        html += "<h3>Resultados de Canciones</h3>";
        searchResults.songs.forEach(song => {
            const track = song.data;
            html += `
                <div class="col-md-4">
                    <div class="card mb-2">
                        <img src="${track.albumOfTrack.coverArt.sources[0].url}" class="card-img-top">
                        <div class="card-body">
                            <h5 class="card-title">${track.name}</h5>
                            <p class="card-text">Artista: ${track.artists.items.map(a => a.profile.name).join(", ")}</p>
                            <a href="https://open.spotify.com/track/${track.id}" class="btn btn-success">Escuchar</a>
                        </div>
                    </div>
                </div>`;
        });
    } else if (type === "albums") {
        html += "<h3>Resultados de Álbumes</h3>";
        searchResults.albums.forEach(album => {
            const albumData = album.data;
            html += `
                <div class="col-md-4">
                    <div class="card mb-2">
                        <img src="${albumData.coverArt.sources[0].url}" class="card-img-top">
                        <div class="card-body">
                            <h5 class="card-title">${albumData.name}</h5>
                            <p class="card-text">Artista: ${albumData.artists.items.map(a => a.profile.name).join(", ")}</p>
                            <p class="card-text">Año: ${albumData.date.year}</p>
                            <button onclick="getAlbumDetails('${albumData.id}')" class="btn btn-primary">Ver detalles</button>
                        </div>
                    </div>
                </div>`;
        });
    } else if (type === "artists") {
        html += "<h3>Resultados de Artistas</h3>";
        searchResults.artists.forEach(artist => {
            const artistData = artist.data;
            const imgSrc = artistData.visuals?.avatarImage?.sources?.[0]?.url || "https://via.placeholder.com/50";
            html += `
                <div class="col-md-4">
                    <div class="card mb-2">
                        <img src="${imgSrc}" class="card-img-top">
                        <div class="card-body">
                            <h5 class="card-title">${artistData.profile.name}</h5>
                            <button onclick="getArtistTopTracks('${artistData.uri.split(':')[2]}')" class="btn btn-info">Ver canciones populares</button>
                        </div>
                    </div>
                </div>`;
        });
    }
    resultsContainer.innerHTML += html + "</div>";
}

async function getAlbumDetails(albumId) {
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

        if (!data.tracks?.items.length) {
            document.getElementById("resultsContainer").innerHTML = "<p class='text-warning'>No se encontraron canciones en este álbum.</p>";
            return;
        }

        let html = `<h3>Canciones del Álbum</h3><div class='row'>`;
        data.tracks.items.forEach(track => {
            html += `<div class='col-md-6'><div class='list-group-item'>${track.name}</div></div>`;
        });
        html += "</div>";

        document.getElementById("resultsContainer").innerHTML = html;
    } catch (error) {
        console.error("Error al obtener detalles del álbum:", error);
    }
}

async function getArtistSongs(artistId) {
    const url = `https://${API_HOST}/search/?q=${artistId}&type=tracks&offset=0&limit=50`;
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

        // Obtener todas las canciones y filtrar duplicados
        let uniqueSongs = [];
        let seenSongs = new Set();

        data.tracks.items.forEach(song => {
            const track = song.data;
            if (!seenSongs.has(track.id)) {
                seenSongs.add(track.id);
                uniqueSongs.push(track);
            }
        });

        // Mostrar los resultados
        let html = `<h3>Canciones del Artista</h3><div class='row'>`;
        uniqueSongs.forEach(track => {
            html += `
                <div class='col-md-4'>
                    <div class='card mb-2'>
                        <img src="${track.albumOfTrack.coverArt.sources[0].url}" class="card-img-top">
                        <div class='card-body'>
                            <h5 class='card-title'>${track.name}</h5>
                            <p class='card-text'>Álbum: ${track.albumOfTrack.name}</p>
                            <a href="https://open.spotify.com/track/${track.id}" class="btn btn-success">Escuchar</a>
                        </div>
                    </div>
                </div>`;
        });
        html += "</div>";

        document.getElementById("resultsContainer").innerHTML = html;
    } catch (error) {
        console.error("Error al obtener canciones del artista:", error);
    }
}

async function getArtistAlbums(artistId, artistName) {
    const url = `https://${API_HOST}/artist_albums/?id=${artistId}&offset=0&limit=5`;
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

        if (!data.albums?.items.length) {
            document.getElementById("resultsContainer").innerHTML = `<p class='text-warning'>No se encontraron álbumes para ${artistName}.</p>`;
            return;
        }

        let html = `<h3>Álbumes de ${artistName}</h3><div class='row'>`;
        data.albums.items.forEach(album => {
            const albumData = album.data;
            html += `
                <div class="col-md-4">
                    <div class="card mb-2">
                        <img src="${albumData.coverArt.sources[0].url}" class="card-img-top">
                        <div class="card-body">
                            <h5 class="card-title">${albumData.name}</h5>
                            <p class="card-text">Año: ${albumData.date.year}</p>
                            <button onclick="getAlbumDetails('${albumData.id}')" class="btn btn-primary">Ver canciones</button>
                        </div>
                    </div>
                </div>`;
        });
        html += "</div>";

        document.getElementById("resultsContainer").innerHTML = html;
    } catch (error) {
        console.error("Error al obtener álbumes del artista:", error);
    }
}
