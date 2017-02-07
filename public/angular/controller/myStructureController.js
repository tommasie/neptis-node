var app = angular.module("myCreation", ['ngSanitize', 'ui.select', 'ui.bootstrap', 'ui-notification', 'preferences', 'nemLogging', 'ui-leaflet'])
    //Configuration for angular-ui-notification
    .config(function (NotificationProvider) {
        NotificationProvider.setOptions({
            delay: 10000,
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

app.controller("myStructureCtrl", ['$scope', '$http', 'Notification', 'SharedPreferences', function ($scope, $http, Notification, SharedPreferences) {

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
        selected: 'Select a structure'
    };
    $scope.structure = [{
            name: 'City'
        },
        {
            name: 'Museum'
        },
        {
            name: 'Opened Museum'
        }
    ];

    $scope.comune = {};
    $scope.comune.selected = "";

    $scope.importCity = function (region) {
        $scope.comuni = [];
        $scope.comune = [];
        $http.get('/resources/italia_comuni.json')
            .then(function (response) {
                comuniList = response.data;
                // console.log("file dei comuni senza toJson ",comuniList.regioni["Abruzzo"]);
                for (i = 0; i < comuniList.regioni.length; i++) {
                    console.log("Sono nel ciclo del file json,regione selezionata è ", region);
                    if (comuniList.regioni[i].nome === region) {
                        console.log("dentro if ", comuniList.regioni[i]);
                        for (j = 0; j < comuniList.regioni[i].province.length; j++) {
                            //item = {};
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
                //console.log("prova array ",$scope.comuni);

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
                    console.log(coords);
                    $scope.center.lat = coords.lat;
                    $scope.center.lng = coords.lng;
                    $scope.center.zoom = 14;
                }
            });
    }

    //
    var latlng;
    var latitude;
    var longitude;
    $scope.markers = new Array();
    $scope.$on('leafletDirectiveMap.click', function (event, args) {
        console.log(args.leafletEvent.latlng);
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

    $scope.rooms = {};
    $scope.rooms.currRooms = [];
    $scope.rooms.currRooms.selected = "";

    $scope.rooms.roomA = "";
    $scope.rooms.roomB = "";
    $scope.addedRooms = false;
    var roomAdjMap = {};
    $scope.addRoomLink = function () {
        var obj = roomAdjMap[$scope.rooms.roomA.name];
        if (obj === null) {
            obj = {};
            obj.name = $scope.rooms.roomA.name;
            obj.list = [];
        }
        var list = obj.list;
        list.push($scope.rooms.roomB.name);
        obj.list = list;
        roomAdjMap[$scope.rooms.roomA.name] = obj
        console.log(roomAdjMap)
    }

    $scope.filterRooms = function (value) {
        return value !== $scope.rooms.roomA;
    };

    var attractions = {}
    var attractionsc = [];
    $scope.add2 = function (structure) {
        switch (structure) {
        case 'City':
            //TODO controlla che sia stato aggiunto il marker
            attractionsc.push({
                name: $scope.attractionName,
                latitude: latitude,
                longitude: longitude,
                city: ""
            });
            var msg = "Added " + $scope.attractionName + " to city " + $scope.comune.selected.name;
            Notification.success({
                message: msg,
                delay: 2000
            });
            $scope.attractionName = "";
            $scope.markers.pop();
            break;

        case 'Museum':
            var area = $scope.noArea ? $scope.museumName : $scope.areaName;
            if ($scope.rooms.currRooms.map(function (e) {
                    return e.name;
                }).indexOf(area) === -1)
                $scope.rooms.currRooms.push({
                    name: area
                });
            console.log($scope.rooms.currRooms);
            var obj = attractions[area];
            if (obj === null) {
                obj = {};
                obj.name = area;
                obj.attractions = [];
            }
            var list = obj.attractions;
            var attr = {}
            attr.name = $scope.attractionName;
            attr.areaM = area;
            list.push(attr);
            obj.attractions = list;
            attractions[area] = obj;
            var msg = "Added " + $scope.attractionName + " to area " + area;
            Notification.success({
                message: msg,
                delay: 2000
            });
            console.log(attractions);
            $scope.attractionName = "";
            break;

        }
    }
    // se usiamo select bootstrap,la citta sara $scope.comune.selected.name e la regione $scope.comune.selected.region
    $scope.add = function (structure) {
        console.log("città ", $scope.comune.selected.name, "regione ", $scope.comune.selected.region, "la struttura scelta è ", structure);
        switch (structure) {
        case 'City':
            toSend = {
                name: $scope.comune.selected.name,
                region: $scope.comune.selected.region,
                attractions: JSON.stringify(attractionsc),
            };
            $http({
                    url: $scope.server + 'addCity', //senza niente qui,metti * in app.post()
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
            console.log("valore checkbox ", $scope.noArea);
            console.log("attractions:", attractions);
            var toSend = {
                city: $scope.comune.selected.name,
                region: $scope.comune.selected.region,
                museumName: $scope.museumName,
                attractions: JSON.stringify(attractions)
            };

            $http({
                    url: $scope.server + 'addMuseum', //senza niente qui,metti * in app.post()
                    method: "POST",
                    data: $.param(toSend),
                    responseType: "application/json",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                })
                .then(function (response) {
                    console.log("risposta dal server aggiunta museo ", response.data);
                    if (response.status === 200) {
                        $scope.addedRooms = true;
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
            break;
        case 'Opened Museum':
            toSend = {
                city: $scope.comune.selected.name,
                region: $scope.comune.selected.region,
                museumName: $scope.museumName,
                area: $scope.areaName,
                attraction: $scope.attractionName
            };
            $http({
                    url: $scope.server + 'addOpenedMuseum', //senza niente qui,metti * in app.post()
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
                    if (response.data.error === 0) {
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

            break;
        }
    };
    $scope.parser2 = function (structure) {
        switch (structure) {
        case 'Museum':
            var toSend = {
                links: JSON.stringify(roomAdjMap)
            };
            $http({
                    url: $scope.server + 'test', //senza niente qui,metti * in app.post()
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
                    if (response.data.error === 0) {
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
        }
    }
    $scope.parser = function (structure) {
        switch (structure) {
        case 'City':
            toSend = {
                name: $scope.comune.selected.name,
                region: $scope.comune.selected.region,
                type: structure
            };
            $http({
                    url: $scope.server + 'create-pddl', //senza niente qui,metti * in app.post()
                    method: "POST",
                    data: $.param(toSend),
                    responseType: "application/json",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                })
                .then(function (response) {
                    // console.log("  result ",response.data.result);
                    if (response.data.result === '1') {
                        Notification.success({
                            message: 'Operation completed!',
                            delay: 2000
                        });
                        return;
                    } else {
                        Notification.error({
                            message: 'Operation Failed!Something wrong,retry!',
                            delay: 2000
                        });
                        return;
                    }

                });
            break;
        case 'Museum':
        case 'Opened Museum':
            toSend = {
                cityName: $scope.comune.selected.name,
                region: $scope.comune.selected.region,
                type: structure,
                museumName: $scope.museumName
            };
            $http({
                    url: $scope.server + 'create-pddl', //senza niente qui,metti * in app.post()
                    method: "POST",
                    data: $.param(toSend),
                    responseType: "application/json",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                })
                .then(function (response) {
                    /// console.log(" parsing ",response.data);
                    if (response.data.result === '1') {
                        Notification.success({
                            message: 'Operation completed!',
                            delay: 2000
                        });
                        return;
                    } else {
                        Notification.error({
                            message: 'Operation Failed!Something wrong,retry!',
                            delay: 2000
                        });
                        return;
                    }
                });
            break;
        }
    };
}]);