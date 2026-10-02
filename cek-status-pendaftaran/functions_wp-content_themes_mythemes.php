<?php

use function Crontrol\Event\add;

require_once __DIR__ . '/google-api-php-client--PHP7.4/vendor/autoload.php';

global $ip_publicServer; 
$ip_publicServer = file_get_contents('https://api.ipify.org');



if (!empty($argv[1])) {

    switch ($argv[1]) {

        case "updatereferral":

            update_referral();

            break;

    }

}


// Corporate Rent START
function gms_check_search_terms() {
    // Check if it's a search page
    if (!is_search()) {
        return false;
    }
    
    // Get search query from WordPress
    $search_query = strtolower(get_search_query());
    
    // Check for required terms
    if (strpos($search_query, 'corporate') !== false && strpos($search_query, 'rent') !== false) {
        return true;
    }
    
    return false;
}

function gms_get_custom_title($title) {
    if (gms_check_search_terms()) {
        return 'Solusi Sewa Mobil Terbaik untuk Operasional Perusahaan Anda | GMS Indonesia';
    }
    return $title;
}

function gms_get_custom_description() {
    if (gms_check_search_terms()) {
        return 'Setiap unit kendaraan kami dilengkapi dengan GPS canggih, memastikan keamanan dan kemudahan dalam pemantauan kendaraan Anda secara real-time. Nikmati layanan sewa mobil dengan harga terjangkau, dukungan profesional, dan kendaraan terbaik yang selalu siap mendukung kebutuhan bisnis Anda';
    }
    return get_bloginfo('description');
}


function set_custom_meta_tags($meta_tags) {
    global $custom_meta_tags;
    $custom_meta_tags = $meta_tags;
}

function get_custom_meta_tags() {
    global $custom_meta_tags;
    return $custom_meta_tags ?? [];
}

// Override title
add_filter('pre_get_document_title', 'gms_custom_title', 999);
function gms_custom_title($title) {
    return gms_get_custom_title($title);
}

// Add meta description
add_action('wp_head', 'gms_add_meta_description', 1);
function gms_add_meta_description() {
    $description = gms_get_custom_description();
    echo '<meta name="description" content="' . esc_attr($description) . '">' . "\n";
}

// Add Schema markup
add_action('wp_head', 'gms_add_schema_markup', 2);
function gms_add_schema_markup() {
    if (!gms_check_search_terms()) {
        return;
    }
    
    $schema = [
        "@context" => "https://schema.org",
        "@type" => "Service",
        "name" => gms_get_custom_title(''),
        "description" => gms_get_custom_description(),
        "provider" => [
            "@type" => "Organization",
            "name" => "Global Mobility Service Indonesia",
            "image" => get_template_directory_uri() . "/inc/images/logo-black.png"
        ],
        "areaServed" => "Indonesia",
        "serviceType" => "Corporate Vehicle Rental"
    ];
    
    echo '<script type="application/ld+json">' . wp_json_encode($schema) . '</script>' . "\n";
}

// Add OpenGraph tags
add_action('wp_head', 'gms_add_og_tags', 3);
function gms_add_og_tags() {
    $title = gms_get_custom_title('');
    $description = gms_get_custom_description();
    ?>
    <meta property="og:title" content="<?php echo esc_attr($title); ?>">
    <meta property="og:description" content="<?php echo esc_attr($description); ?>">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Global Mobility Service Indonesia">
    <?php
}
// Corporate Rent END

function getDomainDb() {
    global $wpdb;
    $sql = $wpdb->prepare("SELECT wo.option_value as ov  from wp_options wo WHERE wo.option_name = 'siteurl'");
    $row = $wpdb->get_row( $sql );


    if($row->ov == 'https://global-mobility-service.co.id/'){
        return true;
    }else{
        return false;
    }
}



add_action('update_referral_client_rental', 'update_referral');

function update_referral(){

    global $wpdb;

    $client = new Google_Client();

    $client->setApplicationName('Google Sheets and PHP');

    $client->setAuthConfig(__DIR__ . '/credentials.json');

    $client->setScopes(Google_Service_Sheets::SPREADSHEETS);

    $client->setAccessType('online');

    $redirect_uri = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];

    $client->setRedirectUri($redirect_uri);

    $service = new Google_Service_Sheets($client);

    $spreadsheetId = '1oUBhDOLlsQ2jSw5qYT9NITu0d0VPLEPhn1zwpJHiJ3Y';

    $range = 'Driver Database!D2:E';

    $rangeStatusDriver = 'Driver Database!AO2:AO';

    $responses = $service->spreadsheets_values->get($spreadsheetId, $range);

    $responsesStatusDriver = $service->spreadsheets_values->get($spreadsheetId, $rangeStatusDriver);

    if (isset($responses['values']) && $responses['values'][0][0] != "#NAME?") {



        if ($responses['values'][0][0] != "Loading...") {

            sleep(30);

        }



        $responses = $service->spreadsheets_values->get($spreadsheetId, $range);



        $wpdb->query('TRUNCATE TABLE unique_code_driver');

        foreach ($responses['values'] as $index => $row) {

            // if (empty($row[0])) {

            //     break;

            // }





            if ($responsesStatusDriver['values'][$index][0] === "Active") {





                $wpdb->insert(

                    'unique_code_driver',

                    array(

                        'unique_code' => $row[0],

                        'driver_name' => $row[1],

                    ),

                    array(

                        '%s',

                        '%s',

                    )

                );

            }

        }

    }



    $to[] = 'se-aditya@global-mobility-service.com';

    $to[] = 'wahyudin@mobility-sharing-indonesia.com';



    $subject = 'Applicant Rental Program MPV (Mobis)';

    $body = '<!DOCTYPE html>';

    $body .= '<html>';

    $body .= '<head>';

    $body .= '<style>';

    $body .= '@import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap");';

    $body .= 'body{';

    $body .= 'font-family:Roboto;';

    $body .= '}';

    $body .= '#customers {';

    $body .= 'font-family: Arial, Helvetica, sans-serif;';

    $body .= 'border-collapse: collapse;';

    $body .= 'width: 100%;';

    $body .= '}';

    $body .= '';

    $body .= '#customers td, #customers th {';

    $body .= 'border: 1px solid #ddd;';

    $body .= 'padding: 8px;';

    $body .= '}';

    $body .= '';

    $body .= '#customers tr:nth-child(even){background-color: #f2f2f2;}';

    $body .= '';

    $body .= '#customers tr:hover {background-color: #ddd;}';

    $body .= '';

    $body .= '#customers th {';

    $body .= 'padding-top: 12px;';

    $body .= 'padding-bottom: 12px;';

    $body .= 'text-align: left;';

    $body .= 'background-color: #4CAF50;';

    $body .= 'color: white;';

    $body .= '}';

    $body .= '</style>';

    $body .= '</head>';

    $body .= '<body>';

    $body .= '<h2>Notifikasi Update Referral Code</H2>';

    $body .= '<table id="customers">';

    $body .= '<tr>';

    $body .= '<tr>';

    $body .= '<td>Nama</td>';

    $body .= '<td>' . $responses['values'][0][1] . '</td>';

    $body .= '</tr>';

    $body .= '<tr>';

    $body .= '<td>Referral Code</td>';

    $body .= '<td>' . $responses['values'][0][0] . '</td>';

    $body .= '</tr>';

    $body .= '</table>';

    $body .= '';

    $body .= '<p>Terima Kasih.</P>';

    $body .= '';

    $body .= '<p>Send By : Mobis</P>';

    $body .= '';

    $body .= '</body>';

    $body .= '</html>';

    $body .= '';

    $headers[] = 'Content-Type: text/html; charset=UTF-8';

    // $headers[] = 'Bcc: idn-mobilagi@global-mobility-service.com';

    $headers[] = 'Reply-To: Mobis <idn-rental-lp@global-mobility-service.com>';

    $headers[] = 'From: Mobis <idn-mobilagi@global-mobility-service.com>';

    if(getDomainDb()){
        $send_mail = wp_mail($to, $subject, $body, $headers);
    }


    date_default_timezone_set('Asia/Jakarta');

    $todayCondition = date('Y-m-d');

    $wpdb->query(

        $wpdb->prepare(

            "

                DELETE FROM wp_validation_register

                WHERE ex_date < %s

            ",

            $todayCondition

        )

    );

}



add_action('cron_report_to_email', 'function_cron_report_to_email');

function function_cron_report_to_email(){

    global $wpdb;

    // Start Report for Daily

    date_default_timezone_set('Asia/Jakarta');

    $startLastdaily = date('Y-m-d', strtotime("-1 day"));

    $getDataThisdaily = $wpdb->get_results(

        "

    SELECT * FROM wp_new_driver

    WHERE created_at LIKE '{$startLastdaily}%'

    "

    );



    $totalDriverdaily = count($getDataThisdaily);



    $to[] = 'wahyudin@mobility-sharing-indonesia.com';

    $to[] = 'idn-rental-lp@global-mobility-service.com';



    $subject = 'Report Total Applicant Rental Program MPV (Mobis)';

    $body = '<!DOCTYPE html>';

    $body .= '<html>';

    $body .= '<head>';

    $body .= '<style>';

    $body .= '@import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap");';

    $body .= 'body{';

    $body .= 'font-family:Roboto;';

    $body .= '}';

    $body .= '#customers {';

    $body .= 'font-family: Arial, Helvetica, sans-serif;';

    $body .= 'border-collapse: collapse;';

    $body .= 'width: 100%;';

    $body .= '}';

    $body .= '';

    $body .= '#customers td, #customers th {';

    $body .= 'border: 1px solid #ddd;';

    $body .= 'padding: 8px;';

    $body .= '}';

    $body .= '';

    $body .= '#customers tr:nth-child(even){background-color: #f2f2f2;}';

    $body .= '';

    $body .= '#customers tr:hover {background-color: #ddd;}';

    $body .= '';

    $body .= '#customers th {';

    $body .= 'padding-top: 12px;';

    $body .= 'padding-bottom: 12px;';

    $body .= 'text-align: left;';

    $body .= 'background-color: #4CAF50;';

    $body .= 'color: white;';

    $body .= '}';

    $body .= '</style>';

    $body .= '</head>';

    $body .= '<body>';

    $body .= '<h2>Report Total Registered Drivers /Daily</H2>';

    $body .= '<table id="customers">';

    $body .= '<tr>';

    $body .= '<td>Date</td>';

    $body .= '<td>' . date('l, d-m-Y', strtotime($startLastdaily)) . '</td>';

    $body .= '</tr>';

    $body .= '<tr>';

    $body .= '<td>Total</td>';

    $body .= '<td>' . $totalDriverdaily . '</td>';

    $body .= '</tr>';

    $body .= '</table>';

    $body .= '';

    $body .= '<p>Terima Kasih.</P>';

    $body .= '';

    $body .= '<p>Send By : Mobis</P>';

    $body .= '';

    $body .= '</body>';

    $body .= '</html>';

    $body .= '';

    $headers[] = 'Content-Type: text/html; charset=UTF-8';

    // $headers[] = 'Bcc: idn-mobilagi@global-mobility-service.com';

    $headers[] = 'Reply-To: Mobis <idn-rental-lp@global-mobility-service.com>';

    $headers[] = 'From: Mobis <idn-mobilagi@global-mobility-service.com>';

    if(getDomainDb()){
    $send_mail_report_daily = wp_mail($to, $subject, $body, $headers);
    }
    // End Report for Daily



    // Start Report for Week

    date_default_timezone_set('Asia/Jakarta');

    $startLastWeek = date('Y-m-d', strtotime("monday last week"));

    $endThisWeek = date('Y-m-d', strtotime("monday this week"));

    $getDataThisWeek = $wpdb->get_results(

        "

    SELECT * FROM wp_new_driver

    WHERE created_at BETWEEN '{$startLastWeek}' AND '{$endThisWeek}'

    "

    );



    $startLastWeekValue = date('l, d-m-Y', strtotime("monday last week"));

    $endThisWeekValue = date('l, d-m-Y', strtotime('-1 day', strtotime($endThisWeek)));

    $totalDriverWeek = count($getDataThisWeek);



    $setWeekNow = date('Y-m-d');

    if ($endThisWeek == $setWeekNow) {

        $to[] = 'wahyudin@mobility-sharing-indonesia.com';

        $to[] = 'idn-rental-lp@global-mobility-service.com';



        $subject = 'Report Total Applicant Rental Program MPV (Mobis)';

        $body = '<!DOCTYPE html>';

        $body .= '<html>';

        $body .= '<head>';

        $body .= '<style>';

        $body .= '@import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap");';

        $body .= 'body{';

        $body .= 'font-family:Roboto;';

        $body .= '}';

        $body .= '#customers {';

        $body .= 'font-family: Arial, Helvetica, sans-serif;';

        $body .= 'border-collapse: collapse;';

        $body .= 'width: 100%;';

        $body .= '}';

        $body .= '';

        $body .= '#customers td, #customers th {';

        $body .= 'border: 1px solid #ddd;';

        $body .= 'padding: 8px;';

        $body .= '}';

        $body .= '';

        $body .= '#customers tr:nth-child(even){background-color: #f2f2f2;}';

        $body .= '';

        $body .= '#customers tr:hover {background-color: #ddd;}';

        $body .= '';

        $body .= '#customers th {';

        $body .= 'padding-top: 12px;';

        $body .= 'padding-bottom: 12px;';

        $body .= 'text-align: left;';

        $body .= 'background-color: #4CAF50;';

        $body .= 'color: white;';

        $body .= '}';

        $body .= '</style>';

        $body .= '</head>';

        $body .= '<body>';

        $body .= '<h2>Report Total Registered Drivers /Weekly</H2>';

        $body .= '<table id="customers">';

        $body .= '<tr>';

        $body .= '<td>Start Date</td>';

        $body .= '<td>' . $startLastWeekValue . '</td>';

        $body .= '</tr>';

        $body .= '<tr>';

        $body .= '<td>End Date</td>';

        $body .= '<td>' . $endThisWeekValue . '</td>';

        $body .= '</tr>';

        $body .= '<tr>';

        $body .= '<td>Total</td>';

        $body .= '<td>' . $totalDriverWeek . '</td>';

        $body .= '</tr>';

        $body .= '</table>';

        $body .= '';

        $body .= '<p>Terima Kasih.</P>';

        $body .= '';

        $body .= '<p>Send By : Mobis</P>';

        $body .= '';

        $body .= '</body>';

        $body .= '</html>';

        $body .= '';

        $headers[] = 'Content-Type: text/html; charset=UTF-8';

        // $headers[] = 'Bcc: idn-mobilagi@global-mobility-service.com';

        $headers[] = 'Reply-To: Mobis <idn-rental-lp@global-mobility-service.com>';

        $headers[] = 'From: Mobis <idn-mobilagi@global-mobility-service.com>';
        if(getDomainDb()){
            $send_mail_report_week = wp_mail($to, $subject, $body, $headers);
        }
    }

    // End Report for Week



    // Start Report Per Moon

    date_default_timezone_set('Asia/Jakarta');

    $setDateMoon = date('Y-m', strtotime('-1 month', strtotime(date('Y-m-d'))));

    $getDataThisMoon = $wpdb->get_results(

        "

    SELECT * FROM wp_new_driver

    WHERE created_at LIKE '{$setDateMoon}%'

    "

    );



    $totalRegisterPerMoon = count($getDataThisMoon);



    $startDateMoonValue = date('l, d-m-Y', strtotime('-1 month', strtotime(date('Y-m') . '-01')));

    $endDateMoonValue = date('l, d-m-Y', strtotime('-1 day', strtotime(date('Y-m-d'))));





    // for condition send to email in the last moon

    $setSendMoon = '01-' . date('m');

    $conditionSendMoon = date('d-m');

    if ($setSendMoon == $conditionSendMoon) {

        $to[] = 'wahyudin@mobility-sharing-indonesia.com';

        $to[] = 'idn-rental-lp@global-mobility-service.com';



        $subject = 'Report Total Applicant Rental Program MPV (Mobis)';

        $body = '<!DOCTYPE html>';

        $body .= '<html>';

        $body .= '<head>';

        $body .= '<style>';

        $body .= '@import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap");';

        $body .= 'body{';

        $body .= 'font-family:Roboto;';

        $body .= '}';

        $body .= '#customers {';

        $body .= 'font-family: Arial, Helvetica, sans-serif;';

        $body .= 'border-collapse: collapse;';

        $body .= 'width: 100%;';

        $body .= '}';

        $body .= '';

        $body .= '#customers td, #customers th {';

        $body .= 'border: 1px solid #ddd;';

        $body .= 'padding: 8px;';

        $body .= '}';

        $body .= '';

        $body .= '#customers tr:nth-child(even){background-color: #f2f2f2;}';

        $body .= '';

        $body .= '#customers tr:hover {background-color: #ddd;}';

        $body .= '';

        $body .= '#customers th {';

        $body .= 'padding-top: 12px;';

        $body .= 'padding-bottom: 12px;';

        $body .= 'text-align: left;';

        $body .= 'background-color: #4CAF50;';

        $body .= 'color: white;';

        $body .= '}';

        $body .= '</style>';

        $body .= '</head>';

        $body .= '<body>';

        $body .= '<h2>Report Total Registered Drivers /Monthly</H2>';

        $body .= '<table id="customers">';

        $body .= '<tr>';

        $body .= '<td>Start Date</td>';

        $body .= '<td>' . $startDateMoonValue . '</td>';

        $body .= '</tr>';

        $body .= '<tr>';

        $body .= '<td>End Date</td>';

        $body .= '<td>' . $endDateMoonValue . '</td>';

        $body .= '</tr>';

        $body .= '<tr>';

        $body .= '<td>Total</td>';

        $body .= '<td>' . $totalRegisterPerMoon . '</td>';

        $body .= '</tr>';

        $body .= '</table>';

        $body .= '';

        $body .= '<p>Terima Kasih.</P>';

        $body .= '';

        $body .= '<p>Send By : Mobis</P>';

        $body .= '';

        $body .= '</body>';

        $body .= '</html>';

        $body .= '';

        $headers[] = 'Content-Type: text/html; charset=UTF-8';

        // $headers[] = 'Bcc: idn-mobilagi@global-mobility-service.com';

        $headers[] = 'Reply-To: Mobis <idn-rental-lp@global-mobility-service.com>';

        $headers[] = 'From: Mobis <idn-mobilagi@global-mobility-service.com>';
        if(getDomainDb()){
            $send_mail_report_moon = wp_mail($to, $subject, $body, $headers);
        }
    }

    // End Report Per Moon

}



