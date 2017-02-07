var app = angular.module("myModification", ['ngSanitize', 'ui.select', 'ui-notification', 'preferences'])
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

app.controller("myModifyController", ['$scope','$log', '$http', 'Notification', 'SharedPreferences', 
                function($scope, $log, $http, Notification, SharedPreferences) {

    $scope.server = SharedPreferences.nodeServer;

    $scope.structure = [
        {name: 'City'},
        {name: 'Museum'},
        {name: 'Opened Museum'}
    ];

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
        console.log("*** struttura selezionata,sono changeArea ", $scope.structure.selected.name);
        if ($scope.structure.selected.name === 'Museum') {
            $scope.attractionJSON = [];
            toSend = {
                area: areaID
            };
            console.log("id area direttamente da select ", areaID);
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
                    console.log("risposta dal server ", response.data[0].name);
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
                    //serviva per provare parser-- console.log("minuti della coda prima attrazione ",response.data);
                });
        }
        if ($scope.structure.selected.name === 'Opened Museum') {
            $scope.attractionJSON = [];
            toSend = {
                area: areaID
            };
            console.log("id area direttamente da select ", areaID);
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
                    console.log("risposta dal server ", response.data[0].name);
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
                    //serviva per provare parser-- console.log("minuti della coda prima attrazione ",response.data);
                });
        }

    };

    $scope.showAttraction = function(cityId) {
        $scope.attractionJSON = [];
        console.log("id della citta scelta :", cityId);
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
                console.log("risposta dal server ", response.data[0].name);
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
                //serviva per provare parser-- console.log("minuti della coda prima attrazione ",response.data);
            });
    };

    $scope.checkDisabledNewAreaButton = function() {
        if (!$scope.museumSel.selected) {
            return true;
        } else if ($scope.areaMSel.selected) {
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
                return true;
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
        console.log("**** test valore struttura", $scope.structure.selected.name);
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
        if (structure === 'Museum' || structure === 'Opened Museum') {
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
                console.log("Attraction disabled ok");
            });

    };

    $scope.addNewAttraction = function(structure) {

        switch (structure) {
            case 'City':
                //console.log(" attrazione inserita ",$scope.newAttr);
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
                        console.log("risposta dal server", response.data);
                        Notification.success({
                            message: 'Operation completed!',
                            delay: 2000
                        });
                        return;
                    });

                break;
            case 'Museum':
                //console.log("valore checkbox ",$scope.noArea);
                // if check box noArea is selected,the area name is the name of museum
                if ($scope.areaMSel.selected !== undefined) {
                    console.log("citta ", $scope.museumSel.selected.city, " regione ", $scope.museumSel.selected.region, " area", $scope.areaMSel.selected.areaName, " museo ", $scope.museumSel.selected.museumName);
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
                        console.log("risposta dal server aggiunta museo ", response.data);
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
                        console.log("*** risposta dal server aggiunta museo ", response.data, "***");
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
                console.log("sono in addNewArea ");
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
                        console.log("risposta dal server aggiunta area ", response.data);
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
                        console.log("*** risposta dal server aggiunta museo ", response.data, "***");
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
        console.log("sono modify attraction,struttura selezionata ", structure);

        switch (structure) {
            case 'City':
                console.log("sono in modifyAttraction ");
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
                        console.log("risposta dal server modifica attrazione ", response.data);
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
                console.log("sono in modifyAttraction ");
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
                        console.log("risposta dal server modifica attrazione ", response.data);
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
                        console.log("*** risposta dal server aggiunta museo ", response.data, "***");
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
        console.log("sono modify area,struttura selezionata ", structure);

        switch (structure) {
            case 'Museum':
                console.log("sono in modifyArea ");
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
                        console.log("risposta dal server modifica area ", response.data);
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
                        console.log("*** risposta dal server aggiunta museo ", response.data, "***");
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
                        $log.log("risposta dal server modifica area ", response.data);
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
                        console.log("*** risposta dal server aggiunta museo ", response.data, "***");
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
                    .then(function(response) {
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
