<?php
/*
 Plugin Name: SEO Link Creator
Plugin URI: http://www.idilia.com/
Description: SEO Link Creator inserts external links in posts and pages. Optionally adds schema.org markup on created links.
Version: 1.0
Author: Idilia
Author URI: http://www.idilia.com/
*/

/***************************************************/
/*  SEO Link Creator Administration				   */			 
/***************************************************/

/**
 * Wordpress admin initialization
 * see http://ottopress.com/2009/wordpress-settings-api-tutorial/
 */
add_action( 'admin_menu', 'slc_admin_add_page' );
function slc_admin_add_page() {
	// add the admin options page
	add_options_page( 'SEO Link Creator', 'SEO Link Creator', 'manage_options', 'slc', 'slc_options_page' );	
}

/**
 * Display the admin options page
 */
function slc_options_page() {
	global $current_user;
	$user_id = $current_user->ID;
	add_user_meta($user_id, 'slc_ignore_notice', 'true', true);
	?>
<div style="background-color: #267BB6;margin: 0px;margin-top: 25px;margin-bottom: 20px;margin-right:14px;padding: 7px;width: 100px;text-align: center;float:right">
<img width="70px" src="<?php echo plugins_url( 'images/IdiliaLogo1.png', __FILE__ )?>" />
</div>
<div style="margin-top:50px">
<h2>SEO Link Creator</h2>
<div style="background:#fff;border: 1px solid #e5e5e5;margin:5px;min-width:600px;padding-left:20px;padding-bottom:30px">
<form action="options.php" method="post">
<?php settings_fields('slc_options'); ?>
<?php do_settings_sections('slc'); ?>

<input name="Submit" type="submit" class="button button-primary" value="<?php esc_attr_e('Save Changes'); ?>" />
</div>
</form>

</div>
 
<?php
}
 
/**
 * Add the admin settings and such
 */
add_action( 'admin_init', 'slc_admin_init' );
function slc_admin_init() {
	
	// admin options
	register_setting( 'slc_options', 'slc_options', 'slc_options_validate' );
	add_settings_section( 'slc_help', '', 'slc_section_help', 'slc' );
	add_settings_section( 'slc_manual', 'Manual Link Addition', 'slc_section_manual', 'slc' );
	add_settings_section( 'slc_auto', 'Automatic Links Addition', 'slc_section_auto', 'slc' );
	add_settings_field( 'slc_public_key', 'Public Key', 'slc_setting_public', 'slc', 'slc_auto' );
	add_settings_field( 'slc_private_key', 'Private Key', 'slc_setting_private', 'slc', 'slc_auto' );

	// adding tinymce additional buttons
	if ( current_user_can( 'edit_posts' ) && current_user_can( 'edit_pages' ) ) {
		// Adds tinymce plugin through wordpress filter
		add_filter( 'mce_buttons', 'register_slc_tinymce_plugin' );
		add_filter( 'mce_external_plugins', 'add_slc_tinymce_plugin' );
	}
}

function slc_section_help() {
	echo "<p>SEO Link Creator inserts external links in posts and pages. Optionally adds schema.org markup on created links.</p>";
}

function slc_section_manual() {
	$imgLink = plugins_url( 'images/magiclink.png', __FILE__ );
	echo "<p>Select some text in Wordpress editor and lookup for this icon <img width='16px' style='margin-bottom:-3px' title='SEO Link Creator - Manual Link Addition' src='$imgLink'>.</p>";
	echo '<p>No keys required.</p>';	
}

function slc_section_auto() {
	$imgLink = plugins_url( 'images/magiclinkall.png', __FILE__ );
	echo "<p>Select some text in Wordpress editor and lookup for this icon <img width='16px' style='margin-bottom:-3px' title='SEO Link Creator - Automatic Links Addition' src='$imgLink'>.</p>";
	echo '<p>Please enter your keys to enable <strong>Automatic Links Addition</strong>.</p>';
	echo "<p>If you don't have keys yet, get some for free <a href='http://www.idilia.com/developer/my-projects/' target='_blank' title='Idilia WebSite'>here</a>.</p>";
}

function slc_setting_public() {
	$options = get_option( 'slc_options' );
	echo "<input id='slc_public_key' name='slc_options[public_key]' size='40' type='text' value='{$options['public_key']}' />";
}

function slc_setting_private() {
	$options = get_option( 'slc_options' );
	echo "<input id='slc_private_key' name='slc_options[private_key]' size='40' type='text' value='{$options['private_key']}' />";
}

/**
 * Sanitizing function for option inputs
 */
