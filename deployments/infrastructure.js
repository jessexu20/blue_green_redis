#!/bin/sh
var http = require('http');
var httpProxy = require('http-proxy');
var exec = require('child_process').exec;
var request = require("request");
var redis = require('redis')

var GREEN = 'http://127.0.0.1:5060';
var BLUE = 'http://127.0.0.1:9090';
var greenclient = redis.createClient(6380, '127.0.0.1', {})
var blueclient = redis.createClient(6379, '127.0.0.1', {})
var TARGET = BLUE;
var mirror=true;
var infrastructure =
{
    setup: function () {
        // Proxy.
        var options = {};
        var proxy = httpProxy.createProxyServer(options);

        var server = http.createServer(function (req, res) {
            proxy.web(req, res, {target: TARGET});
        });
        server.listen(8181);

        // Launch blue slice

        exec('forever start -w --watchDirectory ../blue-www ../blue-www/main.js 9090');
        console.log("blue slice");

        // Launch green slice
        exec('forever start -w --watchDirectory ../green-www ../green-www/main.js 5060');
        console.log("green slice");

        //exec('forever start ../../redis-2.8.19/src/redis-server --port 6379');
        //console.log("blue redis start up");
        //
        //exec('forever start ../../redis-2.8.19/src/redis-server --port 6380');
        //console.log("green redis start up");

        var count =0;
        function getCode(){
            var options = {url: "http://localhost:8181/switch"};
            request(options,function(error,res,body){
                //console.log(res.statusCode);
                //console.log(TARGET);
                if(res.statusCode==500){
                    TARGET=GREEN;
                    var server = http.createServer(function (req, res) {
                        proxy.web(req, res, {target: TARGET});
                    });
                    blueclient.llen("myimg",function(error,num){
                        console.log(num)
                        if(num!=0){
                            (blueclient.lrange("myimg",0,-1,function(err,items){
                                if(err) throw err;
                                items.forEach(function(item){
                                    greenclient.lpush('myimg',item);
                                })
                            }))
                        }
                    });
                }
                count++;
                //console.log(count);
                greenclient.llen("myimg",function(error,num){
                    //console.log(num)
                    //if(num!=0){
                    //    (blueclient.lrange("myimg",0,-1,function(err,items){
                    //        if(err) throw err;
                    //        items.forEach(function(item){
                    //            greenclient.lpush('myimg',item);
                    //        })
                    //    }))
                    //}
                });
                if(count >20)
                    clearInterval(check);

            })
        }
        var init_green=0;
        var init_blue=0;
        blueclient.llen('myimg',function(err,num){
                init_blue=num;
            }
        )
        greenclient.llen('myimg',function(err,num){
                init_green=num;
            }
        )
        console.log(init_blue);
        console.log(init_green);
        function dup(){

            var blue_flag=0;
            var green_flag=0;
            blueclient.llen('myimg',function(err,num){
                    console.log("blue now "+num+" init "+init_blue);
                    if(num>init_blue){
                        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
                        blue_flag=1;
                        init_blue=num;
                        console.log("##########################blue flag "+blue_flag+" green flag "+green_flag)
                    }
                }
            )
            console.log("blue flag "+blue_flag+" green flag "+green_flag)
            greenclient.llen('myimg',function(err,num){
                    console.log("Green now "+num+" init "+init_green);
                    if(num>init_green){
                        green_flag=1;
                        init_green=num;
                    }
                }
            )
            console.log("blue flag "+blue_flag+" green flag "+green_flag)
            if(blue_flag==1 && green_flag==0){
                blueclient.lrange("myimg",0,num-init_blue,function(err,items){
                    console.log("in blue")
                    if(err) throw err;
                    items.forEach(function(item){
                        greenclient.lpush('myimg',item);
                    })
                })
            }
            if(green_flag==1 && blue_flag==0){
                console.log("in green");
                green_flag.lrange("myimg",0,num-init_green,function(err,items){
                    if(err) throw err;
                    items.forEach(function(item){
                        blueclient.lpush('myimg',item);
                    })
                })
            }

        }

        var check= setInterval(getCode, 3*1000);

        if(mirror==true){
            var onChange=setInterval(dup,1*1000);
        }


//setTimeout
//var options = 
//{
//  url: "http://localhost:8080",
//};
//request(options, function (error, res, body) {

    },

    teardown: function () {
        exec('forever stopall', function () {
            console.log("infrastructure shutdown");
            process.exit();
        });
    },

}

infrastructure.setup();
// Make sure to clean up.
process.on('exit', function () {
    infrastructure.teardown();
});
process.on('SIGINT', function () {
    infrastructure.teardown();
});
process.on('uncaughtException', function (err) {
    console.log(err);
    infrastructure.teardown();
});
