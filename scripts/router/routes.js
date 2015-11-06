mpApp.config(function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'views/home.html'
        })
        .when('/hypem', {
            templateUrl: 'views/hypem.html',
            controller: 'mpAppHypeMController'
        }).when('/8tracks', {
            templateUrl: 'views/8tracks.html',
            controller: 'mpApp8tracksController'
        }).when('/manage', {
            templateUrl: 'views/manage.html',
            controller: 'mpAppDownloadsController'
        })
        .otherwise({
            redirectTo: '/'
        });
});