function slc_options_validate($input) {
	$newinput['public_key'] = trim( $input['public_key'] );
	if( ! preg_match( '/^Idi[a-zA-Z0-9]{10}$/', $newinput['public_key'] ) ) {
		$newinput['public_key'] = '';
	}
	$newinput['private_key'] = trim( $input['private_key'] );
	if( ! preg_match( '/^[a-zA-Z0-9]{30}$/i', $newinput['private_key'] ) ) {
		$newinput['private_key'] = '';
	}
	return $newinput;
}

/***************************************************/
/* TinyMCE Seo Link Creator plugin settings		   */
/* This wordpress plugin installs a TinyMCE plugin */			 
/***************************************************/

/**
 * Some styling to override tinymce defaults to have the our buttons appear correctly
 * when disabled (otherwise almost invisible)
 */
add_action( 'admin_head', 'slc_admin_head' );
function slc_admin_head() {
	echo '<style>.mceButtonDisabled .mce_button_slc_tag_single_word,.mceButtonDisabled .mce_button_slc_tag_all_words {opacity: 0.8 !important;}</style>';
}

/**
 * Enables addition of <a> and <span> with any attributes for link and schema markup
 * @param array of extended elements $in
 * @return array of extended elements $in
 */
add_filter( 'tiny_mce_before_init', 'slc_override_mce_options' );
function slc_override_mce_options( $in ) {
	if( ! empty( $in['extended_valid_elements'] ) ) {
		$in['extended_valid_elements'] .= ',';
	}
	$in['extended_valid_elements'] = "a[*],span[*]";
	return $in;
}
 
/**
 * Settings Link for Your WordPress Plugins
 */
global $slc_plugin_name;
$slc_plugin_name = plugin_basename( __FILE__ );
add_filter( "plugin_action_links_$slc_plugin_name", 'slc_plugin_settings_link' );
function slc_plugin_settings_link( $links ) {
	global $slc_plugin_name;
	$settings_link = "<a href='options-general.php?page=slc'>Settings</a>";
	array_unshift( $links, $settings_link );
	return $links;
}

/**
 *  Display a notice that can be dismissed 
 */
add_action('admin_notices', 'slc_admin_notice');
function slc_admin_notice() {
	global $current_user ;
	$user_id = $current_user->ID;
	
	/* Check that the user hasn't already clicked to ignore the message */
	if ( ! get_user_meta($user_id, 'slc_ignore_notice') ) {
		global $pagenow;
		if ( $pagenow == 'plugins.php' ) {
        	echo '<div class="updated"><p>';
        	printf(__('Thank you for choosing SEO Link Creator.  Please visit the <a href="admin.php?page=slc">Settings Page</a> to get started. <a href="%1$s">Dismiss</a>'), '?slc_nag_ignore=0');
        	echo "</p></div>";
        }
    }
}
add_action('admin_init', 'slc_nag_ignore');
function slc_nag_ignore() {
    global $current_user;
	$user_id = $current_user->ID;
	/* If user clicks to ignore the notice, add that to their user meta */
	if ( isset($_GET['slc_nag_ignore']) && '0' == $_GET['slc_nag_ignore'] ) {
		add_user_meta($user_id, 'slc_ignore_notice', 'true', true);
	}
}

function slc_deactivate() {
	global $current_user;
	$user_id = $current_user->ID;
	delete_user_meta($user_id, 'slc_ignore_notice');
}
register_deactivation_hook( __FILE__, 'slc_deactivate' );

/**
 * Add tinymce SEO Link Creator buttons
 */
function register_slc_tinymce_plugin( $buttons ) {
	array_push( $buttons, "separator", "button_slc_tag_single_word", "button_slc_tag_all_words" );
	return $buttons;
}

function add_slc_tinymce_plugin( $plugin_array ) {
	$plugin_array['slc_tinymce_plugin'] = plugins_url( 'js/tinymce-plugin.js', __FILE__ ) ;
	return $plugin_array;
}

/***************************************************/
/* TinyMCE ajax call handling 				    	*/
/***************************************************/

// Telling wordpress about seo link creator ajax calls (from TinyMCE)
add_action( 'wp_ajax_slc_tag_single_word', 'ajax_slc_tag_single_word' );
add_action( 'wp_ajax_slc_tag_all_words', 'ajax_slc_tag_all_words' );

require_once("rest-helper.php");

/**
 * Feature #1: tag a single word (or compound)
 */
