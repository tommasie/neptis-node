var app = angular.module("indexPageApp",['ngMessages','ngAnimate','ui.bootstrap','preferences']);
          
app.controller("indexPageController",['$scope','$http','SharedPreferences',function($scope,$http,SharedPreferences){

    $scope.server = SharedPreferences.nodeServer; //server url for node server route
    
    $scope.badgeid;
    $scope.password;
    
    $scope.inputError = false; 
    $scope.pwdWrong = false;
    
    $scope.submitted = false;

    $scope.check = function(data){
        console.log(data);
        $scope.submitted = true;
        var id = $scope.badgeid;
        var pwd = $scope.password;
        var msg = {badgeid: id,password: pwd};
        $http({
            url: $scope.server+'login_admin',
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
}]);
