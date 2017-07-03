var app = angular.module("editApp", ['ngSanitize', 'ui.select', 'ui-notification', 'preferences','ui-leaflet'])
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
app.filter('propsFilter', function() {
    return function(items, props) {
        var out = [];

        if (angular.isArray(items)) {
            items.forEach(function(item) {
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

app.controller("curatorEditController", ['$scope','$log', '$http', 'Notification', 'SharedPreferences', 
                function($scope, $log, $http, Notification, SharedPreferences) {

    $scope.server = SharedPreferences.nodeServer;
    
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

    $scope.citySel = {};
    $scope.cityJSON = [];

    $scope.museumSel = {};
    $scope.museumJSON = [];

    $scope.areaMSel = {};
    $scope.areaMJSON = [];

    $scope.attractionSel = {};
    $scope.attractionSel = {
        selected: undefined
    };
    $scope.attractionJSON = [];
    
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
            
        $http({
            url: $scope.server + "get_city/",
            method: "GET",
            responseType: "json"
        }).then(function(response) {
            console.log(response);
        });
    }
    
    $scope.change = function() {
        struct = $scope.structure.selected.name;
        $log.info("La strutture scelta è ", struct);
        
        switch (struct) {
            case 'City':
                $http.get($scope.server + 'get_city', {
                    responseType: "application/json",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                })
                .then(function(response) {
                    $log.info("Total items ", response.data.length);
                    cityList = response.data;
                    for (i = 0; i < cityList.length; i++) {
                        item = {
                            cityName: cityList[i].name,
                            region: cityList[i].region,
                            cityId: cityList[i].id
                        };
                        $scope.cityJSON.push(item);
                    }
                    $scope.cityJSON.sort(function(a, b) {
                        //Sort by region, then by city name
                        if (a.region < b.region)
                            return -1;
                        if (a.region > b.region)
                            return 1;
                        if (a.cityName < b.cityName)
                            return -1;
                        if (a.cityName > b.cityName)
                            return 1;
                        return 0;
                    });
                });
                break;
            case 'Museum':
                $scope.museumJSON = [];
                $scope.museumSel = {};
                $http.get($scope.server + 'get_museum', {
                    responseType: "application/json",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                })
                .then(function(response) {
                    $log.info("Total items ", response.data.length);
                    museumList = response.data;
                    $log.debug("museumList", museumList);
                    for (i = 0; i < museumList.length; i++) {
                        item = {
                            city: museumList[i].city.name,
                            cityId: museumList[i].city.id,
                            region: museumList[i].city.region,
                            museumName: museumList[i].name,
                            museumId: museumList[i].id
                        };
                        $scope.museumJSON.push(item);
                    }

                    $scope.museumJSON.sort(function(a, b) {
                        //Sort by region, city name and finally museum name
                        if (a.region < b.region)
                            return -1;
                        if (a.region > b.region)
                            return 1;
                        if (a.city < b.city)
                            return -1;
                        if (a.city > b.city)
                            return 1;
                        if (a.museumName < b.museumName)
                            return -1;
                        if (a.museumName > b.museumName)
                            return 1;
                        return 0;
                    });
                });
                break;
            case 'Opened Museum':
                $scope.museumJSON = [];
                $scope.museumSel = {};
                $http.get($scope.server + 'get_oam', {
                    responseType: "application/json",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                })
                .then(function(response) {
                    $log.info("Total items ", response.data.length);
                    museumList = response.data;
                    for (i = 0; i < museumList.length; i++) {
                        item = {
                            city: museumList[i].city.name,
                            region: museumList[i].city.region,
                            museumName: museumList[i].name,
                            museumId: museumList[i].id
                        };
                        $scope.museumJSON.push(item);
                    }
                    $scope.museumJSON.sort(function(a, b) {
                        //Sort by region, city name and finally museum name
                        if (a.region < b.region)
                            return -1;
                        if (a.region > b.region)
                            return 1;
                        if (a.city < b.city)
                            return -1;
                        if (a.city > b.city)
                            return 1;
                        if (a.museumName < b.museumName)
                            return -1;
                        if (a.museumName > b.museumName)
                            return 1;
                        return 0;
                    });
                });
                break;
        }
    };

    $scope.changeMuseum = function(museumId) {
        struct = $scope.structure.selected.name;
        switch(struct) {
            case 'Museum':
                $scope.areaMSel = {};
                $scope.areaMJSON = [];
                $scope.attractionJSON = [];
                toSend = {
                    id: museumId
                };
                $http({
                    url:$scope.server + 'get_aream',
                    method:'POST',
                    data: $.param(toSend),
                    responseType: "application/json",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                })
                .then(function(response) {
                    $log.debug("risposta dal server:", response.data[0].name);
                    areaList = response.data;
                    for (i = 0; i < areaList.length; i++) {
                        item = {
                            areaName: areaList[i].name,
                            areaId: areaList[i].id
                        };
                        $scope.areaMJSON.push(item);
                    }
                    $scope.areaMJSON.sort(function(a, b) {
                        if (a.areaName < b.areaName)
                            return -1;
                        if (a.areaName > b.areaName)
                            return 1;
                        return 0;
                    });
                });
                break;
            case 'Opened Museum':
                $scope.areaMSel = {};
                $scope.areaMJSON = [];
                $scope.attractionJSON = [];
                toSend = {
                    id: museumId
                };
                $http({
                    url:$scope.server + 'get_areaOam',
                    method:'POST',
                    data: $.param(toSend),
                    responseType: "application/json",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                })
                .then(function(response) {
                    $log.debug("risposta dal server ", response.data[0].name);
                    areaList = response.data;
                    for (i = 0; i < areaList.length; i++) {
                        item = {
                            areaName: areaList[i].name,
                            areaId: areaList[i].id
                        };
                        $scope.areaMJSON.push(item);
                    }
                    $scope.areaMJSON.sort(function(a, b) {
                        if (a.areaName < b.areaName)
                            return -1;
                        if (a.areaName > b.areaName)
                            return 1;
                        return 0;
                    });
                });
                break
        }
    };

    $scope.changeArea = function(areaID) {
            $log.info("*** struttura selezionata,sono changeArea ", $scope.structure.selected.name);
        if ($scope.structure.selected.name === 'Museum') {
            $scope.attractionJSON = [];
            toSend = {
                area: areaID
            };
            $log.info("id area direttamente da select ", areaID);
            $http({
                    url: $scope.server + 'get_attractionm',
                    method: "POST",
                    data: $.param(toSend),
                    responseType: "application/json",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                })
                .then(function(response) {
                    attractionList = response.data;
                    for (i = 0; i < attractionList.length; i++) {
                        item = {};
                        item['attractionName'] = attractionList[i].name;
                        item['attractionId'] = attractionList[i].id;
                        $scope.attractionJSON.push(item);
                    }
                    $scope.attractionJSON.sort(function(a, b) {
                        if (a.areaName < b.areaName) //sort string ascending
                            return -1;
                        if (a.areaName > b.areaName)
                            return 1;
                        return 0;
                    });
                    //serviva per provare parser-- $log.info("minuti della coda prima attrazione ",response.data);
                });
        }
        if ($scope.structure.selected.name === 'Opened Museum') {
            $scope.attractionJSON = [];
            toSend = {
                area: areaID
            };
            $log.info("id area direttamente da select ", areaID);
            $http({
                    url: $scope.server + 'get_attractionOam',
                    method: "POST",
                    data: $.param(toSend),
                    responseType: "application/json",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                })
                .then(function(response) {
                    $log.info("risposta dal server ", response.data[0].name);
                    attractionList = response.data;
                    for (i = 0; i < attractionList.length; i++) {
                        item = {};
                        item['attractionName'] = attractionList[i].name;
                        item['attractionId'] = attractionList[i].id;
                        $scope.attractionJSON.push(item);
                    }
                    $scope.attractionJSON.sort(function(a, b) {
                        if (a.areaName < b.areaName) //sort string ascending
                            return -1;
                        if (a.areaName > b.areaName)
                            return 1;
                        return 0;
                    });
                    //serviva per provare parser-- $log.info("minuti della coda prima attrazione ",response.data);
                });
        }

    };

    $scope.showAttraction = function(cityId) {
        $scope.attractionJSON = [];
        $log.info("id della citta scelta :", cityId);
        toSend = {
            city: cityId
        };
        $http({
                url: $scope.server + 'get_attractionC',
                method: "POST",
                data: $.param(toSend),
                responseType: "application/json",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }
            })
            .then(function(response) {
                attractionList = response.data;
                for (i = 0; i < attractionList.length; i++) {
                    item = {
                        attractionName: attractionList[i].name,
                        attractionId: attractionList[i].id
                    };
                    $scope.attractionJSON.push(item);
                }
                $scope.attractionJSON.sort(function(a, b) {
                    if (a.areaName < b.areaName)
                        return -1;
                    if (a.areaName > b.areaName)
                        return 1;
                    return 0;
                });
            });
    };

    $scope.checkDisabledNewAreaButton = function() {
        if (!$scope.museumSel.selected) {
            return true;
        } else if ($scope.areaMSel.selected) {
            $log.debug("checkDisablArea",$scope.areaMSel.selected);
            return true;
        }
        return false;
    };

    $scope.checkDisabledNewAttrButton = function() {
        if ($scope.museumSel.selected) {
            if ($scope.areaMSel.selected) {
                if (!$scope.attractionSel.selected) {
                    return false;
                }
            }
            return true;
        }
        if ($scope.citySel.selected) {
            if (!$scope.attractionSel.selected) {
                return false;
            }
            return true;
        }
        return true;
    };

    $scope.clearAttr = function($event) {
        $event.stopPropagation();
        $scope.attractionSel.selected = undefined;
    };

    $scope.clearArea = function($event) {
        $event.stopPropagation();
        $scope.areaMSel.selected = undefined;
    };
    
    /** when deleting a city,delete all instances of museum/attraction/oam  **/
    $scope.disable = function(attraction) {
        structure = $scope.structure.selected.name;
        if (structure === 'City') {
            cityId = $scope.citySel.selected.cityId;
            attrId = attraction.attractionId;
            name = attraction.attractionName;
            toSend = {
                id_attr: attrId,
                struct: structure,
                id_city: cityId,
                name: name
            };
        }
        else {
            areaId = $scope.areaMSel.selected.areaId;
            attrId = attraction.attractionId;
            name = attraction.attractionName;
            toSend = {
                id_attr: attrId,
                struct: structure,
                id_area: areaId,
                name: name
            };
        }

        $http({
                url: $scope.server + 'disableAttr',
                method: "POST",
                data: $.param(toSend),
                responseType: "application/json",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }
            })
            .then(function(response) {
                $log.info("Attraction disabled ok");
            });

    };

    $scope.addNewAttraction = function(structure) {

        switch (structure) {
            case 'City':
                //$log.info(" attrazione inserita ",$scope.newAttr);
                toSend = {
                    name: $scope.citySel.selected.cityName,
                    region: $scope.citySel.selected.region,
                    attraction: $scope.newAttr
                };
                $http({
                        url: $scope.server + 'addCity', //senza niente qui,metti * in app.post()
                        method: "POST",
                        data: $.param(toSend),
                        responseType: "application/json",
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        }
                    })
                    .then(function(response) {
                        $log.info("risposta dal server", response.data);
                        Notification.success({
                            message: 'Operation completed!',
                            delay: 2000
                        });
                        return;
                    });

                break;
            case 'Museum':
                //$log.info("valore checkbox ",$scope.noArea);
                // if check box noArea is selected,the area name is the name of museum
                if ($scope.areaMSel.selected !== undefined) {
                    $log.info("citta ", $scope.museumSel.selected.city, " regione ", $scope.museumSel.selected.region, " area", $scope.areaMSel.selected.areaName, " museo ", $scope.museumSel.selected.museumName);
                    toSend = {
                        city: $scope.museumSel.selected.city,
                        region: $scope.museumSel.selected.region,
                        museumName: $scope.museumSel.selected.museumName,
                        area: $scope.areaMSel.selected.areaName,
                        attraction: $scope.newAttr
                    };
                } else {
                    toSend = {
                        city: $scope.museumSel.selected.city,
                        region: $scope.museumSel.selected.region,
                        museumName: $scope.museumSel.selected.museumName,
                        area: $scope.museumSel.selected.museumName,
                        attraction: $scope.newAttr
                    };
                }
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
                    .then(function(response) {
                        $log.info("risposta dal server aggiunta museo ", response.data);
                        Notification.success({
                            message: 'Operation completed!',
                            delay: 2000
                        });
                        return;
                    });

                break;
            case 'Opened Museum':
                toSend = {
                    city: $scope.museumSel.selected.city,
                    region: $scope.museumSel.selected.region,
                    museumName: $scope.museumSel.selected.museumName,
                    area: $scope.areaMSel.selected.areaName,
                    attraction: $scope.newAttr
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
                    .then(function(response) {
                        $log.info("*** risposta dal server aggiunta museo ", response.data, "***");
                        Notification.success({
                            message: 'Operation completed!',
                            delay: 2000
                        });
                        return;
                    });

                break;
        }
    };

    $scope.addNewArea = function(structure) {

        switch (structure) {
            case 'Museum':
                $log.info("sono in addNewArea ");
                toSend = {
                    museumId: $scope.museumSel.selected.museumId,
                    area: $scope.newArea,
                    category: structure
                };

                $http({
                        url: $scope.server + 'addNewArea', //senza niente qui,metti * in app.post()
                        method: "POST",
                        data: $.param(toSend),
                        responseType: "application/json",
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        }
                    })
                    .then(function(response) {
                        $log.info("risposta dal server aggiunta area ", response.data);
                        if (response.data.error === 0) {
                            Notification.success({
                                message: 'Operation completed!',
                                delay: 2000
                            });
                            return;
                        } else {
                            Notification.error({
                                message: 'Something goes wrong,retry!',
                                delay: 2000
                            });
                            return;
                        }

                    });

                break;
            case 'Opened Museum':
                toSend = {
                    museumId: $scope.museumSel.selected.museumId,
                    area: $scope.newArea,
                    category: structure
                };
                $http({
                        url: $scope.server + 'addNewArea', //senza niente qui,metti * in app.post()
                        method: "POST",
                        data: $.param(toSend),
                        responseType: "application/json",
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        }
                    })
                    .then(function(response) {
                        $log.info("*** risposta dal server aggiunta museo ", response.data, "***");
                        if (response.data.error === 0) {
                            Notification.success({
                                message: 'Operation completed!',
                                delay: 2000
                            });
                            return;
                        } else {
                            Notification.error({
                                message: 'Something goes wrong,retry!',
                                delay: 2000
                            });
                            return;
                        }
                    });

                break;
        }
    };

    $scope.modifyAttraction = function(structure) {
        $log.info("sono modify attraction,struttura selezionata ", structure);

        switch (structure) {
            case 'City':
                $log.info("sono in modifyAttraction ");
                toSend = {
                    cityId: $scope.citySel.selected.cityId,
                    category: structure,
                    attractionName: $scope.attrModified,
                    attractionId: $scope.attractionSel.selected.attractionId
                };

                $http({
                        url: $scope.server + 'modifyAttr', //senza niente qui,metti * in app.post()
                        method: "POST",
                        data: $.param(toSend),
                        responseType: "application/json",
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        }
                    })
                    .then(function(response) {
                        $log.info("risposta dal server modifica attrazione ", response.data);
                        if (response.data.error === 0) {
                            Notification.success({
                                message: 'Operation completed!',
                                delay: 2000
                            });
                            return;
                        } else {
                            Notification.error({
                                message: 'Something goes wrong,retry!',
                                delay: 2000
                            });
                            return;
                        }

                    });

                break;

            case 'Museum':
                $log.info("sono in modifyAttraction ");
                toSend = {
                    city: $scope.museumSel.selected.city,
                    areaId: $scope.areaMSel.selected.areaId,
                    category: structure,
                    attractionName: $scope.attrModified,
                    attractionId: $scope.attractionSel.selected.attractionId
                };

                $http({
                        url: $scope.server + 'modifyAttr', //senza niente qui,metti * in app.post()
                        method: "POST",
                        data: $.param(toSend),
                        responseType: "application/json",
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        }
                    })
                    .then(function(response) {
                        $log.info("risposta dal server modifica attrazione ", response.data);
                        if (response.data.error === 0) {
                            Notification.success({
                                message: 'Operation completed!',
                                delay: 2000
                            });
                            return;
                        } else {
                            Notification.error({
                                message: 'Something goes wrong,retry!',
                                delay: 2000
                            });
                            return;
                        }

                    });

                break;
            case 'Opened Museum':
                toSend = {
                    city: $scope.museumSel.selected.city,
                    areaId: $scope.areaMSel.selected.areaId,
                    category: structure,
                    attractionName: $scope.attrModified,
                    attractionId: $scope.attractionSel.selected.attractionId
                };
                $http({
                        url: $scope.server + 'modifyAttr', //senza niente qui,metti * in app.post()
                        method: "POST",
                        data: $.param(toSend),
                        responseType: "application/json",
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        }
                    })
                    .then(function(response) {
                        $log.info("*** risposta dal server aggiunta museo ", response.data, "***");
                        if (response.data.error === 0) {
                            Notification.success({
                                message: 'Operation completed!',
                                delay: 2000
                            });
                            return;
                        } else {
                            Notification.error({
                                message: 'Something goes wrong,retry!',
                                delay: 2000
                            });
                            return;
                        }
                    });

                break;
        }
    };

    $scope.modifyArea = function(structure) {
        $log.info("sono modify area,struttura selezionata ", structure);

        switch (structure) {
            case 'Museum':
                $log.info("sono in modifyArea ");
                toSend = {
                    city: $scope.museumSel.selected.city,
                    museumId: $scope.museumSel.selected.museumId,
                    areaId: $scope.areaMSel.selected.areaId,
                    category: structure,
                    areaName: $scope.areaModified
                };

                $http({
                        url: $scope.server + 'modifyArea', //senza niente qui,metti * in app.post()
                        method: "POST",
                        data: $.param(toSend),
                        responseType: "application/json",
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        }
                    })
                    .then(function(response) {
                        $log.info("risposta dal server modifica area ", response.data);
                        if (response.data.error === 0) {
                            Notification.success({
                                message: 'Operation completed!',
                                delay: 2000
                            });
                            return;
                        } else {
                            Notification.error({
                                message: 'Something goes wrong,retry!',
                                delay: 2000
                            });
                            return;
                        }

                    });

                break;
            case 'Opened Museum':
                toSend = {
                    city: $scope.museumSel.selected.city,
                    museumId: $scope.museumSel.selected.museumId,
                    areaId: $scope.areaMSel.selected.areaId,
                    category: structure,
                    areaName: $scope.areaModified
                };
                $http({
                        url: $scope.server + 'modifyArea', //senza niente qui,metti * in app.post()
                        method: "POST",
                        data: $.param(toSend),
                        responseType: "application/json",
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        }
                    })
                    .then(function(response) {
                        $log.info("*** risposta dal server aggiunta museo ", response.data, "***");
                        if (response.data.error === 0) {
                            Notification.success({
                                message: 'Operation completed!',
                                delay: 2000
                            });
                            return;
                        } else {
                            Notification.error({
                                message: 'Something goes wrong,retry!',
                                delay: 2000
                            });
                            return;
                        }
                    });
                break;
        }
    };

    $scope.modifyMuseum = function(structure) {
        $log.info("[modifyMuseum],struttura selezionata ", structure);
        $log.debug("Museum", $scope.museumSel.selected);
        switch (structure) {
            case 'Museum':
                toSend = {
                    city: $scope.museumSel.selected.cityId,
                    museumId: $scope.museumSel.selected.museumId,
                    category: structure,
                    museumName: $scope.museumModified
                };
                $log.debug("toSend",toSend);
                $http({
                        url: $scope.server + 'modifyMuseum',
                        method: "POST",
                        data: $.param(toSend),
                        responseType: "application/json",
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        }
                    })
                    .then(function(response) {
                        $log.info("risposta dal server modifica area ", response.data);
                        if (response.data.error === 0) {
                            Notification.success({
                                message: 'Operation completed!',
                                delay: 2000
                            });
                            return;
                        } else {
                            Notification.error({
                                message: 'Something goes wrong,retry!',
                                delay: 2000
                            });
                            return;
                        }

                    });

                break;
            case 'Opened Museum':
                toSend = {
                    city: $scope.museumSel.selected.cityId,
                    museumId: $scope.museumSel.selected.museumId,
                    category: structure,
                    museumName: $scope.museumModified
                };
                $http({
                        url: $scope.server + 'modifyMuseum', //senza niente qui,metti * in app.post()
                        method: "POST",
                        data: $.param(toSend),
                        responseType: "application/json",
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        }
                    })
                    .then(function(response) {
                        $log.info("*** risposta dal server aggiunta museo ", response.data, "***");
                        if (response.data.error === 0) {
                            Notification.success({
                                message: 'Operation completed!',
                                delay: 2000
                            });
                            return;
                        } else {
                            Notification.error({
                                message: 'Something goes wrong,retry!',
                                delay: 2000
                            });
                            return;
                        }
                    });
                break;
        }
    };

    $scope.parser = function(structure) {
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
                    .then(function(response) {
                        // $log.info("  result ",response.data.result);
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
                    .then(function(response) {
                        /// $log.info(" parsing ",response.data);
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