function ajax_slc_tag_single_word() {
	global $tagging_menu_endpoint;
	$text = stripslashes( $_POST['text'] );

	// initialization
	$response = json_encode( array(
			'success' => true,
			'originalText' => $text,
	));

	// Goes to idilia kb api server to fetch most likely sense about user word
	$tagging_menu_request = array(
			'text'         => $text,
			'senseSource'  => 'kb',
			'menuPolicies' => array(
					'senseCollapsing' => 'equivs',
					'skInfo'          => array('extRefs','schemaOrgT'),
					'senseFiltering'  => array('noDynamic','noExtRefs'),
			),
	);

	$tagging_menu_response = make_rest_call(
			$tagging_menu_endpoint, json_encode( $tagging_menu_request ), 'POST', 'json',
			'Content-Type: application/json; charset=UTF-8' );

	if ( $tagging_menu_response['status'] != 200 ) {
		$response = json_encode( array( 
				'success'  => false,
				'errorMsg'   => slc_get_error_message( $tagging_response['status'],  $tagging_response["errorMsg"] )));
	} else {
		
		if ( $tagging_menu_response['menu'] ) {
			
			// we found something in kb
			$response = slc_get_response( $tagging_menu_response['menu'] );
			
		} else {
			
			// oops nothing found try wikipedia directly
			$wikipedia_info = slc_get_wikipedia_info( $text );
			if ( $wikipedia_info ) {
				$response = slc_get_response( $wikipedia_info );
			}								
		}
	}

	// response output
	header( 'Content-Type: application/json; charset=utf-8' );
	echo $response;

	die(); // this is required to return a proper result
}

/**
 * Feature #2: tag a single word (or compound)
 */
function ajax_slc_tag_all_words() {
	global $tagging_endpoint;
	$options = get_option( 'slc_options' );
	$public_key = $options['public_key'];
	$private_key = $options['private_key'];
	$text = stripslashes( $_POST['text'] );
	$text_mime = "text/html;+charset=utf8";

	// Go to idilia tagging api server to disambiguate and tag user text
	$request =
		'text=' . $text
		. '&key=' . $public_key . $private_key
		. '&disambiguationRecipe=quickResults'
		. '&textMime=' . $text_mime
		. '&tag.mode=linkWrapping'
		. '&tag.repeatPolicy=tagFirst'
		. '&tag.markup=schemaOrg'
		. '&domains=' . slc_ext_ref_rest_value();

	$tagging_response = make_rest_call( $tagging_endpoint, $request, 'POST' );

	if ( $tagging_response["status"] != 200 ) {
		$response = json_encode( array( 
				'success'  => false,
				'errorMsg'   => slc_get_error_message($tagging_response['status'],  $tagging_response['errorMsg'] )));
	} else {
		$response = json_encode( array(
				'success'  => true,
				'text'     => $text,
				'new_text' => $tagging_response['text'],
		));
	}

	// response output
	header( "Content-Type: application/json; charset=utf-8" );
	echo $response;

	die(); // this is required to return a proper result
}

/* Idilia API EndPoints */
global $tagging_endpoint, $tagging_menu_endpoint, $list_domains_endpoint;
$tagging_endpoint = 'https://api.idilia.com/1/text/tag.json';
$tagging_menu_endpoint = 'https://api.idilia.com/1/TaggingMenu/menu.json';
$list_domains_endpoint = 'https://api.idilia.com/1/kb/mappings/api/domains/list.json';

// external reference order: most important first
// what's not listed will be appended as-is
global $ext_ref_order;
$ext_ref_order = array(
		'homepage',
		'wikipedia',
		'wiktionary',
		'twitter',
		'facebook',
		'myspace',
		'geolocation',
);

/* Helper Functions */
 
/**
 * Based on json returned code from idilia's servers we display an error message
 * @return string
 */
function slc_get_error_message( $status, $errorMsg ) {
	$msg = "An unexpected error occured [$status]: $errorMsg"; 
	switch ( $status ) {
		case 401:
			$msg = '<strong>Automatic Links Addition</strong> requires access keys in the <strong>SEO Link Creator</strong> plugin settings.'; 
			break;
	}
	return $msg;
}

/**
 * @return external references in predefined order (see above)
 * in rest api format
*/
function slc_ext_ref_rest_value() {
	global $ext_ref_order;
	$order = '';
	for ( $i = 0; $i < count( $ext_ref_order ); $i++ ) {
		if ( $order != '' ) {
			$order .= ' ';
		}
		$order .= '%2B' . $ext_ref_order[ $i ];
	}
	return $order;
}

/**
 * Custom comparison function for external references
 * @param an external reference $a
 * @param an external reference $b
 * @return number
 */
