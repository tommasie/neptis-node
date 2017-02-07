/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

   
var app = angular.module('myApp1',['ngMessages','preferences']);
app.controller('loginController',['$scope','$http','SharedPreferences',function($scope,$http,SharedPreferences){
    
    $scope.server = SharedPreferences.nodeServer;
    $scope.visible = false;
    
    $scope.register = function($scope){
        name = $scope.name;
        surname = $scope.surname;
        badgeId = $scope.badgeId;
        email = $scope.email;
        password = $scope.pwd;
        password2 = $scope.pwdOk;
       
        console.log("prova $scope ",$scope ," password :" ,name);
	console.log("$scope.server: ",$scope.server);
        
        if(password !== password2 || name === undefined || surname === undefined || badgeId === undefined || password === undefined || password2 === undefined){
            $scope.visible = true;
        }
        
        toSend = {name: name,surname: surname, badgeId: badgeId, email:email, pwd: password};
        
        $http({
            url: $scope.server+'registration', 
            method:"POST",
            data: $.param(toSend),
            responseType: "application/json",
            headers: {'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json' 
                           }})
            .then(function(response){
                
                       window.location = response.data.redirect;
                        });
                     //serviva per provare parser-- console.log("minuti della coda prima attrazione ",response.data);
                    
    } ;
         
}]);
