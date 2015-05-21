/**
 * Search module
 * @module search
 */
var loadJSON = require("./utilities/ajax").loadJSON;

/**
 * @callback searchCallback
 * @param {Object[]} data - An array of objects that represent possible matches to data. The data are mapped over a formatter to provide a consistent interface.
 */

/**
 * Dispatches search for possible matches to a query, Mention#search.
 *
 * Mention#search
 * @memberof Mention.prototype
 * @this Mention
 * @param {searchCallback} callback - Callback that handles the possible matches
 */
function search(qry, callback) {
    var searcher = this.options.ajax ? this.ajaxSearch : this.staticSearch;
    searcher.call(this, qry, callback);
}



module.exports = function addSearch(Mentions) {
    Mentions.prototype.search = search;

    Mentions.prototype.staticSearch = function staticSearch(qry, callback) {
        var data = this.options.choices.filter(staticFilter);
        if (!callback) noCallbackError("staticSearch");
        callback(data);
    };

    Mentions.prototype.ajaxSearch = function ajaxSearch(qry, callback) {
        // TODO - remember last ajax request, and if it's still pending, cancel it.
        //       ... to that end, just use promises.

        if (ajaxSearch.latest) ajaxSearch.latest.abort();

        var path = this.options.ajax.path,
            formatData = this.options.ajax.format,
            queryParameter = this.options.ajax.queryParameter,
            qryString = path + "?" + queryParameter + "=" + encodeURIComponent(qry);

        ajaxSearch.latest = loadJSON(qryString, ajaxSuccess(callback, formatData), ajaxError);
    };
};

function staticFilter(choice) {
    // TODO - use case insensitive regexp
    return choice.name.toLowerCase().indexOf(qry.toLowerCase()) !== -1;
}

function ajaxSuccess(callback, formatter) {
    return function(data) {
        if (callback) callback(data.map(formatter));
        else noCallbackError("ajaxSearch");
    };
}

function ajaxError(error) {
    console.log("Loading json errored...", error);
}

function noCallbackError(functionName) {
    console.log("Warning!", functionName, "was not provided a callback. Don't be a ding-dong.");
}