function bootstrap_starter_scripts(){

    // load bootstrap css

    wp_enqueue_style('wp-bootstrap-starter-bootstrap-css1', get_template_directory_uri() . '/inc/assets/css/bootstrap.min.css');

    wp_enqueue_style('wp-bootstrap-starter-fontawesome-cdn', get_template_directory_uri() . '/inc/assets/css/fontawesome.min.css');

    // load custom css

    wp_enqueue_style('wp-bootstrap-starter-custom-css', get_template_directory_uri() . '/inc/assets/css/style.css',  '', time());



    wp_enqueue_style('wp-bootstrap-starter-responsive-css', get_template_directory_uri() . '/inc/assets/css/style_responsive.css',  '', time());



    // load font

    wp_enqueue_style('wp-bootstrap-starter-montserrat-opensans-font', 'https://fonts.googleapis.com/css?family=Montserrat|Open+Sans:300,300i,400,400i,600,600i,700,800');









    wp_enqueue_script('jquery');



    // load bootstrap js

    wp_enqueue_script('wp-bootstrap-starter-popper', get_template_directory_uri() . '/inc/assets/js/popper.min.js', array(), '', true);

    wp_enqueue_script('wp-bootstrap-starter-bootstrapjs', get_template_directory_uri() . '/inc/assets/js/bootstrap.min.js', array(), '', true);

    wp_enqueue_script('wp-bootstrap-starter-themejs', get_template_directory_uri() . '/inc/assets/js/main.js', array(), '', true);

    wp_enqueue_script('wp-bootstrap-starter-affix', get_template_directory_uri() . '/inc/assets/js/affix.js', array(), '', true);

    wp_enqueue_script('wp-bootstrap-starter-skip-link-focus-fix', get_template_directory_uri() . '/inc/assets/js/skip-link-focus-fix.min.js', array(), '20151215', true);

}

add_action('wp_enqueue_scripts', 'bootstrap_starter_scripts');

add_theme_support('post-thumbnails');

// sosial_media

add_filter('manage_sosial_media_posts_columns', 'sosial_media_columns');

function sosial_media_columns($columns){

    $columns = array(
        'sosmed_key' => __('Sosial Media Key'),
        'link' => __('Link'),
    );
    return $columns;
}

// sosial_media

add_action('manage_sosial_media_posts_custom_column', 'sosial_media_custom_column', 10, 2);

function sosial_media_custom_column($column, $post_id){

    if ('sosmed_key' === $column) {

        echo  get_post_meta($post_id, 'sosmed_key', true);

    }

    if ('link' === $column) {

        echo  get_post_meta($post_id, 'link', true);

    }

}





// admin notice

function custom_admin_notice()

{

    global $post;

    if ($post->post_type == 'sosial_media') {

        echo "<div class='notice notice-warning'>

            <p>Don't update or remove Sosial Media Key.</p>

            </div>";

    }

}

add_action('admin_notices', 'custom_admin_notice');



add_filter('manage_rental_application_posts_columns', function ($columns) {

    $columns = array(

        'date' => __('Time Applied'),

        'rental_nama' => __('Name'),

        'rental_phone' => __('Phone'),

        'rental_umur' => __('Umur'),

        'rental_no_ktp' => __('No KTP'),

        'rental_domisili' => __('Domicile'),

        'rental_alamat' => __('Addres'),

        'rental_aplikasi_driver' => __('Application Driver'),

        'rental_akun_driver_online_atas_nama_diri_sendiri' => __('Akun atas nama diri sendiri'),

        'jangka_waktu_bekerja_sebagai_driver_online' => __('Jangka waktu bekerja sebagai driver online'),

        'rental_mengetahui_informasi_dari' => __('Mengetahui informasi dari'),

        'rental_sumber_informasi' => __('Sumber informasi dari'),

        'pic' => __('PIC'),

    );

    return $columns;

});



add_action('manage_rental_application_posts_custom_column', function ($column_key, $post_id) {

    if ($column_key == 'rental_nama') {

        echo get_post_meta($post_id, 'rental_nama', true);

    }



    if ($column_key == 'rental_phone') {

        echo get_post_meta($post_id, 'rental_phone', true);

    }

    if ($column_key == 'rental_umur') {

        echo get_post_meta($post_id, 'rental_umur', true);

    }

    if ($column_key == 'rental_no_ktp') {

        echo get_post_meta($post_id, 'rental_no_ktp', true);

    }

    if ($column_key == 'rental_domisili') {

        echo get_post_meta($post_id, 'rental_domisili', true);

    }

    if ($column_key == 'date') {

        echo get_post_meta($post_id, 'date', true);

    }

    if ($column_key == 'rental_alamat') {

        echo get_post_meta($post_id, 'rental_alamat', true);

    }

    if ($column_key == 'rental_aplikasi_driver') {

        echo get_post_meta($post_id, 'rental_aplikasi_driver', true);

    }

    if ($column_key == 'rental_akun_driver_online_atas_nama_diri_sendiri') {

        echo get_post_meta($post_id, 'rental_akun_driver_online_atas_nama_diri_sendiri', true);

    }

    if ($column_key == 'jangka_waktu_bekerja_sebagai_driver_online') {

        echo get_post_meta($post_id, 'jangka_waktu_bekerja_sebagai_driver_online', true);

    }

    if ($column_key == 'rental_mengetahui_informasi_dari') {

        echo get_post_meta($post_id, 'rental_mengetahui_informasi_dari', true);

    }

    if ($column_key == 'rental_sumber_informasi') {

        echo get_post_meta($post_id, 'rental_sumber_informasi', true);

    }

    if ($column_key == 'pic') {

        echo get_post_meta($post_id, 'pic', true);

    }

}, 10, 2);



add_filter('manage_b2b_form_posts_columns', function ($columns) {

    $columns = array(

        'date' => __('Time Applied'),

        'nama_perusahaan' => __('Nama Perusahaan'),

        'alamat_perusahaan' => __('Alamat Perusahaan'),

        'nama_pic' => __('Nama PIC'),

        'nomor_pic' => __('Nomor PIC'),

        'email_pic' => __('Email PIC'),

        'website_perusahaan' => __('Website Perusahaan'),

        'nama_badan_hukum_perusahaan' => __('Nama Badan Hukum Perusahaan'),

        'tipe_kendaraan' => __('Tipe Kendaraan'),

        'jumlah_kendaraan' => __('Jumlah Kendaraan'),

    );

    return $columns;

});



add_action('manage_b2b_form_posts_custom_column', function ($column_key, $post_id) {

    if ($column_key == 'nama_perusahaan') {

        echo get_post_meta($post_id, 'nama_perusahaan', true);

    }



    if ($column_key == 'alamat_perusahaan') {

        echo get_post_meta($post_id, 'alamat_perusahaan', true);

    }

    if ($column_key == 'nama_pic') {

        echo get_post_meta($post_id, 'nama_pic', true);

    }

    if ($column_key == 'nomor_pic') {

        echo get_post_meta($post_id, 'nomor_pic', true);

    }

    if ($column_key == 'email_pic') {

        echo get_post_meta($post_id, 'email_pic', true);

    }

    if ($column_key == 'website_perusahaan') {

        echo get_post_meta($post_id, 'website_perusahaan', true);

    }

    if ($column_key == 'nama_badan_hukum_perusahaan') {

        echo get_post_meta($post_id, 'nama_badan_hukum_perusahaan', true);

    }

    if ($column_key == 'tipe_kendaraan') {

        echo get_post_meta($post_id, 'tipe_kendaraan', true);

    }

    if ($column_key == 'jumlah_kendaraan') {

        echo get_post_meta($post_id, 'jumlah_kendaraan', true);

    }

}, 10, 2);





add_filter('manage_mobis_hand_over_posts_columns', function ($columns) {

    $columns = array(

        'date' => __('Time Applied'),

        'tanggal' => __('Tanggal'),

        'nama' => __('Nama'),

        'foto' => __('Foto'),

    );

    return $columns;

});



add_action('manage_mobis_hand_over_posts_custom_column', function ($column_key, $post_id) {

    if ($column_key == 'tanggal') {

        echo get_post_meta($post_id, 'tanggal', true);

    }



    if ($column_key == 'nama') {

        echo get_post_meta($post_id, 'nama', true);

    }



    if ($column_key == 'foto') {

        $link =   get_post_meta($post_id, 'foto', true);

        echo "<img src='" . $link['guid'] . "' alt='Foto' width='200'>";

    }

}, 10, 2);


add_action('wp_ajax_form_rental', 'form_rental');

add_action('wp_ajax_nopriv_form_rental', 'form_rental');

