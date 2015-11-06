//Home controller loads only ONCE
mpApp.controller("mpAppController", function ($log, mpAppFactory, hypeMFactory, downloadsFactory, $scope, $location) {
    $scope.headerSrc = "views/header.html";

    var playingSongId = null;
    $scope.currentSong = null;
    $scope.currentPlayingSong = {};

    //Initialize progress bar
    $scope.songPosition = 0;
    $scope.songBuffered = 0;

    //HypeM popular page
    var hypePopPage = 1;
    $scope.numDownloads = 0;

    console.log("Calling mpAppController")

    //Load SoundManager 2 player
    mpAppFactory.loadSoundManager();

    //Load Top 20 from Hypemachine 
    var hypeListReady = hypeMFactory.getHypePopList(hypePopPage);
    hypeListReady.then(function(hypePoplist) {
        console.log("mpAppController: ", hypePoplist);
        $scope.topTwenty = hypePoplist;
        if ($scope.topTwenty.length != 0) {
            $scope.currentPlayingSong = $scope.topTwenty[0];

            //Initialize first song
            //if (options.playOnStartUp)
            // $scope.stream($scope.currentPlayingSong.mediaid, 0);

            // var serveLink = hypeMFactory.getServeURL($scope.currentPlayingSong.mediaid);
            // var songId = 'hype-' + $scope.currentPlayingSong.mediaid;
            // serveLink.then(function(response) {
            //     $scope.currentSong = soundManager.createSound({
            //         id: songId,
            //         url: response.data.url,
            //         onstop: function() {
            //             this.destruct();
            //         },
            //         onfinish: function() {
            //             //if (options.autoplay)
            //             this.id = 
            //         }
            //     });

            //     playingSongId = songId;
            // });
        }
    });

    //Get access token from Soundcloud for playing Hypemachine songs
    // var getSCToken = hypeMFactory.scAuth();
    // getSCToken.then(function(response){
    //     $scope.scToken = response.data.access_token;
    // });

    //Function to load when document is ready
    $(function() {
        console.log("jQuery Document.Ready being fired!");
        $("tr").hover(function() {
            console.log("hypeTwenty mouseover!");
        });
    });

    //GET stream URL and play song, cleans up upon stop or selecting a new song
    //When song is done playing, cleans up and plays next song
    $scope.stream = function(id, songIndex){
        //TODO: Check if streaming last song, load next page
        var songId = 'hype-' + id;

        if (songId == playingSongId){
            soundManager.togglePause(playingSongId);
        } else {
            //Another song was selected
            if ($scope.currentSong)
                $scope.currentSong.stop();

            $scope.currentPlayingSong = $scope.topTwenty[songIndex];

            var serveLink = hypeMFactory.getServeURL(id);
            serveLink.then(function(response) {
                console.log('Response url: ', response);
                soundManager.stopAll();
                $scope.currentSong = soundManager.createSound({
                    id: songId,
                    url: response.data.url,
                    whileloading: function() {
                        //Bytesloaded returns a %
                        var songBuffered = (this.bytesLoaded * 100).toFixed();
                        $('#songBuffer').css('width',songBuffered+'%')
                    },
                    whileplaying: function() {
                        var songPosition = ((this.position.toFixed() / this.duration) * 100).toFixed();
                        $('#songPosition').css('width',songPosition+'%')
                    },
                    onstop: function() {
                        this.destruct();
                    },
                    onfinish: function() {
                        //if (options.autoplay)
                        this.destruct();
                        var nextIndex = ++ songIndex;

                        //On autoplay: automate fetching next list
                        if (nextIndex == 19 || nextIndex == 39)
                            loadNextPoplist();

                        //Last song check
                        if (nextIndex == 50)
                            return;
                        else
                            $scope.stream($scope.topTwenty[nextIndex].mediaid, nextIndex);
                    }
                });

                playingSongId = songId;
                $scope.currentSong.play();
            });
        }
    };

    $scope.downloadSong = function(song) {
        // var serveLink = hypeMFactory.getServeURL(song.mediaid);
        // serveLink.then(function(response) {
        //     var directSongURL = response.data.url;
        //     console.log(directSongURL);
        //     console.log(song);
        //     // hypeMFactory.downloadSong(directSongURL, song);
        // });
        downloadsFactory.queueSongDownload(song, function(currNumDownloads) {
            $scope.numDownloads = currNumDownloads;

            $scope.numDownloads = downloadsFactory.downloadFromQueue();
        });
    };

    //Watch to see if downloads are queue and download
    // $scope.$watch('numDownloads', function() {
    //     console.log("Watching")
    //     if ($scope.numDownloads > 0) {
    //         downloadsFactory.downloadFromQueue(function(newCurrNumDownloads) {
    //             $scope.numDownloads = newCurrNumDownloads;
    //         });
    //     }
    // });

    //Gets next page of popular MAX:50 songs
    function loadNextPoplist() {
        var hypeListReady = hypeMFactory.getHypePopList(++hypePopPage);
        hypeListReady.then(function(hypePoplist) {
            hypeMFactory.concatSongs($scope.topTwenty, hypePoplist, function (updatedList) {
                $scope.topTwenty = updatedList;
            });
        });
    };

    //Reload new data when reaching bottom of page
    $(window).scroll(function () {
        if ($(document).height() <= $(window).scrollTop() + $(window).height())
            if (hypePopPage < 3)
                loadNextPoplist();
    });

    $scope.isActive = function (selectedUrl) { return selectedUrl === $location.path(); };
});

