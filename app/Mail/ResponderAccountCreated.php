<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ResponderAccountCreated extends Mailable
{
    use Queueable, SerializesModels;

    public $responderName;

    public $email;

    public $password;

    public $loginUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(string $responderName, string $email, string $password)
    {
        $this->responderName = $responderName;
        $this->email = $email;
        $this->password = $password;
        $this->loginUrl = config('app.url').'/login';
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('EMS Connect - Your Responder Account Has Been Created')
            ->view('emails.responder-created')
            ->with([
                'responderName' => $this->responderName,
                'email' => $this->email,
                'password' => $this->password,
                'loginUrl' => $this->loginUrl,
            ]);
    }
}
