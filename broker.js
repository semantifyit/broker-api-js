/**
 * Class Broker
 */

function Broker() {

    /* for calling self methods */
    var self = this;


    /**
     * variable for websiteApiKey
     *
     * @param string $websiteApiKey ;
     */
    var websiteApiKey;

    /**
     * variables for some api settings
     *
     * @param string $websiteKey ;
     */

    var live_server = undefined;

    var staging_server = "http://localhost:8810";


    var api_path = "api";

    var live = false;

    var jquery = true;

    var token;

    var userId;

    /**
     *
     * var for displaying errors or not
     *
     * true  => errors are shown
     * false => errors are hidden
     *
     * @var boolean
     */
    var error = false;

    /**
     *
     * var for debugging
     *
     * true  => debugging is on
     * false => debugging is off
     *
     * @var boolean
     */
    var debug = false;
    var step = 0;

    /**
     * Checking for jquery
     *
     * @param string $key
     */

    if (!jQuery) {
        jquery = false;
    }


    /**
     * Setters and getters
     * */


    /**
     * @return int
     */
    this.getLive = function () {
        return live;
    };

    this.getToken = function () {
        if(typeof self.token === "undefined"){
            throw new Error("User token requested but it is not set!");
            return false;
        }
        return self.token;
    };

    this.getUserId = function () {
        if(typeof self.userId === "undefined"){
            throw new Error("User ID requested but it is not set!");
            return false;
        }
        return self.userId;
    };

    /**
     * @param int $live
     */
    this.setLive = function (live) {
        self.live = live;
    };

    this.setToken = function (token) {
        self.token = token;
    };

    this.setUserId = function (userId) {
        self.userId = userId;
    };


    /**
     *
     * fet error reporting value
     *
     * @return boolean
     */
    this.getError = function () {
        return error;
    };


    /**
     *
     * showing errors
     * true  => errors are shown
     * false => errors are hidden
     *
     * @param boolean $error
     */
    this.setError = function (error2) {
        error = error2;
    };


    /**
     * getter for websiteApiKey
     *
     * @return string
     */
    this.getWebsiteApiKey = function () {
        //return ""
        if ((error) && ((websiteApiKey == "") || (websiteApiKey == "0"))) {
            throw new Error("Caught problem: no API key saved!");
        }
        return websiteApiKey;
    };


    /**
     * setter for websiteApiKey
     *
     * @param string $websiteApiKey
     */
    this.setWebsiteApiKey = function (websiteApiKey2) {
        websiteApiKey = websiteApiKey2;
    };


    /**
     * SemantifyIt constructor.
     *
     * @param string $key
     */


    if (typeof key === "undefined") {
        key = "";
    }

    if (key != "") {
        this.setWebsiteApiKey(key);
    }


    function isContentAvailable(input) {
        if ((input == "") || (input == false) || (strpos(input, 'error') !== false)) {
            return false;
        }

        return true;
    }


    function buildQuery(params) {

        debugMe(params);

        if(jquery){
            return jQuery.param(params);
        }else{
            var esc = encodeURIComponent;
            var query = Object.keys(params).map(k => esc(k) + '=' + esc(params[k])).join('&');
            return query;
        }

    }

    function resolve(path, obj) {
        return path.split('.').reduce(function (prev, curr) {
            return prev ? prev[curr] : null
        }, obj || self)
    }


    /* this function will replace all object occurences with type @object.b to value of object.b */

    function replaceWithObject(str, obj) {
        var output = str;
        const regex = /@(([a-zA-Z]+\.)*([a-zA-Z]+))/gm;
        let m;

        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            var original = m[0];
            var splitme = m[1];
            var replace = resolve(splitme, obj);

            output = output.replace(original, replace);

        }

        return output;
    }


    function debugMe(text) {
        if (debug) {
            step++;
            console.log("step: " + step + " text: " + text + " function: " + arguments.callee.caller.toString());
        }
    }

    /**
     *
     * transport layer for api
     *
     * @param       $type
     * @param       path
     * @param array $params
     * @return string
     */
    function transport(type, path, params, callback, settings) {

        var headers = null;
        var noApiPath = false;
        var output;
        var e_obj;

        /* set aparams to array if they are not initialized */
        if (typeof params === "undefined") {
            params = new Array();
        }

        /** url with server and path */
        var url = live_server + '/' + api_path + '/' + path;

        / * if it is in staging server than switch to staging api */
        if (live == false) {
            url = staging_server + '/' + api_path + '/' + path;
        }

        /* check settings  */
        if ((typeof settings !== "undefined")) {

            /* if no api url is needed */
            if ((settings.noApiPath !== "undefined") && (settings.noApiPath)) {

                noApiPath = true;
                url = live_server + '/' + path;
                if (live == false) {
                    url = staging_server + '/' + path;
                }

            }

            if ((settings.headers !== "undefined")) {
                headers = settings.headers;
            }
        }

        /* setting callback settings action */
        var newcallback = function (response) {
            /* check settings  */
            if ((typeof settings !== "undefined")) {


                switch (true) {

                    /* if error messages shoudl be dispayed */
                    case (typeof settings.displayErrorMessage !== "undefined"):
                        /* it is already in json */
                        if (typeof response !== "undefined" && (response.status != 200)) {
                            try {
                                var selector = settings.displayErrorMessage;
                                selector.html(response.response.message);
                            } catch (e) {
                            }
                        }
                        break;


                }
            }
            self.callbackHandler(callback, response)
        }


        switch (type) {

            case "GET":

                try {


                    var query = "";
                    if (params.length > 0) {
                        query = buildQuery(query);
                    }

                    var fullurl = url + query;

                    if (noApiPath) {
                        fullurl = url;
                    }

                    get(fullurl, headers, newcallback);

                } catch (/*Error*/ e) {

                    e_obj = e;

                    if (error) {
                        throw new Error('GET Transport Caught exception: ' + e.message);
                    }

                }
                break;

            case "POST":
            case "PATCH":
                try {
                    var fullurl = url;

                    /* determine function name automatically by type and call it */
                    if (type == "POST") {
                        post(fullurl, params, headers, newcallback);
                    }

                    if (type == "PATCH") {
                        patch(fullurl, params, headers, newcallback);
                    }

                } catch (/*Error*/ e) {

                    e_obj = e;

                    if (error) {
                        throw new Error('POST/PATCH Transport Caught exception: ' + e.message);
                    }

                }

                break;
            default:
                debugMe(type);
        }
    }

    function errorHandler(action, content) {
        if (content === false) {
            throw new Error('Error ' + action + ' content to ' + "" + url);
        }

        if (content == "") {
            //console.log('No content returned from ' + " " + action + "" + ' action at url '  + "" +  url);
            throw new Error('No content returned from ' + "" + action + "" + ' action at url ' + "" + url);
        }

        if (content == "Not Found") {
            throw new Error('Annotation Not found for ' + "" + action + "" + ' action at url ' + "" + url);
        }
    }


    function get(url, headers, callback) {
        var action = "GET";

        curl(action, url, undefined, headers, function (response) {
            errorHandler(action, response);
            self.callbackHandler(callback, response);
        });
    }

    function post(url, params, headers, callback) {

        var action = "POST";

        curl(action, url, params, headers, function (response) {
            errorHandler(action, response);
            self.callbackHandler(callback, response);
        });
    }

    function patch(url, params, headers, callback) {
        var action = "PATCH";

        curl(action, url, params, headers, function (response) {
            errorHandler(action, response);
            self.callbackHandler(callback, response);
        });
    }


    /**
     *
     * Function responsible for getting stuff from server - physical layer
     *
     * @param string $url url adress
     * @return string return content
     * @throws Exception
     */


    function curl(type, url, params, headers, callback) {
        var response = "";
        var params_string = null;

        if (typeof params !== "undefined") {
            params_string = JSON.stringify(params);
        }

        var contentType = null;
        switch (type) {
            case "POST":
                var contentType = 'application/json ; charset=utf-8';
                break;
        }


        if (jquery) {

            jQuery.ajax({
                url: url,
                async: true,
                type: type,
                data: params_string,
                contentType: contentType,
                beforeSend: function (xhr) {
                    if (typeof headers !== "undefined") {
                        for (var key in headers) {
                            if (headers.hasOwnProperty(key)) {
                                xhr.setRequestHeader(key, headers[key]);
                            }
                        }
                    }
                },
                success: function (data) {
                    response = {status: 200, response: data};
                    self.callbackHandler(callback, response);
                },
                error: function (request, status, error) {
                    response = {status: request.status, response: request.responseJSON};
                    if (request.status == 404) {
                        throw new Error('Ajax error: ' + request.message);
                    }
                    self.callbackHandler(callback, response);
                }
            });

        } else {

            throw new Error('no jquery! - api will not work');
        }
    }


    /**
     *
     * function for handlig callbacks scopes
     *
     * @param callback, response
     */
    this.callbackHandler = function (callback, response) {
        if (callback !== undefined) {
            try {
                /* local scope */
                callback(response);
            }
            catch (e) {
                try {
                    /* global scope */
                    window[callback](response);
                }
                catch (e) {
                    /* if no function than we return what we received */
                    console.log(callback + " is not a function");
                }
            }
        }
        /* if no function than we return what we received */
    }

    /**
     *
     * function for handlig callbacks scopes
     *
     * @param callback, response
     */
    this.functionHandler = function (func, callback, response) {
        if (callback !== undefined) {
            try {
                /* local scope */
                func(response, callback);
            }
            catch (e) {
                try {
                    /* global scope */
                    window[func](response, callback);
                }
                catch (e) {
                    /* if no function than we return what we received */
                    console.log(callback + " is not a function");
                }
            }
        }
        /* if no function than we return what we received */
    }


    /**
     *
     * function for decoding, it can be easily turned of if necessary
     *
     * @param $json
     * @return mixed
     */
    function decoding(json) {
        return JSON.parse(json);
    }

    /**
     *
     * sending login credentials
     *
     * @param credentials
     * @param callback
     * @return mixed
     */
    this.login = function (credentials, callback, settings) {
        transport("POST", "login/", credentials, callback, settings);
    };

    /**
     *
     * sending login credentials
     *
     * @param credentials
     * @param callback
     * @return mixed
     */
    this.userCreate = function (user_data, callback, settings) {
        return transport("POST", "user/create", user_data, callback, settings);
    };

    /**
     *
     * sending login credentials
     *
     * @param credentials
     * @param callback
     * @return mixed
     */
    this.getUser = function (callback) {
        var id = self.getUserId();
        var token = self.getToken();
        console.log(token);
        console.log(id);
        var settings = {headers: {'Authorization': 'Bearer ' + token}};
        return transport("GET", "user/" + id, undefined, callback, settings);
    };


    /**
     *
     * getting files from server
     *
     * @param url_path
     * @param callback
     * @return mixed
     */
    this.getFile = function (url_path, callback) {
        var settings = {noApiPath: true};
        return transport("GET", url_path, undefined, callback, settings);
    }


    /**
     *
     * getting view
     *
     * @param view
     * @param callback
     * @return mixed
     */
    this.getView = function (view, callback) {
        self.getFile("dashboard/views/" + view + ".html", function (data) {
            data = "<div id='" + view + "'>" + data.response + "</div>";
            self.callbackHandler(callback, data);
        });
    }

    /**
     *
     * getting dynamic view, which means data will be replaced in view
     *
     * @param view
     * @param callback
     * @return mixed
     */
    this.getDynamicView = function (view, obj, callback) {
        self.getView(view, function (data) {
            /* user replacement */
            var newdata = replaceWithObject(data, obj);
            self.callbackHandler(callback, newdata);
        });
    }


    /**
     *
     * add website to url
     */

    this.addWebsite = function (website, callback) {
        var id = self.getUserId();
        var token = self.getToken();
        var newdata = {'Website': website}
        console.log(website, callback);
        self.callbackHandler(callback, newdata);
    };


}






















