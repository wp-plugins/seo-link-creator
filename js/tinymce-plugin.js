/**
 * Script to be uploaded into tinyMCE
 */

com = window.com || {};
com.idilia = window.com.idilia || {};
com.idilia.apps = window.com.idilia.apps || {};

var POPUP_WIDTH = 480;
var POPUP_HEIGHT = 420;
var POPUP_HEIGHT_SMALL = 75;
var PLUGIN_TITLE = "SEO Link Creator";
var TAG_SINGLE_WORD = "Manual Link Addition";
var TAG_ALL_WORDS = "Automatic Links Addition";

var xhr = null;

// To be used from iframe opened by windowManager.open
function closeDialog() {
	tinymce.activeEditor.windowManager
	        .close( document.getElementById( 
	        		window.slc_dialog.iframeElement.id ).contentWindow );
}

function slcInitButtons() {
	tinymce.activeEditor.controlManager.get( 'button_slc_tag_all_words' )
	        .setDisabled( true );
	tinymce.activeEditor.controlManager.get( 'button_slc_tag_single_word' )
	        .setDisabled( true );
}

// sends user text to server to get tagging info
function ajaxTagSingleWord( ed, editorCursorPosition, pluginJsUrl, text ) {

	var data = { 
		action : 'slc_tag_single_word',
		text : text,
	};

	// ajaxurl is defined in the admin header and points to admin-ajax.php
	jQuery.post( ajaxurl, data, function( response ) {
		closeDialog();
		if ( response.success ) {
			var menu = response["menu"];
			confirmTagSingleWord( ed, editorCursorPosition, pluginJsUrl, menu );
		} else {
			displayError( ed, pluginJsUrl, response.errorMsg );
		}
	});
}

// sends user text to server to get tagging info
function ajaxTagAllWords( ed, editorCursorPosition, pluginJsUrl, text ) {

	var data = { 
		action : 'slc_tag_all_words',
		text : text
	};
	
	var nbOriginalAnchors = 0;
	var matches = text.match( /<a/ig );
	if ( matches ) {
		nbOriginalAnchors = matches.length;
	}
	
	// ajaxurl is defined in the admin header and points to admin-ajax.php
	xhr = jQuery.post( ajaxurl, data, function( response ) {
		closeDialog();
		if ( response.success ) {
			var newText = response["new_text"];
			var nbAnchors = 0;
			var matches = newText.match( /<a/ig );
			if ( matches ) {
				nbAnchors = matches.length;
			}
			confirmTallAllWords( ed, editorCursorPosition, pluginJsUrl, newText, nbAnchors - nbOriginalAnchors );
		} else {
			displayError( ed, pluginJsUrl, response.errorMsg );
		}
	});
}

function confirmTallAllWords( ed, editorCursorPosition, pluginJsUrl, newText, nbNewLinks ) {
	
	if ( nbNewLinks == 0 ) {
		ed.windowManager.alert( "No links found. Try manual link addition.");			
	} else {									
	    // restore selection (for IE)
		tinymce.activeEditor.selection.moveToBookmark( editorCursorPosition );	
		tinymce.activeEditor.selection.setContent( newText );
	} 			
}

function displayError( ed, pluginJsUrl, errorMsg ) {
	window.slc_dialog = ed.windowManager.open({
		file : pluginJsUrl + "/../html/error.html",
		title : PLUGIN_TITLE,
		width : POPUP_WIDTH,
		height : POPUP_HEIGHT_SMALL,
		inline : true,
	}, { 
		message : errorMsg
	});
}

// popup to edit/insert link with with tagging server info
function confirmTagSingleWord( ed, editorCursorPosition, pluginJsUrl, menu ) {
	var page = "../html/add-link.html";
	var title = PLUGIN_TITLE + " - " + TAG_SINGLE_WORD
	window.slc_dialog = ed.windowManager.open({
		file : pluginJsUrl + "/" + page,
		title : title,
		width : POPUP_WIDTH,
		height : POPUP_HEIGHT,
		inline : true,
	}, { 
		menu : menu,
		pluginJsUrl: pluginJsUrl,
		editorCursorPosition: editorCursorPosition,
	});
}

