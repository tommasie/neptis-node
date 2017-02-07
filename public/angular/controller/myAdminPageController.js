var app = angular.module("myAdminPage",['ngAnimate','ui.bootstrap','preferences']);
          
app.controller("myAdminPageController",['$scope','$http','SharedPreferences',function($scope,$http,SharedPreferences){
    $scope.server = SharedPreferences.nodeServer;
    $scope.logout =  function (){
        console.log("Logout selected");
        $http.get($scope.server + 'logout_admin')
            .then(function(response) {
                if(response.status === 200)
                    window.location = response.headers("Location");
        });
    };
}]);