//Reloads everytime route redirects
mpApp.controller("mpAppHypeMController", function ($scope, hypeMFactory, $location) {
    console.log("Calling mpAppHypeMController")
    var hypeListReady = hypeMFactory.getHypePopList();

    hypeListReady.then(function(hypePoplist) {
        console.log("mpAppHypeMController: ", hypePoplist);
        $scope.topTwenty = hypePoplist;
    });
    //console.log(hypeMFactory);
    // $http.get(hypeMFactory).success(function(data, status, headers){
    //     console.log('data', data);
    //     console.log('status', status);
    //     console.log('headers', headers);
    // });

    // $scope.movies = hypeMFactory.query();
 
    $scope.currMovie = null;
    // $scope.getMovieById = function (id) {
    //     var movies = $scope.movies;
    //     for (var i = 0; i < movies.length; i++) {
    //         var movie = $scope.movies[i];
    //         if (movie.id == id) {
    //             $scope.currMovie = movie;
    //         }
    //     }
    // };
 
    // $scope.back = function () {
    //     window.history.back();
    // };
 
    // $scope.getCount = function (n) {
    //     return new Array(n);
    // }
 
    // $scope.isActive = function (route) {
    //     return route === $location.path();
    // }
 
    // $scope.isActivePath = function (route) {
    //     return ($location.path()).indexOf(route) >= 0;
    // }
 
});
mpApp.controller("mpApp8tracksController", function($scope, $routeParams){
    console.log("Calling mpApp8tracksController")

});
mpApp.controller("mpAppDownloadsController", function($scope, $routeParams, downloadsFactory){
    $scope.downloadsFactory = downloadsFactory;
    console.log("Calling mpAppDownloadsController")

    $scope.downloads = downloadsFactory.getDownloads();
    $scope.downloadIds = downloadsFactory.getDownloadIds();

    //Reactively watch for download progress in the service to update ctrlr
    $scope.$watch('downloadsFactory.getDownloads()', function (updatedDL) {
        $scope.downloads = updatedDL;
    });
});
// mpApp.controller("movieDetailsController", function ($scope, $routeParams) {
//     $scope.getMovieById($routeParams.id);
// });
// mpApp.controller("bookTicketsController", function ($scope, $http, $location, $routeParams) {
//     $scope.getMovieById($routeParams.id);
//     $scope.onlyNumbers = /^\d+$/;
//     $scope.formData = {};
//     $scope.formData.movie_id = $scope.currMovie.id;
//     $scope.formData.movie_name = $scope.currMovie.name;
//     $scope.formData.date = "Today"
 
//     $scope.processForm = function () {
//         console.log($scope.formData);
//         $http({
//             method: 'POST',
//             url: 'http://moviestub.cloudno.de/book',
//             data: $.param($scope.formData), // pass in data as strings
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             } // set the headers so angular passing info as form data (not request payload)
//         })
//             .success(function (data) {
//                 $location.path("/bookings");
//             });
//     };
// });
// mpApp.controller("bookingDetailsController", function ($scope, movieStubBookingsFactory) {
//     $scope.bookings = movieStubBookingsFactory.query();
// });