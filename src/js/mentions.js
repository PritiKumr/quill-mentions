var addFormat = require("./format"),
    addSearch = require("./search"),
    addView = require("./view");

var defaultFactory = require("./defaults/defaults");

addFormat(QuillMentions);
addSearch(QuillMentions);
addView(QuillMentions);

module.exports = QuillMentions;

/**
 * @constructor
 * @param {Object} quill - An instance of `Quill`.
 * @param {Object} [options] - User configuration passed to the mentions module. It's mixed in with defaults.
 * @property {Object} quill - Instance of quill editor.
 * @property {Object} options - Default configuration mixed in with user configuration.
 * @property {Object} container - DOM node that contains the mention choices.
 * @property {Object[]|null} currentChoices - 
 * @property {Object|null} currentMention
 */
function QuillMentions(quill, options) {

    this.quill = quill;
    this.options = defaultFactory(options);
    this.container = this.quill.addContainer(this.options.containerClassName);
    this.currentChoices = null;
    this.currentMention = null;

    this.hide();
    this.addFormat(); // adds custom format for mentions
    this.addListeners();
}

/**
 * @method
 */
QuillMentions.prototype.addListeners = function addListeners() {
    var textChangeHandler = this.textChangeHandler.bind(this),
        addMentionHandler = this.addMentionHandler.bind(this);

    this.quill.on(this.quill.constructor.events.TEXT_CHANGE, textChangeHandler);

    this.container.addEventListener('click', addMentionHandler, false);
    this.container.addEventListener('touchend', addMentionHandler, false);
};

/**
 * @method
 */
QuillMentions.prototype.textChangeHandler = function textChangeHandler(_delta) {
    var mention = this.findMention(),
        queryString,
        that;
    if (mention) {
        this.currentMention = mention;
        queryString = mention[0].replace("@", "");
        that = this;
        this.search(queryString, function(data) {
            that.currentChoices = data.slice(0, that.options.choiceMax);
            that.renderCurrentChoices();
            that.show();
        });
    }
    else if (this.container.style.left !== this.options.hideMargin) {
        this.currentMention = null;
        this.range = null;   // Prevent restoring selection to last saved
        this.hide();
    }
};

/**
 * @method
 * @return {Match}
 */
QuillMentions.prototype.findMention = function findMention() {
    var contents,
        match;

    this.range = this.quill.getSelection();
    if (!this.range) return;
    contents = this.quill.getText(0, this.range.end);
    match = this.options.matcher.exec(contents);
    return match;
};

/**
 * @method
 */
QuillMentions.prototype.renderCurrentChoices = function renderCurrentChoices() {
    if (this.currentChoices && this.currentChoices.length) {
        var choices = this.currentChoices.map(function(choice) {
            return this.options.choiceTemplate.replace("{{choice}}", choice.name).replace("{{data}}", choice.data);
        }, this).join("");
        this.container.innerHTML = this.options.template.replace("{{choices}}", choices);
    }
    else {
        // render helpful message about nothing matching so far...
        this.container.innerHTML = this.options.template.replace("{{choices}}", "<li><i>Womp womp...</i></li>");
    }
};

/**
 * @method
 */
QuillMentions.prototype.addMentionHandler = function addMentionHandler(e) {
    console.log("Current selection when a choice is clicked: ", this.range);
    var target = e.target || e.srcElement,
        insertAt = this.currentMention.index,
        toInsert = "@"+target.innerText,
        toFocus = insertAt + toInsert.length + 1;
    this.quill.deleteText(insertAt, insertAt + this.currentMention[0].length);
    this.quill.insertText(insertAt, toInsert, "mention", this.options.mentionClass);
    this.quill.insertText(insertAt + toInsert.length, " ");
    this.quill.setSelection(toFocus, toFocus);
    this.hide();
    e.stopPropagation();
};

