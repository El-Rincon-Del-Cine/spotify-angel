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

// app.js
document.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.getElementById('search-button');
  const searchInput = document.getElementById('search-input');
  const albumsResults = document.getElementById('albums-results');
  const artistsResults = document.getElementById('artists-results');
  const tracksResults = document.getElementById('tracks-results');

  searchButton.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    if (query) {
      const results = await searchSpotify(query);
      displayResults(results);
    }
  });

  async function searchSpotify(query) {
    const options = {
      method: 'GET',
      url: 'https://spotify23.p.rapidapi.com/search/',
      params: {
        q: query,
        type: 'multi',
        offset: '0',
        limit: '10',
        numberOfTopResults: '5'
      },
      headers: {
        'X-RapidAPI-Key': '60a0e5bab7msh8cae9556ead86adp1f39a0jsn34cf68f6923e',
        'X-RapidAPI-Host': 'spotify23.p.rapidapi.com'
      }
    };

    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
  }

  function displayResults(results) {
    if (!results) return;

    // Mostrar álbumes
    albumsResults.innerHTML = results.albums?.items.map(album => `
      <div class="card animate__fadeIn">
        <img src="${album.data.coverArt.sources[0].url}" class="card-img-top" alt="${album.data.name}">
        <div class="card-body">
          <h5 class="card-title">${album.data.name}</h5>
        </div>
      </div>
    `).join('');

    // Mostrar artistas
    artistsResults.innerHTML = results.artists?.items.map(artist => `
      <div class="card animate__fadeIn">
        <img src="${artist.data.visuals.avatarImage.sources[0].url}" class="card-img-top" alt="${artist.data.profile.name}">
        <div class="card-body">
          <h5 class="card-title">${artist.data.profile.name}</h5>
          <button class="btn btn-outline-success" onclick="showTopTracks('${artist.data.uri}')">
            Mostrar canciones famosas
          </button>
        </div>
      </div>
    `).join('');

    // Mostrar canciones
    tracksResults.innerHTML = results.tracks?.items.map(track => `
      <div class="card animate__fadeIn">
        <div class="card-body">
          <h5 class="card-title">${track.data.name}</h5>
          <p class="card-text">${track.data.artists.items[0].profile.name}</p>
        </div>
      </div>
    `).join('');
  }

  window.showTopTracks = async (artistUri) => {
    // Lógica para mostrar las canciones más famosas del artista
    alert(`Mostrar canciones famosas del artista: ${artistUri}`);
  };
});