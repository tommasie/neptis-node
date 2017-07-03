var app = angular.module("creationApp", ['ngSanitize', 'ui.select', 'ui.bootstrap', 'ui-notification', 'preferences', 'nemLogging', 'ui-leaflet'])
    //Configuration for angular-ui-notification
    .config(function (NotificationProvider) {
        NotificationProvider.setOptions({
            delay: 2000,
            startTop: 20,
            startRight: 10,
            verticalSpacing: 20,
            horizontalSpacing: 20,
            positionX: 'right',
            positionY: 'bottom'
        });
    });

/*  prova select bootstrap      */
app.filter('propsFilter', function () {
    return function (items, props) {
        var out = [];

        if (angular.isArray(items)) {
            items.forEach(function (item) {
                var itemMatches = false;

                var keys = Object.keys(props);
                for (var i = 0; i < keys.length; i++) {
                    var prop = keys[i];
                    var text = props[prop].toLowerCase();
                    if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                        itemMatches = true;
                        break;
                    }
                }

                if (itemMatches) {
                    out.push(item);
                }
            });
        } else {
            // Let the output be the input untouched
            out = items;
        }

        return out;
    };
});

app.controller("curatorCreationController", ['$scope', '$http', 'Notification', 'SharedPreferences', function ($scope, $http, Notification, SharedPreferences) {

    $scope.server = SharedPreferences.nodeServer;
    //Leaflet options
    angular.extend($scope, {
        center: {
            lat: 41.90,
            lng: 12.4963,
            zoom: 7
        },
        events: {
            map: {
                enable: ['zoomstart', 'drag', 'click', 'mousemove'],
                logic: 'emit'
            }
        }
        /*,
        If more layers are needed, uncomment this and add layers='layers' to the leaflet tag in the HTML
        layers: {
            baselayers: {
                osm: {
                    name: 'OpenStreetMap',
                    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                            //url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
                            //url: 'http://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                            //url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
                    type: 'xyz'
                }/*,
                googleRoadmap: {
                    name: 'Google Streets',
                    layerType: 'ROADMAP',
                    type: 'google'
                },
                googleTerrain: {
                    name: 'Google Terrain',
                    layerType: 'TERRAIN',
                    type: 'google'
                },
                googleHybrid: {
                    name: 'Google Hybrid',
                    layerType: 'HYBRID',
                    type: 'google'
                }    /
            }
        }*/
    });

    $scope.region = [{
            name: 'Abruzzo'
        },
        {
            name: 'Basilicata'
        },
        {
            name: 'Calabria'
        },
        {
            name: 'Campania'
        },
        {
            name: 'Emilia-Romagna'
        },
        {
            name: 'Friuli-Venezia Giulia'
        },
        {
            name: 'Lazio'
        },
        {
            name: 'Liguria'
        },
        {
            name: 'Lombardia'
        },
        {
            name: 'Marche'
        },
        {
            name: 'Molise'
        },
        {
            name: 'Piemonte'
        },
        {
            name: 'Puglia'
        },
        {
            name: 'Sardegna'
        },
        {
            name: 'Sicilia'
        },
        {
            name: 'Toscana'
        },
        {
            name: 'Trentino-Alto Adige'
        },
        {
            name: 'Umbria'
        },
        {
            name: "Valle d' Aosta"
        },
        {
            name: 'Veneto'
        }
    ];
    $scope.regions = {};
    $scope.regions.selected = "";

    var comuniList = null;
    $scope.comuni = [];
    $scope.structure = {
        selected: '',
        structures: [
            {
                name: 'City'
            },
            {
                name: 'Museum'
            },
            {
               name: 'Opened Museum' 
            }
        ]
    };

    $scope.comune = {};
    $scope.comune.selected = "";

    $scope.importCity = function (region) {
        $scope.comuni = [];
        $scope.comune = [];
        $http.get('/resources/italia_comuni.json')
            .then(function (response) {
                comuniList = response.data;
                for (i = 0; i < comuniList.regioni.length; i++) {
                    if (comuniList.regioni[i].nome === region) {
                        for (j = 0; j < comuniList.regioni[i].province.length; j++) {
                            for (k = 0; k < comuniList.regioni[i].province[j].comuni.length; k++) {
                                item = {};
                                item['region'] = comuniList.regioni[i].nome;
                                item['name'] = comuniList.regioni[i].province[j].comuni[k].nome;

                                $scope.comuni.push(item);
                            }
                        }
                    }

                }
                $scope.comuni.sort(function (a, b) {
                    if (a.name < b.name) //sort string ascending
                        return -1;
                    if (a.name > b.name)
                        return 1;
                    return 0;
                });

                $scope.comuni.sort(function (a, b) {
                    if (a.region < b.region)
                        return -1;
                    if (a.region > b.region)
                        return 1;
                    return 0;
                });

            });
    };

    //Update map centre when choosing city
    $scope.onSelected = function (selected) {
        var apiKey = "AIzaSyD0xbJJwC7pQBzNFupb2s7orzOvB_ctSb4";
        $http({
                url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + selected.name + "," + $scope.regions.selected.name + "&key=" + apiKey,
                method: "GET",
                responseType: "json"
            })
            .then(function (response) {
                if (response.data.results.length > 0) {
                    coords = response.data.results[0].geometry.location;
                    $scope.center.lat = coords.lat;
                    $scope.center.lng = coords.lng;
                    $scope.center.zoom = 14;
                }
            });
    }

    //City
    var latlng;
    var latitude;
    var longitude;
    $scope.markers = new Array();
    $scope.$on('leafletDirectiveMap.click', function (event, args) {
        //console.log(args.leafletEvent.latlng);
        latlng = args.leafletEvent.latlng;
        $scope.markers.pop();
        $scope.markers.push({
            lat: latlng.lat,
            lng: latlng.lng,
            messages: ""
        });
        latitude = latlng.lat.toFixed(6);
        longitude = latlng.lng.toFixed(6);
    });
    
    $scope.cityAttractions = [];
    $scope.addCityAttraction = function() {
        if($scope.attractionName === "") {
            Notification.warning("Name of the attraction needed");
            return;
        }
        $scope.cityAttractions.push({
            name: $scope.attractionName,
            latitude: latitude,
            longitude: longitude,
        });
        var msg = "Added " + $scope.attractionName + " to city " + $scope.comune.selected.name;
        Notification.success({
            message: msg,
            delay: 2000
        });
        $scope.attractionName = "";
        $scope.markers.pop();
    }
    
    //Museum
    
    $scope.roomsList = [];
    $scope.addRoom = function() {
        if($scope.areaName === "") {
            Notification.warning("Name of the room needed");
            return;
        }
        $scope.roomsList.push({name:$scope.areaName, attractions:[], selected:false, adjacent:[]});
        $scope.areaName = "";
    }
    
    $scope.selectedArea;
    $scope.attractionsList = [];
    $scope.selectArea = function(area) {
        $scope.selectedArea = area;
        for(var i = 0; i < $scope.roomsList.length; i++)
            $scope.roomsList[i].selected = false;
        $scope.selectedArea.selected = true;
        $scope.attractionsList = area.attractions;
    }
    
    $scope.addAttraction = function() {
        if($scope.selectedArea === null) {
            Notification.warning("Select a room");
            return;
        }
        if($scope.attractionName === "") {
            Notification.warning("Name of the attraction needed");
            return;
        }
        $scope.selectedArea.attractions.push({name:$scope.attractionName});
        $scope.attractionName = "";
    };
    
    $scope.selectedAdjArea = {};
    $scope.addAdjRoom = function() {
        if($scope.selectedArea === null) {
            Notification.warning("Select a room");
            return;
        }
        if($scope.selectedAdjArea.selected.name === "") {
            Notification.warning("Name of the room needed");
            return;
        }
        $scope.selectedArea.adjacent.push($scope.selectedAdjArea.selected.name);
    };
    
    $scope.startEndRooms = {};
    
    $scope.filterRooms = function (value) {
        return value !== $scope.selectedArea;
    };
    
    $scope.finish = function() {
        var toSend;
        switch($scope.structure.selected.name) {
            case 'City':
                toSend = {
                    name: $scope.comune.selected.name,
                    region: $scope.comune.selected.region,
                    attractions: JSON.stringify($scope.cityAttractions),
                };
                $http({
                        url: $scope.server + 'addCity',
                        method: "POST",
                        data: $.param(toSend),
                        responseType: "json",
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        }
                    })
                    .then(function (response) {
                        if (response.status === 200) {
                            Notification.success({
                                message: 'Operation completed!',
                                delay: 2000
                            });
                            return;
                        } else {
                            Notification.error({
                                message: 'An error occurred,retry!',
                                delay: 2000
                            });
                            return;
                        }
                    });
                $scope.attractionName = "";
                $scope.markers.pop();
                break;
            case 'Museum':
                if($scope.startEndRooms.start === null || $scope.startEndRooms.end === null) {
                    Notification.warning("Set the starting and ending rooms");
                    return;
                }
                var museumDescription = {
                    startRoom : $scope.startEndRooms.start.name,
                    endRoom : $scope.startEndRooms.end.name,
                    attractions : $scope.roomsList
                }
                toSend = {
                    city: $scope.comune.selected.name,
                    region: $scope.comune.selected.region,
                    museumName: $scope.museumName,
                    attractions: JSON.stringify($scope.roomsList),
                    startRoom : $scope.startEndRooms.start.name,
                    endRoom : $scope.startEndRooms.end.name
                };
                console.log(toSend);
                $http({
                    url: $scope.server + 'addMuseum',
                    method: "POST",
                    data: $.param(toSend),
                    responseType: "application/json",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                })
                .then(function (response) {
                    console.log("*** risposta dal server aggiunta museo ", response.data, "***");
                    console.log(JSON.stringify(response));
                    if (response.status === 200) {
                        Notification.success({
                            message: 'Operation completed!',
                            delay: 2000
                        });
                        return;
                    } else {
                        Notification.error({
                            message: 'An error occurred, try again!',
                            delay: 2000
                        });
                        return;
                    }
                });
                break;
        }
    }
}]);