//Home controller loads only ONCE
mpApp.controller("mpAppController", function ($log, mpAppFactory, mpAppHypeMFactory, $scope, $location) {
    $scope.headerSrc = "views/header.html";

    var playingSongId = null;
    $scope.currentSong = null;
    $scope.currentPlayingSong = {};

    console.log("Calling mpAppController")

    //Load SoundManager 2 player
    mpAppFactory.loadSoundManager();

    //Load Top 20 from Hypemachine 
    var hypeListReady = mpAppHypeMFactory.getHypePopList();
    hypeListReady.then(function(hypePoplist) {
        console.log("mpAppController: ", hypePoplist);
        $scope.topTwenty = hypePoplist;
        if ($scope.topTwenty.length != 0) {
            $scope.currentPlayingSong = $scope.topTwenty[0];

            //Initialize first song
            //if (options.playOnStartUp)
            // $scope.stream($scope.currentPlayingSong.mediaid, 0);

            // var serveLink = mpAppHypeMFactory.getServeURL($scope.currentPlayingSong.mediaid);
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
    // var getSCToken = mpAppHypeMFactory.scAuth();
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
        var songId = 'hype-' + id;

        if (songId == playingSongId){
            soundManager.togglePause(playingSongId);
        } else {
            //Another song was selected
            if ($scope.currentSong)
                $scope.currentSong.stop();

            $scope.currentPlayingSong = $scope.topTwenty[songIndex];

            var serveLink = mpAppHypeMFactory.getServeURL(id);
            serveLink.then(function(response) {
                console.log('Response url: ', response);
                soundManager.stopAll();
                $scope.currentSong = soundManager.createSound({
                    id: songId,
                    url: response.data.url,
                    onstop: function() {
                        this.destruct();
                    },
                    onfinish: function() {
                        //if (options.autoplay)
                        this.destruct();
                        var nextIndex = ++ songIndex;
                        $scope.stream($scope.topTwenty[nextIndex].mediaid, nextIndex);
                    }
                });

                playingSongId = songId;
                $scope.currentSong.play();
            });
        }
    };

    // $scope.playPause = function() {
    //     var songId = 'hype-' + $scope.currentPlayingSong.mediaid;
    //     if ($scope.currentSong.paused) {
    //         $scope.currentSong.play();
    //     } else {
    //         soundManager.togglePause(songId);
    //     }
    // };

    $scope.downloadSong = function(id) {
        var serveLink = mpAppHypeMFactory.getServeURL(id);
        serveLink.then(function(response) {
            var directSongURL = response.data.url;
            mpAppHypeMFactory.downloadSong(directSongURL);
        });
    }
});

//Reloads everytime route redirects
mpApp.controller("mpAppHypeMController", function ($scope, mpAppHypeMFactory, $location) {
    console.log("Calling mpAppHypeMController")
    var hypeListReady = mpAppHypeMFactory.getHypePopList();

    hypeListReady.then(function(hypePoplist) {
        console.log("mpAppHypeMController: ", hypePoplist);
        $scope.topTwenty = hypePoplist;
    });
    //console.log(mpAppHypeMFactory);
    // $http.get(mpAppHypeMFactory).success(function(data, status, headers){
    //     console.log('data', data);
    //     console.log('status', status);
    //     console.log('headers', headers);
    // });

    // $scope.movies = mpAppHypeMFactory.query();
 
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
mpApp.controller("mpAppDownloadsController", function($scope, $routeParams){
    console.log("Calling mpAppDownloadsController")

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