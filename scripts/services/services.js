mpApp.factory('mpAppFactory', function ($q, $http) {
    return {
        loadSoundManager: function () {
            soundManager.setup({
              url: '../../assets/soundmanager2/',
              onready: function() {
                // var mySound = soundManager.createSound({
                //   id: 'TESTINGSONG',
                //   url:  'https://api.soundcloud.com/tracks/194229344/stream/?client_id=1ddf1e8a5d50bddd4086210abea3ef63'//'http://api.soundcloud.com/tracks/193830642/stream?consumer_key=nH8p0jYOkoVEZgJukRlG6w'
                // });

                // mySound.play(); // Playing before load crashes app?
              },
              ontimeout: function() {
                console.log("SM2 could not start"); // Hrmm, SM2 could not start. Missing SWF? Flash blocked? Show an error, etc.?
              }
            });
        }
    }
});

mpApp.factory('mpAppHypeMFactory', function ($q, $http) {
    return {
        getHypePopList: function() {
            var hypePoplist =[];
            return $http.get('http://hypem.com/playlist/popular/3day/json/1/data.js')
                .then(function(response) {
                    return $q(function(resolve, reject) {
                        for (var songPos = 0; songPos < 21; ++songPos){
                            if (songPos == 20){
                                resolve(hypePoplist);
                            }
                            hypePoplist.push(response.data[songPos]);
                        }
                    });
                });
        },
        scAuth: function() {
            return $http.post('https://api.soundcloud.com/oauth2/token', 
            {
                grant_type: 'password',
                client_id: '1ddf1e8a5d50bddd4086210abea3ef63',
                client_secret: '06b45e9e8eed1cd1db6a9e0cc0f82131',
                username: 'pbtesting',
                password: 'testing',
                scope: 'non-expiring'
            });
        },
        getServeURL: function(metaId) {
            return $http.get('http://hypem.com/track/' + metaId)
                .then(function(response) {
                    try {
                        var script = JSON.parse($(response.data).find('#displayList-data').text());
                        return $http.get('http://hypem.com/serve/source/' + metaId + '/' +script.tracks[0].key + '?_=' + new Date().getTime());
                    } catch (e) {
                        //TODO: Handle when the track id does not exist
                        console.log("ERROR: ", e)
                    }
                });
        },
        //get Stream URL Via Search
        getStreamURL: function(title, artist) {
            var params = {
                q: title + ' ' + artist,
                client_id: '1ddf1e8a5d50bddd4086210abea3ef63'
            };
            return $http.get('http://api.soundcloud.com/tracks/?q=' + params.q + '&client_id=' + params.client_id).then(function(response) {
                return $q(function(resolve, reject){
                    //TODO: Check if response has nothing, process with error
                    resolve(response.data[0].stream_url + '/?client_id=' + params.client_id);
                });
            });
        }
    };
});
 
// mpApp.factory('mpApp8tracksFactory', function ($resource) {
//     return $resource('http://moviestub.cloudno.de/bookings');
// });