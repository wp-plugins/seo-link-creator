com = window.com || {};
com.idilia = window.com.idilia || {};
com.idilia.Word = window.com.Word || {};
com.idilia.Menu = window.com.idilia.Menu || {};
com.idilia.MenuItem = window.com.idilia.MenuItem || {};
com.idilia.Link = window.com.idilia.Link || {};

/*****************************************************************************
 * Model
 *****************************************************************************/

com.idilia.Word = function( originalText, lemma, genre, description, thumbnail, sense, link ) {
	this.originalText = originalText	
	this.lemma = lemma;
	this.genre = genre;
	this.description = description;
	this.thumbnail = thumbnail;
	this.sense = sense;
	this.link = link;
	
	this.getSchemaOrgT = function() {
		if ( this.sense && this.sense.schemaOrgT ) {
			return this.sense.schemaOrgT[0];
		}
		return null;
	}
	
	this.getExtRefs = function() {
		if ( this.sense && this.sense.extRefs ) {
			return this.sense.extRefs;
		}
		return null;
	}
}

com.idilia.Link = function() {
	this.href = null;
	this.title = null;
	this.hasSchemaOrgT = false;
	this.target = "_blank";
}

com.idilia.MenuItem = function() {
	this.lemma = "";
	this.genre = "unknown";
	this.description = "unknown sense";
	this.thumbnail = "";	
	this.sense = null;
}

com.idilia.Menu = function(menu) {
	
	this.menu = menu;
	this.menuHTML = null;
	
	if ( this.menu && this.menu.menuHTML ) {		
		this.menuHTML = $(menu.menuHTML)[0];
	}
	
	// given a url, tries to find corresponding sense in the menu
	this.getSenseFromUrl = function ( url ) {					
		if ( ! this.menu || ! this.menu.senses ) {
			return null
		}
		
		var maxSenses = this.menu.senses.length;
		var i = 0;
		for ( ; i < maxSenses; i = i + 1 ) {
			var sense = this.menu.senses[i];
			if ( sense && sense.extRefs ) {
				var maxExtRefs = sense.extRefs.length;
				var j = 0;
				for ( ; j < maxExtRefs; j = j + 1 ) {
					// because of trailing / on ref test with indexOf
					if ( url.indexOf( sense.extRefs[j].url ) != -1 )
						return sense;
				}
			}
		}
		
		return null;
	} 
	
	// parses a menu dom item
	this.parseDomItem = function( item ) {		
		var menuItem = new com.idilia.MenuItem();
		
		if ( item !== undefined && item.attr("class") !== "othMenuItem" && item.length > 0 ) {		
			menuItem.lemma = $( "span span[class='lemma']", item ).html();
			menuItem.genre = $( "span span[class='pos']" , item ).html();
			menuItem.description = $( "a", item ).attr( "title" );
			
			// Thumbnail source, there is not always one
			var imgSrc = $( "img.tbnail", item ).attr( "src" );
			if ( imgSrc ) {
				menuItem.thumbnail = imgSrc;
			}
			
			// get corresponding sense  
			var idx = item.attr( "data-fsk-idx" );
			if ( idx && this.menu.senses ) {
				menuItem.sense = this.menu.senses[ idx ];
			}
		}
		
		return menuItem;
	}
	
	// get first menu item - most frequent sense
	this.getFirstMenuItem = function() {		
		var item = $( "li[data-fsk-idx]", this.menuHTML ).first();		
		return this.parseDomItem( item );
	}
	
	// get menu item given an index
	this.getMenuItemFromIndex = function( idx ) {	
		var item = $( "li[data-fsk-idx='" + idx + "']", this.menuHTML ).first();
		return this.parseDomItem( item );
	}			
	
	// get menu item given a url
	this.getMenuItemFromUrl = function( url ) {
		var sense = this.getSenseFromUrl( url );
		if ( sense ) {
			return this.getMenuItemFromIndex( sense.idx );
		}
		return new com.idilia.MenuItem();
	}	
}

/*****************************************************************************
 * View
 *****************************************************************************/

com.idilia.buildWordView = function( word, menu, parentDivWidth, parentIFrameWidth ) {
	if ( word.thumbnail !== "" ) {
		$( "#slc-word-info > span img" ).attr( "src", word.thumbnail );
		$( "#slc-word-info  > span img" ).show();
	} else {
		$( "#slc-word-info > span img" ).hide();
	}	
	
	var label = word.lemma;
	if ( label === "" && word.originalText !== "" ) {
		label = word.originalText;
	}		
	$( "#slc-word-info > span .lemma " ).html( label );
	$( "#slc-word-info > span .pos " ).html( word.genre );
	
	var shortDescription = word.description;
	var MAX_DESC_LENGTH = 160;
	$( "#slc-word-info" ).attr( "title", "" );
	if ( shortDescription.length > MAX_DESC_LENGTH ) {
		$( "#slc-word-info" ).attr( "title", word.description ); 
		shortDescription = shortDescription.substr( 0, MAX_DESC_LENGTH ) + "..." ;
	}		
	$( "#slc-word-info > span span.description" ).html( shortDescription );
	
	// Word change meaning button
    $( "#slc-sense-menu" ).hide();        
	$( "#slc-edit-sense" ).show();
    top.document.getElementById( top.window.slc_dialog.id ).style.width = parentDivWidth;
    top.document.getElementById( top.window.slc_dialog.iframeElement.id ).style.width = parentIFrameWidth;
}

