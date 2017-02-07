/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* serverNode url is used to call node routes from angularjs controller,
 *            modify here accordingly to your nodejs server url
 *
 *  
 */



angular.module('preferences',[]);
angular.module('preferences').service('SharedPreferences',function(){
            var pref =  {
                //serverNode: 'http://127.0.0.1:9070/'  // node js server 84.220.134.235
                serverNode: 'http://neptistest.asuscomm.com:9070/'
            };
            
             return{
                nodeServer: pref.serverNode 
            };
});
