var app = angular.module("myApp",['ngAnimate','ui.bootstrap','preferences']);
          
app.controller("myIndexController",['$scope','$http','SharedPreferences',function($scope,$http,SharedPreferences){

    $scope.server = SharedPreferences.nodeServer; //server url for node server route
    $scope.inputError = false; 
    $scope.pwdWrong = false;
    $scope.keyCaptcha = '6Lflex4TAAAAAFkPr3pxpNNskgNbUvWe9FqaWJUM';
    $scope.pass = false;
    
    /* verify captcha response */

    $scope.check = function(data){
        $scope.click = true;
        
        if(data.form === undefined || data.form.password === undefined || data.form.id === undefined) {
            $scope.inputError = true;
        }
   
        var response = grecaptcha.getResponse();
        toSend = {resp: response};
        // nodejs route to check captcha response with google
        $http({
            url:$scope.server+'check_captcha',
            method:"POST",
            data: $.param(toSend),
            responseType: "application/json",
            headers: {'Content-Type': 'application/x-www-form-urlencoded',
                       'Accept': 'application/json' 
                    }
            })
            .then(function(response){
                if(response.data.ok){
                    $scope.pass = true;
                    var id = data.form.id;
                    var pwd = data.form.password;
                    console.log("utente è "+id+",password è "+pwd);
                    var msg = {badgeid: id,password: pwd};
                    $http({
                        url: $scope.server+'login_admin', //senza niente qui,metti * in app.post()
                        method:"POST",
                        data: $.param(msg),
                        responseType: "application/json",
                        headers: {'Content-Type': 'application/x-www-form-urlencoded',
                                   'Accept': 'application/json' 
                                }
                        }).then(function(response) {
                            switch(response.status) {
                                case 200:
                                    console.log(response.headers("Location"));
                                    window.location = response.headers("Location");
                                    break;
                                case 500:
                                    $scope.pwdWrong = true;
                                    break;
                            }
                    });  
                }
                else $scope.pass = false;
            });
    };
}]);