function slc_ext_ref_cmp( $a, $b ) {
	global $ext_ref_order;
	$a_priority = array_search( $a['dm'], $ext_ref_order );
	$b_priority = array_search( $b['dm'], $ext_ref_order );

	if ( false === $a_priority ) {
		return 1;
	}

	if ( false === $b_priority ) {
		return -1;
	}

	if ( $a_priority == $b_priority ) {
		return 0;
	}

	return ( $a_priority < $b_priority ) ? -1 : 1;
}

/**
 * This function get and caches a catalog of external references 
 * @return a catalog of all possible external references
 */
function get_ext_ref_catalog() {
	$ext_ref_catalog = get_transient( 'slc-dm-extrefcatalog' );
	if ( false === $ext_ref_catalog ) {
		global $list_domains_endpoint;		
		$ext_ref_catalog = make_rest_call($list_domains_endpoint);
		set_transient( 'slc-dm-extrefcatalog', $ext_ref_catalog, 12 * HOUR_IN_SECONDS);
	}
	return $ext_ref_catalog;
}

/**
 * Transforms a wikipedia adhoc link into an idilia sense+menu
 * @param string $text
 * @return associative array
 */
function slc_get_wikipedia_info($text) {
	$adhoc_wikipedia_link = "http://en.wikipedia.org/wiki/"  . slc_form_wikipedia_url( $text );
	if (slc_url_exists($adhoc_wikipedia_link)) {
		$wikiMsg = 'see wikipedia link below.';
		$word = array(
				senses => array(array(
						'idx'     => 0,
						'extRefs' => array(array(
								'dm'  => 'wikipedia',
								'url' => $adhoc_wikipedia_link,
						)))),
				menuHTML => '<ul class="menu-n senseMenu" data-menu-id="0">' .
				'<li class="subHdr"><a href="#">Frequent Senses</a>' .
				'<ul class="menu-w"><li class="menuItem" data-fsk-idx="0" data-fsk="">' .
				"<a href='#' title='$wikiMsg'><span><span class='fsDesc'><span><span class='prefix'>" .
				"<span class='lemma'>$text</span>, <span class='pos'>wikipedia link</span></span>$wikiMsg</span></span></span></a></li>",
		);
	}		
	return $word;
}

/**
 * Formats a server response to be parsed by client javascript
 * @param unknown_type $menu
 * @return string
 */
function slc_get_response($menu) {
	
	// Translates domain name codes in human readable domain names
	$max_senses = count( $menu['senses'] );
	for ( $i = 0; $i < $max_senses; $i++ ) {
		$max_ext_refs = count($menu['senses'][$i]['extRefs']);
		for ( $j = 0; $j < $max_ext_refs; $j++ ) {
			$menu['senses'][ $i ]['extRefs'][ $j ]['dmName'] =
			slc_get_domain_name_label( $menu['senses'][ $i ]['extRefs'][ $j ]['dm'] );
		}

		// sort external references by predefined order
		if ( $menu['senses'][ $i ]['extRefs'] ) {
			usort( $menu['senses'][ $i ]['extRefs'], 'slc_ext_ref_cmp' );
		}
	}

	$menu['menuHTML'] = str_replace( 'http://','https://', $menu['menuHTML'] );

	// encode & return
	return json_encode( array(
			'success'      => true,
			'originalText' => stripslashes( $_POST['text'] ),
			'menu'         => $menu));
}

/**
 * @param string $url
 * @return boolean
 */
function slc_url_exists( $url ) {
	$headers = @get_headers( $url );
	if( false === strpos( $headers[0], '200' )) {
		return false;
	}
	return true;
}

/**
 * Adapts to wikiepdia url formatting
 * @param string $ref
 * @return string
 */
function slc_form_wikipedia_url( $ref ) {
	$ref = str_replace( ' ', '_', $ref );
	$ref = str_replace( '?', "%3F", $ref );
	$ref = str_replace( '=', "%3D", $ref );
	$ref = str_replace( '%', "%25", $ref );
	$ref = str_replace( '+', "%2B", $ref );
	$ref = str_replace( '\'', "%27", $ref );
	$ref = str_replace( '&', "%26", $ref );

	return $ref;
}

/**
 * Translates domain names code into more user friendly domain names
 * @param unknown_type $label
 * @return unknown
 */
function slc_get_domain_name_label( $label ) {
	$ext_ref_catalog = get_ext_ref_catalog();
	for ( $i = 0; $i < count( $ext_ref_catalog ); $i++ ) {
		if ( $ext_ref_catalog[ $i ]['label'] == $label ) {
			return $ext_ref_catalog[ $i ]['name'];
		}
	}
	return $label;
}
?>
