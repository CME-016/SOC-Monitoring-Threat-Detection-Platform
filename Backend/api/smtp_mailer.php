<?php
// Backend/api/smtp_mailer.php

function sendSOCEmail($to, $subject, $bodyHTML) {
    // ---- EMAIL CONFIGURATION ----
    $smtpHost = 'smtp.gmail.com';
    $smtpPort = 465; // SSL port
    
    // TODO: The user needs to fill these in!
    $smtpUser = 'dupana.chiranjeevi2008@gmail.com';
    $smtpPass = 'rplsncwqocwhtooo'; 
    $fromName = 'CyberSOC Alert System';
    // -----------------------------

    // Removed the confusing check here.

    $crlf = "\r\n";
    $socket = stream_socket_client("ssl://" . $smtpHost . ":" . $smtpPort, $errno, $errstr, 15);
    
    if (!$socket) {
        error_log("SOC Mailer Error: Could not connect to SMTP server ($errstr).");
        return false;
    }

    fread($socket, 256);
    
    // Helper function
    $sendCommand = function($cmd) use ($socket, $crlf) {
        fwrite($socket, $cmd . $crlf);
        return fread($socket, 256);
    };

    $sendCommand("EHLO localhost");
    $sendCommand("AUTH LOGIN");
    $sendCommand(base64_encode($smtpUser));
    $sendCommand(base64_encode($smtpPass));
    $sendCommand("MAIL FROM: <" . $smtpUser . ">");
    $sendCommand("RCPT TO: <" . $to . ">");
    $sendCommand("DATA");

    $headers = "From: " . $fromName . " <" . $smtpUser . ">" . $crlf;
    $headers .= "To: <" . $to . ">" . $crlf;
    $headers .= "Subject: " . $subject . $crlf;
    $headers .= "MIME-Version: 1.0" . $crlf;
    $headers .= "Content-Type: text/html; charset=UTF-8" . $crlf;
    $headers .= "Connection: close" . $crlf . $crlf;

    $sendCommand($headers . $bodyHTML . $crlf . ".");
    $sendCommand("QUIT");
    
    fclose($socket);
    return true;
}
?>
