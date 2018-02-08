
/**
 * Class Broker
 */

function Broker()
{

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

    var live_server = "https://semantify.it";

    var staging_server = "http://localhost:8810";


    var api_path = "api";

    var live = false;

    var jquery = true;

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

    if(!jQuery) {
        jquery = false;
    }


    /**
     * Setters and getters
     * */


    /**
     * @return int
     */
    this.getLive = function ()
    {
        return live;
    };


    /**
     * @param int $live
     */
    this.setLive = function (live2)
    {
        live = live2;
    };




    /**
     *
     * fet error reporting value
     *
     * @return boolean
     */
    this.getError = function ()
    {
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
    this.setError = function (error2)
    {
        error = error2;
    };


    /**
     * getter for websiteApiKey
     *
     * @return string
     */
    this.getWebsiteApiKey = function ()
    {
        //return ""
        if ((error) && ((websiteApiKey=="") || (websiteApiKey=="0"))){
            throw new Error("Caught problem: no API key saved!");
        }
        return websiteApiKey;
    };


    /**
     * setter for websiteApiKey
     *
     * @param string $websiteApiKey
     */
    this.setWebsiteApiKey = function (websiteApiKey2)
    {
        websiteApiKey = websiteApiKey2;
    };


    /**
     * SemantifyIt constructor.
     *
     * @param string $key
     */


    if(typeof key === "undefined"){
        key = "";
    }

    if (key != "") {
        this.setWebsiteApiKey(key);
    }






    function isContentAvailable (input)
    {
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


    function debugMe(text){
        if(debug){
            step++;
            console.log("step: "+ step + " text: "+ text+" function: "+ arguments.callee.caller.toString());
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
    function transport (type, path, params, callback, settings)
    {

        var headers = null;
        var noApiPath = false;


        /* set aparams to array if they are not initialized */
        if(typeof params === "undefined"){
            params = new Array();
        }

        /** url with server and path */
        var url = live_server  + '/' + api_path + '/'  +  path;

        / * if it is in staging server than switch to staging api */
        if (live == false) {
            url = staging_server + '/' + api_path  +  '/' +  path;
        }

        //console.log(settings);
        /* check settings  */
        if((typeof settings !== "undefined")){

            /* if no api url is needed */
            if((settings.noApiPath !== "undefined") && (settings.noApiPath)){

                noApiPath = true;
                url = live_server + '/' + path;
                if (live == false) {
                    url = staging_server + '/' + path;
                }

            }

            if((settings.headers !== "undefined")){
                headers = settings.headers;
            }
        }


        switch (type) {

            case "GET":

                try {


                    var query = "";
                    if(params.length >0){
                        query = buildQuery(query);
                    }

                    var fullurl = url +  query;

                    if(noApiPath){
                        fullurl = url;
                    }

                    return get(fullurl, headers, callback);

                } catch (/*Error*/ e) {

                    if(error){
                        throw new Error('GET Transport Caught exception: '  +  e.message );
                    }

                    return false;
                }
                break;

            case "POST":
            case "PATCH":
                try {
                    var fullurl = url;

                    /* determine function name automatically by type and call it */
                    if(type=="POST"){
                        return post( fullurl, params, headers, callback);
                    }

                    if(type=="PATCH"){
                        return patch( fullurl, params, headers, callback);
                    }

                } catch (/*Error*/ e) {
                    if(error){
                        throw new Error('POST/PATCH Transport Caught exception: '  +  e.message );
                    }

                    return false;
                }

                break;
            default:
                debugMe(type);

        }
    }

    function get(url, headers, callback)
    {

        //if allow url fopen is allowed we will use file_get_contents otherwise curl
        var content = curl("GET", url, undefined, headers, callback);

        //console.log(content);

        if (content === false) {
            throw new Error('Error getting content from '  + "" +  url);
        }

        if (content == "") {
            //throw new Error('No content received from '  + "" +  url);
            console.log('No content returned from '  + "" + ' action at url '  + "" +  url);

        }

        return content;

    }

    function post(url, params, headers, callback)
    {

        var action = "POST";
        var content = curl(action, url, params, headers, callback);

        console.log(content);

        if (content === false) {
            throw new Error('Error posting content to '  + "" +  url);
        }

        if (content == "") {
            //console.log('No content returned from ' + " " + action + "" + ' action at url '  + "" +  url);
            throw new Error('No content returned from ' + "" + action + "" + ' action at url '  + "" +  url);
        }

        return content;

    }

    function patch(url, params, headers, callback)
    {
        var action = "PATCH";
        var content = curl(action, url, params, headers, callback);

        if (content === false) {
            throw new Error('Error patching content to '  + "" +  url);
        }

        if (content == "") {
            //console.log('No content returned from ' + " " + action + "" + ' action at url '  + "" +  url);
            throw new Error('No content returned from ' + "" + action + "" + ' action at url '  + "" +  url);
        }

        if (content == "Not Found") {
            throw new Error('Annotation Not found for ' + "" + action + "" + ' action at url '  + "" +  url);
        }

        return content;

    }



    /**
     *
     * Function responsible for getting stuff from server - physical layer
     *
     * @param string $url url adress
     * @return string return content
     * @throws Exception
     */


    function curl (type, url, params, headers, callback)
    {
        var response = "";
        var params_string = null;

        if(typeof params !== "undefined"){
            params_string = JSON.stringify(params);
        }

        var contentType = null;
        switch (type){
            case "POST":
                var contentType = 'application/json ; charset=utf-8';
                break;
        }



        if(jquery){

            jQuery.ajax({
                url: url,
                async: false,
                type: type,
                data: params_string,
                contentType: contentType,
                beforeSend: function(xhr) {
                    if(typeof headers !== "undefined"){
                        for (var key in headers) {
                            if (headers.hasOwnProperty(key)) {
                                xhr.setRequestHeader(key, headers[key]);

                            }
                        }
                    }
                },
                success: function(data){
                    response = data;
                    if(callback!==undefined){
                        if (typeof callback === "function") {
                            //console.log(data)
                            callback(data);
                        }
                    }
                },
                error: function (request, status, error) {
                    response = request.responseText;
                    if(request.status==404){
                        throw new Error('Ajax error: '  +  response);
                    }
                }
            });

        }else{

            throw new Error('no jquery! - api will not work');
        }

        return response;

    }



    /**
     *
     * function for decoding, it can be easily turned of if necessary
     *
     * @param $json
     * @return mixed
     */
    function decoding (json)
    {
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
     this.login = function(credentials, callback) {
        //console.log(credentials);
        return transport("POST", "login/", credentials, callback);
     };

    /**
     *
     * getting files from server
     *
     * @param url_path
     * @param callback
     * @return mixed
     */
    this.getFile = function(url_path, callback) {
        var settings = {noApiPath:true};
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
        return self.getFile("dashboard/views/"+ view + ".html", function(data)
                {
                    /* adding id to views */
                    data = "<div id='"+view+".html'>"+data+"</div>";
                    /* user callback */
                    callback(data);
                });
    }


}






















