<?php
$flag = __DIR__ . '/.ads-enabled';
if (file_exists($flag)) {
    unlink($flag);
    echo 'Ads disabled.';
} else {
    echo 'Ads were already disabled.';
}
