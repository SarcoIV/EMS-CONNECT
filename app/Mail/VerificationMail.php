<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $code;
    public $name;

    /**
     * Create a new message instance.
     */
    public function __construct(string $code, string $name = 'User')
    {
        $this->code = $code;
        $this->name = $name;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('EMS Connect - Email Verification Code')
                    ->view('emails.verification')
                    ->with([
                        'code' => $this->code,
                        'name' => $this->name,
                    ]);
    }
}