// appends custom buttons with behavior to tinymce interface
( function() {
	
	/* Register the buttons */
	tinymce.create(			
        'tinymce.plugins.SEOLinkCreatorTinymcePlugin',        
        { 
        	init : function( ed, pluginJsUrl ) {
        	
	            /**
				 * Adds HTML tag to selected content
				 */
        		ed.addButton( 'separator', {});
	
	            ed.addButton( 'button_slc_tag_single_word', {
	            	title : PLUGIN_TITLE + ' - ' + TAG_SINGLE_WORD,
	            	image : pluginJsUrl + '/../images/magiclink.png',
	            	cmd : 'button_slc_tag_single_word_cmd',
	            	disabled : true
	            });
	
	            ed.addCommand( 'button_slc_tag_single_word_cmd', function() {
	
	                var selectedText = ed.selection.getContent();
	                if ( ed.dom.getParent( 
	                		ed.selection.getStart() ).nodeName === "A" ) {	                	
	                    selectedText = ed.selection.getStart().textContent;
	                }
	                
	                // the following is for IE otherwise ed.selection is lost
	                var normalize = true;
	                var editorCursorPosition = ed.selection.getBookmark( normalize );
	
	                ajaxTagSingleWord( ed, editorCursorPosition, pluginJsUrl, selectedText );
	
	                window.slc_dialog = ed.windowManager.open({
		                file : pluginJsUrl + '/../html/loading-spinner.html',
		                title : PLUGIN_TITLE + ' - ' + TAG_SINGLE_WORD,
		                width : POPUP_WIDTH,
		                height : POPUP_HEIGHT,
		                inline : true,
	                });
	            });
	
	            ed.addButton( 'button_slc_tag_all_words', {
	                title : PLUGIN_TITLE + ' - ' + TAG_ALL_WORDS,
	                image : pluginJsUrl + '/../images/magiclinkall.png',
	                cmd : 'button_slc_tag_all_words_cmd',
	                disabled : true
	            });
	            
			    ed.addCommand( 'button_slc_tag_all_words_cmd', function() {
	                var selectedText = ed.selection.getContent();
	                
	                // the following is for IE otherwise ed.selection is lost
	                var normalize = true;
	                var editorCursorPosition = ed.selection.getBookmark( normalize );	                

	                ajaxTagAllWords( ed, editorCursorPosition, pluginJsUrl, selectedText );
	                
	                // This window will be later closed by ajaxTagAllWords success callback
	                window.slc_dialog = ed.windowManager.open({
	                    file : pluginJsUrl + '/../html/loading.html',
	                    title : PLUGIN_TITLE + ' - ' + TAG_ALL_WORDS,
	                    width : POPUP_WIDTH,
	                    height : POPUP_HEIGHT_SMALL,
	                    inline : true
	                },
	                { 
	                	nbWords : selectedText.split( /\s+/ ).length
	                });
	
	                ed.windowManager.onClose.add( function() {
	                    // disables text replacement when canceling loading page
	                    if ( typeof xhr !== undefined ) {
	                        xhr.abort();
	                    }
	                });
	            });
	
                ed.onNodeChange.add( function( ed, cm, n ) {

                    var selectedText = ed.selection.getContent();
                    var isTextSelected = ! ed.selection.isCollapsed();
                    var nbWords = selectedText.split(" ").length; 

                    if ( nbWords > 1 && isTextSelected ) {
                    	
                        // we display the "link all" option only
						// when more than one word is selected
                        cm.get( 'button_slc_tag_all_words' )
                                .setDisabled( ed.selection.isCollapsed() );
                    }
                    
                	cm.get( 'button_slc_tag_single_word' )
                			.setDisabled( ed.selection.isCollapsed() );
                	
                	var SINGLE_WORD_MAX_WORDS = 12;
                	if ( nbWords > SINGLE_WORD_MAX_WORDS ) {
                    	cm.get( 'button_slc_tag_single_word' ).setDisabled( true );
                	}

                    if ( !isTextSelected ) {
                        cm.get( 'button_slc_tag_all_words' )
                                .setDisabled( ed.selection.isCollapsed() );
                    }

                    if ( ed.dom.getParent( ed.selection.getStart() ).nodeName === "A" ) {                        
                        cm.get( 'button_slc_tag_single_word' ).setDisabled( false );
                    }
                });
        	}
        });
	
	/* Start the buttons */
	tinymce.PluginManager.add( 'slc_tinymce_plugin',
	        tinymce.plugins.SEOLinkCreatorTinymcePlugin );
})();