com.idilia.buildMenuView = function( word, menu ) {	
	if ( menu.menuHTML ) {
		$( "#slc-sense-menu" ).html( menu.menu.menuHTML );
	}
	
	if ( ! menu.menuHTML || menu.menu.senses.length <= 1 ) {
		$( "#slc-edit-sense" ).attr( "disabled", true );
		$( "#slc-edit-sense" ).attr( "title", "No other sense available.");
	}	        
}

com.idilia.buildSelectView = function( word, menu ) {
	// link
	var url = "";
	if ( word.link && word.link.href ) {
		url = word.link.href				
	} else if ( extRefs = word.getExtRefs() ) {
		url = extRefs[0].url;	 
	} 
	$( "#slc-mapping-link" ).val( url );		
	
	// link title
	if ( word.link && word.link.title ) {
		$( "#slc-mapping-title" ).val( word.link.title );		
	} else {
		$( "#slc-mapping-title" ).val( word.lemma );
	}
		
	// open in new window
	if ( word.link ) {
		$( "#slc-mapping-new-tab" ).prop( "checked", word.link.target != "" );
	}

	// Submit button (either Add Link or Update)
    if ( word.link ) {
        $( "#slc-add-link" ).val( "Update" );
        $( "#slc-unlink" ).show();
    }

    // Link Select Box    
    $( "#slc-mappings" ).find( "option" ).remove(); // Reset select options    
    var extRefs = word.getExtRefs();
    if ( menu && extRefs ) {
        var max = extRefs.length;
        var selectionDone = false;
        var i = 0;
        for ( ; i < max; i = i + 1 ) {        	
        	
        	selected = url.indexOf( extRefs[i].url ) != -1;
        	if ( selected ) {
        		selectionDone = true;
        	}
        	
            var option = $( "<option></option>" )
            		.attr( "value", extRefs[i].url )
            		.prop( "selected", selected )
                    .text( extRefs[i].dmName );
            
            $( "#slc-mappings" ).append( option );
        }
        
        // the schema only option        
        var option = $( "<option></option>" )
				.attr( "value", "schemaOnly" )	
				.prop( "disabled", word.getSchemaOrgT() == undefined )
				.text( "-- schema only --" );
        $( "#slc-mappings" ).append( option );
		        
        // the other option 
        option = $( "<option></option>" )
        		.attr( "value", "" )
        		.prop( "selected", ! selectionDone )
        		.text( "-- other --" );
        $( "#slc-mappings" ).append( option );
        $( "#slc-mappings" ).show();
        
    } else {
        $( "#slc-mappings" ).hide();
    }
    
    // Schema.org check box
    if ( ! word.getSchemaOrgT() ) {
        $( "#slc-mapping-schema" ).prop( "checked", false );
        $( "#slc-mapping-schema" ).prop( "disabled", true );
        $( "#slc-mapping-schema" ).attr( "title", "No schema.org markup available for this text." );
    } else {
    	$( "#slc-mapping-schema" ).prop( "checked", true );
        $( "#slc-mapping-schema" ).prop( "disabled", false );
        $( "#slc-mapping-schema" ).attr( "title", "Schema.org markup available for this text." );
    }    
}

com.idilia.buildView = function( word, menu, parentDivWidth, parentIFrameWidth ) {	
	com.idilia.buildWordView( word, menu, parentDivWidth, parentIFrameWidth );
	com.idilia.buildMenuView( word, menu );
	com.idilia.buildSelectView( word, menu );		
}

/*****************************************************************************
 * Main + Event handlers
 *****************************************************************************/
