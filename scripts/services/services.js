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
        getHypePopList: function (page) {
            var hypePoplist =[];
            return $http.get('http://hypem.com/playlist/popular/3day/json/' + page + '/data.js')
                .then(function(response) {
                    return $q(function(resolve, reject) {
                        for (var songPos = 0; songPos < 21; ++songPos){
                            //Pages 1&2 consist only of 20 songs, page 3 has 10
                            if (songPos == 20)
                                return resolve(hypePoplist);
                            else if (songPos == 10 && page == 3) 
                                return resolve(hypePoplist);
                            else
                                hypePoplist.push(response.data[songPos]);
                        }
                    });
                });
        },
        // scAuth: function() {
        //     return $http.post('https://api.soundcloud.com/oauth2/token', 
        //     {
        //         grant_type: 'password',
        //         client_id: '1ddf1e8a5d50bddd4086210abea3ef63',
        //         client_secret: '06b45e9e8eed1cd1db6a9e0cc0f82131',
        //         username: 'pbtesting',
        //         password: 'testing',
        //         scope: 'non-expiring'
        //     });
        // },
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
        // //get Stream URL Via Search
        // getStreamURL: function(title, artist) {
        //     var params = {
        //         q: title + ' ' + artist,
        //         client_id: '1ddf1e8a5d50bddd4086210abea3ef63'
        //     };
        //     return $http.get('http://api.soundcloud.com/tracks/?q=' + params.q + '&client_id=' + params.client_id).then(function(response) {
        //         return $q(function(resolve, reject){
        //             //TODO: Check if response has nothing, process with error
        //             resolve(response.data[0].stream_url + '/?client_id=' + params.client_id);
        //         });
        //     });
        // },
        downloadSong: function (file_url) {
            // Dependencies
            var fs = require('fs');
            var url = require('url');
            var http = require('http');
            var https = require('https');
            var exec = require('child_process').exec;
            var spawn = require('child_process').spawn;

            var DOWNLOAD_DIR = './';
            var file_name = "test.mp3";
            var file = fs.createWriteStream(DOWNLOAD_DIR + file_name);

            var i = 0;

            //Get song from soundcloud's API
            http.get(file_url, function(res) {
                console.log("Got response: " + res.statusCode);

                res.on("data", function(chunk) {
                    //Soundcloud redirects us to a secure URL where the song is actually stored
                    var redirectURL = JSON.parse(chunk).location;
                    if (redirectURL) {
                        https.get(redirectURL, function(res) {
                            //Begin streaming the song chunks into a file stream
                            res.on("data", function(chunk) {
                                console.log("WRITING " + ++i);
                                file.write(chunk);
                            });
                            res.on("end", function() {

                                file.end();
                            });

                        }).on('error', function(e) {
                          console.log("Got error: " + e.message);
                          file.end();
                        });
                    }
                });
            }).on('error', function(e) {
              console.log("Got error: " + e.message);
              file.end();
            });

            // http.get(file_url, function(res) {
            //   console.log("Got response: " + res.statusCode);

            //   res.on("data", function(chunk) {
            //     console.log("BODY: " + chunk);
            //     console.log("WRITING")
            //     file.write(chunk);
            //   });
            // }).on('error', function(e) {
            //   console.log("Got error: " + e.message);
            //   file.end();
            // });
        },
        //Concats new song list to old, checking for duplicates
        concatSongs: function (originalList, extendedList, callback) {
            var songCount = extendedList.length;
            extendedList.forEach(function (song) {
                ++ songCount;
                if (originalList.indexOf(song) == -1)
                    originalList.push(song);
                if (songCount == extendedList.length)
                    callback(originalList);
            });
        }
    };
});
 
// mpApp.factory('mpApp8tracksFactory', function ($resource) {
//     return $resource('http://moviestub.cloudno.de/bookings');
// });