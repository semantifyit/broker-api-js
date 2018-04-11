/**
 * Class Broker
 */

function Broker() {

    /* for calling self methods */
    var self = this;

    this.live_server = "https://broker.semantify.it";

    this.staging_server = "http://localhost:8810";

    this.live_server_processor = "https://broker.semantify.it";

    this.staging_server_processor = "http://localhost:8010";


    this.api_path = "api";

    this.live = true;

    this.jquery = true;

    this.token = undefined;

    this.userId = undefined;

    this.organisationId = undefined;

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
        this.jquery = false;
    }


    /**
     * Setters and getters
     * */

    this.getLive = function () {
        return self.live;
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

    this.getOrganisationId = function () {
        if(typeof self.organisationId === "undefined"){
            throw new Error("Organisation ID requested but it is not set!");
            return false;
        }
        return self.organisationId;
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

    this.setOrganisationId = function (organisationId) {
        self.organisationId = organisationId;
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
     * broker constructor.
     *
     * @param string $key
     */


    /**
     * switch to stagging server if it is on the development server
     */
    var development = new Array("localhost");
    if(in_array(window.location.hostname,development)) {

        self.setLive(false);
        self.setError(true);
    }

    function in_array(value, array) {
        return array.indexOf(value) > -1;
    }


    function isContentAvailable(input) {
        if ((input == "") || (input == false) || (strpos(input, 'error') !== false)) {
            return false;
        }

        return true;
    }


    function buildQuery(params) {

        debugMe(params);

        if(self.jquery){
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
        var url = self.live_server + '/' + self.api_path + '/' + path;

        / * if it is in staging server than switch to staging api */
        if (self.live === false) {
            url = self.staging_server + '/' + self.api_path + '/' + path;
        }
        console.log(self.live_server);
        console.log(url);

        /* check settings  */
        if ((typeof settings !== "undefined")) {

            /* if no api url is needed */
            if ((settings.noApiPath !== "undefined") && (settings.noApiPath)) {

                noApiPath = true;
                url = self.live_server + '/' + path;
                if (self.live === false) {
                    url = self.staging_server + '/' + path;
                }

            }

            if ((settings.headers !== "undefined")) {
                headers = settings.headers;
            }

            /* api processor */
            if ((settings.useProcessorApi !== "undefined") && (settings.useProcessorApi)) {

                url = self.live_server_processor + '/'  + self.api_path + '/' + path;
                if (self.live === false) {
                    url = self.staging_server_processor + '/' + self.api_path + '/' + path;
                }

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

            case "DELETE":
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


                    if (type == "GET") {
                        get(fullurl, headers, newcallback);

                    }

                    if (type == "DELETE") {
                        del(fullurl, headers, newcallback);
                    }


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

    function del(url, headers, callback) {
        var action = "DELETE";

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
            case "PATCH":
            case "POST":
                var contentType = 'application/json ; charset=utf-8';
                break;
        }


        if (self.jquery) {

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
                        throw new Error('Ajax error: ' + request.responseText);
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
     * function for handlig callbacks scopes
     *
     * @param callback, response
     */
    this.callbackHandler = function (callback, response) {
        if (typeof callback !== "undefined") {
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
                    console.log(callback + " is not a function "+ e.message);
                    return false;
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
        if (typeof callback !== "undefined") {
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
                    console.log(func + " is not a function "+ e.message);
                    return false;
                }
            }
        }
        /* if no function than we return what we received */
    }



    this.paramCheck = function(value,name){
        if(typeof value === "undefined"){throw new Error('Parameter '+name+' is required!');}
    }


    function isEmpty(obj) {
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop))
                return false;
        }

        return JSON.stringify(obj) === JSON.stringify({});
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
    this.getUser = function (novalue, callback, settings) {
        if(typeof settings === "undefined"){settings = {};}
        var id = self.getUserId();
        var token = self.getToken();
        //console.log(token);
        //console.log(id);
        settings.headers = {'Authorization': 'Bearer ' + token};
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
    this.getFile = function (url_path, callback, settings) {
        if(typeof settings === "undefined"){settings = {};}
        settings.noApiPath = true;
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
    this.getView = function (view, callback, settings) {
        self.getFile("dashboard/views/" + view + ".html", function (data) {
            data = "<div id='" + view + "'>" + data.response + "</div>";
            self.callbackHandler(callback, data);
        },settings);
    }

    /**
     *
     * getting dynamic view, which means data will be replaced in view
     *
     * @param view
     * @param callback
     * @return mixed
     */
    this.getDynamicView = function (view, callback, settings) {
        var obj = {};
        if(typeof settings.obj === "undefined"){
            settings.obj = {};
        }

        obj = settings.obj;
        self.getView(view, function (data) {
            /* user replacement */
            var newdata = data;
            if(!isEmpty(obj)){
                 newdata = replaceWithObject(data, obj);
            }

            self.callbackHandler(callback, newdata);
        },settings);
    }


    /**
     *
     * add website to url
     */

    this.addWebsite = function (website, callback, settings) {
        if(typeof settings === "undefined"){settings = {};}
        var orgId = self.getOrganisationId();
        var token = self.getToken();

        var data = {organisation: orgId, url: website.url};
        settings.headers = {'Authorization': 'Bearer ' + token};

        transport("POST", "website/add", data, callback, settings);
    };



    /**
     *
     * remove website by id
     *
     * @param credentials
     * @param callback
     * @return mixed
     */
    this.deleteWebsite = function (websiteId,callback, settings) {
        if(typeof settings === "undefined"){settings = {};}

        if($.isPlainObject( websiteId )){
            websiteId = websiteId.id;
        }

        var token = self.getToken();
        settings.headers = {'Authorization': 'Bearer ' + token};
        return transport("DELETE", "website/" + websiteId, undefined, callback, settings);
    };


    /**
     *
     * getting list of websites based on user id
     *
     * @param credentials
     * @param callback
     * @return mixed
     */
    this.getWebsites = function (novalue,callback, settings) {
        if(typeof settings === "undefined"){settings = {};}
        var orgId = self.getOrganisationId();
        var token = self.getToken();
        settings.headers = {'Authorization': 'Bearer ' + token};
        return transport("GET", "website/list/" + orgId, undefined, callback, settings);
    };

    /**
     *
     * getting list of websites based on user id
     *
     * @param credentials
     * @param callback
     * @return mixed
     */
    this.getWebsiteCrawl = function (websiteId, callback, settings) {
        if(typeof settings === "undefined"){settings = {};}
        var token = self.getToken();
        settings.headers = {'Authorization': 'Bearer ' + token};
        return transport("GET", "website/crawl/" + websiteId, undefined, callback, settings);
    };



    /**
     *
     * patch website
     *
     * @param credentials
     * @param callback
     * @return mixed
     */
    this.patchWebsite = function (data, callback, settings) {
        if(typeof settings === "undefined"){settings = {};}

        var websiteId = data._id;

        console.log("patchWebsite",data);

        var token = self.getToken();
        settings.headers = {'Authorization': 'Bearer ' + token};
        return transport("PATCH", "website/" + websiteId, data, callback, settings);
    };



    /**
     *
     * getting processor retrieval
     *
     * @param credentials
     * @param callback
     * @return mixed
     */
    this.getProcessorWebsiteRetrieval = function (websiteId, callback, settings) {
        if(typeof settings === "undefined"){settings = {};}

        if($.isPlainObject( websiteId )){
            websiteId = websiteId.id;
        }

        settings.useProcessorApi = true;
        return transport("GET", "retrieval/website/" + websiteId, undefined, callback, settings);
    };

    /**
     *
     * set webpage to process
     */

    this.addWebsiteToProcessorRetrieval = function (websiteId, callback, settings) {
        if(typeof settings === "undefined"){settings = {};}

        if($.isPlainObject( websiteId )){
            websiteId = websiteId.id;
        }

        settings.useProcessorApi = true;
        transport("POST", "retrieval/website/" + websiteId, undefined, callback, settings);
    };



}






