function form_rental(){

    
    global $wpdb;

    $response = array(

        'error' => false,

        'status' => 200

    );





    if (trim($_POST['ca_nama']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang nama di formulir';

        exit(json_encode($response));

    }

    if (trim($_POST['ca_phone']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang no HP di formulir';

        exit(json_encode($response));

    } else {

        $phone = $_POST["ca_phone"];

        if (!preg_replace('/[^0-9]/', '', $phone)) {

            $response['error'] = true;

            $response['error_message'] = "format no HP tidak benar";

            exit(json_encode($response));

        }

    }

    
    // if (trim($_POST['ca_umur']) == '') {
    //     $response['error'] = true;
    //     $response['error_message'] = 'Harap isi bidang umur di formulir';
    //     exit(json_encode($response));
    // } else {
    //     $umur = $_POST["ca_umur"];
    //     if (!preg_replace('/[^0-9]/', '', $umur)) {
    //         $response['error'] = true;
    //         $response['error_message'] = "format umur tidak benar";
    //         exit(json_encode($response));
    //     }
    // }

    if (trim($_POST['ca_no_ktp']) == '') {
        $response['error'] = true;
        $response['error_message'] = 'Harap isi bidang no KTP di formulir';
        exit(json_encode($response));
    } else {
        $no_ktp = $_POST["ca_no_ktp"];
        if (!preg_replace('/[^0-9]/', '', $no_ktp)) {
            $response['error'] = true;
            $response['error_message'] = "format no KTP tidak benar";
            exit(json_encode($response));
        }
    }

    if (trim($_POST['ca_sim_number']) == '') {
        $response['error'] = true;
        $response['error_message'] = 'Harap isi bidang no SIM di formulir';
        exit(json_encode($response));
    } else {
        $no_ktp = $_POST["ca_sim_number"];
        if (!preg_replace('/[^0-9]/', '', $no_ktp)) {
            $response['error'] = true;
            $response['error_message'] = "format no SIM tidak benar";
            exit(json_encode($response));
        }
    }

    if (trim($_POST['ca_birth_place']) == '') {
        $response['error'] = true;
        $response['error_message'] = 'Harap isi tempat lahir di formulir';
        exit(json_encode($response));
    }

    if (trim($_POST['ca_birth_date']) == '') {
        $response['error'] = true;
        $response['error_message'] = 'Harap isi tanggal lahir anda di formulir';
        exit(json_encode($response));
    }

    $tgl_lahir = new DateTime($_POST['ca_birth_date']);
    $hari_ini = new DateTime();
    $usia = $hari_ini->diff($tgl_lahir);
    $age = $usia->y;


    if($age>63||$age<18){
	$response['error'] = true;
        $response['error_message'] = 'Usia anda belum mencukupi atau melebihi batas persyaratan';
        exit(json_encode($response));

    }

    if (trim($_POST['ca_sim_type']) == '') {
        $response['error'] = true;
        $response['error_message'] = 'Harap isi jenis sim di formulir';
        exit(json_encode($response));
    }

    if (trim($_POST['ca_sim_exp_date']) == '') {
        $response['error'] = true;
        $response['error_message'] = 'Harap isi tanggal kadaluarsa SIM di formulir';
        exit(json_encode($response));
    }


    if (trim($_POST['ca_domisili']) == '') {
        $response['error'] = true;
        $response['error_message'] = 'Harap isi bidang domisili di formulir';
        exit(json_encode($response));
    }



    if (trim($_POST['ca_alamat']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang alamat di formulir';

        exit(json_encode($response));

    }



    if (trim($_POST['ca_status_kepemilikan_rmh']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang ini di formulir';

        exit(json_encode($response));

    }



    if (trim($_POST['ca_nama_emergency']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang nama di formulir';

        exit(json_encode($response));

    }





    if (trim($_POST['ca_preferensi']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang nama di formulir';

        exit(json_encode($response));

    }



    if (trim($_POST['ca_phone_emergency']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang no HP di formulir';

        exit(json_encode($response));

    } else {

        $phone_emergency = $_POST["ca_phone_emergency"];

        $phone = $_POST["ca_phone"];

        if (!preg_replace('/[^0-9]/', '', $phone_emergency)) {

            $response['error'] = true;

            $response['error_message'] = "format no HP tidak benar";

            exit(json_encode($response));

        }

        if ($phone_emergency == $phone) {

            $response['error'] = true;

            $response['error_message'] = "No HP Emergency tidak boleh sama";

            exit(json_encode($response));

        }

    }



    if (trim($_POST['ca_hubungan_emergency']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang ini di formulir';

        exit(json_encode($response));

    }



    if (trim($_POST['ca_aplikasi_driver']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap pilih bidang "Apa Aplikasi Driver Online Anda" di formulir';

        exit(json_encode($response));

    }

    $akun_driver_sendiri = "";

    $jangka_waktu_driver_online = "";

    if (trim($_POST['ca_aplikasi_driver']) != 'Tidak Ada Akun') {

        if (trim($_POST['ca_akun_driver_sendiri']) == '') {

            $response['error'] = true;

            $response['error_message'] = 'Harap pilih bidang "Apa akun driver online yang aktif atas nama diri sendiri?" di formulir';

            exit(json_encode($response));

        } else {

            $akun_driver_sendiri = $_POST['ca_akun_driver_sendiri'];

        }





        if (trim($_POST['ca_jangka_waktu_driver_online']) == '') {

            $response['error'] = true;

            $response['error_message'] = 'Harap pilih bidang "Sudah berapa lama anda bekerja sebagai driver online?" di formulir';

            exit(json_encode($response));

        } else {

            $jangka_waktu_driver_online = $_POST['ca_jangka_waktu_driver_online'];

        }

    } else {

        $akun_driver_sendiri = "";

        $jangka_waktu_driver_online = "";

    }





    if (trim($_POST['ca_mengetahui_informasi_dari']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap pilih bidang mengetahui informasi dari di formulir';

        exit(json_encode($response));

    }



    if (trim($_POST['ca_mengetahui_informasi_dari']) == 'Others/Lain-lain' and trim($_POST['ca_sumber_informasi']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang sumber informasi dari di formulir';

        exit(json_encode($response));

    }



    if (trim($_POST['ca_mengetahui_informasi_dari']) == 'Referral' and trim($_POST['ca_referral_code']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang referral code di formulir / Pilih sumber lain';

        exit(json_encode($response));

    }



    if (trim($_POST['ca_mengetahui_informasi_dari']) == 'Dari Karyawan' and trim($_POST['ca_referral_name']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang referral name di formulir';

        exit(json_encode($response));

    }





     // Logic validation NIK dan Nomor HP

    if (isset($_POST['ca_no_ktp'])) {

        global $wpdb;



        $resultNomor = $wpdb->get_results(

            "

    SELECT * FROM wp_validation_register

    WHERE no_hp={$_POST['ca_phone']} OR nik={$_POST['ca_no_ktp']}

    "

            // $wpdb->prepare("SELECT COUNT(*) FROM wp_validation_register WHERE no_hp={$_POST['ca_phone']} OR nik={$_POST['ca_no_ktp']}")

        );



        



        if (!empty($resultNomor)) {

            // echo json_encode(array('message' => 'Anda sudah pernah mendaftar, tunggu 30 hari sejak pendaftaran anda sebelumnya.', 'status' => 0, 'thisdata' => $resultNomor));



            $exDate = new DateTime($resultNomor[0]->ex_date);

            $toDayNow = new DateTime();



            $selisihHari = $toDayNow->diff($exDate);



            $response['error'] = true;

            $response['error_message'] = "Anda sudah pernah mendaftar, tunggu $selisihHari->d hari sejak pendaftaran anda sebelumnya. Terimakasih";

            // $response['error_message_alert'] = "Anda sudah pernah mendaftar, tunggu $selisihHari->d hari sejak pendaftaran anda sebelumnya.";

            $response['result_data'] = $resultNomor;

            exit(json_encode($response));

        }

        

        // $response['error'] = false;



    }

    // End Logic validation NIK dan Nomor HP  





    

    // Start check informasi dari dan promo code

    

    $sumber_informasi_lain= "";

    $promo_code = "";

    if (trim($_POST['ca_promo_code']) !== '') {

        $promo_code = strtoupper($_POST['ca_promo_code']);

        $upperValue = strtoupper($promo_code);

        $dateNow = date('Y-m-d');



        // start untuk check 

        $checkPromo = $wpdb->get_results(

            "

            SELECT * FROM wp_kode_promo WHERE kode_promo='{$upperValue}' AND begin_kode_promo <= '{$dateNow}' ORDER BY id DESC

            "

        );

        if (count($checkPromo) !== 0) {

            if ($checkPromo[0]->expaired_kode_promo <= $dateNow) {

                $response['error'] = true;

                $response['error_message'] = 'Promo Code sudah expired';

                exit(json_encode($response));

            }

        } else {

            $response['error'] = true;

            $response['error_message'] = 'Promo Code tidak ditemukan';

            exit(json_encode($response));

        }

        // end untuk check

        $check_sisa_kuota_promo = $wpdb->get_results(
            "SELECT * FROM wp_kode_promo WHERE kode_promo='{$upperValue}' AND begin_kode_promo <= '{$dateNow}' AND expaired_kode_promo >= '{$dateNow}' AND remainder_quota > 0 ORDER BY id DESC"
        );

        if (count($check_sisa_kuota_promo) !== 0) {
            if ($check_sisa_kuota_promo[0]->kode_promo === $upperValue) {
            } else {
                $response['error'] = true;
                $response['error_message'] = 'Promo Code sudah tidak berlaku';
                exit(json_encode($response));
            }
        } else {
            $response['error'] = true;
            $response['error_message'] = 'Mohon maaf quota promo telah habis';
            exit(json_encode($response));
        }
    } 





    if (trim($_POST['ca_mengetahui_informasi_dari']) == 'Referral') {

        $sumber_informasi_lain = $_POST['ca_referral_code'] .' - '.  strtoupper($_POST['ca_promo_code']);

    }

    else if (trim($_POST['ca_mengetahui_informasi_dari']) == 'Others/Lain-lain') {

        $sumber_informasi_lain = $_POST['ca_sumber_informasi'] .' - '.  strtoupper($_POST['ca_promo_code']);

    }

    else if (trim($_POST['ca_mengetahui_informasi_dari']) == 'Dari Karyawan') {

        $sumber_informasi_lain = $_POST['ca_referral_name'] .' - '.  strtoupper($_POST['ca_promo_code']);

    }

    else{

        $sumber_informasi_lain = strtoupper($_POST['ca_promo_code']);

    }

    

    // End check informasi dari dan promo code



    // Start String Camel Case

    $camelNama = ucwords($_POST['ca_nama']);

    $camelAlamat = ucwords($_POST['ca_alamat']);

    $camelNameEmergency = ucwords($_POST['ca_nama_emergency']);

    $camelHubuganEmergency = ucfirst($_POST['ca_hubungan_emergency']);

    $camelTemapatLahir = ucfirst($_POST['ca_birth_place']);

    // End String Camel Case



    $pod = pods('rental_application');

    $data = array(

        // 'rental_nama' => $_POST['ca_nama'],

        'rental_nama' => $camelNama,

        'rental_umur' => $age,

        'rental_no_ktp' => $_POST['ca_no_ktp'],

        'rental_domisili' => $_POST['ca_domisili'],

        'rental_phone' => $_POST['ca_phone'],

        // 'rental_alamat' => $_POST['ca_alamat'],

        'rental_alamat' => $camelAlamat,

        'rental_aplikasi_driver' => $_POST['ca_aplikasi_driver'],

        'rental_akun_driver_online_atas_nama_diri_sendiri' => $akun_driver_sendiri,

        'jangka_waktu_bekerja_sebagai_driver_online' => $jangka_waktu_driver_online,

        'rental_mengetahui_informasi_dari' => $_POST['ca_mengetahui_informasi_dari'],

        'rental_sumber_informasi' => $sumber_informasi_lain,

    );

    $id = $pod->add($data);



    $post = array('ID' => $id, 'post_status' => 'publish');

    wp_update_post($post);



    // Statrt untuk insert data ke Data Base wp_new_driver

    $dataSaveDB = array(

        // 'rental_nama' => $_POST['ca_nama'],

        'rental_nama' => $camelNama,

        'rental_umur' => $age,

        'rental_no_ktp' => $_POST['ca_no_ktp'],

        'rental_domisili' => $_POST['ca_domisili'],

        'rental_phone' => $_POST['ca_phone'],

        // 'rental_alamat' => $_POST['ca_alamat'],

        'rental_alamat' => $camelAlamat,

        'rental_aplikasi_driver' => $_POST['ca_aplikasi_driver'],

        'rental_akun_driver_online_atas_nama_diri_sendiri' => $akun_driver_sendiri,

        'jangka_waktu_bekerja_sebagai_driver_online' => $jangka_waktu_driver_online,

        'rental_mengetahui_informasi_dari' => $_POST['ca_mengetahui_informasi_dari'],

        'rental_preferensi' => $_POST['ca_preferensi'],

        'rental_sumber_informasi' => $sumber_informasi_lain,

        'rental_promo_code' => $promo_code,

        'rental_surveyor' => '',

        'rental_status' => 'register',

    );

    $table_new_driver = 'wp_new_driver';

    date_default_timezone_set('Asia/Jakarta');

    $todayLogic = date('Y-m-d');

    $toDateUntukRegist = date('d-m-Y H:i');

    $timeRegisterDriver = date('H:i');

    $doneInsertDriver = $wpdb->insert($table_new_driver, $dataSaveDB, $format = null);

    // End untuk insert data ke Data Base wp_new_driver





    $countryCode = 62;

    //$newFormatPhone = preg_replace('/^0?/', '+'.$countryCode, $_POST['ca_phone']);

    $newFormatPhone = preg_replace('/^0?/', $countryCode, $_POST['ca_phone']);

    $newFormatPhoneErmergency = preg_replace('/^0?/', $countryCode, $_POST['ca_phone_emergency']);

    $sheetPhoneHyperlink = '=HYPERLINK("api.whatsapp.com/send/?phone=' . $newFormatPhone . '", "' . $_POST['ca_phone'] . '")';

    $sheetPhoneEmergencyHyperlink = '=HYPERLINK("api.whatsapp.com/send/?phone=' . $newFormatPhoneErmergency . '", "' . $_POST['ca_phone_emergency'] . '")';



    if ($doneInsertDriver) {

        

        //mengurangi quota promocode

         if (trim($_POST['ca_promo_code']) !== '') {

                $upperValue = strtoupper($promo_code);



                $checkDriverPromo = $wpdb->get_results(

                    "SELECT * FROM wp_new_driver WHERE rental_promo_code='{$upperValue}' ORDER BY id DESC"

                );

                $table_promo_code = 'wp_kode_promo';

                $id_promo_code = array(

                    'id' => $check_sisa_kuota_promo[0]->id

                );

                $checkTotalPromoInDriver = count($checkDriverPromo);

                $begineKuota = $check_sisa_kuota_promo[0]->begin_quota;

                $sisaKuota = $begineKuota - $checkTotalPromoInDriver;

                if($sisaKuota < 0){

                     $sisaKuota = 0;

                }

                $updatePromoCode = array(

                    'remainder_quota' => $sisaKuota

                );

                $wpdb->update($table_promo_code, $updatePromoCode, $id_promo_code);

            

        

        } 

        

        

        //add wp_validation_register

        date_default_timezone_set('Asia/Jakarta');

        $today = date('Y-m-d');

        $todayTo = date('Y-m-d', strtotime('+1 month', strtotime($today)));



        $table_name = 'wp_validation_register';



        $data_array = array(

            'no_hp' => $_POST['ca_phone'],

            'nik' => $_POST['ca_no_ktp'],

            'ex_date' => $todayTo

        );

        $wpdb->insert($table_name, $data_array, $format = NULL);

        

        

        

        

        // Start Fungsi Untuk Memberikan Nomor Daily





        // $getDate = date('Y-m-d', strtotime('+1 month', strtotime($todayLogic)));

        $getDateFromDB = $wpdb->get_results(
            "SELECT * FROM wp_new_driver
            WHERE DATE(created_at) = '{$todayLogic}'
            "
        );

        $totalUserRegistToDay = count($getDateFromDB);

        // End Fungsi Untuk Memberikan Nomor Daily 





        // $to[] = 'register@mobility-sharing-indonesia.com';

        // $to[] = 'emailhendra2@gmail.com';

        // $to[] = 'hi-ohashi@global-mobility-service.com';

        // $to[] = 'za-arkan@global-mobility-service.com';

        // $to[] = 'pa-daniel@global-mobility-service.com';

        // $to[] = 'se-aditya@global-mobility-service.com';

        // $to[] = 'se-aditya@global-mobility-service.com';

        $to = 'idn-rental-lp@global-mobility-service.com';

        // $to[] = 'wahyudin@mobility-sharing-indonesia.com';



        $subject = 'Applicant Rental Program MPV (Mobis)';

        $body = '<!DOCTYPE html>';

        $body .= '<html>';

        $body .= '<head>';

        $body .= '<style>';

        $body .= '@import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap");';

        $body .= 'body{';

        $body .= 'font-family:Roboto;';

        $body .= '}';

        $body .= '#customers {';

        $body .= 'font-family: Arial, Helvetica, sans-serif;';

        $body .= 'border-collapse: collapse;';

        $body .= 'width: 100%;';

        $body .= '}';

        $body .= '';

        $body .= '#customers td, #customers th {';

        $body .= 'border: 1px solid #ddd;';

        $body .= 'padding: 8px;';

        $body .= '}';

        $body .= '';

        $body .= '#customers tr:nth-child(even){background-color: #f2f2f2;}';

        $body .= '';

        $body .= '#customers tr:hover {background-color: #ddd;}';

        $body .= '';

        $body .= '#customers th {';

        $body .= 'padding-top: 12px;';

        $body .= 'padding-bottom: 12px;';

        $body .= 'text-align: left;';

        $body .= 'background-color: #4CAF50;';

        $body .= 'color: white;';

        $body .= '}';

        $body .= '</style>';

        $body .= '</head>';

        $body .= '<body>';

        $body .= '<h2>Pendaftaran baru program rental</H2>';

        $body .= '<table id="customers">';

        $body .= '<tr>';

        $body .= '<td>No. Sequence By Daily</td>';

        $body .= '<td>' . $totalUserRegistToDay . '</td>';

        $body .= '</tr>';

        $body .= '<tr>';

        $body .= '<td>Tgl Register</td>';

        $body .= '<td>' . $toDateUntukRegist . '</td>';

        $body .= '</tr>';

        $body .= '<tr>';

        $body .= '<td>Nama</td>';

        $body .= '<td>' . $camelNama . '</td>';

        $body .= '</tr>';

        $body .= '<tr>';

        $body .= '<td>No HP (Whatsapp)</td>';

        $body .= '<td><a href="api.whatsapp.com/send/?phone=' . $newFormatPhone . '">' . $_POST['ca_phone'] . '</a></td>';

        $body .= '</tr>';

        $body .= '<tr>';

        $body .= '<td>Umur</td>';

        $body .= '<td>' . $age . '</td>';

        $body .= '</tr>';

        $body .= '<tr>';

        $body .= '<td>No KTP</td>';

        $body .= '<td>' . $_POST['ca_no_ktp'] . '</td>';

        $body .= '</tr>';

        $body .= '<tr>';

        $body .= '<td>Domisili</td>';

        $body .= '<td>' . $_POST['ca_domisili'] . '</td>';

        $body .= '</tr>';

        $body .= '<tr>';

        $body .= '<td>Alamat Lengkap Saat Ini</td>';

        $body .= '<td>' . $camelAlamat . '</td>';

        $body .= '</tr>';

        // start Change 20062023

        $body .= '<tr>';

        $body .= '<td>Status Kepemilikan Rumah</td>';

        $body .= '<td>' . $_POST['ca_status_kepemilikan_rmh'] . '</td>';

        $body .= '</tr>';

        // end Change 20062023



        // Start Change

        $body .= '<tr>';

        $body .= '<td>No. Hp Emergency</td>';

        $body .= '<td><a href="api.whatsapp.com/send/?phone=' . $newFormatPhoneErmergency . '">' . $_POST['ca_phone_emergency'] . '</a></td>';

        $body .= '</tr>';



        $body .= '<tr>';

        $body .= '<td>Nama Kontak Emergency</td>';

        $body .= '<td>' . $camelNameEmergency . '</td>';

        $body .= '</tr>';



        $body .= '<tr>';

        $body .= '<td>Hubungan</td>';

        $body .= '<td>' . $camelHubuganEmergency . '</td>';

        $body .= '</tr>';

        // End Change

        $body .= '<tr>';

        $body .= '<td>Apa Aplikasi Driver Online Anda</td>';

        $body .= '<td>' . $_POST['ca_aplikasi_driver'] . '</td>';

        $body .= '</tr>';

        if (trim($_POST['ca_aplikasi_driver']) != 'Tidak Ada Akun') {

            $body .= '<tr>';

            $body .= '<td>Akun driver online atas nama diri sendiri</td>';

            $body .= '<td>' . $_POST['ca_akun_driver_sendiri'] . '</td>';

            $body .= '</tr>';

            $body .= '<tr>';

            $body .= '<td>Jangka waktu bekerja sebagai driver online</td>';

            $body .= '<td>' . $_POST['ca_jangka_waktu_driver_online'] . '</td>';

            $body .= '</tr>';

        }





        $body .= '<tr>';

        $body .= '<td>Preferensi</td>';

        $body .= '<td>' . $_POST['ca_preferensi'] . '</td>';

        $body .= '</tr>';



        $body .= '<tr>';

        $body .= '<td>Mengetahui Informasi dari</td>';

        $body .= '<td>' . $_POST['ca_mengetahui_informasi_dari'] . '</td>';

        $body .= '</tr>';

        if (trim($_POST['ca_akun_fb']) != '') {

            $body .= '<tr>';

            $body .= '<td>Akun FB</td>';

            $body .= '<td>' . $_POST['ca_akun_fb'] . '</td>';

            $body .= '</tr>';

        }

        

        if (trim($_POST['ca_mengetahui_informasi_dari']) == 'Others/Lain-lain' and trim($_POST['ca_sumber_informasi']) != '') {



            $body .= '<tr>';

            $body .= '<td>Sumber Informasi dari</td>';

            $body .= '<td>' . $_POST['ca_sumber_informasi'] . '</td>';

            $body .= '</tr>';

        } else if (trim($_POST['ca_mengetahui_informasi_dari']) == 'Referral' and trim($_POST['ca_referral_code']) != '') {

            $body .= '<tr>';

            $body .= '<td>Referral Code</td>';

            $body .= '<td>' . $_POST['ca_referral_code'] . '</td>';

            $body .= '</tr>';

        } else if (trim($_POST['ca_mengetahui_informasi_dari']) == 'Dari Karyawan' and trim($_POST['ca_referral_name']) != '') {

            $body .= '<tr>';

            $body .= '<td>Nama Karyawan</td>';

            $body .= '<td>' . $_POST['ca_referral_name'] . '</td>';

            $body .= '</tr>';

        } 

        if (trim($promo_code) != '') {

            $body .= '<tr>';

            $body .= '<td>Promo Code</td>';

            $body .= '<td>' . $promo_code . '</td>';

            $body .= '</tr>';

        }

       

        $body .= '</table>';

        $body .= '';

        $body .= '<p>Terima Kasih.</P>';

        $body .= '';

        $body .= '<p>Send By : Mobis</P>';

        $body .= '';

        $body .= '</body>';

        $body .= '</html>';

        $body .= '';

        $headers[] = 'Content-Type: text/html; charset=UTF-8';

        // $headers[] = 'Bcc: idn-mobilagi@global-mobility-service.com';

        $headers[] = 'Reply-To: Mobis <idn-rental-lp@global-mobility-service.com>';

        $headers[] = 'From: Mobis <idn-mobilagi@global-mobility-service.com>';


        if(getDomainDb()){
            $send_mail = wp_mail($to, $subject, $body, $headers);   
        }
        

    }


    $listSim = ['A','A Umum','B','B2','B2 Umum','C','B1','B1 Umum'];

    // Pendaftaran Rental Driver spreedsheet
    $client = new Google_Client();
    $client->setApplicationName('Google Sheets and PHP');
    $client->setAuthConfig(__DIR__ . '/credentials.json');
    $client->setScopes(Google_Service_Sheets::SPREADSHEETS);
    $client->setAccessType('online');
    $redirect_uri = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];
    $client->setRedirectUri($redirect_uri);
    $service = new Google_Service_Sheets($client);
    $spreadsheetId = '1mYPIVGkPHJiHtD-3aohslJ9OG8EM2fhsD-o3bIpk4pY';



    $values = [
        [
            $camelNama, 
            $sheetPhoneHyperlink, 
            $age, 
            "'" . $_POST['ca_no_ktp'], 
            $_POST['ca_domisili'], 
            $camelAlamat, 
            $_POST['ca_status_kepemilikan_rmh'], 
            $_POST['ca_aplikasi_driver'], 
            $akun_driver_sendiri, 
            $jangka_waktu_driver_online, 
            $_POST['ca_preferensi'], 
            $_POST['ca_mengetahui_informasi_dari'], 
            $_POST['ca_akun_fb'], 
            $sumber_informasi_lain, 
            "Website Mobis", 
            "", 
            "", 
            date("d-m-Y"), 
            $timeRegisterDriver, 
            $sheetPhoneEmergencyHyperlink, 
            $camelNameEmergency, 
            $camelHubuganEmergency,
            $camelTemapatLahir,
            $_POST['ca_birth_date'],
            $_POST['ca_sim_number'],
            $listSim[$_POST['ca_sim_type']],
            $_POST['ca_sim_exp_date']
        ]
    ];

    $body = new Google_Service_Sheets_ValueRange([
        'values' => $values
    ]);

    $range = 'Posts';

    $params = [
        'valueInputOption' => "USER_ENTERED"
    ];

    $service->spreadsheets_values->append($spreadsheetId, $range, $body, $params);





    

    //Program Rental Driver spreedsheet

    $client = new Google_Client();
    $client->setApplicationName('Google Sheets and PHP');
    $client->setAuthConfig(__DIR__ . '/credentials.json');
    $client->setScopes(Google_Service_Sheets::SPREADSHEETS);
    $client->setAccessType('online');
    $redirect_uri = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];
    $client->setRedirectUri($redirect_uri);
    $service = new Google_Service_Sheets($client);
    $spreadsheetId = '1oUBhDOLlsQ2jSw5qYT9NITu0d0VPLEPhn1zwpJHiJ3Y';

    if($_POST['ca_preferensi'] == 'Provinsi Bali'){
        $spreadsheetId = '1qW_Jt4uCL37QYTO6xzztILba6ixNeOuWArcDrXVDOa8';
    }else if($_POST['ca_preferensi'] == 'Surabaya' || $_POST['ca_preferensi'] == 'Sidoarjo' || $_POST['ca_preferensi'] == 'Gersik' ){
    	 $spreadsheetId = '1q2MHNnL-J28OcYbBETsI9uUuhqM5ty33UGr_f7D8yYo';
    }else if($_POST['ca_preferensi'] == 'Bandung'){
        $spreadsheetId = '133BpHSTkcAdHKaY0SLab4SPBH7qKjYoMXEitra8QoPg';
    }


    $values = [
        [
            $camelNama, 
            $sheetPhoneHyperlink, 
            $age, 
            "'" . $_POST['ca_no_ktp'], 
            $_POST['ca_domisili'], 
            $camelAlamat, 
            $_POST['ca_status_kepemilikan_rmh'], 
            $_POST['ca_aplikasi_driver'], 
            $akun_driver_sendiri, 
            $jangka_waktu_driver_online, 
            $_POST['ca_preferensi'], 
            $_POST['ca_mengetahui_informasi_dari'], 
            $_POST['ca_akun_fb'], 
            $sumber_informasi_lain, 
            "Website Mobis", 
            "", 
            "", 
            date("d-m-Y"), 
            $timeRegisterDriver, 
            $sheetPhoneEmergencyHyperlink, 
            $camelNameEmergency, 
            $camelHubuganEmergency,
            $camelTemapatLahir,
            $_POST['ca_birth_date'],
            $_POST['ca_sim_number'],
            $listSim[$_POST['ca_sim_type']],
            $_POST['ca_sim_exp_date']
        ]
    ];

    $body = new Google_Service_Sheets_ValueRange([

        'values' => $values

    ]);

    $range = 'Leads!A1:Z1';

    $params = [

        'valueInputOption' => "USER_ENTERED"

    ];

    $service->spreadsheets_values->append($spreadsheetId, $range, $body, $params);



    $response['id'] = $id;


    
    switch ($_POST['ca_preferensi']) {

        case "Kranggan - Kota Bekasi":
         $pools_pref = "1";
        break;

        case "Karawaci - Kabupaten Tanggerang":
         $pools_pref = "2";
        break;

        case "Tanah Sereal - Kota Bogor":
         $pools_pref = "3";
        break;

        case "Pondok Cabe - Kota Tangerang Selatan":
            $pools_pref = "4";
        break;

        case "Provinsi Bali":
            $pools_pref = "5";

        default:
            $pools_pref = "";

       }

    switch ($_POST['ca_status_kepemilikan_rmh']){
        case "Atas Nama Sendiri":
            $home_status = "1";
            break;
        case "Atas Nama Orang Lain":
            $home_status = "2";
            break;
        case "Sewa":
            $home_status = "3";
            break;
        default:
            $home_status = "";

      }

     switch ($_POST['ca_aplikasi_driver']) {

        case "Gocar":
         $app_drive = "1";
        break;

        case "Grabcar":
         $app_drive = "2";
        break;

        case "Lalamove Car":
         $app_drive = "3";
        break;

        case "Maxim":
          $app_drive = "4";
        break;

        case "Indriver":
           $app_drive = "5";
        break;

        default:
            $app_drive = "";

     }

     if($akun_driver_sendiri){
        $self_account = "1";
    }else{
        $self_account = "0";
    }

    switch ($jangka_waktu_driver_online) {
        case "kurang dari 3 bulan":
         $work_time_duration = "1";
        break;

        case "kurang dari 6 bulan":
         $work_time_duration = "2";
        break;

        case "kurang dari 1 tahun":
         $work_time_duration = "3";
        break;

        case "lebih dari 1 tahun":
          $work_time_duration = "4";
        break;

        default:
            $work_time_driver = "";

    }

     switch ($_POST['ca_mengetahui_informasi_dari']) {
        case "kurang dari 3 bulan":
         $work_time_duration = "1";
        break;

        case "kurang dari 6 bulan":
         $work_time_duration = "2";
        break;

        case "kurang dari 1 tahun":
         $work_time_duration = "3";
        break;

        case "lebih dari 1 tahun":
          $work_time_duration = "4";
        break;

        default:
            $work_time_driver = "";

     }



     switch ($_POST['ca_mengetahui_informasi_dari']) {

        case "Tiktok":
         $social_resources = "1";
        break;

        case "YouTube":
         $social_resources = "2";
        break;

        case "Facebook":
         $social_resources = "3";
        break;

        case "Instagram":
          $social_resources = "4";
        break;

        case "OLX":
          $social_resources = "5";
        break;

        case "Google":
           $social_resources ="6";
        break;

        case "Referral":
           $social_resources ="7";
        break;

        case "Dari Karyawan":
           $social_resources ="8";
        break;

        default:
            $work_time_driver = "";

     }


     switch($_POST['ca_domisili']){

        case 'DKI Jakarta':
           $domicile = "1";
        break;

        case 'Kota/Kab. Bogor':
           $domicile = "2";
        break;

        case 'Kota/Kab. Bekasi':
           $domicile = "3";
        break;

        case 'Kota/Kab. Bekasi':
           $domicile = "4";
        break;

        case 'Kota/Kab. Bekasi':
           $domicile = "5";
        break;

        case 'Kota Depok':
           $domicile = "6";
           break;

        default:
           $domicile = "";

     }

      $adds_more_information = [
        "facebook/instagram : ".$_POST['ca_akun_fb'],
        "referral : ".$_POST['ca_referral_code'],
        "employee : ".$_POST['ca_referral_name'],
        "other : ".$_POST['ca_sumber_informasi']
     ];


    $merge_more_information = implode (' | ', $adds_more_information);

    $url = "https://stgapi.fleet-management-system.co.id/public/mobis/leads";
    // $url = "https://api.fleet-management-system.co.id/public/mobis/leads";
    $data = [
             "name" => $camelNama,
             "phone_number" =>  $newFormatPhone,
             "age" => $age,
             "identity_number" => $_POST['ca_no_ktp'],
             "domicile" => $domicile,
             "address" => $camelAlamat,
             "home_ownership_status" => $home_status,
             "online_driver_app" => $app_drive,
             "personal_online_driver_app" => $self_account,
             "online_driver_duration" => $work_time_duration    ,
             "pool_preference" => $pools_pref,
             "information_source" => $social_resources,
             "detail_information_source" => $sumber_informasi_lain." | ".$merge_more_information,
             "promo_code" => $promo_code,
             "registered_from" => "Website Mobis",
             "emergency_phone_number" => $newFormatPhoneErmergency,
             "emergency_contact_name" => $camelNameEmergency,
             "emergency_contact_relation" => $camelHubuganEmergency,
             "lead_place_of_birth"=>$camelTemapatLahir,
             "lead_date_of_birth"=>$_POST['ca_birth_date'],
             "lead_sim_no"=>$_POST['ca_sim_number'],
             "lead_sim_type"=>$_POST['ca_sim_type'],
             "lead_sim_expire_date"=>$_POST['ca_sim_exp_date']
    ];

    $headers = [
          "Content-Type: application/json",
          "x-public-keys: R01TeE1TSWluZG9uZXNpYTIwMjQ="
    ];


     // Inisialisasi curl
     $ch = curl_init($url);

     // Set opsi curl
     curl_setopt($ch, CURLOPT_POST, true);
     curl_setopt($ch, CURLOPT_TIMEOUT, 60);
     curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
     curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
     curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
     curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

     // Eksekusi curl dan tangkap respons
     $response = curl_exec($ch);

     // Periksa untuk kesalahan
    if (curl_errno($ch)) {
       echo 'Error:' . curl_error($ch);
    }

    // Tutup curl
    curl_close($ch);


    //   wp_mail( $to, $subject, $body, $headers );

    $response['id'] = $id;


    //   wp_mail( $to, $subject, $body, $headers );



    exit(json_encode($response));

}

/**
 *
 *
 *
 Fuction For check Driver Status
 *
 */


add_action('wp_ajax_mobis_check_status', 'mobis_check_status_handler');
add_action('wp_ajax_nopriv_mobis_check_status', 'mobis_check_status_handler');

function mobis_check_status_handler() {
    header('Content-Type: application/json; charset=utf-8');

    // ambil area dari 2 nama
    $area = '';
    if (!empty($_REQUEST['ca_pref'])) {
        $area = sanitize_text_field($_REQUEST['ca_pref']);
    } elseif (!empty($_REQUEST['ca_preferensi'])) {
        $area = sanitize_text_field($_REQUEST['ca_preferensi']);
    }

    // UPPERCASE supaya cocok dgn GAS
    $area = strtoupper(trim($area));

    // tipe input
    $input_type = isset($_REQUEST['input_type']) && $_REQUEST['input_type'] !== ''
        ? sanitize_text_field($_REQUEST['input_type'])
        : 'nik';

    // nik / phone
    $nik_raw   = isset($_REQUEST['nik']) ? $_REQUEST['nik'] : '';
    $phone_raw = isset($_REQUEST['phone']) ? $_REQUEST['phone'] : '';

    // ke digit saja
    $nik_clean   = $nik_raw !== '' ? preg_replace('/\D+/', '', $nik_raw) : '';
    $phone_clean = $phone_raw !== '' ? preg_replace('/\D+/', '', $phone_raw) : '';

    // validasi dasar
    if ($area === '') {
        echo json_encode([
            'success' => false,
            'message' => 'Area belum dipilih.'
        ]);
        wp_die();
    }
    if ($input_type === 'nik' && $nik_clean === '') {
        echo json_encode([
            'success' => false,
            'message' => 'Mohon isi NIK terlebih dahulu.'
        ]);
        wp_die();
    }
    if ($input_type === 'phone' && $phone_clean === '') {
        echo json_encode([
            'success' => false,
            'message' => 'Mohon isi nomor handphone terlebih dahulu.'
        ]);
        wp_die();
    }

    // URL GAS
    $gas_base  = 'https://script.google.com/macros/s/AKfycbwueMEz3gDjWlQMNYGB6zWdt22oVvVKE6fElnnGV9LJdwgs4kkNqQ0wiQPWfjisZhKB/exec';
    // $gas_base = 'https://script.google.com/macros/s/AKfycbzIAMBnRpUJ6H7-wRVJkjBkXkCenQnYofLlmtE_re1hIUm0lpvU2sgghcrBBwRYldP4/exec';
    $gas_token = 'MOBIS_SECRET_123'; // <- ganti sesuai di GAS

    // kirim 2 nama area + 3 versi nik
    $query_args = [
        'token'         => $gas_token,
        'ca_pref'       => $area,
        'ca_preferensi' => $area,
        'input_type'    => $input_type,
        'nik'           => $nik_clean,
        'nik_raw'       => $nik_raw,
        'nik_str'       => $nik_clean ? ("'".$nik_clean) : '',
        'phone'         => $phone_clean,
        'phone_raw'     => $phone_raw,
    ];

    $gas_url  = add_query_arg($query_args, $gas_base);
    $response = wp_remote_get($gas_url, ['timeout' => 20]);

    if (is_wp_error($response)) {
        echo json_encode([
            'success' => false,
            'message' => 'Gagal menghubungi server pendaftaran (WP/cURL).',
            'error'   => $response->get_error_message(),
        ]);
        wp_die();
    }


    $body = wp_remote_retrieve_body($response);
    $gas  = json_decode($body, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode([
            'success' => false,
            'message' => 'Respon dari server pendaftaran tidak valid.',
            'raw'     => $body,
        ]);
        wp_die();
    }

    // kalau GAS bilang ok:false
    if (isset($gas['ok']) && $gas['ok'] === false) {
        echo json_encode([
            'success'  => false,
            'message'  => $gas['error'] ?? 'Server menolak permintaan.',
            'timeline' => isset($gas['timeline']) ? $gas['timeline'] : [],
        ]);
        wp_die();
    }

    // pastikan ada timeline
    if (!isset($gas['timeline'])) {
        if (isset($gas['data']) && is_array($gas['data'])) {
            $gas['timeline'] = $gas['data'];
        } elseif (isset($gas['steps']) && is_array($gas['steps'])) {
            $gas['timeline'] = $gas['steps'];
        } else {
            $gas['timeline'] = [];
        }
    }

    echo json_encode($gas);
    wp_die();
}

// kirim ajax_url ke frontend
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_script('jquery');
    wp_localize_script('jquery', 'MOBIS_AJAX', [
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce'    => wp_create_nonce('mobis_check_status_nonce'),
    ]);
});



/**
 *
 *
 *
 End Fuction Check Driver Status
 *
 */




add_action('wp_ajax_form_lpk', 'form_lpk');
add_action('wp_ajax_nopriv_form_lpk', 'form_lpk');

function form_lpk()  {

    if (trim($_POST['lpk_firstName']) == '') {
        $response['error'] = true;
        $response['error_message'] = 'Harap isi bidang Give name di formulir';
        exit(json_encode($response));
    }

    if (trim($_POST['lpk_lastName']) == '') {
        $response['error'] = true;
        $response['error_message'] = 'Harap isi bidang Last name di formulir';
        exit(json_encode($response));
    }


    $countryCode = 62;

    $newFormatPhone = preg_replace('/^0?/', $countryCode, $_POST['lpk_phoneNumber']);
    $sheetPhoneHyperlink = '=HYPERLINK("api.whatsapp.com/send/?phone=' . $newFormatPhone . '", "' . $_POST['lpk_phoneNumber'] . '")';
    
    if (trim($_POST['lpk_email']) == '') {
        $response['error'] = true;
        $response['error_message'] = 'Harap isi bidang email PIC di formulir';
        exit(json_encode($response));
    }

    if (trim($_POST['lpk_job']) == '') {
        $response['error'] = true;
        $response['error_message'] = 'Harap isi bidang email PIC di formulir';
        exit(json_encode($response));
    }


    
    // Pendaftaran Rental Driver spreedsheet
    $client = new Google_Client();
    $client->setApplicationName('Google Sheets and PHP');
    $client->setAuthConfig(__DIR__ . '/credentials.json');
    $client->setScopes(Google_Service_Sheets::SPREADSHEETS);
    $client->setAccessType('online');
    $redirect_uri = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];
    $client->setRedirectUri($redirect_uri);
    $service = new Google_Service_Sheets($client);
    $spreadsheetId = '1SrnPRzRj0XR_PpDauZn0jkKJvcpBo6TZdo9iPg4oOAw';


    $values = [
        [
            $_POST['lpk_firstName'], 
            $_POST['lpk_lastName'], 
            $sheetPhoneHyperlink, 
            $_POST['lpk_email'], 
            $_POST['lpk_job'], 
            $_POST['lpk_typeJob'], 
        ]
    ];

    $body = new Google_Service_Sheets_ValueRange([
        'values' => $values
    ]);
    $range = 'Registration';
    $params = [
        'valueInputOption' => "USER_ENTERED"
    ];

    $service->spreadsheets_values->append($spreadsheetId, $range, $body, $params);

    $to[] = 'ml_idn-b2b@global-mobility-service.com';

    $subject = 'Applicant Program B2B';
    $body = '<!DOCTYPE html>';
    $body .= '<html>';
    $body .= '<head>';
    $body .= '<style>';
    $body .= '@import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap");';
    $body .= 'body{';
    $body .= 'font-family:Roboto;';
    $body .= '}';
    $body .= '#customers {';
    $body .= 'font-family: Arial, Helvetica, sans-serif;';
    $body .= 'border-collapse: collapse;';
    $body .= 'width: 100%;';
    $body .= '}';
    $body .= '';
    $body .= '#customers td, #customers th {';
    $body .= 'border: 1px solid #ddd;';
    $body .= 'padding: 8px;';
    $body .= '}';
    $body .= '';
    $body .= '#customers tr:nth-child(even){background-color: #f2f2f2;}';
    $body .= '';
    $body .= '#customers tr:hover {background-color: #ddd;}';
    $body .= '';
    $body .= '#customers th {';
    $body .= 'padding-top: 12px;';
    $body .= 'padding-bottom: 12px;';
    $body .= 'text-align: left;';
    $body .= 'background-color: #4CAF50;';
    $body .= 'color: white;';
    $body .= '}';
    $body .= '</style>';
    $body .= '</head>';
    $body .= '<body>';
    $body .= '<h2>Pendaftaran baru program B2B</H2>';
    $body .= '<table id="customers">';
    $body .= '<tr>';
    $body .= '<tr>';
    $body .= '<td>Nama Perusahaan</td>';
    $body .= '<td>' . $_POST['ca_company_name'] . '</td>';
    $body .= '</tr>';
    $body .= '<tr>';
    $body .= '<td>Alamat Perusahaan</td>';
    $body .= '<td>' . $_POST['ca_alamat_perusahaan'] . '</td>';
    $body .= '</tr>';
    $body .= '<tr>';
    $body .= '<td>Nama PIC</td>';
    $body .= '<td>' . $_POST['ca_pic_name'] . '</td>';
    $body .= '</tr>';
    $body .= '<tr>';
    $body .= '<td>Email PIC</td>';
    $body .= '<td>' . $_POST['ca_pic_email'] . '</td>';
    $body .= '</tr>';
    $body .= '<tr>';
    $body .= '<td>No PIC</td>';
    $body .= '<td><a href="api.whatsapp.com/send/?phone=' . $newFormatPhone . '">' . $_POST['ca_pic_phone'] . '</a></td>';
    $body .= '</tr>';
    $body .= '<tr>';
    $body .= '<td>Website Perusahaan</td>';
    $body .= '<td></td>';
    $body .= '</tr>';
    $body .= '<tr>';
    $body .= '<tr>';
    $body .= '<td>Nama Badan Hukum Perusahaan</td>';
    $body .= '<td></td>';
    $body .= '</tr>';
    $body .= '<tr>';
    $body .= '<td>Tipe Kendaraan</td>';
    $body .= '<td>' . $_POST['ca_type_car'] . '</td>';
    $body .= '</tr>';
    $body .= '<tr>';
    $body .= '<td>Jumlah Kendaraan</td>';
    $body .= '<td></td>';
    $body .= '</tr>';
    $body .= '</table>';
    $body .= '';
    $body .= '<p>Terima Kasih.</P>';
    $body .= '';
    $body .= '<p>Send By : GMSI B2B</P>';
    $body .= '';
    $body .= '</body>';
    $body .= '</html>';
    $body .= '';
    $headers[] = 'Content-Type: text/html; charset=UTF-8';
    $headers[] = 'Reply-To: Mobis <idn-rental-lp@global-mobility-service.com>';
    $headers[] = 'From: Mobis <idn-mobilagi@global-mobility-service.com>';
    if(getDomainDb()){
        wp_mail($to, $subject, $body, $headers);
    }
    exit(json_encode(array('error' => false, 'status' => 200)));
}





add_action('wp_ajax_form_b2b', 'form_b2b');

add_action('wp_ajax_nopriv_form_b2b', 'form_b2b');

function form_b2b()

{

    $response = array(

        'error' => false,

        'status' => 200

    );





    if (trim($_POST['ca_company_name']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang nama perusahaan di formulir';

        exit(json_encode($response));

    }



    if (trim($_POST['ca_alamat_perusahaan']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang alamat perusahaan di formulir';

        exit(json_encode($response));

    }



    if (trim($_POST['ca_pic_name']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang nama PIC di formulir';

        exit(json_encode($response));

    }



    if (trim($_POST['ca_pic_phone']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang no HP PIC di formulir';

        exit(json_encode($response));

    } else {

        $phone = $_POST["ca_pic_phone"];

        if (!preg_replace('/[^0-9]/', '', $phone)) {

            $response['error'] = true;

            $response['error_message'] = "format no HP tidak benar";

            exit(json_encode($response));

        }

    }





    if (trim($_POST['ca_pic_email']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang email PIC di formulir';

        exit(json_encode($response));

    }



    // if (trim($_POST['ca_company_legal_entity']) == '') {

    //     $response['error'] = true;

    //     $response['error_message'] = 'Harap isi bidang nama badan hukum perusahaan di formulir';

    //     exit(json_encode($response));

    // }





    if (trim($_POST['ca_type_car']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap pilih bidang tipe kendaraan di formulir';

        exit(json_encode($response));

    }



    // if (trim($_POST['ca_number_car']) == '') {

    //     $response['error'] = true;

    //     $response['error_message'] = 'Harap isi jumlah kendaraan di formulir';

    //     exit(json_encode($response));

    // }









    $pod = pods('b2b_form');

    switch ($$_POST['ca_type_car']) {
        case 'MPV':
                $MdlKendaraan = $_POST['merk_mvp_car'];
            break;

        case 'Logistic Dry':
                $MdlKendaraan = $_POST['merk_dry_car'];
            break;

        case 'Logistic Refrigerator':
                $MdlKendaraan = $_POST['merk_refrigerator_car'];
            break;
        
        default:
                $MdlKendaraan = "";
            break;
    }

    $data = array(

        'nama_perusahaan' => $_POST['ca_company_name'],

        'alamat_perusahaan' => $_POST['ca_alamat_perusahaan'],

        'nama_pic' => $_POST['ca_pic_name'],

        'nomor_pic' => $_POST['ca_pic_phone'],

        'email_pic' => $_POST['ca_pic_email'],

        // 'website_perusahaan' => $_POST['ca_company_website'],
        'website_perusahaan' => '',

        // 'nama_badan_hukum_perusahaan' => $_POST['ca_company_legal_entity'],

        'nama_badan_hukum_perusahaan' => '',

        'tipe_kendaraan' => $_POST['ca_type_car'],

        'model_kendaraan' => $MdlKendaraan,

        'jumlah_kendaraan' => ''

    );

    $id = $pod->add($data);



    // $post = array( 'ID' => $id, 'post_status' => 'publish' );

    // wp_update_post($post);



    $countryCode = 62;

    $newFormatPhone = preg_replace('/^0?/', $countryCode, $_POST['ca_pic_phone']);

    // $newFormatPhone = preg_replace('/^0?/', '+'.$countryCode, $_POST['ca_pic_phone']);

    $sheetPhoneHyperlink = '=HYPERLINK("api.whatsapp.com/send/?phone=' . $newFormatPhone . '", "' . $_POST['ca_pic_phone'] . '")';







    //Program Rental Driver spreedsheet B2B

    $client = new Google_Client();

    $client->setApplicationName('Google Sheets and PHP');

    $client->setAuthConfig(__DIR__ . '/credentials.json');

    $client->setScopes(Google_Service_Sheets::SPREADSHEETS);

    $client->setAccessType('online');

    $redirect_uri = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];

    $client->setRedirectUri($redirect_uri);

    $service = new Google_Service_Sheets($client);

    $spreadsheetId = '1Is-6yUTtaLCgsmmUxZnXYQBwnjLtID3h6_QXO1zQ8Uk';



    $values = [

        // [$_POST['ca_company_name'], $_POST['ca_alamat_perusahaan'], $_POST['ca_pic_name'], $sheetPhoneHyperlink, $_POST['ca_pic_email'], $_POST['ca_company_website'], $_POST['ca_company_legal_entity'], $_POST['ca_type_car'], $_POST['ca_number_car'], '', '', 'Website', date("d-m-Y")]
        
        [$_POST['ca_company_name'], $_POST['ca_alamat_perusahaan'], $_POST['ca_pic_name'], $sheetPhoneHyperlink, $_POST['ca_pic_email'], '', '', $_POST['ca_type_car'], '', '', '', 'Website', date("d-m-Y")]
    ];

    $body = new Google_Service_Sheets_ValueRange([

        'values' => $values

    ]);

    $range = 'B2B Leads';

    $params = [

        'valueInputOption' => "USER_ENTERED"

    ];

    $service->spreadsheets_values->append($spreadsheetId, $range, $body, $params);







    $response['id'] = $id;





    // $to[] = 'register@mobility-sharing-indonesia.com';

    // $to[] = 'emailhendra2@gmail.com';

    // $to[] = 'hi-ohashi@global-mobility-service.com';

    // $to[] = 'za-arkan@global-mobility-service.com';

    // $to[] = 'pa-daniel@global-mobility-service.com';

    //$to[] = 'se-aditya@global-mobility-service.com';

    //$to[] = 'idn-rental-lp@global-mobility-service.com';

    $to[] = 'ml_idn-b2b@global-mobility-service.com';



    $subject = 'Applicant Program B2B';

    $body = '<!DOCTYPE html>';

    $body .= '<html>';

    $body .= '<head>';

    $body .= '<style>';

    $body .= '@import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap");';

    $body .= 'body{';

    $body .= 'font-family:Roboto;';

    $body .= '}';

    $body .= '#customers {';

    $body .= 'font-family: Arial, Helvetica, sans-serif;';

    $body .= 'border-collapse: collapse;';

    $body .= 'width: 100%;';

    $body .= '}';

    $body .= '';

    $body .= '#customers td, #customers th {';

    $body .= 'border: 1px solid #ddd;';

    $body .= 'padding: 8px;';

    $body .= '}';

    $body .= '';

    $body .= '#customers tr:nth-child(even){background-color: #f2f2f2;}';

    $body .= '';

    $body .= '#customers tr:hover {background-color: #ddd;}';

    $body .= '';

    $body .= '#customers th {';

    $body .= 'padding-top: 12px;';

    $body .= 'padding-bottom: 12px;';

    $body .= 'text-align: left;';

    $body .= 'background-color: #4CAF50;';

    $body .= 'color: white;';

    $body .= '}';

    $body .= '</style>';

    $body .= '</head>';

    $body .= '<body>';

    $body .= '<h2>Pendaftaran baru program B2B</H2>';

    $body .= '<table id="customers">';

    $body .= '<tr>';

    $body .= '<tr>';

    $body .= '<td>Nama Perusahaan</td>';

    $body .= '<td>' . $_POST['ca_company_name'] . '</td>';

    $body .= '</tr>';

    $body .= '<tr>';

    $body .= '<td>Alamat Perusahaan</td>';

    $body .= '<td>' . $_POST['ca_alamat_perusahaan'] . '</td>';

    $body .= '</tr>';

    $body .= '<tr>';

    $body .= '<td>Nama PIC</td>';

    $body .= '<td>' . $_POST['ca_pic_name'] . '</td>';

    $body .= '</tr>';

    $body .= '<tr>';

    $body .= '<td>Email PIC</td>';

    $body .= '<td>' . $_POST['ca_pic_email'] . '</td>';

    $body .= '</tr>';

    $body .= '<tr>';

    $body .= '<td>No PIC</td>';

    $body .= '<td><a href="api.whatsapp.com/send/?phone=' . $newFormatPhone . '">' . $_POST['ca_pic_phone'] . '</a></td>';

    $body .= '</tr>';

    $body .= '<tr>';

    $body .= '<td>Website Perusahaan</td>';

    $body .= '<td></td>';

    $body .= '</tr>';

    $body .= '<tr>';

    $body .= '<tr>';

    $body .= '<td>Nama Badan Hukum Perusahaan</td>';

    $body .= '<td></td>';

    $body .= '</tr>';

    $body .= '<tr>';

    $body .= '<td>Tipe Kendaraan</td>';

    $body .= '<td>' . $_POST['ca_type_car'] . '</td>';

    $body .= '</tr>';

    $body .= '<tr>';

    $body .= '<td>Jumlah Kendaraan</td>';

    $body .= '<td></td>';

    $body .= '</tr>';

    $body .= '</table>';

    $body .= '';

    $body .= '<p>Terima Kasih.</P>';

    $body .= '';

    $body .= '<p>Send By : GMSI B2B</P>';

    $body .= '';

    $body .= '</body>';

    $body .= '</html>';

    $body .= '';
    $headers[] = 'Content-Type: text/html; charset=UTF-8';
    // $headers[] = 'Bcc: idn-mobilagi@global-mobility-service.com';
    $headers[] = 'Reply-To: Mobis <idn-rental-lp@global-mobility-service.com>';
    $headers[] = 'From: Mobis <idn-mobilagi@global-mobility-service.com>';
    if(getDomainDb()){
        $send_mail = wp_mail($to, $subject, $body, $headers);
    }
    //   wp_mail( $to, $subject, $body, $headers );
    exit(json_encode($response));

}



add_action('ninja_forms_after_submission', 'my_ninja_forms_after_submission');



function my_ninja_forms_after_submission($form_data)

{
    $client = new Google_Client();

    $client->setApplicationName('Google Sheets and PHP');

    $client->setAuthConfig(__DIR__ . '/credentials.json');

    $client->setScopes(Google_Service_Sheets::SPREADSHEETS);

    $client->setAccessType('online');

    $redirect_uri = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];

    $client->setRedirectUri($redirect_uri);

    $service = new Google_Service_Sheets($client);

    $spreadsheetId = '1fp20ZbBH99Adovnj5abhjwMbYoGdfzd9xieckSGU8Mc';



    $valTujuanPertanyaan = "";

    $valMasukanPesan = "";

    $valPhone = "";

    $valMail = "";

    foreach ($form_data['fields'] as $field) { // Field settigns, including the field key and value.



        if ('tujuan_dari_pertanyaan_1611836430668' == $field['key']) { // Check the field key to see if this is the field that I need to update.



            $valTujuanPertanyaan = $field['value'];

        }



        if ('phone_1612009152764' == $field['key']) { // Check the field key to see if this is the field that I need to update.



            $valPhone = $field['value'];

        }



        if ('email_1612009165710' == $field['key']) { // Check the field key to see if this is the field that I need to update.



            $valMail = $field['value'];

        }



        if ('masukan_pesan_1611836470619' == $field['key']) { // Check the field key to see if this is the field that I need to update.



            $valMasukanPesan = $field['value'];

        }

    }









    $values = [

        ['', $valTujuanPertanyaan, $valPhone, $valMail, $valMasukanPesan, date("d-m-Y")]

    ];

    $body = new Google_Service_Sheets_ValueRange([

        'values' => $values

    ]);

    $range = 'Form Submissions';

    $params = [

        'valueInputOption' => "USER_ENTERED"

    ];

    $service->spreadsheets_values->append($spreadsheetId, $range, $body, $params);

}


//start form kontak ninja form
add_filter( 'ninja_forms_run_action_settings', 'customize_email_bcc', 10, 4 );

function customize_email_bcc( $action_settings, $form_id, $action_id, $form_settings ) {
    if ($form_id == 3 && $action_settings['type'] == 'email' && $action_settings['active'] == 1) { // Replace YOUR_FORM_ID with your actual form ID.
        
    // error_log("phase 1");
        // Initialize a variable for the BCC email address.
                $cc_email = '';

                // Get the email message content.
                $email_message = $action_settings['email_message'] ?? '';

                // Check if the email message contains the specific string.
                if (strpos($email_message, 'Inquiry for Human Resources Support') !== false) {
                    // error_log("phase 2-1");
                    $cc_email = 'idn-hr-project@global-mobility-service.com, taiga.saito@mobility-sharing-indonesia.com '; // Set the BCC email if found.
                } else {
                    // error_log("phase 2-2");
                    $cc_email = 'idn-info@global-mobility-service.com'; // Set a default BCC email.
                }

                // Modify the BCC in the action settings.
                $action_settings['cc'] = $cc_email;

                // Log the decision for debugging.
                // error_log('BCC Email Set: ' . $bcc_email);
            
        return  $action_settings;
    }
}



// start form mccs

add_action('wp_ajax_form_mccs', 'form_mccs');

add_action('wp_ajax_nopriv_form_mccs', 'form_mccs');

function form_mccs()

{

    $response = array(

        'error' => false,

        'status' => 200

    );



    if (trim($_POST['input_name']) == '') {

        $response['error'] = true;

        exit(json_encode($response));

    }



    if (trim($_POST['input_email']) == '') {

        $response['error'] = true;

        exit(json_encode($response));

    }



    if (trim($_POST['input_company_name']) == '') {

        $response['error'] = true;

        exit(json_encode($response));

    }



    if (trim($_POST['input_wa_number']) == '') {

        $response['error'] = true;

        exit(json_encode($response));

    }



    if (trim($_POST['input_massage']) == '') {

        $response['error'] = true;

        exit(json_encode($response));

    }



    $countryCode = 62;

    $newFormatPhone = preg_replace('/^0?/', $countryCode, $_POST['input_wa_number']);

    // $newFormatPhone = preg_replace('/^0?/', '+'.$countryCode, $_POST['ca_pic_phone']);

    $sheetPhoneHyperlink = '=HYPERLINK("api.whatsapp.com/send/?phone=' . $newFormatPhone . '", "' . $_POST['input_wa_number'] . '")';



    $client = new Google_Client();

    $client->setApplicationName('Google Sheets and PHP');

    $client->setAuthConfig(__DIR__ . '/credentials.json');

    $client->setScopes(Google_Service_Sheets::SPREADSHEETS);

    $client->setAccessType('online');

    $redirect_uri = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];

    $client->setRedirectUri($redirect_uri);

    $service = new Google_Service_Sheets($client);

    $spreadsheetId = '1fp20ZbBH99Adovnj5abhjwMbYoGdfzd9xieckSGU8Mc';

    date_default_timezone_set('Asia/Jakarta');

    $values = [

        [$_POST['input_name'], $_POST['input_email'], $_POST['input_company_name'], $sheetPhoneHyperlink, $_POST['input_massage'], date("d-m-Y"), date('H:i')]

    ];

    $body = new Google_Service_Sheets_ValueRange([

        'values' => $values

    ]);

    $range = 'Form_MCCS';

    $params = [

        'valueInputOption' => "USER_ENTERED"

    ];

    $service->spreadsheets_values->append($spreadsheetId, $range, $body, $params);



    exit(json_encode($response));

}

// end form mccs



// Start untuk form login admin mobis

add_action('wp_ajax_form_login_rental', 'form_login_rental');

add_action('wp_ajax_nopriv_form_login_rental', 'form_login_rental');

function form_login_rental()

{

    global $wpdb;



    $response = array(

        'error' => false,

    );



    $resultEmail = null;



    // if (trim($_POST['email']) == '' && empty($resultEmail)) {

    //     $response['error'] = true;

    //     $response['error_message'] = 'Akun tidak terdaftar';

    //     exit(json_encode($response));

    // } else {

    //     $response['error'] = false;

    //     $response['email'] = $resultEmail;

    //     session_start();

    //     $_SESSION['auth_admin'] = $resultEmail;

    //     exit(json_encode($response));

    // }



    if (trim($_POST['email']) !== '') {

        $resultEmail = $wpdb->get_results(

            "SELECT * FROM wp_users WHERE user_email = '{$_POST['email']}' AND user_status = 0"

        );

    }

    if (!empty($resultEmail)) {

        $response['error'] = false;

        $response['email'] = $resultEmail;

        session_start();

        $_SESSION['auth_admin'] = $resultEmail;

        exit(json_encode($response));

    } else {

        $response['error'] = true;

        $response['error_message'] = 'Akun tidak terdaftar';

        exit(json_encode($response));

    }

}

// End untuk form login admin mobis



// Start untuk mengirim params ID driver

add_action('wp_ajax_form_params_id_d', 'form_params_id_d');

add_action('wp_ajax_nopriv_form_params_id_d', 'form_params_id_d');

function form_params_id_d()

{

    $response = array(

        'error' => false,

    );

    if (trim($_POST['id_params']) == '') {

        $response['error'] = true;

        exit(json_encode($response));

    } else {

        $response['error'] = false;

        session_start();

        $_SESSION['params_id'] = $_POST['id_params'];

        $response['params'] = $_SESSION['params_id'];

        exit(json_encode($response));

    }

}

// End untuk mengirim params ID driver



// Start function untuk update status driver

add_action('wp_ajax_form_update_status_d', 'form_update_status_d');

add_action('wp_ajax_nopriv_form_update_status_d', 'form_update_status_d');

function form_update_status_d()

{



    $response = array(

        'error' => false,

    );

    if (!empty($_SESSION['auth_admin']) && !empty($_SESSION['params_id'])) {

        if (trim($_POST['rental_status']) == '') {

            $response['error'] = true;

            exit(json_encode($response));

        } else {

            global $wpdb;

            $statusSebelumnya = $wpdb->get_results(

                "SELECT * FROM wp_new_driver WHERE id = {$_POST['id']}"

            );

            if ($statusSebelumnya[0]->rental_status !== $_POST['rental_status']) {

                $response['error'] = false;

                $table_driver = 'wp_new_driver';

                $dataUpdate = array(

                    'rental_status' => $_POST['rental_status']

                );

                $idDriver = array(

                    'id' => $_POST['id']

                );

                $wpdb->update($table_driver, $dataUpdate, $idDriver);

                exit(json_encode($response));

            } else {

                $response['error'] = true;

                $response['no_update'] = true;

                exit(json_encode($response));

            }

        }

    }

}

// End function untuk update status driver











//Start untuk form bisnis

add_action('wp_ajax_form_bisnis', 'form_bisnis');

add_action('wp_ajax_nopriv_form_bisnis', 'form_bisnis');

function form_bisnis()

{

    global $wpdb;

    $response = array(

        'error' => false,

        'status' => 200

    );



    if (trim($_POST['page_form']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Ada error asal page form kosong';

        exit(json_encode($response));

    }



    if (trim($_POST['name']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang nama di formulir';

        exit(json_encode($response));

    }

    if (trim($_POST['no_phone']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang no HP di formulir';

        exit(json_encode($response));

    } else {

        $phone = $_POST["no_phone"];

        if (!preg_replace('/[^0-9]/', '', $phone)) {

            $response['error'] = true;

            $response['error_message'] = "format no HP tidak benar";

            exit(json_encode($response));

        }

    }

    if (trim($_POST['email']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang domisili di formulir';

        exit(json_encode($response));

    }



    if (trim($_POST['company_name']) == '') {

        $response['error'] = true;

        $response['error_message'] = 'Harap isi bidang domisili di formulir';

        exit(json_encode($response));

    }







    $formName = "";



    if ($_POST['page_form'] == "SME") {

        $formName = "Small Medium Enterprise";

    }

    if ($_POST['page_form'] == "logistic") {

        $formName = "Logistic";

    };

    if ($_POST['page_form'] == "individual") {

        $formName = "Individual";

    }

    if ($_POST['page_form'] == "cop") {

        $formName = "Car Ownership Program";

    }



    // Start String Camel Case

    $camelNama = ucwords($_POST['name']);

    // End String Camel Case



    // $pod = pods('rental_application');

    // $data = array(

    //     // 'rental_nama' => $_POST['ca_nama'],

    //     'rental_nama' => $camelNama,

    //     'rental_umur' => $_POST['ca_umur'],

    //     'rental_no_ktp' => $_POST['ca_no_ktp'],

    //     'rental_domisili' => $_POST['ca_domisili'],

    //     'rental_phone' => $_POST['ca_phone'],

    //     // 'rental_alamat' => $_POST['ca_alamat'],

    //     'rental_alamat' => $camelAlamat,

    //     'rental_aplikasi_driver' => $_POST['ca_aplikasi_driver'],

    //     'rental_akun_driver_online_atas_nama_diri_sendiri' => $akun_driver_sendiri,

    //     'jangka_waktu_bekerja_sebagai_driver_online' => $jangka_waktu_driver_online,

    //     'rental_mengetahui_informasi_dari' => $_POST['ca_mengetahui_informasi_dari'],

    //     'rental_sumber_informasi' => $sumber_informasi,

    // );

    // $id = $pod->add($data);



    // $post = array('ID' => $id, 'post_status' => 'publish');

    // wp_update_post($post);



    // Statrt untuk insert data ke Data Base wp_new_driver

    // $dataSaveDB = array(

    //     // 'rental_nama' => $_POST['ca_nama'],

    //     'rental_nama' => $camelNama,

    //     'rental_umur' => $_POST['ca_umur'],

    //     'rental_no_ktp' => $_POST['ca_no_ktp'],

    //     'rental_domisili' => $_POST['ca_domisili'],

    //     'rental_phone' => $_POST['ca_phone'],

    //     // 'rental_alamat' => $_POST['ca_alamat'],

    //     'rental_alamat' => $camelAlamat,

    //     'rental_aplikasi_driver' => $_POST['ca_aplikasi_driver'],

    //     'rental_akun_driver_online_atas_nama_diri_sendiri' => $akun_driver_sendiri,

    //     'jangka_waktu_bekerja_sebagai_driver_online' => $jangka_waktu_driver_online,

    //     'rental_mengetahui_informasi_dari' => $_POST['ca_mengetahui_informasi_dari'],

    //     'rental_sumber_informasi' => $sumber_informasi,

    //     'rental_surveyor' => '',

    //     'rental_status' => 'register',

    // );

    // $table_new_driver = 'wp_new_driver';

    // date_default_timezone_set('Asia/Jakarta');

    // $todayLogic = date('Y-m-d');

    // $toDateUntukRegist = date('d-m-Y H:i');

    // $timeRegisterDriver = date('H:i');

    // $doneInsertDriver = $wpdb->insert($table_new_driver, $dataSaveDB, $format = null);

    // End untuk insert data ke Data Base wp_new_driver

    date_default_timezone_set('Asia/Jakarta');

    $toDateUntukPertanyaan = date('d-m-Y H:i');

    $timePertanyaan = date('H:i');



    $countryCode = 62;

    $newFormatPhone = preg_replace('/^0?/', $countryCode, $_POST['no_phone']);

    $sheetPhoneHyperlink = '=HYPERLINK("api.whatsapp.com/send/?phone=' . $newFormatPhone . '"; "' . $_POST['no_phone'] . '")';



    // $to[] = 'register@mobility-sharing-indonesia.com';

    // $to[] = 'emailhendra2@gmail.com';

    // $to[] = 'hi-ohashi@global-mobility-service.com';

    // $to[] = 'za-arkan@global-mobility-service.com';

    // $to[] = 'pa-daniel@global-mobility-service.com';

    // $to[] = 'se-aditya@global-mobility-service.com';

    // $to[] = 'idn-rental-lp@global-mobility-service.com';

    // $to[] = 'wahyudin@mobility-sharing-indonesia.com';

    $to[] = 'idn-it@global-mobility-service.com';



    $subject = 'Pertanyaan Bisnis GMSI ' . $formName;

    $body = '<!DOCTYPE html>';

    $body .= '<html>';

    $body .= '<head>';

    $body .= '<style>';

    $body .= '@import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap");';

    $body .= 'body{';

    $body .= 'font-family:Roboto;';

    $body .= '}';

    $body .= '#customers {';

    $body .= 'font-family: Arial, Helvetica, sans-serif;';

    $body .= 'border-collapse: collapse;';

    $body .= 'width: 100%;';

    $body .= '}';

    $body .= '';

    $body .= '#customers td, #customers th {';

    $body .= 'border: 1px solid #ddd;';

    $body .= 'padding: 8px;';

    $body .= '}';

    $body .= '';

    $body .= '#customers tr:nth-child(even){background-color: #f2f2f2;}';

    $body .= '';

    $body .= '#customers tr:hover {background-color: #ddd;}';

    $body .= '';

    $body .= '#customers th {';

    $body .= 'padding-top: 12px;';

    $body .= 'padding-bottom: 12px;';

    $body .= 'text-align: left;';

    $body .= 'background-color: #4CAF50;';

    $body .= 'color: white;';

    $body .= '}';

    $body .= '</style>';

    $body .= '</head>';

    $body .= '<body>';

    $body .= '<h2>Pertanyaan Baru GMSI ' . $formName . '</H2>';

    $body .= '<table id="customers">';



    $body .= '<td>Tgl Pertanyaan</td>';

    $body .= '<td>' . $toDateUntukPertanyaan . '</td>';

    $body .= '</tr>';

    $body .= '<tr>';

    $body .= '<td>Nama</td>';

    $body .= '<td>' . $camelNama . '</td>';

    $body .= '</tr>';

    $body .= '<tr>';

    $body .= '<td>No HP (Whatsapp)</td>';

    $body .= '<td><a href="api.whatsapp.com/send/?phone=' . $newFormatPhone . '">' . $_POST['no_phone'] . '</a></td>';

    $body .= '</tr>';

    $body .= '<tr>';

    $body .= '<td>Email</td>';

    $body .= '<td>' . $_POST['email'] . '</td>';

    $body .= '</tr>';

    $body .= '<tr>';

    $body .= '<td>Nama Perusahaan</td>';

    $body .= '<td>' . $_POST['company_name'] . '</td>';

    $body .= '</tr>';

    $body .= '<tr>';

    $body .= '<td>Pesan</td>';

    $body .= '<td>' . $_POST['message'] . '</td>';

    $body .= '</tr>';

    $body .= '</table>';

    $body .= '';

    $body .= '<p>Terima Kasih.</P>';

    $body .= '';

    $body .= '<p>Send By : GMSI Site</P>';

    $body .= '';

    $body .= '</body>';

    $body .= '</html>';

    $body .= '';

    $headers[] = 'Content-Type: text/html; charset=UTF-8';

    // $headers[] = 'Bcc: idn-mobilagi@global-mobility-service.com';

    // $headers[] = 'Reply-To: Mobis <idn-rental-lp@global-mobility-service.com>';

    $headers[] = 'From: GMSI <idn-info@global-mobility-service.com >';

    if(getDomainDb()){
        $send_mail = wp_mail($to, $subject, $body, $headers);
    }

    //add spreedsheet

    $client = new Google_Client();

    $client->setApplicationName('Google Sheets and PHP');

    $client->setAuthConfig(__DIR__ . '/credentials.json');

    $client->setScopes(Google_Service_Sheets::SPREADSHEETS);

    $client->setAccessType('online');

    $redirect_uri = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];

    $client->setRedirectUri($redirect_uri);

    $service = new Google_Service_Sheets($client);

    // $spreadsheetId = '1xa_mgci_vhd2hGhjfu3sMeWdl6OuosBbJUKvGgSh0Kk';

    $spreadsheetId = '1Is-6yUTtaLCgsmmUxZnXYQBwnjLtID3h6_QXO1zQ8Uk';



    $values = [

        [$camelNama, $sheetPhoneHyperlink, $_POST['email'], $_POST['company_name'], $_POST['message'], $toDateUntukPertanyaan]

    ];

    $body = new Google_Service_Sheets_ValueRange([

        'values' => $values

    ]);





    $params = [

        'valueInputOption' => "USER_ENTERED"

    ];

    $service->spreadsheets_values->append($spreadsheetId, $formName, $body, $params);

    $response['id'] = $id;

    exit(json_encode($response));

}

//end untuk form bisnis











// Start untuk form login USER mobis

add_action('wp_ajax_form_login_rental_driver', 'form_login_rental_driver');

add_action('wp_ajax_nopriv_form_login_rental_driver', 'form_login_rental_driver');

function form_login_rental_driver()

{

    global $wpdb;



    $response = array(

        'error' => false,

    );



    $resultPhone = null;



    // if (trim($_POST['rental_phone']) == '' && empty($resultPhone)) {

    //     $response['error'] = true;

    //     $response['error_message'] = 'Akun tidak terdaftar';

    //     session_start();

    //     $_SESSION['message_login_admin'] = json_encode($response);

    //     exit(json_encode($response));

    // } else {

    //     $response['error'] = false;

    //     session_start();

    //     $_SESSION['auth_users'] = $resultPhone;

    //     unset($_SESSION['message_login_admin']);

    //     exit(json_encode($response));

    // }



    if (trim($_POST['rental_phone']) !== '') {

        $resultPhone = $wpdb->get_results(

            "SELECT * FROM wp_new_driver WHERE rental_phone = '{$_POST['rental_phone']}'"

        );

    }



    if (!empty($resultPhone)) {

        $response['error'] = false;

        session_start();

        $_SESSION['auth_users'] = $resultPhone;

        exit(json_encode($response));

    } else {

        $response['error'] = true;

        $response['error_message'] = 'Akun tidak terdaftar';

        exit(json_encode($response));

    }

}

// End untuk form login USER mobis



// Start funtion kondisi restricted

function my_page_template_redirect()

{

    // untuk kondisi auth role admin mobis
   session_start();
    if (is_page_template('table-driver-page.php') && !$_SESSION['auth_admin']) {

        wp_redirect(home_url('/mobis/login-admin-mobis'));

        exit();

    }

    if (is_page_template('detail-driver-page.php') && !$_SESSION['auth_admin']) {

        wp_redirect(home_url('/mobis/login-admin-mobis'));

        exit();

    }



    // start new update

    if (is_page_template('limit-referral.php') && !$_SESSION['auth_admin']) {

        wp_redirect(home_url('/mobis/login-admin-mobis'));

        exit();

    }

    if (is_page_template('page-promo-code.php') && !$_SESSION['auth_admin']) {

        wp_redirect(home_url('/mobis/promo-code'));

        exit();

    }

    // end new update





    if (is_page_template('login-page-admin-mobis.php') && !empty($_SESSION['auth_admin'])) {

        wp_redirect(home_url('/mobis/table-driver'));

        exit();

    }

    if (is_page_template('detail-driver-page.php') && !$_SESSION['params_id']) {

        wp_redirect(home_url('/mobis/table-driver'));

        exit();

    }

    if (is_page_template('table-driver-page.php') && !empty($_SESSION['params_id'])) {

        unset($_SESSION['params_id']);

    }



    // untuk kondisi auth role calon driver

    if (is_page_template('detail-driver-page-users.php') && !$_SESSION['auth_users']) {

        wp_redirect(home_url('/mobis/login-user-mobis'));

        exit();

    }

    if (is_page_template('login-page-driver-mobis.php') && !empty($_SESSION['auth_users'])) {

        wp_redirect(home_url('/mobis/check-status'));

        exit();

    }

}

add_action('template_redirect', 'my_page_template_redirect');

// Start funtion kondisi restricted



// Start Create Limit Referral

add_action('wp_ajax_form_create_limit_referral_d', 'form_create_limit_referral_d');

add_action('wp_ajax_nopriv_form_create_limit_referral_d', 'form_create_limit_referral_d');

function form_create_limit_referral_d()

{

    global $wpdb;



    $response = array(

        'error' => false,

    );



    $lengthLimitReferral = 0;

    if (trim($_POST['value_limit_referral'] !== '')) {

        $check = $wpdb->get_results(

            "SELECT * FROM wp_limit_referral"

        );



        $lengthLimitReferral = count($check);

    }



    if ($lengthLimitReferral == 0) {

        $table_driver = 'wp_limit_referral';

        $inserLimitReferral = array(

            'kuota_awal' => $_POST['value_limit_referral'],

            'sisah_kuota' => $_POST['value_limit_referral']

        );

        $wpdb->insert($table_driver, $inserLimitReferral);

        $response['sisa_kuota_referral'] = $inserLimitReferral[0]->sisah_kuota;

    } else {

        $table_driver = 'wp_limit_referral';

        $updateLimitReferral = array(

            'kuota_awal' => $_POST['value_limit_referral'],

            'sisah_kuota' => $_POST['value_limit_referral']

        );

        $idLimitReferral = array(

            'id' => 1

        );

        $wpdb->update($table_driver, $updateLimitReferral, $idLimitReferral);

        $response['sisa_kuota_referral'] = $updateLimitReferral[0]->sisah_kuota;

    }

}

// End Create Limit Referral



// Start Create Kategori Promo Code

add_action('wp_ajax_form_create_name_category_promo_code_d', 'form_create_name_category_promo_code_d');

add_action('wp_ajax_nopriv_form_create_name_category_promo_code_d', 'form_create_name_category_promo_code_d');

function form_create_name_category_promo_code_d()

{

    global $wpdb;



    $response = array(

        'error' => false,

    );



    if (trim($_POST['value_name_category_promo_code'] !== '')) {

        $upperVal = strtoupper($_POST['value_name_category_promo_code']);



        $check = $wpdb->get_results(

            "SELECT * FROM wp_kode_promo WHERE category_promo_code='{$upperVal}'"

        );



        if (count($check) !== 0) {

            $response['error'] = true;

            $response['error_message'] = 'kategori sudah ada!';

            exit(json_encode($response));

        } else {

            $response['error'] = false;

            $table_categories_promo_code = 'wp_categories_promo_code';

            $insert_categories_promo_code = array(

                'name_category' => $upperVal

            );

            $wpdb->insert($table_categories_promo_code, $insert_categories_promo_code);

            exit(json_encode($response));

        }

    }

}

// End Create Kategori Promo Code



// Start Create Promo Code

add_action('wp_ajax_form_create_promo_code_d', 'form_create_promo_code_d');

add_action('wp_ajax_nopriv_form_create_promo_code_d', 'form_create_promo_code_d');

function form_create_promo_code_d()

{

    global $wpdb;



    $response = array(

        'error' => false,

    );



    $upperVal = strtoupper($_POST['value_promo_code']);



    $check = $wpdb->get_results(

        "SELECT * FROM wp_kode_promo WHERE kode_promo='{$upperVal}' AND category_promo_code='{$_POST['value_category_promo']}'"

    );



    if (count($check) !== 0) {

        $response['error'] = true;

        $response['error_message'] = 'KODE PROMO sudah ada!';

        exit(json_encode($response));

    }



    if (date('Y-m-d', strtotime($_POST['value_exp_date_promo'])) < date('Y-m-d', strtotime($_POST['value_start_date_promo']))) {

        $response['error'] = true;

        $response['error_message'] = 'Exp Date tidak kurang dari Start Date!';

        exit(json_encode($response));

    }



    if (date('Y-m-d', strtotime($_POST['value_exp_date_promo'])) < date('Y-m-d')) {

        $response['error'] = true;

        $response['error_message'] = 'Format Date salah!';

        exit(json_encode($response));

    }



    $table_promo_code = 'wp_kode_promo';

    $insert_promo_code = array(

        'category_promo_code' => $_POST['value_category_promo'],

        'kode_promo' => $upperVal,

        'begin_quota' => intval($_POST['value_quota_promo']),

        'remainder_quota' => intval($_POST['value_quota_promo']),

        'begin_kode_promo' => date('Y-m-d', strtotime($_POST['value_start_date_promo'])),

        'expaired_kode_promo' => date('Y-m-d', strtotime($_POST['value_exp_date_promo'])),

        'ket_kode_promo' => $_POST['value_ket_promo']

    );

    $wpdb->insert($table_promo_code, $insert_promo_code);



    $response['sisa_kuota_promo_code'] = $insert_promo_code[0]->begin_quota;



    exit(json_encode($response));

}

// End Create Promo Code





// Start Get Kode Promo

function get_kode_promo()

{

    global $wpdb;

    $dateNow = date('Y-m-d');



    $category = strtoupper($_POST['category']);



    $promoCategory = $wpdb->get_results(

        "SELECT * FROM wp_kode_promo WHERE category_promo_code='{$category}' AND begin_kode_promo <= '{$dateNow}' AND expaired_kode_promo >= '{$dateNow}' ORDER BY id DESC"

    );



    exit(json_encode($promoCategory[0]));

}

add_action('wp_ajax_get_kode_promo', 'get_kode_promo');

add_action('wp_ajax_nopriv_get_kode_promo', 'get_kode_promo');

// End Get Kode Promo

