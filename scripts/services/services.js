mpApp.factory('mpAppFactory', function ($q, $http) {
    return {
        loadSoundManager: function () {
            soundManager.setup({
              url: '../../assets/soundmanager2/',
              debugMode: false,
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

mpApp.factory('hypeMFactory', function ($q, $http) {
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

//Service that manages downloads, their queue order, and downloading a song
mpApp.factory('downloadsFactory', function ($q, $http, $rootScope, hypeMFactory) {
    var downloads = {};

    //downloadIds is used to simply used for comparators: checking which songs are queued and how many are queued
    var downloadIds = [];
    var numDownloads = 0;
    var queuePosition = 0;
    var downloadingLocked = false;

    return {
        //Used to create unique temp mp3 files for filestream
        generateId: function() {
            return '_' + Math.random().toString(36).substr(2, 9);
        },
        getDownloads: function() {
            return downloads;
        },
        getDownloadIds: function() {
            return downloadIds;
        },
        getNumDownloads: function() {
            return numDownloads;
        },
        incNumDownloads: function() {
            return ++numDownloads;
        },
        decNumDownloads: function() {
            return --numDownloads;
        },
        calculateProgress: function(song) {
            return (((parseInt(song.downloadingProgress) + parseInt(song.processingProgress)) / 200.0) * 100).toFixed();
        },
        //Queues song and returns number of current queue
        queueSongDownload: function(songMeta, callback) {
            var self = this;

            //Check downloadIds to prevent song download duplication
            if (downloadIds.indexOf(songMeta.mediaid) != -1)
                return;

            console.log("Adding: ", songMeta.title, " to downloadQ");
            downloadIds.push(songMeta.mediaid);
            var song = {};
            song.artist = songMeta.title.toString();
            song.title = songMeta.artist.toString();
            song.totalProgress = 0;
            song.downloadingProgress = 0;
            song.processingProgress = 0;
            song.songSize = 0;
            song.downloadingCompleted = false;
            song.processingCompleted = false;
            song.failed = false;
            //TODO: Handle when getServeURL fails
            var serveLink = hypeMFactory.getServeURL(songMeta.mediaid);
            serveLink.then(function(response) {
                song.directSongURL = response.data.url;
                downloads[songMeta.mediaid] = song;
                console.log(downloads)
                callback(self.incNumDownloads());
            });
        },
        downloadFromQueue: function() {
            var self = this;
            if (downloadingLocked){
                return;
            }
            downloadingLocked = true;
            console.log("Downloading from queue; position: ", queuePosition)
            self.downloadSong(downloads[downloadIds[queuePosition++]], function() {
                downloadingLocked = false;
                self.decNumDownloads();
                if (self.getNumDownloads() > 0) {
                    self.downloadFromQueue();
                    downloadingLocked = false;
                } else {
                    //Finished downloading song - remove from services
                    return self.getNumDownloads();
                }
            });          
        },
        downloadSong: function (songMeta, callback) {
            var self = this;
            // Dependencies
            var fs = require('fs');
            var http = require('http');
            var https = require('https');

            //External npm module - ffmpeg API
            var ffmpeg = require('fluent-ffmpeg');

            var DOWNLOAD_DIR = './';
            var file_name = songMeta.artist + " - " + songMeta.title + ".mp3";
            var temp_mp3 = self.generateId() + '.mp3';

            //Creates new file stream to pipe mp3 chunks from HTTP res into
            var file = fs.createWriteStream(DOWNLOAD_DIR + temp_mp3);

            var title ='title=' + songMeta.title;
            var artist = 'artist=' + songMeta.artist;

            var downloaded = 0;

            //Get song from soundcloud's API
            http.get(songMeta.directSongURL, function(res) {
                console.log("Got response: " + res.statusCode);
                var redirectURL = res.headers.location;
                https.get(redirectURL, function(res) {
                    var totalSize = res.headers['content-length'];
                    songMeta.songSize = totalSize;

                    //Begin streaming the song chunks into a file stream
                    res.on("data", function(chunk) {
                        downloaded += chunk.length;
                        songMeta.downloadingProgress = ((downloaded / totalSize) * 100).toFixed();
                        songMeta.totalProgress = self.calculateProgress(songMeta);
                        $rootScope.$apply();
                        file.write(chunk);
                    });
                    res.on("end", function() {
                        console.log("END FILE DOWNLOAD");
                        songMeta.downloadingCompleted = true;
                        file.end();

                        //Sets ffmpeg source/path and writes meta into file
                        setFfmpeg(function() {
                            writeSongMeta();
                        });
                    });

                }).on('error', function(e) {
                  console.log("Got error: " + e.message);
                  songMeta.failed = true;
                  file.end();
                });
                // res.on("data", function(chunk) {
                //     //Soundcloud redirects us to a secure URL where the song is actually stored
                //     console.log("Chunk: ", chunk);
                //     //TODO: Handle when chunk returns nothing - request dropped?
                //     if (chunk) {
                //         var redirectURL = JSON.parse(chunk).location;
                //         https.get(redirectURL, function(res) {
                //             //Begin streaming the song chunks into a file stream
                //             res.on("data", function(chunk) {
                //                 console.log("WRITING " + ++i);
                //                 file.write(chunk);
                //             });
                //             res.on("end", function() {
                //                 console.log("END FILE DOWNLOAD")
                //                 file.end();

                //                 //Sets ffmpeg source/path and writes meta into file
                //                 setFfmpeg(function() {
                //                     writeSongMeta();
                //                 });
                //             });

                //         }).on('error', function(e) {
                //           console.log("Got error: " + e.message);
                //           file.end();
                //         });
                //     }
                // });
            }).on('error', function(e) {
              console.log("Got error: " + e.message);
              songMeta.failed = true;
              file.end();
            });

            //Set paths for ffmpeg and ffprobe before use
            function setFfmpeg (callback) {
                //TODO: Handle linux directory no bin
                fs.realpath("./ffmpeg/bin/", function(err, resolvedPath) {
                    if (err) throw err;
                    // console.log(resolvedPath)
                    //TODO: Handle linux file extensions
                    ffmpeg.setFfmpegPath(resolvedPath + "/ffmpeg.exe");
                    ffmpeg.setFfprobePath(resolvedPath + "/ffprobe.exe");
                    callback();
                });
            };

            //Inputs temp.mp3 and copys audio stream into a corrected file name mp3
            function writeSongMeta() {
                ffmpeg(temp_mp3)
                    .audioBitrate('128')
                    // .audioChannels(2)
                    .audioCodec('libmp3lame')
                    .output(file_name)
                    .outputOptions(
                        '-id3v2_version', '3',
                        '-metadata', title,
                        '-metadata', artist
                    )
                    .on('start', function(commandLine) {
                        console.log('Spawned Ffmpeg with command: ' + commandLine);
                    })
                    // .on('codecData', function(data) {
                    //     console.log('Input is ' + data.audio + ' audio ' + 'with ' + data.audio_details + ' duration ' + data.duration + ' ' + data.format);
                    // })
                    .on('progress', function(progress) {
                        console.log('Processing: ' + progress.percent.toFixed() + '% done');
                        songMeta.processingProgress = progress.percent.toFixed();
                        songMeta.totalProgress = self.calculateProgress(songMeta);
                        $rootScope.$apply();
                        // console.log('Processing: ' + progress.targetSize + ' target');
                    })
                    .on('error', function(err, stdout, stderr) {
                        console.log(err.message); //this will likely return "code=1" not really useful
                        console.log("stdout:\n" + stdout);
                        console.log("stderr:\n" + stderr); //this will contain more detailed debugging info
                        songMeta.failed = true;
                    })
                    .on('end', function() {
                        console.log('Finished processing');
                        songMeta.processingCompleted = true;
                        songMeta.processingProgress = 100.0;
                        songMeta.totalProgress = self.calculateProgress(songMeta);
                        $rootScope.$apply();
                        fs.unlinkSync(temp_mp3);
                        callback();
                    })
                    .run();
            };
        }
    };
});