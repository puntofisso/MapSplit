<?php
file_put_contents(__DIR__ . '/.ads-enabled', date('Y-m-d H:i:s'));
echo 'Ads enabled since ' . date('Y-m-d H:i:s') . '.';
