//import http library to make HTTP requests.
var request = require('request');
//import filesystem library to read files.
var fs = require("fs");
//import a library for asynchronous processing
var async = require("async");
//read the file name
var fileName = process.argv[2];
//read and store the list of cities as an array
var cities = fs.readFileSync(fileName).toString().split('\n').filter(v => v != '');

//regular expression to match the input as a valid city name.
var cityNameRegex = /^[a-z\s\-A-Z]*$/;
//regular expression to match the input to a valid 5 digit US zipcode country pair.
var zipRegex = /^([0-9]{5}),(us|US)$/;
//regular expression to match the input to a valid coordinate pair
var coordinatesRegex = /^([-+]?\d{1,2}([.]\d+)?),\s*([-+]?\d{1,3}([.]\d+)?)$/;

//array to store all operations to process asynchronously
var operations = [];

//for each city in cities create a http request and push it to operations
cities.forEach(function(city) {
    //if input matches a city name create http request url accordingly
    if (city.match(cityNameRegex) !== null) {
        operations.push(function(cb) {
            request('http://api.openweathermap.org/data/2.5/weather?q=' + city + '&APPID=7da574ed52c552e6ad9209354553f404', function(error, response, body) {
                //parse body from a json string to a javascript object and return it if no error is received
                if (!error && response.statusCode == 200) {
                    cb(null, JSON.parse(body));
                } else {
                    //If there is no error but the call was unsuccessful. Show that to the user but do not throw an error. Example: When the city is not found.
                    if (response.statusCode !== 200) {
                        console.log(JSON.parse(body).message + " " + city)
                        cb(null, undefined);
                    } else {
                        //return error if an error is received
                        cb(new Error(error), null);
                    }
                }
            });
        });
        //if input matches zip,country pair create http request url accordingly
    } else if (city.match(zipRegex) !== null) {
        operations.push(function(cb) {
            request('http://api.openweathermap.org/data/2.5/weather?zip=' + city + '&APPID=7da574ed52c552e6ad9209354553f404', function(error, response, body) {
                //parse body from a json string to a javascript object and return it if no error is received
                if (!error && response.statusCode == 200) {
                    cb(null, JSON.parse(body));
                } else {
                    //If there is no error but the call was unsuccessful. Show that to the user but do not throw an error. Example: When the city is not found.
                    if (response.statusCode !== 200) {
                        console.log(JSON.parse(body).message + " " + city)
                        cb(null, undefined);
                    } else {
                        //return error if an error is received
                        cb(new Error(error), null);
                    }
                }
            });
        });
        //if input matches a coordinate pair create http request url accordingly
    } else if (city.match(coordinatesRegex) !== null) {
        operations.push(function(cb) {
            var lat = city.match(coordinatesRegex)[1];
            var lon = city.match(coordinatesRegex)[3];
            request('http://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lon + '&APPID=7da574ed52c552e6ad9209354553f404', function(error, response, body) {
                //parse body from a json string to a javascript object and return it if no error is received
                if (!error && response.statusCode == 200) {
                    cb(null, JSON.parse(body));
                } else {
                    //If there is no error but the call was unsuccessful. Show that to the user but do not throw an error. Example: When the city is not found.
                    if (response.statusCode !== 200) {
                        console.log(JSON.parse(body).message + " " + city)
                        cb(null, undefined);
                    } else {
                        //return error if an error is received
                        cb(new Error(error), null);
                    }
                }
            });
        });
    } else {
        //if the input doesnt match any given format it has a formatting error. Skip those inputs and show a message to tell the user
        console.log("Error in city input format: " + city);
    }
});

async.series(operations, function(error, results) {
    if (error) {
        console.log(error);
    } else {
        // Filter all undefined entries that occur if the api call is unsuccessful. Example: When the city is not found.
        results = results.filter(v => v != undefined)
            //Sort the result in descending order of latitude
        results.sort(function(left, right) {
            return right.coord.lat - left.coord.lat;
        });
        //For each result print name,coordinates and the current weather description
        results.forEach(function(result) {
            console.log(result.name + ' - ' + result.coord.lat + ',' + result.coord.lon + ' - ' + result.weather[0].description);
        });
    }
});