$( document ).ready(function() {
	
	// store original width
    var parentDivWidth = top.document
    	.getElementById( top.window.slc_dialog.id ).style.width;
    var parentIFrameWidth = top.document
    	.getElementById( top.window.slc_dialog.iframeElement.id ).style.width;

    // getting information from tinymce editor
    var tinymce = top.tinymce
    var editor = top.tinymce.activeEditor;
    var params = editor.windowManager.params;   
    
    // restore selection (for IE)
    editor.selection.moveToBookmark( params.editorCursorPosition );
    
    var anchor = editor.selection.getStart();    
    var text = editor.selection.getContent();    
    var menu = new com.idilia.Menu( params.menu );      
    
    // some view stuff
    $( "#slc-edit-sense" ).attr( "src", params.pluginJsUrl + "/../images/edit-20x20.png");
    $( "#slc-mapping-link-view" ).attr( "src", params.pluginJsUrl + "/../images/link-16x16.png");    
    
    // constructing the model (a word)
    var link = null;
    var menuItem = null;
    
    if ( anchor && anchor.nodeName == "A" ) {
    	
        // Existing link => update dialog using existing link info
    	link = new com.idilia.Link();
        link.title = anchor.title;
        link.href = anchor.href;
        link.target = anchor.target;
        text = anchor.textContent;
        menuItem = menu.getMenuItemFromUrl( anchor.href );
        
    } else {
    	
    	// No predefined link take first item in menu - it's the
    	// most frequent sense    	
    	menuItem = menu.getFirstMenuItem();
    }       
    
    var word = new com.idilia.Word( 
    		text,  
    		menuItem.lemma,
    		menuItem.genre, 
    		menuItem.description,
    		menuItem.thumbnail, 
    		menuItem.sense, 
    		link );
    
    com.idilia.buildView( word, menu, parentDivWidth, parentIFrameWidth );    
    
    var closeDialog = function() {
        top.tinymce.activeEditor.windowManager.close( window );
    };

    // function to build link given word informations and user
    // requirements
    var buildLink = function( text, schema, wikiUrl, url,
            title, openInNewTab ) {

        var link = "<";

        // decide tag: a|span
        // a span would do for those who want no link but
        // schema.org markup
        var isValidUrl = url != undefined && url.length > 0 && url != "schemaOnly";
        var tag = "a";
        if ( isValidUrl ) {
        	link += "a href=\"" + encodeURI( url ) + "\"";
        } else {
        	tag = "span";
        	link += tag;
        }

        // add up schema markup
        var isValidSchema = schema != undefined && schema.length > 0;
        if ( isValidSchema ) {
        	link += " itemscope itemtype=\"http://schema.org/" + schema + "\"";
        }
        if ( !isValidUrl || url != wikiUrl ) {
        	
            // if url is not wikiUrl => add it
        	link += " sameAs=\"" + encodeURI( wikiUrl ) + "\"";
        }

        if ( tag == "a" && title != undefined ) {
        	link += " title=\"" + title.replace( /"/g, "&#34" ) + "\"";
        }

        // same window or new one (only for anchor not span)
        if ( openInNewTab && isValidUrl ) {
            link += " target=\"_blank\"";
        }

        // add text and closing tag
        link += ">" + text + "</" + tag + ">";

        return link;
    };

    var updateFromIdx = function( idx ) {
    	    	
    	var menuItem = menu.getMenuItemFromIndex( idx );            
    
    	word = new com.idilia.Word(
    			word.originalText,
    			menuItem.lemma,  
    			menuItem.genre, 
    			menuItem.description,
    			menuItem.thumbnail, 
    			menuItem.sense);
    
    	com.idilia.buildWordView( word, menu, parentDivWidth, parentIFrameWidth );        	
    	com.idilia.buildSelectView( word, menu );        
    };         
    
    var viewLinkOptions = function(view) {
    	$( "#slc-url-div" ).toggle(view);
    	$( "#slc-title-div" ).toggle(view);
    	$( "#slc-schema-div" ).toggle(view);
    	$( "#slc-new-tab-div" ).toggle(view);
    }
    
    var addLink = function( forceSchema ) {
    	
	    // get reference url
	    var refUrl = "wikipedia";
	    var wikipediaUrl = "";
	
	    $( "#slc-mappings option" ).each(function() {
	        // add $(this).val()
	        // to your list
	        if ( $( this ).val().indexOf( refUrl ) != -1 )
	            wikipediaUrl = $( this ).val();
	    });
	
	    var schemaOrgT  = word.getSchemaOrgT();
	    if ( ! forceSchema ) {
	    	schemaOrgT = ( document.getElementById( "slc-mapping-schema" ).checked ? 
	    		word.getSchemaOrgT() : null );
	    }
	    
	    if ( schemaOrgT || $( "#slc-mapping-link" ).val().length > 0 ) {
	        var htmlLink = buildLink(
	        		text,
	        		schemaOrgT,
	        		wikipediaUrl,
	        		$( "#slc-mapping-link" ).val(),
	        		$( "#slc-mapping-title" ).val(),
	        		document.getElementById( "slc-mapping-new-tab" ).checked );
	
	        if ( anchor && anchor.nodeName == "A" ) {
	        	editor.dom.setOuterHTML( anchor, htmlLink );
	        } else {
	        	
	            // restore selection (for IE)
	            editor.selection.moveToBookmark( params.editorCursorPosition );	        	
	        	editor.selection.setContent( htmlLink );
	        }
	    }
	    top.slcInitButtons();
	    closeDialog();
	}
       
    // ***************
    // Event handlers
    // ***************
    $( "#slc-mapping-link-view" ).click(function() {
    	if ( $( "#slc-mapping-link" ).val() != "" ) {
    		window.slc_view = editor.windowManager.open({
    		    file : $( "#slc-mapping-link" ).val(),
    		    title : "SEO Link Creator - View",
    		    width : 800,
    		    height : 600,
    		    inline : false,
    		});
    	}
    });
    
    $( "#slc-edit-sense" ).click(function( event ) {        
        
    	// depends on number of sense categories in this menu (+ 1 for other sense)
    	var AVG_MENU_WIDTH = 105;
    	var neededDivWidth = ( $( ".subHdr" ).length + 1 ) * AVG_MENU_WIDTH;    	
    	if ( neededDivWidth > $( window ).width() ) {
    		var neededIFrameWidth = neededDivWidth - 10;    	    
    		top.document.getElementById( top.window.slc_dialog.id ).style.width = neededDivWidth + "px";
    		top.document.getElementById( top.window.slc_dialog.iframeElement.id ).style.width = neededIFrameWidth + "px";
    	}
        
        $( "#slc-edit-sense" ).hide();
        $( "#slc-sense-menu" ).show();
                
        // otherwise sense-menu we just opened is closed
        event.stopPropagation(); 
    });

    $( "#slc-anchor-cancel" ).click(function() {
        closeDialog();
    });

    $( "#slc-unlink" ).click(function() {
        if ( anchor && anchor.nodeName == "A" ) {
            editor.dom.setOuterHTML( anchor, anchor.innerHTML );
        }
        top.slcInitButtons();
        closeDialog();
    });
    
    $( "#slc-add-schema" ).click(function() {    	
    	var forceSchema = true;
    	addLink( forceSchema );
    });

    $( "#slc-add-link" ).click(function() {
    	var forceSchema = false;
    	addLink( forceSchema );    	
    });    

    $( "#slc-mappings" ).change(function() {
        $( "#slc-mapping-link" ).val( $( "#slc-mappings" ).val() );  
        if ( $( "#slc-mappings" ).val() == "schemaOnly" ) {
        	viewLinkOptions(false);    
        	$( "#slc-add-link" ).hide();
        	$( "#slc-add-schema" ).show();        	
        } else {
        	viewLinkOptions(true);
        	$( "#slc-add-schema" ).hide();
        	$( "#slc-add-link" ).show();        	            
        }
    });

    /*
     * Next part of code handles hovering effect and submenu
     * appearing
     */
    $( '.menu-n li' ).hover(function() { 
    	
    	// appearing on hover
        // closes the initially opened "Frequent Sources"
        $( "ul", $( this ).parent() ).hide();
        
        // remove menu background highlighter
        $('ul.menu-w').first().parent().find('a').first().css("background-color", "")
        
        $( this ).css( "background-color", "#CCC" );
        $( 'ul', this ).fadeIn();
        
        // adjust submenu left position 
        if ( $( 'ul', this ).offset() ) {
            var parentMenuLeft = $( 'ul', this ).parent().offset().left;
            var menuWidth = $( 'ul', this ).width();            
            var availableWidth = $( window ).width() - 40;            
            var neededWidth = parentMenuLeft + menuWidth;            
            if ( neededWidth > availableWidth ) {            	
                $( 'ul', this ).css( "margin-left",
                		availableWidth - neededWidth );
            }
        }
    }, function() { 
    	
    	// disappearing on hover exit
        $( this ).css( "background-color", "" );
        $( 'ul', this ).fadeOut();
    });
    
    $('html').click(function() {    
    	if ( $( "#slc-sense-menu" ).is( ":visible" ) ) {
    		com.idilia.buildWordView( word, menu, parentDivWidth, parentIFrameWidth );
    	}
    });
    
    /*
     * Hides the sense selection menu if esc is pressed
     */
    $(document).keyup(function(e) {
    	if (e.keyCode == 27) {
    		com.idilia.buildWordView( word, menu, parentDivWidth, parentIFrameWidth );
    	}   // esc
    });

    /*
     * Sense selection event 
     */
    $( "a[href='#']" ).click(function( event ) {    	
    	event.preventDefault();    	
    });

    $( 'li.menuItem, li.othMenuItem' ).click(function( event ) {
    	event.stopPropagation(); 
    	updateFromIdx( event.currentTarget.getAttribute( "data-fsk-idx" ) );
    });    
})
